// Mail Merge Module - PREMIUM FEATURE - SECURE
import fs from 'fs';
import { PDFDocument, rgb } from 'pdf-lib';
import { LicenseManager } from '../licensing/licenseManager.mjs';
import { validateMailMerge, _0x9a8b } from '../licensing/securityValidator.mjs';

// Initialize license manager with security
const licenseManager = new LicenseManager();

/**
 * Create mail merge configuration
 * @param {string} templatePath - Template PDF path
 * @param {Array} fields - Field definitions
 * @returns {Object} Mail merge configuration
 */
export async function createMailMerge(templatePath, fields) {
    // 🔒 SECURE LICENSE VALIDATION - Premium feature
    try {
        // Multiple security layers
        await validateMailMerge(licenseManager);
        await _0x9a8b('mail-merge', licenseManager);
        await licenseManager.checkFeature('mail-merge');
    } catch (licenseError) {
        throw new Error(`PREMIUM_FEATURE: ${licenseError.message}`);
    }

    return {
        template: templatePath,
        fields: fields.map(field => ({
            name: field.name,
            x: field.x || 100,
            y: field.y || 700,
            fontSize: field.fontSize || 12,
            maxLength: field.maxLength || 100
        }))
    };
}

/**
 * Process mail merge with data
 * @param {Object} mergeConfig - Mail merge configuration
 * @param {Array} dataArray - Array of data objects
 * @param {string} outputDir - Output directory
 * @returns {Promise<Array>} Generated file paths
 */
export async function processMailMerge(mergeConfig, dataArray, outputDir) {
    // 🔒 SECURE LICENSE VALIDATION - Premium feature
    try {
        // Multiple security layers
        await validateMailMerge(licenseManager);
        await _0x9a8b('mail-merge', licenseManager);
        await licenseManager.checkFeature('mail-merge');
    } catch (licenseError) {
        throw new Error(`PREMIUM_FEATURE: ${licenseError.message}`);
    }

    const generatedFiles = [];
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    for (let i = 0; i < dataArray.length; i++) {
        const data = dataArray[i];
        const outputPath = `${outputDir}/merged_${i + 1}.pdf`;
        
        const pdfBytes = await generateMergedPdf(mergeConfig, data);
        fs.writeFileSync(outputPath, pdfBytes);
        
        generatedFiles.push(outputPath);
    }
    
    return generatedFiles;
}

/**
 * Generate single merged PDF
 * @param {Object} mergeConfig - Mail merge configuration
 * @param {Object} data - Data object
 * @returns {Promise<Uint8Array>} PDF bytes
 */
async function generateMergedPdf(mergeConfig, data) {
    const templateData = fs.readFileSync(mergeConfig.template);
    const pdfDoc = await PDFDocument.load(templateData);
    
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Add text fields
    mergeConfig.fields.forEach(field => {
        const value = data[field.name] || '';
        firstPage.drawText(String(value), {
            x: field.x,
            y: field.y,
            size: field.fontSize,
            color: rgb(0, 0, 0)
        });
    });
    
    return await pdfDoc.save();
} 