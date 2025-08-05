// Premium API Authentication Middleware
// Validates API keys and user licenses

import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const LICENSE_TABLE = process.env.LICENSE_TABLE || 'stitchpdf-licenses';

/**
 * Validate API key and return license information
 * @param {string} apiKey - The API key to validate
 * @returns {Promise<Object>} License validation result
 */
export async function validateLicense(apiKey) {
    try {
        if (!apiKey) {
            return {
                valid: false,
                error: 'API key is required'
            };
        }

        // Query DynamoDB for license information
        const params = {
            TableName: LICENSE_TABLE,
            Key: {
                apiKey: apiKey
            }
        };

        const result = await dynamodb.get(params).promise();
        
        if (!result.Item) {
            return {
                valid: false,
                error: 'Invalid API key'
            };
        }

        const license = result.Item;
        
        // Check if license is expired
        if (license.expiresAt && Date.now() > license.expiresAt) {
            return {
                valid: false,
                error: 'License expired',
                license
            };
        }

        // Check if license is active
        if (license.status !== 'active') {
            return {
                valid: false,
                error: `License status: ${license.status}`,
                license
            };
        }

        // Check usage limits (if applicable)
        const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
        const monthlyUsage = license.usage?.[currentMonth] || 0;
        const monthlyLimit = getMonthlyLimit(license.tier);
        
        if (monthlyLimit && monthlyUsage >= monthlyLimit) {
            return {
                valid: false,
                error: 'Monthly usage limit exceeded',
                license,
                usage: {
                    current: monthlyUsage,
                    limit: monthlyLimit
                }
            };
        }

        return {
            valid: true,
            license: {
                userId: license.userId,
                tier: license.tier,
                features: license.features || [],
                usage: {
                    current: monthlyUsage,
                    limit: monthlyLimit
                }
            }
        };

    } catch (error) {
        console.error('License validation error:', error);
        return {
            valid: false,
            error: 'License validation failed',
            details: error.message
        };
    }
}

/**
 * Get monthly usage limits based on tier
 * @param {string} tier - License tier (pro, enterprise, etc.)
 * @returns {number|null} Monthly limit or null for unlimited
 */
function getMonthlyLimit(tier) {
    const limits = {
        'pro': 1000,        // 1,000 operations per month
        'enterprise': null,  // Unlimited
        'trial': 50         // 50 operations for trial
    };
    
    return limits[tier] || null;
}

/**
 * Record API usage for billing/analytics
 * @param {string} apiKey - The API key
 * @param {string} operation - The operation performed
 * @param {Object} metadata - Additional operation metadata
 */
export async function recordUsage(apiKey, operation, metadata = {}) {
    try {
        const currentMonth = new Date().toISOString().substring(0, 7);
        
        const params = {
            TableName: LICENSE_TABLE,
            Key: { apiKey },
            UpdateExpression: `
                ADD usage.#month :inc
                SET lastUsed = :now,
                    #operation = if_not_exists(#operation, :zero) + :inc
            `,
            ExpressionAttributeNames: {
                '#month': currentMonth,
                '#operation': `operations.${operation}`
            },
            ExpressionAttributeValues: {
                ':inc': 1,
                ':now': Date.now(),
                ':zero': 0
            }
        };

        await dynamodb.update(params).promise();
        
        // Optional: Record detailed usage log
        if (process.env.DETAILED_LOGGING === 'true') {
            await recordDetailedUsage(apiKey, operation, metadata);
        }

    } catch (error) {
        console.error('Usage recording error:', error);
        // Don't fail the operation if usage recording fails
    }
}

/**
 * Record detailed usage for analytics
 */
async function recordDetailedUsage(apiKey, operation, metadata) {
    const usageParams = {
        TableName: process.env.USAGE_LOG_TABLE || 'stitchpdf-usage-logs',
        Item: {
            apiKey,
            timestamp: Date.now(),
            operation,
            metadata,
            requestId: metadata.requestId || 'unknown'
        }
    };

    await dynamodb.put(usageParams).promise();
}

/**
 * Get user license information
 * @param {string} apiKey - The API key
 * @returns {Promise<Object>} License information
 */
export async function getLicenseInfo(apiKey) {
    try {
        const validation = await validateLicense(apiKey);
        
        if (!validation.valid) {
            return {
                error: validation.error,
                valid: false
            };
        }

        const params = {
            TableName: LICENSE_TABLE,
            Key: { apiKey }
        };

        const result = await dynamodb.get(params).promise();
        const license = result.Item;

        return {
            valid: true,
            tier: license.tier,
            features: license.features || [],
            userId: license.userId,
            email: license.email,
            expiresAt: license.expiresAt,
            usage: license.usage || {},
            status: license.status
        };

    } catch (error) {
        console.error('Get license info error:', error);
        return {
            valid: false,
            error: 'Failed to retrieve license information'
        };
    }
}

/**
 * Middleware function for API Gateway
 * Validates the API key and attaches license info to the event
 */
export function authMiddleware(handler) {
    return async (event, context) => {
        try {
            const body = JSON.parse(event.body || '{}');
            const apiKey = body.apiKey || event.headers['x-api-key'];

            if (!apiKey) {
                return {
                    statusCode: 401,
                    body: JSON.stringify({
                        error: 'API key is required',
                        message: 'Include apiKey in request body or x-api-key header'
                    })
                };
            }

            const validation = await validateLicense(apiKey);
            
            if (!validation.valid) {
                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        error: validation.error,
                        details: validation.details
                    })
                };
            }

            // Attach license info to event for use in handler
            event.license = validation.license;
            event.apiKey = apiKey;

            // Call the actual handler
            const response = await handler(event, context);
            
            // Record usage after successful operation
            if (response.statusCode === 200) {
                const operation = event.pathParameters?.operation || 'unknown';
                await recordUsage(apiKey, operation, {
                    requestId: context.awsRequestId,
                    path: event.path
                });
            }

            return response;

        } catch (error) {
            console.error('Auth middleware error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'Authentication failed',
                    message: error.message
                })
            };
        }
    };
}