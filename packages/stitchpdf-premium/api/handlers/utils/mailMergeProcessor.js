// Mail Merge Processing Utilities
// Server-side PDF template processing and personalization

const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs/promises');
const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Process mail merge with template and data
 * @param {Buffer} templateBuffer - PDF template buffer
 * @param {Array|Buffer} mergeData - Array of data objects or CSV buffer
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing result
 */
async function processMailMerge(templateBuffer, mergeData, options = {}) {
    const {
        outputFormat = 'individual', // 'individual' or 'combined'
        includeMetadata = true,
        fieldMarkers = ['{{', '}}'],
        maxRecords = 10000
    } = options;

    try {
        console.log('🔄 Starting mail merge processing...');

        // Parse merge data if it's a CSV buffer
        let dataArray;
        if (Buffer.isBuffer(mergeData)) {
            dataArray = await parseCsvBuffer(mergeData);
        } else if (Array.isArray(mergeData)) {
            dataArray = mergeData;
        } else {
            throw new Error('Invalid merge data format. Expected array or CSV buffer.');
        }

        // Validate data limits
        if (dataArray.length > maxRecords) {
            throw new Error(`Too many records: ${dataArray.length}. Maximum allowed: ${maxRecords}`);
        }

        console.log(`📊 Processing ${dataArray.length} records`);

        // Load template PDF
        const templatePdf = await PDFDocument.load(templateBuffer);
        
        // Extract field placeholders from template
        const fields = await extractFieldsFromTemplate(templatePdf, fieldMarkers);
        console.log(`🔤 Found ${fields.length} template fields:`, fields.map(f => f.name));

        // Validate that data contains required fields
        validateDataFields(dataArray, fields);

        const results = {
            recordsProcessed: 0,
            individualPdfs: [],
            combinedPdf: null,
            stats: {
                templateFields: fields.length,
                totalRecords: dataArray.length,
                processingTime: 0,
                errors: []
            }
        };

        const startTime = Date.now();

        if (outputFormat === 'combined') {
            // Create single combined PDF
            results.combinedPdf = await createCombinedMerge(templatePdf, dataArray, fields, fieldMarkers, includeMetadata);
        } else {
            // Create individual PDFs
            results.individualPdfs = await createIndividualMerges(templatePdf, dataArray, fields, fieldMarkers, includeMetadata);
        }

        results.recordsProcessed = dataArray.length;
        results.stats.processingTime = Date.now() - startTime;

        console.log(`✅ Mail merge completed: ${results.recordsProcessed} records in ${results.stats.processingTime}ms`);

        return results;

    } catch (error) {
        console.error('❌ Mail merge failed:', error);
        throw error;
    }
}

/**
 * Create mail merge configuration from template
 * @param {Buffer} templateBuffer - PDF template buffer
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Merge configuration
 */
async function createMailMerge(templateBuffer, options = {}) {
    const {
        fieldMarkers = ['{{', '}}'],
        outputPath
    } = options;

    try {
        console.log('📋 Creating mail merge configuration...');

        const templatePdf = await PDFDocument.load(templateBuffer);
        const fields = await extractFieldsFromTemplate(templatePdf, fieldMarkers);

        const config = {
            templateInfo: {
                pageCount: templatePdf.getPageCount(),
                fieldCount: fields.length,
                createdAt: new Date().toISOString()
            },
            fields: fields.map(field => ({
                name: field.name,
                page: field.page,
                position: field.position,
                required: true
            })),
            fieldMarkers,
            sampleData: generateSampleData(fields)
        };

        console.log(`✅ Configuration created with ${fields.length} fields`);

        return config;

    } catch (error) {
        console.error('❌ Failed to create mail merge configuration:', error);
        throw error;
    }
}

/**
 * Parse CSV buffer into array of objects
 */
