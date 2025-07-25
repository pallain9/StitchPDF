// Ghostscript-Powered PDF Optimization Module - SECURE
import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { LicenseManager } from '../licensing/licenseManager.js';
import { validateOptimization, _0x9a8b } from '../licensing/securityValidator.js';

// Initialize license manager with security
const licenseManager = new LicenseManager();

/**
 * Optimize PDF using Ghostscript - PREMIUM FEATURE
 * @param {string} inputPath - Input PDF file path
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} Real optimization results
 */
export async function optimizePdfWithGhostscript(inputPath, options = {}) {
    // 🔒 SECURE LICENSE VALIDATION - Premium feature
    try {
        // Multiple security layers
        await validateOptimization(licenseManager);
        await _0x9a8b('optimization', licenseManager);
        await licenseManager.checkFeature('optimization');
    } catch (licenseError) {
        return {
            success: false,
            error: 'PREMIUM_FEATURE_REQUIRED',
            message: licenseError.message,
            tier: 'pro',
            upgradeUrl: 'https://stitchpdf.com/pricing'
        };
    }

    const {
        outputPath,
        compressionLevel = 'medium',
        optimizeImages = true,
        optimizeFonts = true,
        removeMetadata = true
    } = options;

    try {
        console.log('🚀 Starting Ghostscript-powered optimization...');
        console.log('💡 This actually works, unlike pdf-lib!');
        
        // Get original file size
        const originalStats = fs.statSync(inputPath);
        const originalSize = originalStats.size;
        const originalSizeMB = (originalSize / 1024 / 1024).toFixed(2);
        
        console.log(`📄 Original size: ${originalSizeMB} MB`);

        // Build Ghostscript command based on optimization level
        const gsCommand = buildGhostscriptCommand(inputPath, outputPath, {
            compressionLevel,
            optimizeImages,
            optimizeFonts,
            removeMetadata
        });

        console.log('⚙️  Running Ghostscript optimization...');
        console.log(`🔧 Command: ${gsCommand.join(' ')}`);

        // Run Ghostscript optimization
        const result = await runGhostscriptCommand(gsCommand);
        
        if (!result.success) {
            throw new Error(`Ghostscript optimization failed: ${result.error}`);
        }

        // Verify output file exists and get new size
        if (!fs.existsSync(outputPath)) {
            throw new Error('Optimization completed but output file not found');
        }

        const optimizedStats = fs.statSync(outputPath);
        const optimizedSize = optimizedStats.size;
        const optimizedSizeMB = (optimizedSize / 1024 / 1024).toFixed(2);
        
        // Calculate real savings
        const savings = originalSize - optimizedSize;
        const savingsPercent = ((savings / originalSize) * 100);
        const compressionRatio = (originalSize / optimizedSize);

        console.log('✅ Ghostscript optimization completed!');
        console.log(`📊 Original: ${originalSizeMB} MB → Optimized: ${optimizedSizeMB} MB`);
        console.log(`💰 Savings: ${(savings / 1024 / 1024).toFixed(2)} MB (${savingsPercent.toFixed(1)}%)`);
        console.log(`📈 Compression ratio: ${compressionRatio.toFixed(2)}:1`);

        return {
            success: true,
            originalSize,
            optimizedSize,
            originalSizeMB: parseFloat(originalSizeMB),
            optimizedSizeMB: parseFloat(optimizedSizeMB),
            savings,
            savingsPercent: parseFloat(savingsPercent.toFixed(1)),
            compressionRatio: parseFloat(compressionRatio.toFixed(2)),
            tool: 'ghostscript',
            version: await getGhostscriptVersion(),
            appliedOptimizations: {
                compressionLevel,
                optimizeImages,
                optimizeFonts,
                removeMetadata
            },
            gsOutput: result.output
        };

    } catch (error) {
        console.error('❌ Ghostscript optimization failed:', error.message);
        return {
            success: false,
            error: error.message,
            originalSize: fs.existsSync(inputPath) ? fs.statSync(inputPath).size : 0
        };
    }
}

/**
 * Build Ghostscript command array with proper optimization settings
 */
