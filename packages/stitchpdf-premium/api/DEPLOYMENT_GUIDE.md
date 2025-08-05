# 🚀 StitchPDF Premium AWS Deployment Guide

## Prerequisites

### 1. AWS Account Setup
- Active AWS account with billing enabled
- AWS CLI installed and configured
- Appropriate IAM permissions for Lambda, API Gateway, S3, and DynamoDB

### 2. Required Tools
- Node.js 18+ installed
- Serverless Framework CLI
- AWS CLI v2

## Step 1: Install Serverless Framework

```bash
# Install Serverless CLI globally
npm install -g serverless

# Verify installation
serverless --version
```

## Step 2: Configure AWS Credentials

### Option A: AWS CLI Configuration (Recommended)
```bash
# Configure AWS credentials
aws configure

# You'll need:
# - AWS Access Key ID
# - AWS Secret Access Key  
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

### Option B: Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

### Option C: AWS Profile
```bash
# Create a named profile
aws configure --profile stitchpdf

# Use the profile for deployment
export AWS_PROFILE=stitchpdf
```

## Step 3: Install Dependencies

```bash
# Navigate to API directory
cd packages/stitchpdf-premium/api

# Install dependencies
npm install

# Install Serverless plugins locally
npm install serverless-offline serverless-bundle --save-dev
```

## Step 4: Deploy to AWS

### Development Deployment
```bash
# Deploy to dev stage
serverless deploy --stage dev

# This creates:
# - Lambda functions
# - API Gateway endpoints
# - S3 bucket
# - DynamoDB table
# - IAM roles and policies
```

### Production Deployment
```bash
# Deploy to production
serverless deploy --stage prod --region us-east-1
```

## Step 5: Verify Deployment

### Check API Endpoints
```bash
# Get deployment info
serverless info --stage dev

# Test health endpoint
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/health
```

### Expected Output
```json
{
  "api": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "ghostscript": { "status": "healthy" },
    "dynamodb": { "status": "healthy" },
    "s3": { "status": "healthy" }
  }
}
```

## Step 6: Configure License Management

### Create Sample License
```bash
# Use AWS CLI to add a test license
aws dynamodb put-item \
  --table-name stitchpdf-licenses-dev \
  --item '{
    "apiKey": {"S": "test-api-key-12345"},
    "userId": {"S": "user-123"},
    "tier": {"S": "pro"},
    "status": {"S": "active"},
    "features": {"SS": ["optimization", "mail-merge", "conditional-insertion"]},
    "email": {"S": "test@example.com"},
    "createdAt": {"N": "'$(date +%s)'000"}
  }'
```

## Step 7: Test Premium Features

### Test PDF Optimization
```bash
# Test upload URL endpoint
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/optimization/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "test-api-key-12345",
    "fileName": "test.pdf",
    "fileSize": 1024000
  }'
```

## Step 8: Update Client Configuration

### Update Premium Client Base URL
In your client applications, update the base URL:

```javascript
import { configure } from '@stitchpdf/premium';

configure({
  apiKey: 'user-api-key',
  baseUrl: 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev'
});
```

## AWS Resources Created

### Lambda Functions
- `stitchpdf-premium-api-dev-getOptimizationUploadUrl`
- `stitchpdf-premium-api-dev-optimizePdf`
- `stitchpdf-premium-api-dev-getMailMergeUploadUrl`
- `stitchpdf-premium-api-dev-processMailMerge`
- `stitchpdf-premium-api-dev-getLicenseInfo`
- `stitchpdf-premium-api-dev-validateLicense`
- `stitchpdf-premium-api-dev-healthCheck`
- `stitchpdf-premium-api-dev-detailedHealthCheck`

### API Gateway
- REST API with CORS enabled
- Custom domain support (optional)
- Rate limiting and throttling

### S3 Bucket
- `stitchpdf-premium-dev` (or your stage name)
- Lifecycle rules for automatic cleanup
- CORS configuration for direct uploads

### DynamoDB Table
- `stitchpdf-licenses-dev`
- Pay-per-request billing
- Point-in-time recovery enabled
- Encryption at rest

### IAM Roles
- Lambda execution role with minimal required permissions
- S3 and DynamoDB access policies

## Environment Variables

The following environment variables are automatically configured:

- `STAGE`: Deployment stage (dev/prod)
- `S3_BUCKET_NAME`: S3 bucket for file storage
- `LICENSE_TABLE`: DynamoDB table for licenses
- `LICENSE_API_URL`: License validation endpoint
- `NODE_ENV`: production

## Monitoring and Logs

### View Logs
```bash
# View function logs
serverless logs -f optimizePdf --stage dev

# Follow logs in real-time
serverless logs -f optimizePdf --stage dev --tail
```

### CloudWatch Monitoring
- Function duration and memory usage
- Error rates and throttling
- Custom metrics for API usage

## Troubleshooting

### Common Issues

1. **Deployment Fails - IAM Permissions**
   ```
   Solution: Ensure your AWS user has CloudFormation, Lambda, API Gateway, S3, and DynamoDB permissions
   ```

2. **Function Timeout**
   ```
   Solution: Increase timeout in serverless.yml (max 900 seconds for Lambda)
   ```

3. **Memory Issues**
   ```
   Solution: Increase memorySize for PDF processing functions
   ```

4. **CORS Errors**
   ```
   Solution: Verify CORS configuration in serverless.yml
   ```

### Debug Commands
```bash
# Deploy with verbose output
serverless deploy --stage dev --verbose

# Remove deployment if needed
serverless remove --stage dev

# Invoke function locally
serverless invoke local -f healthCheck
```

## Cost Optimization

### Development Stage
- Use minimal memory for dev testing
- Set short S3 lifecycle rules
- Use DynamoDB on-demand billing

### Production Stage
- Monitor CloudWatch metrics
- Set up billing alerts
- Consider Reserved Capacity for high usage

## Security Best Practices

1. **API Keys**: Implement proper API key validation
2. **CORS**: Restrict origins in production
3. **Encryption**: Enable S3 and DynamoDB encryption
4. **VPC**: Consider VPC deployment for enhanced security
5. **Secrets**: Use AWS Secrets Manager for sensitive data

## Next Steps

1. Set up custom domain with Route 53
2. Configure SSL certificate with ACM
3. Implement rate limiting and quotas
4. Set up monitoring and alerting
5. Create CI/CD pipeline for automated deployments

## Support

For deployment issues:
1. Check CloudFormation stack events
2. Review Lambda function logs
3. Verify IAM permissions
4. Test individual endpoints

---

🎉 **Your StitchPDF Premium API is now live on AWS!**