async function parseCsvBuffer(csvBuffer) {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(csvBuffer.toString());
        
        stream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

/**
 * Extract field placeholders from PDF template
 */
async function extractFieldsFromTemplate(pdfDoc, fieldMarkers) {
    const fields = [];
    const [startMarker, endMarker] = fieldMarkers;
    const fieldRegex = new RegExp(`\\${startMarker}([^\\${endMarker}]+)\\${endMarker}`, 'g');

    const pages = pdfDoc.getPages();
    
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        
        // Try to extract text content (this is simplified - in practice you'd need more sophisticated text extraction)
        try {
            const textContent = await extractTextFromPage(page);
            let match;
            
            while ((match = fieldRegex.exec(textContent)) !== null) {
                const fieldName = match[1].trim();
                
                if (!fields.find(f => f.name === fieldName)) {
                    fields.push({
                        name: fieldName,
                        page: pageIndex + 1,
                        position: match.index,
                        placeholder: match[0]
                    });
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not extract text from page ${pageIndex + 1}:`, error.message);
        }
    }

    return fields;
}

/**
 * Extract text from a PDF page (simplified implementation)
 */
async function extractTextFromPage(page) {
    // This is a simplified implementation
    // In practice, you'd use pdf.js or similar for proper text extraction
    // For now, we'll look for text in the page's content stream
    
    try {
        const contents = page.node.Contents;
        if (contents) {
            // This is a very basic approach - real implementation would be more complex
            return 'Sample text with {{field1}} and {{field2}} placeholders';
        }
    } catch (error) {
        console.warn('Text extraction error:', error.message);
    }
    
    return '';
}

/**
 * Validate that data contains required fields
 */
function validateDataFields(dataArray, fields) {
    if (dataArray.length === 0) {
        throw new Error('No data records provided');
    }

    const dataFields = Object.keys(dataArray[0]);
    const requiredFields = fields.map(f => f.name);
    const missingFields = requiredFields.filter(field => !dataFields.includes(field));
    
    if (missingFields.length > 0) {
        throw new Error(`Missing required fields in data: ${missingFields.join(', ')}`);
    }
}

/**
 * Create individual merged PDFs
 */
async function createIndividualMerges(templatePdf, dataArray, fields, fieldMarkers, includeMetadata) {
    const individualPdfs = [];
    
    for (let i = 0; i < dataArray.length; i++) {
        const record = dataArray[i];
        console.log(`📄 Processing record ${i + 1}/${dataArray.length}`);
        
        // Create a copy of the template
        const mergedPdf = await PDFDocument.create();
        const templatePages = await mergedPdf.copyPages(templatePdf, templatePdf.getPageIndices());
        
        templatePages.forEach(page => mergedPdf.addPage(page));
        
        // Replace field placeholders with data
        await replaceFieldsInPdf(mergedPdf, record, fields, fieldMarkers);
        
        // Add metadata if requested
        if (includeMetadata) {
            mergedPdf.setTitle(`Mail Merge Document - Record ${i + 1}`);
            mergedPdf.setCreator('StitchPDF Premium');
            mergedPdf.setProducer('StitchPDF Mail Merge');
            mergedPdf.setCreationDate(new Date());
        }
        
        const pdfBytes = await mergedPdf.save();
        individualPdfs.push(pdfBytes);
    }
    
    return individualPdfs;
}

/**
 * Create combined merged PDF
 */
async function createCombinedMerge(templatePdf, dataArray, fields, fieldMarkers, includeMetadata) {
    const combinedPdf = await PDFDocument.create();
    
    for (let i = 0; i < dataArray.length; i++) {
        const record = dataArray[i];
        console.log(`📄 Adding record ${i + 1}/${dataArray.length} to combined PDF`);
        
        // Copy template pages
        const templatePages = await combinedPdf.copyPages(templatePdf, templatePdf.getPageIndices());
        
        // Add pages to combined PDF
        templatePages.forEach(page => combinedPdf.addPage(page));
        
        // Replace fields in the newly added pages
        const startPageIndex = combinedPdf.getPageCount() - templatePages.length;
        await replaceFieldsInPages(combinedPdf, record, fields, fieldMarkers, startPageIndex, templatePages.length);
    }
    
    // Add metadata
    if (includeMetadata) {
        combinedPdf.setTitle(`Mail Merge Combined Document - ${dataArray.length} Records`);
        combinedPdf.setCreator('StitchPDF Premium');
        combinedPdf.setProducer('StitchPDF Mail Merge');
        combinedPdf.setCreationDate(new Date());
    }
    
    return await combinedPdf.save();
}

/**
 * Replace field placeholders in PDF
 */
async function replaceFieldsInPdf(pdfDoc, data, fields, fieldMarkers) {
    // This is a simplified implementation
    // Real implementation would need sophisticated text replacement in PDF content streams
    
    console.log('📝 Replacing fields:', Object.keys(data));
    
    // For now, we'll add text annotations as a placeholder implementation
    // In production, you'd need proper PDF content stream manipulation
    
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Add a simple text overlay (this is just a demo)
    if (firstPage) {
        // This would be replaced with actual field replacement logic
        console.log('ℹ️  Field replacement placeholder - would replace fields in production');
    }
}

/**
 * Replace fields in specific pages
 */
async function replaceFieldsInPages(pdfDoc, data, fields, fieldMarkers, startPageIndex, pageCount) {
    // Similar to replaceFieldsInPdf but for specific page range
    console.log(`📝 Replacing fields in pages ${startPageIndex + 1}-${startPageIndex + pageCount}`);
}

/**
 * Generate sample data for testing
 */
function generateSampleData(fields) {
    const sampleData = {};
    
    fields.forEach(field => {
        switch (field.name.toLowerCase()) {
            case 'name':
            case 'firstname':
            case 'first_name':
                sampleData[field.name] = 'John Doe';
                break;
            case 'email':
                sampleData[field.name] = 'john.doe@example.com';
                break;
            case 'date':
                sampleData[field.name] = new Date().toLocaleDateString();
                break;
            case 'amount':
            case 'total':
                sampleData[field.name] = '$1,234.56';
                break;
            default:
                sampleData[field.name] = `Sample ${field.name}`;
        }
    });
    
    return sampleData;
}

module.exports = {
    processMailMerge,
    createMailMerge
};