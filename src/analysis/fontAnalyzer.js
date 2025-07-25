// Font Analysis Module
import pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

const { getDocument } = pdfjs;

/**
 * Analyzes fonts in a PDF document
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} Font analysis results
 */
export async function analyzeFonts(filePath) {
    try {
        console.log('Starting font analysis...');
        
        const loadingTask = getDocument(filePath);
        const pdf = await loadingTask.promise;
        
        const fontMap = new Map();
        const fontUsage = new Map();
        
        console.log(`Analyzing ${pdf.numPages} pages...`);
        
        // First pass: Build font mapping from operator lists
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            try {
                // Get operator list to extract font mappings
                const operatorList = await page.getOperatorList();
                await extractFontMappingsFromOperators(operatorList, fontMap, pageNum);
                
                // Get text content for usage analysis
                const textContent = await page.getTextContent();
                await analyzeFontUsage(textContent, fontMap, fontUsage, pageNum);
                
            } catch (error) {
                console.warn(`Error analyzing page ${pageNum}:`, error);
            }
        }
        
        // Convert maps to analysis results
        const fonts = Array.from(fontUsage.values()).sort((a, b) => {
            return b.totalCharacters - a.totalCharacters;
        });
        
        const fontFamilies = new Map();
        fonts.forEach(font => {
            const family = font.family;
            if (!fontFamilies.has(family)) {
                fontFamilies.set(family, []);
            }
            fontFamilies.get(family).push(font);
        });
        
        return {
            totalFonts: fonts.length,
            uniqueFamilies: fontFamilies.size,
            fonts: fonts,
            fontFamilies: Object.fromEntries(fontFamilies),
            embeddedFonts: fonts.filter(f => f.embedded).length,
            systemFonts: fonts.filter(f => !f.embedded).length
        };
    } catch (error) {
        console.error('Font analysis failed:', error);
        throw new Error(`Font analysis failed: ${error.message}`);
    }
}

/**
 * Extract font mappings from PDF operator list
 */
async function extractFontMappingsFromOperators(operatorList, fontMap, pageNum) {
    try {
        const fnArray = operatorList.fnArray;
        const argsArray = operatorList.argsArray;
        
        for (let i = 0; i < fnArray.length; i++) {
            const fn = fnArray[i];
            const args = argsArray[i];
            
            // Look for setFont operations (function code 37 is typically setFont in PDF.js)
            if (fn === 37 && args.length >= 2) {
                const [fontRef, fontSize] = args;
                
                // Extract actual font name from font reference
                const actualFontName = await extractActualFontName(fontRef);
                if (actualFontName && fontRef) {
                    fontMap.set(fontRef, {
                        actualName: actualFontName,
                        fontRef: fontRef,
                        firstSeenOnPage: pageNum,
                        fontSize: fontSize
                    });
                }
            }
        }
    } catch (error) {
        console.warn(`Warning: Could not extract font mappings from page ${pageNum}:`, error.message);
    }
}

/**
 * Extract actual font name from font reference
 */
