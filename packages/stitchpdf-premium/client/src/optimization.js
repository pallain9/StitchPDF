// Premium PDF Optimization Client
// Implements presigned URL workflow for secure AWS API processing

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
 * Optimize PDF with Ghostscript compression
 * @param {string} inputPath - Path to input PDF
 * @param {Object} options - Optimization options
 * @param {string} options.outputPath - Optional output path (returns buffer if not provided)
 * @param {string} options.compression - 'low', 'medium', 'high'
 * @param {boolean} options.optimizeImages - Optimize images
 * @param {boolean} options.optimizeFonts - Optimize fonts
 * @param {boolean} options.removeMetadata - Remove metadata
 * @returns {Promise<string|Buffer>} Output path or buffer
 */
export async function optimizePdf(inputPath, options = {}) {
    const config = getConfig();
    
    try {
        console.log('🚀 Starting PDF optimization...');
        
        // Step 1: Get file info
        const stats = await fs.stat(inputPath);
        const fileName = path.basename(inputPath);
        
        console.log(`📄 File: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        
        // Step 2: Get presigned upload URL
        console.log('📡 Getting upload URL...');
        const uploadResponse = await fetch(`${config.baseUrl}/optimization/upload-url`, {
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

        // Step 3: Upload PDF directly to S3
        console.log('⬆️  Uploading to S3...');
        const fileBuffer = await fs.readFile(inputPath);
        
        const uploadResult = await fetch(uploadUrl, {
            method: 'PUT',
            body: fileBuffer,
            headers: {
                'Content-Type': 'application/pdf'
            }
        });

        if (!uploadResult.ok) {
            throw new Error(`S3 upload failed: ${uploadResult.statusText}`);
        }

        // Step 4: Trigger optimization
        console.log('⚙️  Processing optimization...');
        const optimizeResponse = await fetch(`${config.baseUrl}/optimization/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: config.apiKey,
                key,
                options: {
                    compression: options.compression || 'medium',
                    optimizeImages: options.optimizeImages !== false,
                    optimizeFonts: options.optimizeFonts !== false,
                    removeMetadata: options.removeMetadata !== false
                }
            })
        });

        if (!optimizeResponse.ok) {
            const error = await optimizeResponse.json();
            throw new Error(`Optimization failed: ${error.error}`);
        }

        const result = await optimizeResponse.json();

        // Step 5: Download optimized PDF
        console.log('⬇️  Downloading optimized PDF...');
        const downloadResponse = await fetch(result.downloadUrl);
        
        if (!downloadResponse.ok) {
            throw new Error(`Download failed: ${downloadResponse.statusText}`);
        }

        const optimizedBuffer = await downloadResponse.buffer();

        // Step 6: Save or return result
        if (options.outputPath) {
            await fs.writeFile(options.outputPath, optimizedBuffer);
            console.log(`✅ Optimization complete! Saved to: ${options.outputPath}`);
            console.log(`📊 Original: ${(stats.size / 1024 / 1024).toFixed(2)} MB → Optimized: ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
            console.log(`💾 Space saved: ${result.stats.savings}`);
            return options.outputPath;
        } else {
            console.log(`✅ Optimization complete!`);
            console.log(`📊 Original: ${(stats.size / 1024 / 1024).toFixed(2)} MB → Optimized: ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
            return optimizedBuffer;
        }

    } catch (error) {
        console.error('❌ Optimization failed:', error.message);
        throw error;
    }
}

/**
 * Estimate optimization savings without processing
 * @param {string} inputPath - Path to input PDF
 * @returns {Promise<Object>} Estimation results
 */
export async function estimateOptimization(inputPath) {
    const config = getConfig();
    
    try {
        const stats = await fs.stat(inputPath);
        const fileName = path.basename(inputPath);
        
        const response = await fetch(`${config.baseUrl}/optimization/estimate`, {
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

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Estimation failed: ${error.error}`);
        }

        const estimation = await response.json();
        
        console.log(`📊 Optimization Estimate for ${fileName}:`);
        console.log(`• Current size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`• Estimated optimized size: ${estimation.estimatedSize}`);
        console.log(`• Potential savings: ${estimation.estimatedSavings}`);
        console.log(`• Compression ratio: ${estimation.compressionRatio}`);
        
        return estimation;

    } catch (error) {
        console.error('❌ Estimation failed:', error.message);
        throw error;
    }
}

/**
 * Batch optimize multiple PDFs
 * @param {string[]} inputPaths - Array of PDF paths
 * @param {Object} options - Optimization options
 * @returns {Promise<Object[]>} Array of results
 */
export async function batchOptimize(inputPaths, options = {}) {
    const config = getConfig();
    
    if (!Array.isArray(inputPaths) || inputPaths.length === 0) {
        throw new Error('Input paths must be a non-empty array');
    }

    console.log(`🔄 Starting batch optimization of ${inputPaths.length} files...`);
    
    const results = [];
    
    for (let i = 0; i < inputPaths.length; i++) {
        const inputPath = inputPaths[i];
        const fileName = path.basename(inputPath);
        const outputPath = options.outputDir ? 
            path.join(options.outputDir, `optimized-${fileName}`) :
            inputPath.replace('.pdf', '-optimized.pdf');
        
        try {
            console.log(`\n📄 Processing ${i + 1}/${inputPaths.length}: ${fileName}`);
            
            const result = await optimizePdf(inputPath, {
                ...options,
                outputPath
            });
            
            results.push({
                success: true,
                inputPath,
                outputPath: result,
                index: i
            });
            
        } catch (error) {
            console.error(`❌ Failed to optimize ${fileName}:`, error.message);
            results.push({
                success: false,
                inputPath,
                error: error.message,
                index: i
            });
        }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`\n✅ Batch optimization complete: ${successful}/${inputPaths.length} successful`);
    
    return results;
} 