#!/usr/bin/env node
// Premium API Handlers Tests
// Tests the API handlers and middleware

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 StitchPDF Premium API Tests\n');

async function runAPITests() {
    let passed = 0;
    let failed = 0;

    // Test 1: Authentication Middleware Import
    try {
        console.log('1️⃣  Testing auth middleware import...');
        
        const auth = await import('../middleware/auth.js');
        
        // Check required exports
        const requiredExports = [
            'validateLicense', 'recordUsage', 'getLicenseInfo', 'authMiddleware'
        ];
        
        for (const exportName of requiredExports) {
            if (typeof auth[exportName] !== 'function') {
                throw new Error(`Missing or invalid export: ${exportName}`);
            }
        }
        
        console.log('   ✅ Auth middleware exports available');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Auth middleware test failed:', error.message);
        failed++;
    }

    // Test 2: Ghostscript Utils Import
    try {
        console.log('\n2️⃣  Testing Ghostscript utils import...');
        
        const gs = await import('../handlers/utils/ghostscript.js');
        
        // Check required exports
        if (typeof gs.optimizePdfWithGhostscript !== 'function') {
            throw new Error('optimizePdfWithGhostscript function not found');
        }
        
        if (typeof gs.checkGhostscriptAvailability !== 'function') {
            throw new Error('checkGhostscriptAvailability function not found');
        }
        
        if (typeof gs.estimateGhostscriptSavings !== 'function') {
            throw new Error('estimateGhostscriptSavings function not found');
        }
        
        console.log('   ✅ Ghostscript utils exports available');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Ghostscript utils test failed:', error.message);
        failed++;
    }

    // Test 3: Mail Merge Processor Import
    try {
        console.log('\n3️⃣  Testing mail merge processor import...');
        
        const merge = await import('../handlers/utils/mailMergeProcessor.js');
        
        // Check required exports
        if (typeof merge.processMailMerge !== 'function') {
            throw new Error('processMailMerge function not found');
        }
        
        if (typeof merge.createMailMerge !== 'function') {
            throw new Error('createMailMerge function not found');
        }
        
        console.log('   ✅ Mail merge processor exports available');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Mail merge processor test failed:', error.message);
        failed++;
    }

    // Test 4: Optimization Handler Import
    try {
        console.log('\n4️⃣  Testing optimization handler import...');
        
        const opt = await import('../handlers/optimization.js');
        
        // Check required exports
        if (typeof opt.getUploadUrl !== 'function') {
            throw new Error('getUploadUrl function not found');
        }
        
        if (typeof opt.optimizePdf !== 'function') {
            throw new Error('optimizePdf function not found');
        }
        
        console.log('   ✅ Optimization handler exports available');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Optimization handler test failed:', error.message);
        failed++;
    }

    // Test 5: Mail Merge Handler Import
    try {
        console.log('\n5️⃣  Testing mail merge handler import...');
        
        const merge = await import('../handlers/mailMerge.js');
        
        // Check required exports
        if (typeof merge.processMerge !== 'function') {
            throw new Error('processMerge function not found');
        }
        
        if (typeof merge.uploadTemplate !== 'function') {
            throw new Error('uploadTemplate function not found');
        }
        
        console.log('   ✅ Mail merge handler exports available');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Mail merge handler test failed:', error.message);
        failed++;
    }

    // Test 6: License Handler Import
    try {
        console.log('\n6️⃣  Testing license handler import...');
        
        const license = await import('../handlers/license.js');
        
        // Check required exports
        if (typeof license.getInfo !== 'function') {
            throw new Error('getInfo function not found');
        }
        
        if (typeof license.validate !== 'function') {
            throw new Error('validate function not found');
        }
        
        if (typeof license.getUsage !== 'function') {
            throw new Error('getUsage function not found');
        }
        
        console.log('   ✅ License handler exports available');
        passed++;
        
    } catch (error) {
        console.log('   ❌ License handler test failed:', error.message);
        failed++;
    }

    // Test 7: Health Handler Import
    try {
        console.log('\n7️⃣  Testing health handler import...');
        
        const health = await import('../handlers/health.js');
        
        // Check required exports
        if (typeof health.check !== 'function') {
            throw new Error('check function not found');
        }
        
        if (typeof health.detailed !== 'function') {
            throw new Error('detailed function not found');
        }
        
        console.log('   ✅ Health handler exports available');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Health handler test failed:', error.message);
        failed++;
    }

    // Test 8: Package Configuration
    try {
        console.log('\n8️⃣  Testing package configuration...');
        
        const packageJson = await import('../package.json', { assert: { type: 'json' } });
        const pkg = packageJson.default;
        
        // Check required dependencies
        const requiredDeps = [
            'aws-sdk', 'pdf-lib', 'canvas', 'fs-extra', 'pdfjs-dist', 'csv-parser', 'uuid'
        ];
        
        for (const dep of requiredDeps) {
            if (!pkg.dependencies[dep]) {
                throw new Error(`Missing dependency: ${dep}`);
            }
        }
        
        // Check dev dependencies
        const requiredDevDeps = [
            'serverless', 'serverless-offline', 'serverless-bundle'
        ];
        
        for (const dep of requiredDevDeps) {
            if (!pkg.devDependencies[dep]) {
                throw new Error(`Missing dev dependency: ${dep}`);
            }
        }
        
        console.log('   ✅ Package configuration correct');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Package configuration test failed:', error.message);
        failed++;
    }

    // Test 9: Mock Event Processing
    try {
        console.log('\n9️⃣  Testing mock event processing...');
        
        const health = await import('../handlers/health.js');
        
        // Create mock API Gateway event
        const mockEvent = {
            body: JSON.stringify({ test: true }),
            headers: {},
            pathParameters: {},
            requestContext: { requestId: 'test-123' }
        };
        
        const mockContext = {
            awsRequestId: 'test-123',
            functionName: 'test-function'
        };
        
        // Test health check (should work without external dependencies in test mode)
        const response = await health.check(mockEvent, mockContext);
        
        if (!response || !response.statusCode) {
            throw new Error('Invalid response format from health check');
        }
        
        console.log('   ✅ Mock event processing works');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Mock event processing test failed:', error.message);
        failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 API Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All API tests passed! Handlers are ready.');
        return true;
    } else {
        console.log('❌ Some API tests failed. Please fix the issues above.');
        return false;
    }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        const success = await runAPITests();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('💥 API test runner failed:', error);
        process.exit(1);
    }
}

export { runAPITests };