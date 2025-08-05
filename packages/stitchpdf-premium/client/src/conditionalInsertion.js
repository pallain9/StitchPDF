// Premium Conditional Insertion Client
// Client-side wrapper for smart text-based page insertion

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

/**
 * Get API configuration
 */
function getConfig() {
    if (!global.STITCHPDF_CONFIG) {
        throw new Error('Premium client not configured. Call configure({ apiKey: "your-key" }) first.');
    }
    return global.STITCHPDF_CONFIG;
}

/**
 * Insert pages based on text conditions
 * @param {string} targetPath - Path to target PDF
 * @param {string} insertPath - Path to PDF to insert
 * @param {Object} conditions - Insertion conditions
 * @param {Object} options - Insertion options
 * @returns {Promise<string|Buffer>} Result path or buffer
 */
export async function insertConditional(targetPath, insertPath, conditions = {}, options = {}) {
    const config = getConfig();
    
    try {
        console.log('🎯 Starting conditional page insertion...');
        
        // Validate conditions
        if (!conditions.textContains && !conditions.textMatches && !conditions.pageNumber) {
            throw new Error('At least one condition must be specified (textContains, textMatches, or pageNumber)');
        }

        // Step 1: Upload files
        const [targetKey, insertKey] = await uploadFiles(targetPath, insertPath);

        // Step 2: Process conditional insertion
        console.log('⚙️  Processing conditional insertion...');
        const processResponse = await fetch(`${config.baseUrl}/insertion/conditional`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: config.apiKey,
                targetKey,
                insertKey,
                conditions,
                options: {
                    insertBefore: options.insertBefore !== false,
                    insertAfter: options.insertAfter === true,
                    caseSensitive: options.caseSensitive === true,
                    multipleMatches: options.multipleMatches === true
                }
            })
        });

        if (!processResponse.ok) {
            const error = await processResponse.json();
            throw new Error(`Conditional insertion failed: ${error.error}`);
        }

        const result = await processResponse.json();

        console.log(`✅ Conditional insertion completed!`);
        console.log(`📊 Matches found: ${result.matchesFound}`);
        console.log(`📄 Pages inserted: ${result.pagesInserted}`);

        // Step 3: Download result
        const resultBuffer = await downloadResult(result.downloadUrl);
        
        if (options.outputPath) {
            await fs.writeFile(options.outputPath, resultBuffer);
            console.log(`💾 Output saved to: ${options.outputPath}`);
            return options.outputPath;
        }
        
        return resultBuffer;

    } catch (error) {
        console.error('❌ Conditional insertion failed:', error.message);
        throw error;
    }
}

/**
 * Smart insert with multiple conditions and rules
 * @param {string} targetPath - Path to target PDF
 * @param {string} insertPath - Path to PDF to insert  
 * @param {Object} rules - Complex insertion rules
 * @param {Object} options - Processing options
 * @returns {Promise<string|Buffer>} Result path or buffer
 */