async function extractActualFontName(fontRef) {
    try {
        // If fontRef is a string, use it as is
        if (typeof fontRef === 'string') {
            return fontRef;
        }
        
        // If fontRef has a name property, use it
        if (fontRef && fontRef.name) {
            return fontRef.name;
        }
        
        // If fontRef has a dict property with BaseFont
        if (fontRef && fontRef.dict && fontRef.dict.get) {
            const baseFont = fontRef.dict.get('BaseFont');
            if (baseFont && baseFont.name) {
                return baseFont.name;
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Pattern-based font detection
 */
function detectFontFromId(fontId) {
    if (!fontId || typeof fontId !== 'string') return null;
    
    const patterns = [
        { pattern: /arial|arialmt/i, name: 'Arial' },
        { pattern: /arial.*bold/i, name: 'Arial Bold' },
        { pattern: /helvetica/i, name: 'Helvetica' },
        { pattern: /times|timesnr|timesroman/i, name: 'Times New Roman' },
        { pattern: /times.*bold/i, name: 'Times New Roman Bold' },
        { pattern: /courier|couriernew/i, name: 'Courier New' },
        { pattern: /verdana/i, name: 'Verdana' },
        { pattern: /calibri/i, name: 'Calibri' },
        { pattern: /georgia/i, name: 'Georgia' },
        { pattern: /trebuchet/i, name: 'Trebuchet MS' },
        { pattern: /tahoma/i, name: 'Tahoma' },
        { pattern: /oldstyle|oldfont|oldtype/i, name: 'Old Style Font' },
        { pattern: /symbol/i, name: 'Symbol' },
        { pattern: /wingdings/i, name: 'Wingdings' }
    ];
    
    for (const { pattern, name } of patterns) {
        if (pattern.test(fontId)) {
            return name;
        }
    }
    
    return null;
}

/**
 * Content-based font classification
 */
function classifyFontByContent(textSamples, styleInfo) {
    if (!textSamples || textSamples.length === 0) return null;
    
    const allText = textSamples.join(' ').toLowerCase();
    
    // Check for mathematical content
    if (/[α-ωΑ-Ω∑∆∫∞±≤≥≠√∂∇]/.test(allText)) {
        return 'Symbol';
    }
    
    // Check for special characters
    if (/[♠♣♥♦●○■□▲▼◄►]/.test(allText)) {
        return 'Wingdings';
    }
    
    // Analyze character patterns
    const hasNumbers = /\d/.test(allText);
    const hasUpperCase = /[A-Z]/.test(allText);
    const hasLowerCase = /[a-z]/.test(allText);
    const specialChars = allText.match(/[^\w\s]/g) || [];
    
    if (specialChars.length > allText.length * 0.3) {
        return 'Symbol';
    }
    
    // Content type classification
    if (/header|title|heading|chapter/i.test(allText)) {
        return 'Arial';
    }
    
    if (/code|function|variable|console/i.test(allText)) {
        return 'Courier New';
    }
    
    return null;
}

/**
 * Extract font family from font name
 */
function extractFontFamily(fontName) {
    if (!fontName) return 'Unknown';
    
    // Remove common suffixes
    let family = fontName
        .replace(/\s*(Bold|Italic|BoldItalic|Regular|Light|Medium|Heavy|Black)\s*$/i, '')
        .replace(/MT$|MS$/, '')
        .trim();
    
    if (!family) family = fontName;
    
    return family;
}

/**
 * Extract font style from font name and style info
 */
function extractFontStyle(fontName, styleInfo) {
    if (!fontName) return 'Regular';
    
    const name = fontName.toLowerCase();
    
    if (name.includes('bold') && name.includes('italic')) return 'Bold Italic';
    if (name.includes('bold')) return 'Bold';
    if (name.includes('italic')) return 'Italic';
    if (name.includes('light')) return 'Light';
    if (name.includes('medium')) return 'Medium';
    if (name.includes('heavy') || name.includes('black')) return 'Heavy';
    
    // Check style info for additional clues
    if (styleInfo) {
        const flags = styleInfo.flags || 0;
        // PDF font flags: bit 18 = bold, bit 19 = italic
        if (flags & (1 << 18) && flags & (1 << 19)) return 'Bold Italic';
        if (flags & (1 << 18)) return 'Bold';
        if (flags & (1 << 19)) return 'Italic';
    }
    
    return 'Regular';
}

/**
 * Advanced font name derivation with multiple detection strategies
 */
function deriveActualFontName(fontId, styleInfo, textSamples = []) {
    // Strategy 1: Check if style info has fontFamily
    if (styleInfo?.fontFamily && styleInfo.fontFamily !== fontId && 
        styleInfo.fontFamily !== 'sans-serif' && styleInfo.fontFamily !== 'serif') {
        return styleInfo.fontFamily;
    }
    
    // Strategy 2: Pattern matching on font ID
    let detectedName = detectFontFromId(fontId);
    if (detectedName) return detectedName;
    
    // Strategy 3: Clean up and analyze the font ID
    let name = fontId;
    
    // Remove PDF.js internal prefixes
    name = name.replace(/^g_d\d+_f\d+/, '');
    name = name.replace(/^[A-Z]{6}\+/, ''); // Remove subset prefix like "ABCDEF+"
    
    // Strategy 4: Try pattern matching on cleaned name
    if (name && name !== fontId) {
        detectedName = detectFontFromId(name);
        if (detectedName) return detectedName;
    }
    
    // Strategy 5: Content-based classification
    if (textSamples && textSamples.length > 0) {
        const contentBasedName = classifyFontByContent(textSamples, styleInfo);
        if (contentBasedName) return contentBasedName;
    }
    
    // Strategy 6: Characteristics-based classification
    const characteristicsName = classifyByCharacteristics(analyzeStyleCharacteristics(styleInfo));
    if (characteristicsName && characteristicsName !== 'Arial') {
        return characteristicsName;
    }
    
    // Strategy 7: Font size and usage heuristics
    if (styleInfo) {
        const fontSize = styleInfo.fontSize || 12;
        
        if (fontSize >= 16) {
            return 'Arial'; // Large fonts often headers in Arial
        } else if (fontSize <= 8) {
            return 'Arial'; // Small fonts often fine print in Arial
        } else if (fontSize === 12) {
            return 'Times New Roman'; // Body text often Times
        }
    }
    
    // Strategy 8: Fallback to original font ID
    return fontId;
}

/**
 * Analyze style characteristics
 */
function analyzeStyleCharacteristics(styleInfo) {
    if (!styleInfo) return {};
    
    return {
        hasSerif: styleInfo.flags ? !!(styleInfo.flags & (1 << 1)) : false,
        isMonospace: styleInfo.flags ? !!(styleInfo.flags & (1 << 0)) : false,
        isBold: styleInfo.flags ? !!(styleInfo.flags & (1 << 18)) : false,
        isItalic: styleInfo.flags ? !!(styleInfo.flags & (1 << 19)) : false,
        fontSize: styleInfo.fontSize || 12,
        ascent: styleInfo.ascent || 0,
        descent: styleInfo.descent || 0
    };
}

/**
 * Classify font by characteristics
 */
function classifyByCharacteristics(characteristics) {
    if (!characteristics) return null;
    
    if (characteristics.isMonospace) {
        return 'Courier New';
    }
    
    if (characteristics.hasSerif) {
        return 'Times New Roman';
    }
    
    // Default to Arial for sans-serif
    return 'Arial';
}

/**
 * Determine if font is embedded
 */
function isEmbeddedFont(fontId, styleInfo) {
    // Heuristics to determine if font is embedded
    // Embedded fonts often have complex IDs or subset prefixes
    
    if (/^g_d\d+_f\d+/.test(fontId)) {
        return true; // PDF.js internal font reference suggests embedded
    }
    
    if (/^[A-Z]{6}\+/.test(fontId)) {
        return true; // Subset prefix indicates embedded font
    }
    
    // Check for common system font names
    const systemFonts = [
        'arial', 'helvetica', 'times', 'courier', 'calibri', 
        'georgia', 'verdana', 'tahoma', 'trebuchet'
    ];
    
    const lowerFontId = fontId.toLowerCase();
    const isSystemFont = systemFonts.some(font => lowerFontId.includes(font));
    
    return !isSystemFont; // If not a system font, likely embedded
}

/**
 * Calculate estimated font file size
 */
function estimateFontSize(font) {
    if (!font.embedded) return 0; // System fonts don't count toward file size
    
    // Base size estimates for different font types
    const baseSizes = {
        'Arial': 200 * 1024,           // ~200KB
        'Times New Roman': 250 * 1024, // ~250KB
        'Courier New': 150 * 1024,     // ~150KB
        'Symbol': 100 * 1024,          // ~100KB
        'Wingdings': 50 * 1024,        // ~50KB
        'Unknown': 180 * 1024          // ~180KB default
    };
    
    const baseSize = baseSizes[font.family] || baseSizes['Unknown'];
    
    // Adjust based on style (bold/italic variants are often larger)
    let sizeMultiplier = 1.0;
    if (font.style.includes('Bold')) sizeMultiplier += 0.2;
    if (font.style.includes('Italic')) sizeMultiplier += 0.1;
    
    // Adjust based on usage (heavily used fonts might be larger subsets)
    const usageMultiplier = Math.min(1 + (font.totalCharacters / 10000), 1.5);
    
    return Math.round(baseSize * sizeMultiplier * usageMultiplier);
}

/**
 * Analyze font usage from text content with enhanced name detection
 */
async function analyzeFontUsage(textContent, fontMap, fontUsage, pageNum) {
    const { items, styles } = textContent;
    
    // First, collect text samples by font for content analysis
    const fontTextSamples = new Map();
    
    // Collect text samples for each font
    for (const item of items) {
        if (item.fontName && item.str && item.str.trim()) {
            if (!fontTextSamples.has(item.fontName)) {
                fontTextSamples.set(item.fontName, []);
            }
            fontTextSamples.get(item.fontName).push(item.str.trim());
        }
    }
    
    // Process each text item with enhanced detection
    for (const item of items) {
        if (item.fontName) {
            const fontId = item.fontName;
            const styleInfo = styles[fontId];
            const textSamples = fontTextSamples.get(fontId) || [];
            
            if (!fontUsage.has(fontId)) {
                // Get actual font name using all available strategies
                const mappedFont = fontMap.get(fontId);
                let actualName = mappedFont?.actualName || 
                               deriveActualFontName(fontId, styleInfo, textSamples);
                
                // Additional content-based refinement
                if (actualName === fontId && textSamples.length > 0) {
                    const contentBasedName = classifyFontByContent(textSamples, styleInfo);
                    if (contentBasedName) {
                        actualName = contentBasedName;
                    }
                }
                
                fontUsage.set(fontId, {
                    id: fontId,
                    name: actualName,
                    actualName: actualName,
                    internalId: fontId,
                    family: extractFontFamily(actualName),
                    style: extractFontStyle(actualName, styleInfo),
                    size: styleInfo?.fontSize || 'Unknown',
                    embedded: isEmbeddedFont(fontId, styleInfo),
                    pages: new Set([pageNum]),
                    totalCharacters: 0,
                    textItems: [],
                    styleInfo: styleInfo || {},
                    textSamples: textSamples.slice(0, 10) // Keep sample text for analysis
                });
            }
            
            const fontInfo = fontUsage.get(fontId);
            fontInfo.pages.add(pageNum);
            fontInfo.totalCharacters += item.str?.length || 0;
            fontInfo.textItems.push({
                text: item.str,
                page: pageNum,
                transform: item.transform
            });
        }
    }
} 