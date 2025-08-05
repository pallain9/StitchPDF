// Basic Page Insertion - Free Tier
// Simple page insertion without conditional logic

import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';

/**
 * 🆓 FREE: Insert pages at specific position
 * Basic insertion without text-based conditions
 */
export async function insertAtPage(targetPdfPath, insertPdfPath, insertAtPageNumber, outputPath) {
    try {
        // Load PDFs
        const [targetBytes, insertBytes] = await Promise.all([
            fs.readFile(targetPdfPath),
            fs.readFile(insertPdfPath)
        ]);

        const targetPdf = await PDFDocument.load(targetBytes);
        const insertPdf = await PDFDocument.load(insertBytes);

        // Copy pages from insert PDF
        const insertPages = await targetPdf.copyPages(insertPdf, insertPdf.getPageIndices());

        // Insert pages at specified position
        const insertIndex = Math.max(0, Math.min(insertAtPageNumber - 1, targetPdf.getPageCount()));
        
        insertPages.forEach((page, index) => {
            targetPdf.insertPage(insertIndex + index, page);
        });

        // Save result
        const pdfBytes = await targetPdf.save();
        if (outputPath) {
            await fs.writeFile(outputPath, pdfBytes);
            return outputPath;
        }
        
        return pdfBytes;
    } catch (error) {
        throw new Error(`Page insertion failed: ${error.message}`);
    }
}

// 💡 Premium feature notice
export function getConditionalInsertionInfo() {
    console.log(`
💎 Want smart conditional insertion?

Upgrade to @stitchpdf/premium for:
• Text-based conditional insertion
• Pattern matching and rules
• Bulk conditional processing
• Advanced insertion logic

Visit https://stitchpdf.com/pricing
    `);
} 