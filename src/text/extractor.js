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
            
            const textItems = filteredItems.map(item => ({
                text: item.str,
                x: item.transform[4],
                y: item.transform[5],
                width: item.width,
                height: item.height,
                fontName: item.fontName
            }));
            
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