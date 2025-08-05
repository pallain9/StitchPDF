// Health Check API Handler
// Monitors API health and dependencies

import { checkGhostscriptAvailability } from './utils/ghostscript.js';
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Health check endpoint
 */
export async function check(event, context) {
    const healthChecks = {
        api: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        checks: {}
    };

    try {
        // Check Ghostscript availability
        const ghostscriptCheck = await checkGhostscriptAvailability();
        healthChecks.checks.ghostscript = {
            status: ghostscriptCheck.available ? 'healthy' : 'unhealthy',
            version: ghostscriptCheck.version,
            error: ghostscriptCheck.error
        };

        // Check DynamoDB connectivity
        const dynamoCheck = await checkDynamoDb();
        healthChecks.checks.dynamodb = dynamoCheck;

        // Check S3 connectivity
        const s3Check = await checkS3();
        healthChecks.checks.s3 = s3Check;

        // Determine overall health
        const unhealthyChecks = Object.values(healthChecks.checks)
            .filter(check => check.status !== 'healthy');
        
        healthChecks.api = unhealthyChecks.length === 0 ? 'healthy' : 'degraded';

        const statusCode = healthChecks.api === 'healthy' ? 200 : 503;

        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(healthChecks)
        };

    } catch (error) {
        console.error('Health check error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                api: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
                checks: healthChecks.checks
            })
        };
    }
}

/**
 * Check DynamoDB connectivity
 */
async function checkDynamoDb() {
    try {
        const tableName = process.env.LICENSE_TABLE || 'stitchpdf-licenses';
        
        // Simple describe table operation
        const params = {
            TableName: tableName
        };
        
        await dynamodb.describe(params).promise();
        
        return {
            status: 'healthy',
            tableName
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
}

/**
 * Check S3 connectivity
 */
async function checkS3() {
    try {
        const s3 = new AWS.S3();
        const bucketName = process.env.S3_BUCKET_NAME;
        
        if (!bucketName) {
            return {
                status: 'unhealthy',
                error: 'S3_BUCKET_NAME environment variable not set'
            };
        }
        
        // Check if bucket exists and is accessible
        await s3.headBucket({ Bucket: bucketName }).promise();
        
        return {
            status: 'healthy',
            bucketName
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
}

/**
 * Detailed health check with metrics
 */
export async function detailed(event, context) {
    try {
        const checks = await performDetailedChecks();
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                region: process.env.AWS_REGION,
                version: '1.0.0',
                checks,
                metrics: {
                    memoryUsage: process.memoryUsage(),
                    uptime: process.uptime(),
                    nodeVersion: process.version
                }
            })
        };

    } catch (error) {
        console.error('Detailed health check error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Detailed health check failed',
                message: error.message
            })
        };
    }
}

/**
 * Perform detailed health checks
 */
async function performDetailedChecks() {
    const checks = {};

    // Ghostscript check with version info
    try {
        const ghostscriptResult = await checkGhostscriptAvailability();
        checks.ghostscript = {
            status: ghostscriptResult.available ? 'healthy' : 'unhealthy',
            version: ghostscriptResult.version,
            error: ghostscriptResult.error,
            description: 'PDF optimization engine'
        };
    } catch (error) {
        checks.ghostscript = {
            status: 'unhealthy',
            error: error.message,
            description: 'PDF optimization engine'
        };
    }

    // DynamoDB detailed check
    checks.dynamodb = await checkDynamoDbDetailed();

    // S3 detailed check
    checks.s3 = await checkS3Detailed();

    // API Gateway check
    checks.apiGateway = {
        status: 'healthy',
        description: 'API Gateway endpoint',
        requestId: event?.requestContext?.requestId || 'unknown'
    };

    return checks;
}

/**
 * Detailed DynamoDB check
 */
async function checkDynamoDbDetailed() {
    try {
        const tableName = process.env.LICENSE_TABLE || 'stitchpdf-licenses';
        
        // Get table description
        const describeResult = await dynamodb.describe({ TableName: tableName }).promise();
        
        return {
            status: 'healthy',
            tableName,
            description: 'License storage',
            tableStatus: describeResult.Table?.TableStatus,
            itemCount: describeResult.Table?.ItemCount || 'unknown'
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            description: 'License storage'
        };
    }
}

/**
 * Detailed S3 check
 */
async function checkS3Detailed() {
    try {
        const s3 = new AWS.S3();
        const bucketName = process.env.S3_BUCKET_NAME;
        
        if (!bucketName) {
            return {
                status: 'unhealthy',
                error: 'S3_BUCKET_NAME environment variable not set',
                description: 'File storage'
            };
        }
        
        // Check bucket and get some metadata
        const [bucketHead, bucketLocation] = await Promise.all([
            s3.headBucket({ Bucket: bucketName }).promise(),
            s3.getBucketLocation({ Bucket: bucketName }).promise().catch(() => ({ LocationConstraint: 'unknown' }))
        ]);
        
        return {
            status: 'healthy',
            bucketName,
            description: 'File storage',
            region: bucketLocation.LocationConstraint || 'us-east-1'
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            description: 'File storage'
        };
    }
}