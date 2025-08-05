// AWS Lambda Handler - Mail Merge
// Handles template processing and personalized PDF generation

const AWS = require('aws-sdk');
const { createMailMerge, processMailMerge } = require('./utils/mailMergeProcessor.js');
const { validateLicense } = require('../middleware/auth.js');

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Process mail merge with template and data
 */
async function processMerge(event, context) {
    try {
        const { apiKey, templateKey, mergeData, options = {} } = JSON.parse(event.body);
        
        // Validate license
        const license = await validateLicense(apiKey);
        if (!license.valid || !license.features.includes('mail-merge')) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Invalid license or feature not included' })
            };
        }

        // Check merge data limits based on tier
        const maxRecords = license.tier === 'enterprise' ? 10000 : 1000;
        if (mergeData.length > maxRecords) {
            return {
                statusCode: 413,
                body: JSON.stringify({ 
                    error: `Too many records. Max: ${maxRecords} for ${license.tier} tier` 
                })
            };
        }

        // Download template from S3
        const templateObject = await s3.getObject({
            Bucket: BUCKET_NAME,
            Key: templateKey
        }).promise();

        // Process mail merge
        const mergeResults = await processMailMerge(templateObject.Body, mergeData, {
            outputFormat: options.outputFormat || 'individual', // 'individual' or 'combined'
            includeMetadata: options.includeMetadata !== false
        });

        const downloadUrls = [];

        if (options.outputFormat === 'combined') {
            // Upload single combined PDF
            const outputKey = `mailmerge/${license.userId}/${Date.now()}-merged.pdf`;
            await s3.putObject({
                Bucket: BUCKET_NAME,
                Key: outputKey,
                Body: mergeResults.combinedPdf,
                ContentType: 'application/pdf'
            }).promise();

            const downloadUrl = s3.getSignedUrl('getObject', {
                Bucket: BUCKET_NAME,
                Key: outputKey,
                Expires: 3600
            });

            downloadUrls.push({ type: 'combined', url: downloadUrl });
        } else {
            // Upload individual PDFs
            for (let i = 0; i < mergeResults.individualPdfs.length; i++) {
                const outputKey = `mailmerge/${license.userId}/${Date.now()}-${i + 1}.pdf`;
                await s3.putObject({
                    Bucket: BUCKET_NAME,
                    Key: outputKey,
                    Body: mergeResults.individualPdfs[i],
                    ContentType: 'application/pdf'
                }).promise();

                const downloadUrl = s3.getSignedUrl('getObject', {
                    Bucket: BUCKET_NAME,
                    Key: outputKey,
                    Expires: 3600
                });

                downloadUrls.push({ 
                    type: 'individual', 
                    index: i + 1, 
                    url: downloadUrl,
                    record: mergeData[i]
                });
            }
        }

        // Clean up template file
        await s3.deleteObject({
            Bucket: BUCKET_NAME,
            Key: templateKey
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                recordsProcessed: mergeData.length,
                downloadUrls,
                expires: Date.now() + 3600000,
                stats: mergeResults.stats
            })
        };
    } catch (error) {
        console.error('Mail merge failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Mail merge processing failed' })
        };
    }
}

/**
 * Upload template and get presigned URLs for data upload
 */
async function uploadTemplate(event, context) {
    try {
        const { apiKey, fileName } = JSON.parse(event.body);
        
        // Validate license
        const license = await validateLicense(apiKey);
        if (!license.valid || !license.features.includes('mail-merge')) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Invalid license or feature not included' })
            };
        }

        // Generate unique key for template
        const templateKey = `templates/${license.userId}/${Date.now()}-${fileName}`;
        
        // Create presigned URL for template upload
        const uploadUrl = s3.getSignedUrl('putObject', {
            Bucket: BUCKET_NAME,
            Key: templateKey,
            Expires: 900, // 15 minutes
            ContentType: 'application/pdf'
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                uploadUrl,
                templateKey,
                expires: Date.now() + 900000
            })
        };
    } catch (error) {
        console.error('Template upload URL generation failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate template upload URL' })
        };
    }
}

module.exports = {
    processMerge,
    uploadTemplate
}; 