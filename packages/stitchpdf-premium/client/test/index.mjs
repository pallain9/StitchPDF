#!/usr/bin/env node
// Premium Integration Tests
// Tests the full premium client SDK functionality

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TEST_CONFIG = {
    apiKey: 'test-api-key-12345',
    baseUrl: 'https://api.stitchpdf.com', // Will be mocked
    timeout: 30000
};

console.log('🧪 StitchPDF Premium Integration Tests\n');

async function runTests() {
    let passed = 0;
    let failed = 0;

    // Test 1: Client SDK Import and Configuration
    try {
        console.log('1️⃣  Testing SDK imports...');
        
        // Import the premium SDK
        const premium = await import('../src/index.js');
        
        // Check exports
        const requiredExports = [
            'optimizePdf', 'estimateOptimization',
            'createMailMerge', 'processMailMerge', 
            'insertConditional', 'smartInsert',
            'PremiumClient', 'configure', 'showFeatures'
        ];
        
        for (const exportName of requiredExports) {
            if (typeof premium[exportName] !== 'function') {
                throw new Error(`Missing or invalid export: ${exportName}`);
            }
        }
        
        console.log('   ✅ All SDK exports available');
        
        // Test configuration
        premium.configure(TEST_CONFIG);
        
        if (!premium.isConfigured()) {
            throw new Error('Configuration not properly set');
        }
        
        console.log('   ✅ SDK configuration successful');
        passed++;
        
    } catch (error) {
        console.log('   ❌ SDK import/config failed:', error.message);
        failed++;
    }

    // Test 2: PremiumClient Class
    try {
        console.log('\n2️⃣  Testing PremiumClient class...');
        
        const { PremiumClient } = await import('../src/index.js');
        
        // Create client instance
        const client = new PremiumClient(TEST_CONFIG.apiKey, {
            baseUrl: TEST_CONFIG.baseUrl,
            timeout: 5000
        });
        
        // Test health check method
        if (typeof client.healthCheck !== 'function') {
            throw new Error('PremiumClient missing healthCheck method');
        }
        
        // Test license validation method
        if (typeof client.validateLicense !== 'function') {
            throw new Error('PremiumClient missing validateLicense method');
        }
        
        console.log('   ✅ PremiumClient class instantiated correctly');
        console.log('   ✅ Required methods available');
        passed++;
        
    } catch (error) {
        console.log('   ❌ PremiumClient test failed:', error.message);
        failed++;
    }

    // Test 3: Optimization Module
    try {
        console.log('\n3️⃣  Testing optimization module...');
        
        const opt = await import('../src/optimization.js');
        
        // Check required functions
        if (typeof opt.optimizePdf !== 'function') {
            throw new Error('optimizePdf function not found');
        }
        
        if (typeof opt.estimateOptimization !== 'function') {
            throw new Error('estimateOptimization function not found');
        }
        
        if (typeof opt.batchOptimize !== 'function') {
            throw new Error('batchOptimize function not found');
        }
        
        console.log('   ✅ All optimization functions available');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Optimization module test failed:', error.message);
        failed++;
    }

    // Test 4: Mail Merge Module
    try {
        console.log('\n4️⃣  Testing mail merge module...');
        
        const merge = await import('../src/mailMerge.js');
        
        // Check required functions
        if (typeof merge.createMailMerge !== 'function') {
            throw new Error('createMailMerge function not found');
        }
        
        if (typeof merge.processMailMerge !== 'function') {
            throw new Error('processMailMerge function not found');
        }
        
        if (typeof merge.batchMailMerge !== 'function') {
            throw new Error('batchMailMerge function not found');
        }
        
        console.log('   ✅ All mail merge functions available');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Mail merge module test failed:', error.message);
        failed++;
    }

    // Test 5: Conditional Insertion Module
    try {
        console.log('\n5️⃣  Testing conditional insertion module...');
        
        const insertion = await import('../src/conditionalInsertion.js');
        
        // Check required functions
        if (typeof insertion.insertConditional !== 'function') {
            throw new Error('insertConditional function not found');
        }
        
        if (typeof insertion.smartInsert !== 'function') {
            throw new Error('smartInsert function not found');
        }
        
        if (typeof insertion.analyzeInsertionOpportunities !== 'function') {
            throw new Error('analyzeInsertionOpportunities function not found');
        }
        
        console.log('   ✅ All conditional insertion functions available');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Conditional insertion module test failed:', error.message);
        failed++;
    }

    // Test 6: Free Feature Re-exports
    try {
        console.log('\n6️⃣  Testing free feature re-exports...');
        
        const premium = await import('../src/index.js');
        
        // Check that free features are re-exported
        const freeFeatures = [
            'extractText', 'extractTextWithCoordinates',
            'analyzeFonts', 'validatePdf', 'insertAtPage'
        ];
        
        for (const feature of freeFeatures) {
            if (typeof premium[feature] !== 'function') {
                throw new Error(`Free feature not re-exported: ${feature}`);
            }
        }
        
        console.log('   ✅ All free features re-exported correctly');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Free feature re-export test failed:', error.message);
        failed++;
    }

    // Test 7: Error Handling (Configuration Not Set)
    try {
        console.log('\n7️⃣  Testing error handling...');
        
        // Clear configuration
        global.STITCHPDF_CONFIG = null;
        
        const { optimizePdf } = await import('../src/optimization.js');
        
        try {
            await optimizePdf('/nonexistent/file.pdf');
            throw new Error('Should have thrown configuration error');
        } catch (error) {
            if (!error.message.includes('not configured')) {
                throw new Error('Wrong error type: ' + error.message);
            }
        }
        
        // Restore configuration
        const premium = await import('../src/index.js');
        premium.configure(TEST_CONFIG);
        
        console.log('   ✅ Error handling works correctly');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Error handling test failed:', error.message);
        failed++;
    }

    // Test 8: Feature Showcase
    try {
        console.log('\n8️⃣  Testing feature showcase...');
        
        const premium = await import('../src/index.js');
        
        // This should not throw an error
        premium.showFeatures();
        
        console.log('   ✅ Feature showcase works');
        passed++;
        
    } catch (error) {
        console.log('   ❌ Feature showcase test failed:', error.message);
        failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Premium SDK is ready.');
        return true;
    } else {
        console.log('❌ Some tests failed. Please fix the issues above.');
        return false;
    }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        const success = await runTests();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    }
}

export { runTests };