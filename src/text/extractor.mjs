// Text Extraction Module
import pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

const { getDocument } = pdfjs;

/**
 * Extract text from PDF
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} Extracted text
 */
export async function extractText(filePath) {
    try {
        const loadingTask = getDocument(filePath);
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            
            fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
        }
        
        return fullText;
    } catch (error) {
        throw new Error(`Text extraction failed: ${error.message}`);
    }
}

/**
 * Extract text with coordinates
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<Object>} Text with position data
 */
export async function extractTextWithCoordinates(filePath) {
    try {
        const loadingTask = getDocument(filePath);
        const pdf = await loadingTask.promise;
        
        const pages = [];
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            const textItems = textContent.items.map(item => ({
                text: item.str,
                x: item.transform[4],
                y: item.transform[5],
                width: item.width,
                height: item.height,
                fontName: item.fontName
            }));
            
            pages.push({
                pageNumber: pageNum,
                textItems
            });
        }
        
        return { pages };
    } catch (error) {
        throw new Error(`Text extraction with coordinates failed: ${error.message}`);
    }
} 