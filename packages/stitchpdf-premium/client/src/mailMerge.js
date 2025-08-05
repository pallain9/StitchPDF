// Premium Mail Merge Client
// Client-side wrapper for mail merge API operations

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
 * Create mail merge configuration from template
 * @param {string} templatePath - Path to PDF template
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Mail merge configuration
 */
export async function createMailMerge(templatePath, options = {}) {
    const config = getConfig();
    
    try {
        console.log('📋 Creating mail merge configuration...');
        
        // Step 1: Upload template and get configuration
        const stats = await fs.stat(templatePath);
        const fileName = path.basename(templatePath);
        
        console.log(`📄 Template: ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
        
        // Get presigned upload URL for template
        console.log('📡 Getting template upload URL...');
        const uploadResponse = await fetch(`${config.baseUrl}/mailmerge/upload-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: config.apiKey,
                fileName
            })
        });

        if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(`Upload URL request failed: ${error.error}`);
        }

        const { uploadUrl, templateKey } = await uploadResponse.json();

        // Upload template to S3
        console.log('⬆️  Uploading template...');
        const templateBuffer = await fs.readFile(templatePath);
        
        const uploadResult = await fetch(uploadUrl, {
            method: 'PUT',
            body: templateBuffer,
            headers: {
                'Content-Type': 'application/pdf'
            }
        });

        if (!uploadResult.ok) {
            throw new Error(`Template upload failed: ${uploadResult.statusText}`);
        }

        // Create merge configuration
        console.log('⚙️  Creating merge configuration...');
        const configResponse = await fetch(`${config.baseUrl}/mailmerge/create-config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: config.apiKey,
                templateKey,
                options
            })
        });

        if (!configResponse.ok) {
            const error = await configResponse.json();
            throw new Error(`Configuration creation failed: ${error.error}`);
        }

        const configuration = await configResponse.json();

        console.log(`✅ Configuration created with ${configuration.fields.length} fields`);
        console.log(`📋 Fields found:`, configuration.fields.map(f => f.name).join(', '));

        return configuration;

    } catch (error) {
        console.error('❌ Create mail merge failed:', error.message);
        throw error;
    }
}

/**
 * Process mail merge with data
 * @param {string} templatePath - Path to PDF template  
 * @param {Array|string} mergeData - Array of data objects or path to CSV file
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results with download URLs
 */
export async function processMailMerge(templatePath, mergeData, options = {}) {
    const config = getConfig();
    
    try {
        console.log('🔄 Starting mail merge processing...');
        
        // Step 1: Prepare data
        let dataArray;
        if (typeof mergeData === 'string') {
            // Load CSV file
            const csvData = await fs.readFile(mergeData, 'utf8');
            dataArray = csvData; // Will be parsed on server
            console.log(`📊 Loaded data from: ${path.basename(mergeData)}`);
        } else if (Array.isArray(mergeData)) {
            dataArray = mergeData;
            console.log(`📊 Processing ${mergeData.length} records`);
        } else {
            throw new Error('Invalid merge data. Expected array or CSV file path.');
        }

        // Step 2: Upload template
        const stats = await fs.stat(templatePath);
        const fileName = path.basename(templatePath);
        
        console.log(`📄 Template: ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
        
        // Get presigned upload URL
        const uploadResponse = await fetch(`${config.baseUrl}/mailmerge/upload-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: config.apiKey,
                fileName
            })
        });

        if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(`Upload URL request failed: ${error.error}`);
        }

        const { uploadUrl, templateKey } = await uploadResponse.json();

        // Upload template
        console.log('⬆️  Uploading template...');
        const templateBuffer = await fs.readFile(templatePath);
        
        const uploadResult = await fetch(uploadUrl, {
            method: 'PUT',
            body: templateBuffer,
            headers: {
                'Content-Type': 'application/pdf'
            }
        });

        if (!uploadResult.ok) {
            throw new Error(`Template upload failed: ${uploadResult.statusText}`);
        }

        // Step 3: Process mail merge
        console.log('⚙️  Processing mail merge...');
        const processResponse = await fetch(`${config.baseUrl}/mailmerge/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: config.apiKey,
                templateKey,
                mergeData: dataArray,
                options: {
                    outputFormat: options.outputFormat || 'individual',
                    includeMetadata: options.includeMetadata !== false
                }
            })
        });

        if (!processResponse.ok) {
            const error = await processResponse.json();
            throw new Error(`Mail merge processing failed: ${error.error}`);
        }

        const result = await processResponse.json();

        console.log(`✅ Mail merge completed: ${result.recordsProcessed} records processed`);

        // Step 4: Download results if output directory specified
        if (options.outputDir) {
            await downloadMergeResults(result.downloadUrls, options.outputDir);
        }

        return result;

    } catch (error) {
        console.error('❌ Mail merge failed:', error.message);
        throw error;
    }
}