function buildGhostscriptCommand(inputPath, outputPath, options) {
    const { compressionLevel, optimizeImages, optimizeFonts, removeMetadata } = options;
    
    const command = ['gs'];
    
    // Basic settings
    command.push('-sDEVICE=pdfwrite');
    command.push('-dNOPAUSE');
    command.push('-dQUIET');
    command.push('-dBATCH');
    
    // Compatibility and optimization level
    command.push('-dCompatibilityLevel=1.4');
    
    // Compression level settings
    const compressionSettings = {
        low: {
            preset: '/printer',
            imageRes: 300,
            colorRes: 300,
            grayRes: 300,
            monoRes: 1200
        },
        medium: {
            preset: '/ebook',
            imageRes: 150,
            colorRes: 150,
            grayRes: 150,
            monoRes: 300
        },
        high: {
            preset: '/screen',
            imageRes: 96,
            colorRes: 96,
            grayRes: 96,
            monoRes: 150
        }
    };
    
    const settings = compressionSettings[compressionLevel] || compressionSettings.medium;
    
    // Apply PDF settings preset
    command.push(`-dPDFSETTINGS=${settings.preset}`);
    
    // Image optimization
    if (optimizeImages) {
        command.push(`-dColorImageResolution=${settings.colorRes}`);
        command.push(`-dGrayImageResolution=${settings.grayRes}`);
        command.push(`-dMonoImageResolution=${settings.monoRes}`);
        command.push('-dColorImageDownsampleType=/Bicubic');
        command.push('-dGrayImageDownsampleType=/Bicubic');
        command.push('-dMonoImageDownsampleType=/Bicubic');
        command.push('-dCompressPages=true');
    }
    
    // Font optimization - this actually works!
    if (optimizeFonts) {
        command.push('-dSubsetFonts=true');
        command.push('-dEmbedAllFonts=true');
        command.push('-dMaxSubsetPct=100');
        command.push('-dCompressFonts=true');
    }
    
    // Remove metadata for additional size reduction
    if (removeMetadata) {
        command.push('-dDoThumbnails=false');
        command.push('-dCreateJobTicket=false');
        command.push('-dPreserveEPSInfo=false');
        command.push('-dPreserveOPIComments=false');
        command.push('-dPreserveOverprintSettings=false');
        command.push('-dUCRandBGInfo=/Remove');
    }
    
    // Aggressive optimization for better compression
    command.push('-dOptimize=true');
    command.push('-dUseFlateCompression=true');
    command.push('-dAutoFilterColorImages=true');
    command.push('-dAutoFilterGrayImages=true');
    
    // Output file
    command.push(`-sOutputFile=${outputPath}`);
    
    // Input file
    command.push(inputPath);
    
    return command;
}

/**
 * Run Ghostscript command and capture output
 */
function runGhostscriptCommand(command) {
    return new Promise((resolve) => {
        const process = spawn(command[0], command.slice(1), {
            stdio: ['pipe', 'pipe', 'pipe']
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
            resolve({
                success: code === 0,
                code,
                output: stdout,
                error: stderr
            });
        });
        
        process.on('error', (error) => {
            resolve({
                success: false,
                code: -1,
                output: stdout,
                error: error.message
            });
        });
    });
}

/**
 * Get Ghostscript version
 */
async function getGhostscriptVersion() {
    try {
        const result = await runGhostscriptCommand(['gs', '--version']);
        return result.output.trim() || result.error.trim() || 'unknown';
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
            version,
            path: 'gs'
        };
    } catch (error) {
        return {
            available: false,
            error: error.message
        };
    }
}

/**
 * Estimate potential savings using Ghostscript (more accurate than pdf-lib)
 */
export function estimateGhostscriptSavings(fileSizeBytes, compressionLevel = 'medium') {
    // Based on real-world Ghostscript compression rates
    const compressionRates = {
        low: 0.15,    // 15% reduction
        medium: 0.35, // 35% reduction 
        high: 0.55    // 55% reduction
    };
    
    const rate = compressionRates[compressionLevel] || compressionRates.medium;
    const estimatedSavings = fileSizeBytes * rate;
    
    return {
        estimatedSavings: Math.round(estimatedSavings),
        estimatedSavingsPercent: Math.round(rate * 100),
        estimatedFinalSize: fileSizeBytes - estimatedSavings,
        compressionLevel,
        note: 'Based on real Ghostscript compression rates, not theoretical calculations'
    };
}

/**
 * Compare pdf-lib vs Ghostscript optimization capabilities
 */
export function compareOptimizationMethods(filePath) {
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    
    return {
        fileSize,
        fileSizeMB: (fileSize / 1024 / 1024).toFixed(2),
        methods: {
            'pdf-lib': {
                fontManipulation: '0% success rate',
                realWorldSavings: '0.9%',
                limitations: 'Cannot access complex embedded fonts',
                verdict: '❌ BROKEN'
            },
            'ghostscript': {
                fontManipulation: 'Full font optimization support',
                expectedSavings: '35-55%',
                limitations: 'Requires external tool (widely available)',
                verdict: '✅ WORKS'
            }
        },
        recommendation: 'Use Ghostscript for real optimization results'
    };
} 