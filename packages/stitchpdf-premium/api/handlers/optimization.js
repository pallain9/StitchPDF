// AWS Lambda Handler - PDF Optimization
// Handles presigned URL generation and PDF optimization processing

import AWS from 'aws-sdk';
import { optimizePdfWithGhostscript } from './utils/ghostscript.js';
import { validateLicense } from '../middleware/auth.js';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Generate presigned URL for file upload
 */
export async function getUploadUrl(event, context) {
    try {
        const { apiKey, fileName, fileSize } = JSON.parse(event.body);
        
        // Validate license
        const license = await validateLicense(apiKey);
        if (!license.valid || !license.features.includes('optimization')) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Invalid license or feature not included' })
            };
        }

        // Check file size limits based on tier
        const maxSizeGB = license.tier === 'enterprise' ? 10 : 2;
        if (fileSize > maxSizeGB * 1024 * 1024 * 1024) {
            return {
                statusCode: 413,
                body: JSON.stringify({ error: `File too large. Max size: ${maxSizeGB}GB` })
            };
        }

        // Generate unique key
        const key = `uploads/${license.userId}/${Date.now()}-${fileName}`;
        
        // Create presigned URL for upload
        const uploadUrl = s3.getSignedUrl('putObject', {
            Bucket: BUCKET_NAME,
            Key: key,
            Expires: 900, // 15 minutes
            ContentType: 'application/pdf'
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                uploadUrl,
                key,
                expires: Date.now() + 900000
            })
        };
    } catch (error) {
        console.error('Upload URL generation failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate upload URL' })
        };
    }
}

/**
 * Process PDF optimization
 */
export async function optimizePdf(event, context) {
    try {
        const { apiKey, key, options = {} } = JSON.parse(event.body);
        
        // Validate license
        const license = await validateLicense(apiKey);
        if (!license.valid || !license.features.includes('optimization')) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Invalid license or feature not included' })
            };
        }

        // Download PDF from S3
        const inputObject = await s3.getObject({
            Bucket: BUCKET_NAME,
            Key: key
        }).promise();

        // Optimize PDF using Ghostscript
        const optimizationResult = await optimizePdfWithGhostscript(inputObject.Body, {
            compressionLevel: options.compression || 'medium',
            optimizeImages: options.optimizeImages !== false,
            optimizeFonts: options.optimizeFonts !== false,
            removeMetadata: options.removeMetadata !== false
        });

        // Upload optimized PDF back to S3
        const outputKey = `optimized/${license.userId}/${Date.now()}-optimized.pdf`;
        await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: outputKey,
            Body: optimizationResult.data,
            ContentType: 'application/pdf'
        }).promise();

        // Generate presigned download URL
        const downloadUrl = s3.getSignedUrl('getObject', {
            Bucket: BUCKET_NAME,
            Key: outputKey,
            Expires: 3600 // 1 hour
        });

        // Clean up input file
        await s3.deleteObject({
            Bucket: BUCKET_NAME,
            Key: key
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                downloadUrl,
                expires: Date.now() + 3600000,
                stats: {
                    originalSize: optimizationResult.originalSize,
                    optimizedSize: optimizationResult.optimizedSize,
                    compressionRatio: optimizationResult.compressionRatio,
                    savings: optimizationResult.savings
                }
            })
        };
    } catch (error) {
        console.error('PDF optimization failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Optimization failed' })
        };
    }
} 