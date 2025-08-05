// Ghostscript PDF Optimization Utilities
// Server-side PDF compression and optimization

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Optimize PDF using Ghostscript
 * @param {Buffer} pdfBuffer - Input PDF buffer
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} Optimization result with data and stats
 */
export async function optimizePdfWithGhostscript(pdfBuffer, options = {}) {
    const {
        compressionLevel = 'medium',
        optimizeImages = true,
        optimizeFonts = true,
        removeMetadata = true
    } = options;

    // Create temporary files
    const tempDir = `/tmp/stitchpdf-${Date.now()}`;
    await fs.mkdir(tempDir, { recursive: true });
    
    const inputPath = path.join(tempDir, 'input.pdf');
    const outputPath = path.join(tempDir, 'output.pdf');

    try {
        // Write input buffer to file
        await fs.writeFile(inputPath, pdfBuffer);
        
        // Get original size
        const originalStats = await fs.stat(inputPath);
        const originalSize = originalStats.size;

        console.log(`🚀 Optimizing PDF: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

        // Build Ghostscript command
        const gsCommand = buildGhostscriptCommand(inputPath, outputPath, {
            compressionLevel,
            optimizeImages,
            optimizeFonts,
            removeMetadata
        });

        // Execute Ghostscript
        const result = await executeGhostscript(gsCommand);
        
        if (result.error) {
            throw new Error(`Ghostscript failed: ${result.error}`);
        }

        // Read optimized file
        const optimizedBuffer = await fs.readFile(outputPath);
        const optimizedSize = optimizedBuffer.length;
        
        // Calculate savings
        const savings = originalSize - optimizedSize;
        const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
        const compressionRatio = (optimizedSize / originalSize).toFixed(3);

        console.log(`✅ Optimization complete: ${(optimizedSize / 1024 / 1024).toFixed(2)} MB (${savingsPercent}% savings)`);

        return {
            success: true,
            data: optimizedBuffer,
            stats: {
                originalSize,
                optimizedSize,
                savings,
                savingsPercent: parseFloat(savingsPercent),
                compressionRatio: parseFloat(compressionRatio)
            },
            tool: 'Ghostscript',
            version: await getGhostscriptVersion()
        };

    } catch (error) {
        console.error('Ghostscript optimization failed:', error);
        throw error;
    } finally {
        // Cleanup temporary files
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
            console.warn('Cleanup warning:', cleanupError.message);
        }
    }
}

/**
 * Build Ghostscript command based on options
 */
function buildGhostscriptCommand(inputPath, outputPath, options) {
    const {
        compressionLevel,
        optimizeImages,
        optimizeFonts,
        removeMetadata
    } = options;

    let command = [
        'gs',
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=' + getGhostscriptPreset(compressionLevel),
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH'
    ];

    // Image optimization
    if (optimizeImages) {
        command.push(
            '-dDownsampleColorImages=true',
            '-dDownsampleGrayImages=true',
            '-dDownsampleMonoImages=true',
            '-dColorImageResolution=' + getImageResolution(compressionLevel),
            '-dGrayImageResolution=' + getImageResolution(compressionLevel),
            '-dMonoImageResolution=' + getMonoImageResolution(compressionLevel)
        );
    }

    // Font optimization
    if (optimizeFonts) {
        command.push(
            '-dSubsetFonts=true',
            '-dEmbedAllFonts=true',
            '-dCompressFonts=true'
        );
    }

    // Metadata removal
    if (removeMetadata) {
        command.push(
            '-dPrinted=false'
        );
    }

    // Add output and input paths
    command.push(`-sOutputFile=${outputPath}`, inputPath);

    return command;
}

/**
 * Get Ghostscript preset based on compression level
 */
function getGhostscriptPreset(level) {
    const presets = {
        'low': '/printer',      // High quality, lower compression
        'medium': '/ebook',     // Balanced quality/compression
        'high': '/screen'       // Maximum compression
    };
    return presets[level] || presets.medium;
}

/**
 * Get image resolution based on compression level
 */
function getImageResolution(level) {
    const resolutions = {
        'low': 300,      // High quality
        'medium': 150,   // Balanced
        'high': 72       // Maximum compression
    };
    return resolutions[level] || resolutions.medium;
}

/**
 * Get mono image resolution based on compression level
 */
function getMonoImageResolution(level) {
    const resolutions = {
        'low': 1200,     // High quality
        'medium': 600,   // Balanced  
        'high': 300      // Maximum compression
    };
    return resolutions[level] || resolutions.medium;
}

/**
 * Execute Ghostscript command
 */
function executeGhostscript(command) {
    return new Promise((resolve) => {
        console.log('🔧 Executing Ghostscript:', command.join(' '));
        
        const process = spawn(command[0], command.slice(1), {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true, stdout, stderr });
            } else {
                resolve({ 
                    success: false, 
                    error: `Ghostscript exited with code ${code}: ${stderr}`,
                    stdout,
                    stderr
                });
            }
        });

        process.on('error', (error) => {
            resolve({ 
                success: false, 
                error: `Failed to start Ghostscript: ${error.message}`
            });
        });
    });
}

/**
 * Get Ghostscript version
 */
async function getGhostscriptVersion() {
    try {
        const result = await new Promise((resolve) => {
            const process = spawn('gs', ['--version'], { stdio: 'pipe' });
            let output = '';
            
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            process.on('close', (code) => {
                resolve(code === 0 ? output.trim() : 'unknown');
            });
            
            process.on('error', () => {
                resolve('unknown');
            });
        });
        
        return result;
    } catch (error) {
        return 'unknown';
    }
}

/**
 * Check if Ghostscript is available
 */
export async function checkGhostscriptAvailability() {
    try {
        const version = await getGhostscriptVersion();
        return {
            available: version !== 'unknown',
            version
        };
    } catch (error) {
        return {
            available: false,
            error: error.message
        };
    }
}

/**
 * Estimate optimization savings without processing
 */
export async function estimateGhostscriptSavings(fileSize, compressionLevel = 'medium') {
    // Estimation based on typical Ghostscript performance
    const savingsEstimates = {
        'low': { min: 15, max: 30, typical: 22 },
        'medium': { min: 30, max: 50, typical: 40 },
        'high': { min: 50, max: 80, typical: 65 }
    };

    const estimate = savingsEstimates[compressionLevel] || savingsEstimates.medium;
    const typicalSavings = estimate.typical / 100;
    
    const estimatedSize = Math.round(fileSize * (1 - typicalSavings));
    const estimatedSavingsBytes = fileSize - estimatedSize;
    
    return {
        originalSize: fileSize,
        estimatedSize,
        estimatedSavings: estimatedSavingsBytes,
        estimatedSavingsPercent: estimate.typical,
        compressionLevel,
        range: {
            min: Math.round(fileSize * (1 - estimate.max / 100)),
            max: Math.round(fileSize * (1 - estimate.min / 100))
        }
    };
}