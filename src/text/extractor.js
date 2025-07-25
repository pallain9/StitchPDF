// Text Extraction Module
import pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

const { getDocument } = pdfjs;

/**
 * Convert units to points (PDF's default unit)
 * @param {number} value - Value to convert
 * @param {string} unit - Unit type ('pt', 'in', 'mm')
 * @returns {number} Value in points
 */
function convertToPoints(value, unit) {
    switch (unit) {
        case 'in': return value * 72;      // 72 points per inch
        case 'mm': return value * 2.83465; // ~2.83 points per mm
        case 'pt':
        default: return value;              // Already in points
    }
}

/**
 * Check if text item is within the specified region
 * @param {Object} item - Text item with coordinates
 * @param {Object} region - Region bounds {x, y, width, height, unit}
 * @returns {boolean} True if item is within region
 */
function isWithinRegion(item, region) {
    if (!region) return true;
    
    const regionX = convertToPoints(region.x, region.unit);
    const regionY = convertToPoints(region.y, region.unit);
    const regionWidth = convertToPoints(region.width, region.unit);
    const regionHeight = convertToPoints(region.height, region.unit);
    
    const itemX = item.transform[4];
    const itemY = item.transform[5];
    
    return (
        itemX >= regionX &&
        itemX <= regionX + regionWidth &&
        itemY >= regionY &&
        itemY <= regionY + regionHeight
    );
}

/**
 * Parse and clean font name to be human-readable
 * @param {string} rawFontName - Raw font name from PDF
 * @param {Object} fontInfo - Additional font information from PDF
 * @returns {Object} Human-readable font information
 */
function parseFont(rawFontName, fontInfo = {}) {
    if (!rawFontName) return { family: 'Unknown', style: 'Regular', display: 'Unknown' };
    
    // Remove common PDF font prefixes (like BAAAAA+)
    let cleanName = rawFontName.replace(/^[A-Z]{6}\+/, '');
    
    // Common font mappings
    const fontMappings = {
        'TimesNewRoman': 'Times New Roman',
        'TimesNewRomanPS': 'Times New Roman',
        'Arial': 'Arial',
        'ArialMT': 'Arial',
        'Helvetica': 'Helvetica',
        'HelveticaNeue': 'Helvetica Neue',
        'Calibri': 'Calibri',
        'CourierNew': 'Courier New',
        'Georgia': 'Georgia',
        'Verdana': 'Verdana',
        'TrebuchetMS': 'Trebuchet MS',
        'ComicSansMS': 'Comic Sans MS'
    };
    
    // Extract style information
    let style = 'Regular';
    let weight = 'Normal';
    
    if (cleanName.includes('Bold')) {
        weight = 'Bold';
        style = style === 'Regular' ? 'Bold' : style + ' Bold';
    }
    if (cleanName.includes('Italic')) {
        style = style === 'Regular' ? 'Italic' : style + ' Italic';
    }
    if (cleanName.includes('Light')) {
        weight = 'Light';
        style = style === 'Regular' ? 'Light' : 'Light ' + style;
    }
    if (cleanName.includes('Black')) {
        weight = 'Black';
        style = style === 'Regular' ? 'Black' : 'Black ' + style;
    }
    
    // Clean the base name
    let baseName = cleanName
        .replace(/[-_](Bold|Italic|Light|Black|Regular|Normal)/gi, '')
        .replace(/BoldItalic|ItalicBold/gi, '')
        .replace(/MT$|PS$/gi, '');
    
    // Map to human-readable name
    const humanName = fontMappings[baseName] || baseName;
    
    return {
        family: humanName,
        style: style,
        weight: weight,
        size: fontInfo.size || 'Unknown',
        display: `${humanName} ${style}${fontInfo.size ? ` (${Math.round(fontInfo.size)}pt)` : ''}`,
        raw: rawFontName
    };
}

/**
 * Extract text from PDF
 * @param {string} filePath - Path to PDF file
 * @param {Object} options - Extraction options
 * @param {Object} options.region - Region to extract from {x, y, width, height, unit}
 * @param {Array} options.pageNumbers - Specific pages to extract
 * @returns {Promise<string>} Extracted text
 */
export async function extractText(filePath, options = {}) {
    try {
        const loadingTask = getDocument(filePath);
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        
        // Determine which pages to process
        const pagesToProcess = options.pageNumbers || 
            Array.from({length: pdf.numPages}, (_, i) => i + 1);
        
        for (const pageNum of pagesToProcess) {
            if (pageNum < 1 || pageNum > pdf.numPages) continue;
            
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Filter text items by region if specified
            const filteredItems = textContent.items.filter(item => 
                isWithinRegion(item, options.region)
            );
            
            const pageText = filteredItems
                .map(item => item.str)
                .join(' ');
            
            if (pageText.trim()) {
                fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
            }
        }
        
        return fullText;
    } catch (error) {
        throw new Error(`Text extraction failed: ${error.message}`);
    }
}

/**
 * Extract text with coordinates
 * @param {string} filePath - Path to PDF file
 * @param {Object} options - Extraction options
 * @param {Object} options.region - Region to extract from {x, y, width, height, unit}
 * @param {Array} options.pageNumbers - Specific pages to extract
 * @returns {Promise<Object>} Text with position data
 */
export async function extractTextWithCoordinates(filePath, options = {}) {
    try {
        const loadingTask = getDocument(filePath);
        const pdf = await loadingTask.promise;
        
        const pages = [];
        
        // Determine which pages to process
        const pagesToProcess = options.pageNumbers || 
            Array.from({length: pdf.numPages}, (_, i) => i + 1);
        
        for (const pageNum of pagesToProcess) {
            if (pageNum < 1 || pageNum > pdf.numPages) continue;
            
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Filter text items by region if specified
            const filteredItems = textContent.items.filter(item => 
                isWithinRegion(item, options.region)
            );
            
            const textItems = filteredItems.map(item => {
                const fontInfo = parseFont(item.fontName, { size: item.height });
                return {
                    text: item.str,
                    x: item.transform[4],
                    y: item.transform[5],
                    width: item.width,
                    height: item.height,
                    font: {
                        family: fontInfo.family,
                        style: fontInfo.style,
                        weight: fontInfo.weight,
                        size: Math.round(item.height),
                        display: fontInfo.display,
                        raw: fontInfo.raw
                    }
                };
            });
            
            if (textItems.length > 0) {
                pages.push({
                    pageNumber: pageNum,
                    textItems
                });
            }
        }
        
        return { pages };
    } catch (error) {
        throw new Error(`Text extraction with coordinates failed: ${error.message}`);
    }
} 