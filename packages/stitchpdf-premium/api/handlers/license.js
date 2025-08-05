// License Management API Handlers
// Handles license information and validation endpoints

const { getLicenseInfo, validateLicense } = require('../middleware/auth.js');

/**
 * Get license information
 */
async function getInfo(event, context) {
    try {
        const body = JSON.parse(event.body || '{}');
        const apiKey = body.apiKey || event.headers['x-api-key'];

        if (!apiKey) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'API key is required'
                })
            };
        }

        const licenseInfo = await getLicenseInfo(apiKey);

        if (!licenseInfo.valid) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: licenseInfo.error
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                tier: licenseInfo.tier,
                features: licenseInfo.features,
                usage: licenseInfo.usage,
                status: licenseInfo.status,
                email: licenseInfo.email,
                expiresAt: licenseInfo.expiresAt
            })
        };

    } catch (error) {
        console.error('Get license info error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Failed to retrieve license information',
                message: error.message
            })
        };
    }
}

/**
 * Validate license
 */
async function validate(event, context) {
    try {
        const body = JSON.parse(event.body || '{}');
        const apiKey = body.apiKey || event.headers['x-api-key'];

        if (!apiKey) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'API key is required'
                })
            };
        }

        const validation = await validateLicense(apiKey);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                valid: validation.valid,
                error: validation.error,
                license: validation.license,
                usage: validation.usage
            })
        };

    } catch (error) {
        console.error('License validation error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'License validation failed',
                message: error.message
            })
        };
    }
}

/**
 * Get usage statistics
 */
async function getUsage(event, context) {
    try {
        const body = JSON.parse(event.body || '{}');
        const apiKey = body.apiKey || event.headers['x-api-key'];
        const period = body.period || 'month'; // month, week, day

        if (!apiKey) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'API key is required'
                })
            };
        }

        const licenseInfo = await getLicenseInfo(apiKey);

        if (!licenseInfo.valid) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: licenseInfo.error
                })
            };
        }

        // Get usage statistics based on period
        const usage = calculateUsageStats(licenseInfo.usage, period);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                period,
                usage,
                tier: licenseInfo.tier,
                limits: getTierLimits(licenseInfo.tier)
            })
        };

    } catch (error) {
        console.error('Get usage error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Failed to retrieve usage statistics',
                message: error.message
            })
        };
    }
}

/**
 * Calculate usage statistics for a given period
 */
function calculateUsageStats(usageData, period) {
    const now = new Date();
    const stats = {
        total: 0,
        byOperation: {},
        byPeriod: {}
    };

    if (!usageData) {
        return stats;
    }

    // Calculate based on period
    switch (period) {
        case 'day':
            const today = now.toISOString().substring(0, 10); // YYYY-MM-DD
            stats.total = usageData[today] || 0;
            break;
        
        case 'week':
            // Get last 7 days
            for (let i = 0; i < 7; i++) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().substring(0, 10);
                const dayUsage = usageData[dateStr] || 0;
                stats.total += dayUsage;
                stats.byPeriod[dateStr] = dayUsage;
            }
            break;
        
        case 'month':
        default:
            const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM
            stats.total = usageData[currentMonth] || 0;
            break;
    }

    return stats;
}

/**
 * Get tier limits
 */
function getTierLimits(tier) {
    const limits = {
        'trial': {
            monthly: 50,
            daily: 10,
            features: ['optimization', 'mail-merge']
        },
        'pro': {
            monthly: 1000,
            daily: 100,
            features: ['optimization', 'mail-merge', 'conditional-insertion']
        },
        'enterprise': {
            monthly: null, // Unlimited
            daily: null,   // Unlimited
            features: ['optimization', 'mail-merge', 'conditional-insertion', 'bulk-processing']
        }
    };

    return limits[tier] || limits.trial;
}

module.exports = {
    getInfo,
    validate,
    getUsage
};