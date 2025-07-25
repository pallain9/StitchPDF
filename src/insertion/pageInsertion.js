// Page Insertion Module - PREMIUM FEATURE - SECURE
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { LicenseManager } from '../licensing/licenseManager.js';
import { validatePageInsertion, _0x9a8b } from '../licensing/securityValidator.js';
import { extractText } from '../text/extractor.js';

// Initialize license manager with security
const licenseManager = new LicenseManager();

/**
 * Insert pages at specific position
 * @param {string} sourcePath - Source PDF path
 * @param {string} insertPath - PDF to insert
 * @param {number} position - Position to insert at
 * @param {string} outputPath - Output file path
 * @returns {Promise<Object>} Insertion results
 */
export async function insertAtPage(sourcePath, insertPath, position, outputPath) {
    // 🔒 SECURE LICENSE VALIDATION - Premium feature
    try {
        // Multiple security layers
        await validatePageInsertion(licenseManager);
        await _0x9a8b('page-insertion', licenseManager);
        await licenseManager.checkFeature('page-insertion');
    } catch (licenseError) {
        throw new Error(`PREMIUM_FEATURE: ${licenseError.message}`);
    }

    try {
        const sourceData = fs.readFileSync(sourcePath);
        const insertData = fs.readFileSync(insertPath);
        
        const sourcePdf = await PDFDocument.load(sourceData);
        const insertPdf = await PDFDocument.load(insertData);
        
        const insertPages = await sourcePdf.copyPages(insertPdf, insertPdf.getPageIndices());
        
        // Insert pages at specified position
        insertPages.forEach((page, index) => {
            sourcePdf.insertPage(position + index, page);
        });
        
        const pdfBytes = await sourcePdf.save();
        fs.writeFileSync(outputPath, pdfBytes);
        
        return {
            success: true,
            originalPageCount: sourcePdf.getPageCount() - insertPages.length,
            insertedPageCount: insertPages.length,
            finalPageCount: sourcePdf.getPageCount()
        };
    } catch (error) {
        throw new Error(`Page insertion failed: ${error.message}`);
    }
}

/**
 * Insert pages conditionally based on text content
 * @param {string} sourcePath - Source PDF path
 * @param {string} insertPath - PDF to insert
 * @param {Object} condition - Insertion condition
 * @param {string} outputPath - Output file path
 * @returns {Promise<Object>} Conditional insertion results
 */
export async function insertConditional(sourcePath, insertPath, condition, outputPath) {
    // 🔒 SECURE LICENSE VALIDATION - Premium feature
    try {
        // Multiple security layers
        await validatePageInsertion(licenseManager);
        await _0x9a8b('conditional-insertion', licenseManager);
        await licenseManager.checkFeature('conditional-insertion');
    } catch (licenseError) {
        throw new Error(`PREMIUM_FEATURE: ${licenseError.message}`);
    }

    try {
        const text = await extractText(sourcePath);
        
        let shouldInsert = false;
        
        if (condition.containsText) {
            shouldInsert = text.toLowerCase().includes(condition.containsText.toLowerCase());
        }
        
        if (condition.matchesPattern) {
            const regex = new RegExp(condition.matchesPattern, 'i');
            shouldInsert = regex.test(text);
        }
        
        if (shouldInsert) {
            return await insertAtPage(sourcePath, insertPath, condition.position || 0, outputPath);
        } else {
            // Just copy original if condition not met
            fs.copyFileSync(sourcePath, outputPath);
            return {
                success: true,
                conditionMet: false,
                originalPageCount: 0,
                insertedPageCount: 0,
                finalPageCount: 0
            };
        }
    } catch (error) {
        throw new Error(`Conditional insertion failed: ${error.message}`);
    }
} 