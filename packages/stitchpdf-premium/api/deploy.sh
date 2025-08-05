#!/bin/bash
# StitchPDF Premium AWS Deployment Script

set -e  # Exit on any error

echo "🚀 StitchPDF Premium AWS Deployment"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_step "\n1️⃣  Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    print_error "Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) is installed"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_warning "AWS CLI is not installed. Please install it first:"
    echo "  - macOS: brew install awscli"
    echo "  - Windows: https://aws.amazon.com/cli/"
    echo "  - Linux: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    exit 1
fi
print_success "AWS CLI $(aws --version | cut -d' ' -f1) is installed"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Run: aws configure"
    exit 1
fi
print_success "AWS credentials are configured"

# Check/Install Serverless CLI
if ! command -v serverless &> /dev/null; then
    print_step "Installing Serverless Framework..."
    npm install -g serverless
    print_success "Serverless Framework installed"
else
    print_success "Serverless Framework $(serverless -v) is installed"
fi

# Install dependencies
print_step "\n2️⃣  Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Get deployment options
print_step "\n3️⃣  Deployment configuration..."

# Ask for stage
read -p "Enter deployment stage (dev/staging/prod) [dev]: " STAGE
STAGE=${STAGE:-dev}

# Ask for region
read -p "Enter AWS region [us-east-1]: " REGION
REGION=${REGION:-us-east-1}

print_step "Deploying to stage: $STAGE in region: $REGION"

# Deploy
print_step "\n4️⃣  Deploying to AWS..."
echo "This may take 3-5 minutes..."

if serverless deploy --stage "$STAGE" --region "$REGION"; then
    print_success "Deployment completed successfully!"
    
    # Get deployment info
    print_step "\n5️⃣  Deployment Information:"
    serverless info --stage "$STAGE" --region "$REGION"
    
    # Test health endpoint
    print_step "\n6️⃣  Testing deployment..."
    API_URL=$(serverless info --stage "$STAGE" --region "$REGION" | grep "ServiceEndpoint:" | cut -d' ' -f2)
    
    if [ ! -z "$API_URL" ]; then
        echo "Testing health endpoint: $API_URL/health"
        if curl -s "$API_URL/health" | grep -q "healthy"; then
            print_success "Health check passed! API is working."
        else
            print_warning "Health check failed. Check the logs."
        fi
    fi
    
    print_step "\n🎉 Deployment Summary:"
    echo "  • Stage: $STAGE"
    echo "  • Region: $REGION"
    echo "  • API URL: $API_URL"
    echo "  • S3 Bucket: stitchpdf-premium-$STAGE"
    echo "  • DynamoDB Table: stitchpdf-licenses-$STAGE"
    
    print_step "\n📋 Next Steps:"
    echo "  1. Update your client apps with the new API URL"
    echo "  2. Add test licenses to DynamoDB"
    echo "  3. Configure custom domain (optional)"
    echo "  4. Set up monitoring and alerts"
    
else
    print_error "Deployment failed! Check the output above for errors."
    exit 1
fi