/**
 * Download merge results to local directory
 * @param {Array} downloadUrls - Array of download URL objects
 * @param {string} outputDir - Output directory path
 */
async function downloadMergeResults(downloadUrls, outputDir) {
    console.log(`⬇️  Downloading ${downloadUrls.length} files to ${outputDir}...`);
    
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    for (let i = 0; i < downloadUrls.length; i++) {
        const urlInfo = downloadUrls[i];
        
        try {
            const response = await fetch(urlInfo.url);
            
            if (!response.ok) {
                throw new Error(`Download failed: ${response.statusText}`);
            }
            
            const buffer = await response.buffer();
            
            // Generate filename
            let fileName;
            if (urlInfo.type === 'combined') {
                fileName = 'merged-combined.pdf';
            } else {
                const recordName = urlInfo.record?.name || urlInfo.record?.email || `record-${urlInfo.index}`;
                fileName = `merged-${sanitizeFileName(recordName)}.pdf`;
            }
            
            const outputPath = path.join(outputDir, fileName);
            await fs.writeFile(outputPath, buffer);
            
            console.log(`📄 Downloaded: ${fileName}`);
            
        } catch (error) {
            console.error(`❌ Failed to download file ${i + 1}:`, error.message);
        }
    }
    
    console.log(`✅ Download complete: ${downloadUrls.length} files saved to ${outputDir}`);
}

/**
 * Sanitize filename for safe file system use
 */
function sanitizeFileName(name) {
    return name.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
}

/**
 * Batch process multiple mail merges
 * @param {Array} mergeJobs - Array of merge job configurations
 * @param {Object} options - Batch processing options
 * @returns {Promise<Array>} Array of processing results
 */
export async function batchMailMerge(mergeJobs, options = {}) {
    const config = getConfig();
    
    if (!Array.isArray(mergeJobs) || mergeJobs.length === 0) {
        throw new Error('Merge jobs must be a non-empty array');
    }

    console.log(`🔄 Starting batch mail merge: ${mergeJobs.length} jobs`);
    
    const results = [];
    
    for (let i = 0; i < mergeJobs.length; i++) {
        const job = mergeJobs[i];
        
        try {
            console.log(`\n📄 Processing job ${i + 1}/${mergeJobs.length}: ${path.basename(job.templatePath)}`);
            
            const result = await processMailMerge(job.templatePath, job.mergeData, {
                ...options,
                ...job.options,
                outputDir: job.outputDir || options.outputDir
            });
            
            results.push({
                success: true,
                jobIndex: i,
                templatePath: job.templatePath,
                result
            });
            
        } catch (error) {
            console.error(`❌ Job ${i + 1} failed:`, error.message);
            results.push({
                success: false,
                jobIndex: i,
                templatePath: job.templatePath,
                error: error.message
            });
        }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`\n✅ Batch mail merge complete: ${successful}/${mergeJobs.length} successful`);
    
    return results;
}