export async function smartInsert(targetPath, insertPath, rules = {}, options = {}) {
    const config = getConfig();
    
    try {
        console.log('🧠 Starting smart insertion with advanced rules...');
        
        // Validate rules
        if (!rules.conditions || !Array.isArray(rules.conditions)) {
            throw new Error('Rules must contain an array of conditions');
        }

        // Step 1: Upload files
        const [targetKey, insertKey] = await uploadFiles(targetPath, insertPath);

        // Step 2: Process smart insertion
        console.log('⚙️  Processing smart insertion...');
        const processResponse = await fetch(`${config.baseUrl}/insertion/smart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: config.apiKey,
                targetKey,
                insertKey,
                rules: {
                    conditions: rules.conditions,
                    logic: rules.logic || 'AND', // AND, OR
                    priority: rules.priority || 'first-match', // first-match, all-matches
                    placement: rules.placement || 'before' // before, after, replace
                },
                options
            })
        });

        if (!processResponse.ok) {
            const error = await processResponse.json();
            throw new Error(`Smart insertion failed: ${error.error}`);
        }

        const result = await processResponse.json();

        console.log(`✅ Smart insertion completed!`);
        console.log(`📊 Rules processed: ${result.rulesProcessed}`);
        console.log(`📄 Total insertions: ${result.totalInsertions}`);

        // Step 3: Download result
        const resultBuffer = await downloadResult(result.downloadUrl);
        
        if (options.outputPath) {
            await fs.writeFile(options.outputPath, resultBuffer);
            console.log(`💾 Output saved to: ${options.outputPath}`);
            return options.outputPath;
        }
        
        return resultBuffer;

    } catch (error) {
        console.error('❌ Smart insertion failed:', error.message);
        throw error;
    }
}

/**
 * Analyze text patterns in PDF for insertion planning
 * @param {string} pdfPath - Path to PDF to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeInsertionOpportunities(pdfPath, options = {}) {
    const config = getConfig();
    
    try {
        console.log('🔍 Analyzing PDF for insertion opportunities...');
        
        // Step 1: Upload PDF for analysis
        const stats = await fs.stat(pdfPath);
        const fileName = path.basename(pdfPath);
        
        // Get upload URL
        const uploadResponse = await fetch(`${config.baseUrl}/insertion/upload-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: config.apiKey,
                fileName,
                fileSize: stats.size
            })
        });

        if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(`Upload URL request failed: ${error.error}`);
        }

        const { uploadUrl, key } = await uploadResponse.json();

        // Upload PDF
        const fileBuffer = await fs.readFile(pdfPath);
        const uploadResult = await fetch(uploadUrl, {
            method: 'PUT',
            body: fileBuffer,
            headers: {
                'Content-Type': 'application/pdf'
            }
        });

        if (!uploadResult.ok) {
            throw new Error(`PDF upload failed: ${uploadResult.statusText}`);
        }

        // Step 2: Analyze insertion opportunities
        const analysisResponse = await fetch(`${config.baseUrl}/insertion/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: config.apiKey,
                key,
                options: {
                    detectHeaders: options.detectHeaders !== false,
                    detectSections: options.detectSections !== false,
                    detectPageBreaks: options.detectPageBreaks !== false,
                    customPatterns: options.customPatterns || []
                }
            })
        });

        if (!analysisResponse.ok) {
            const error = await analysisResponse.json();
            throw new Error(`Analysis failed: ${error.error}`);
        }

        const analysis = await analysisResponse.json();

        console.log(`✅ Analysis complete!`);
        console.log(`📊 Found ${analysis.opportunities.length} insertion opportunities`);

        return analysis;

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        throw error;
    }
}

/**
 * Upload target and insert PDFs
 */
async function uploadFiles(targetPath, insertPath) {
    const config = getConfig();
    
    console.log('⬆️  Uploading PDFs...');
    
    // Upload target PDF
    const targetResult = await uploadSingleFile(targetPath, 'target');
    console.log(`📄 Target uploaded: ${path.basename(targetPath)}`);
    
    // Upload insert PDF
    const insertResult = await uploadSingleFile(insertPath, 'insert');
    console.log(`📄 Insert uploaded: ${path.basename(insertPath)}`);
    
    return [targetResult.key, insertResult.key];
}

/**
 * Upload a single file
 */
async function uploadSingleFile(filePath, purpose) {
    const config = getConfig();
    
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    
    // Get upload URL
    const uploadResponse = await fetch(`${config.baseUrl}/insertion/upload-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            apiKey: config.apiKey,
            fileName,
            fileSize: stats.size,
            purpose
        })
    });

    if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(`Upload URL request failed for ${purpose}: ${error.error}`);
    }

    const { uploadUrl, key } = await uploadResponse.json();

    // Upload file
    const fileBuffer = await fs.readFile(filePath);
    const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileBuffer,
        headers: {
            'Content-Type': 'application/pdf'
        }
    });

    if (!uploadResult.ok) {
        throw new Error(`Upload failed for ${purpose}: ${uploadResult.statusText}`);
    }

    return { key };
}

/**
 * Download result from presigned URL
 */
async function downloadResult(downloadUrl) {
    console.log('⬇️  Downloading result...');
    
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
    }
    
    return await response.buffer();
}

/**
 * Batch conditional insertion
 * @param {Array} insertionJobs - Array of insertion job configurations
 * @param {Object} options - Batch processing options
 * @returns {Promise<Array>} Array of processing results
 */
export async function batchConditionalInsert(insertionJobs, options = {}) {
    if (!Array.isArray(insertionJobs) || insertionJobs.length === 0) {
        throw new Error('Insertion jobs must be a non-empty array');
    }

    console.log(`🔄 Starting batch conditional insertion: ${insertionJobs.length} jobs`);
    
    const results = [];
    
    for (let i = 0; i < insertionJobs.length; i++) {
        const job = insertionJobs[i];
        
        try {
            console.log(`\n📄 Processing job ${i + 1}/${insertionJobs.length}`);
            
            const result = await insertConditional(
                job.targetPath, 
                job.insertPath, 
                job.conditions, 
                {
                    ...options,
                    ...job.options,
                    outputPath: job.outputPath
                }
            );
            
            results.push({
                success: true,
                jobIndex: i,
                targetPath: job.targetPath,
                result
            });
            
        } catch (error) {
            console.error(`❌ Job ${i + 1} failed:`, error.message);
            results.push({
                success: false,
                jobIndex: i,
                targetPath: job.targetPath,
                error: error.message
            });
        }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`\n✅ Batch conditional insertion complete: ${successful}/${insertionJobs.length} successful`);
    
    return results;
}