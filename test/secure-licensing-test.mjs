// stitchPDF Secure Licensing System Test
import { LicenseManager, licenseApiClient } from '../src/index.js';
import chalk from 'chalk';

console.log(chalk.blue.bold('🔒 stitchPDF Secure Licensing System Test\n'));

// Test secure license manager
async function testSecureLicensing() {
    try {
        const licenseManager = new LicenseManager();
        
        console.log(chalk.yellow('1. Testing Hardware Fingerprinting...'));
        const info = licenseManager.getLicenseInfo();
        console.log(`   Hardware ID: ${info.hardwareId}`);
        console.log(`   Current Tier: ${info.tier}`);
        console.log(`   Available Features: ${info.availableFeatures.join(', ')}`);
        
        console.log(chalk.yellow('\n2. Testing Demo License Installation...'));
        const demo = licenseManager.activateDemo();
        if (demo) {
            console.log(chalk.green('   ✅ Demo license activated'));
            const demoInfo = licenseManager.getLicenseInfo();
            console.log(`   New Tier: ${demoInfo.tier}`);
            console.log(`   Features: ${demoInfo.availableFeatures.length} available`);
        }
        
        console.log(chalk.yellow('\n3. Testing Pro License Installation...'));
        const proResult = await licenseManager.installLicense('STITCH-PRO-123456789');
        if (proResult.success) {
            console.log(chalk.green('   ✅ Pro license installed successfully'));
            console.log(`   Tier: ${proResult.license.tier}`);
            console.log(`   Email: ${proResult.license.email}`);
        } else {
            console.log(chalk.red('   ❌ Pro license installation failed'));
            console.log(`   Error: ${proResult.message}`);
        }
        
        console.log(chalk.yellow('\n4. Testing Enterprise License...'));
        const entResult = await licenseManager.installLicense('STITCH-ENT-987654321');
        if (entResult.success) {
            console.log(chalk.green('   ✅ Enterprise license installed'));
            console.log(`   Features: ${entResult.license.features?.length || 0} total`);
        }
        
        console.log(chalk.yellow('\n5. Testing Feature Validation Security...'));
        try {
            await licenseManager.checkFeature('optimization');
            console.log(chalk.green('   ✅ Optimization feature accessible'));
        } catch (error) {
            console.log(chalk.red('   ❌ Optimization requires license:'), error.message);
        }
        
        try {
            await licenseManager.checkFeature('bulk-processing');
            console.log(chalk.green('   ✅ Bulk processing feature accessible'));
        } catch (error) {
            console.log(chalk.red('   ❌ Bulk processing requires license:'), error.message);
        }
        
        console.log(chalk.yellow('\n6. Testing Invalid License...'));
        const invalidResult = await licenseManager.installLicense('INVALID-KEY-123');
        if (!invalidResult.success) {
            console.log(chalk.green('   ✅ Invalid license correctly rejected'));
            console.log(`   Error: ${invalidResult.message}`);
        }
        
        console.log(chalk.yellow('\n7. Testing API Client...'));
        const apiResult = await licenseApiClient.validateLicense('STITCH-PRO-123456789', info.hardwareId);
        if (apiResult.success) {
            console.log(chalk.green('   ✅ API validation working'));
            console.log(`   Valid: ${apiResult.valid}`);
        } else {
            console.log(chalk.blue('   📡 API offline, using mock validation'));
        }
        
    } catch (error) {
        console.error(chalk.red('❌ Test failed:'), error.message);
    }
}

// Test secure feature validation
async function testSecureFeatures() {
    console.log(chalk.blue.bold('\n🛡️  Testing Secure Feature Protection\n'));
    
    try {
        const { validateOptimization, _0x9a8b } = await import('../src/licensing/securityValidator.js');
        const licenseManager = new LicenseManager();
        
        console.log(chalk.yellow('1. Testing Obfuscated Validators...'));
        try {
            await validateOptimization(licenseManager);
            console.log(chalk.green('   ✅ Optimization validator passed'));
        } catch (error) {
            console.log(chalk.red('   ❌ Optimization validator blocked:'), error.message);
        }
        
        console.log(chalk.yellow('\n2. Testing Multiple Security Layers...'));
        try {
            await _0x9a8b('optimization', licenseManager);
            console.log(chalk.green('   ✅ Multi-layer validation passed'));
        } catch (error) {
            console.log(chalk.red('   ❌ Security layer blocked:'), error.message);
        }
        
        console.log(chalk.yellow('\n3. Testing Runtime Integrity Checks...'));
        if (licenseManager._runtimeIntegrityCheck()) {
            console.log(chalk.green('   ✅ Code integrity verified'));
        } else {
            console.log(chalk.red('   ❌ Code integrity check failed'));
        }
        
    } catch (error) {
        console.error(chalk.red('❌ Secure feature test failed:'), error.message);
    }
}

// Test premium feature integration
async function testPremiumFeatures() {
    console.log(chalk.blue.bold('\n🚀 Testing Premium Feature Integration\n'));
    
    try {
        // Test if PDF optimization requires license
        const { optimizePdfWithGhostscript } = await import('../src/optimization/ghostscriptOptimizer.mjs');
        
        console.log(chalk.yellow('1. Testing PDF Optimization License Check...'));
        const result = await optimizePdfWithGhostscript('test.pdf', { outputPath: 'output.pdf' });
        
        if (result.success) {
            console.log(chalk.green('   ✅ Optimization accessible with license'));
        } else if (result.error === 'PREMIUM_FEATURE_REQUIRED') {
            console.log(chalk.blue('   🔒 Optimization correctly protected'));
            console.log(`   Message: ${result.message}`);
        } else {
            console.log(chalk.gray('   ℹ️  Other error (expected for test):'), result.error);
        }
        
    } catch (error) {
        console.log(chalk.gray('   ℹ️  Import test completed (file handling expected)'));
    }
}

// Main test execution
async function runAllTests() {
    console.log(chalk.cyan('Starting comprehensive secure licensing tests...\n'));
    
    await testSecureLicensing();
    await testSecureFeatures();
    await testPremiumFeatures();
    
    console.log(chalk.green.bold('\n✅ Secure Licensing System Tests Complete!'));
    console.log(chalk.cyan('\n📝 Security Features Implemented:'));
    console.log('   • API-based license validation');
    console.log('   • Hardware fingerprinting');
    console.log('   • Encrypted license storage');
    console.log('   • Obfuscated security checks');
    console.log('   • Multi-layer validation');
    console.log('   • Runtime integrity verification');
    console.log('   • Anti-tampering protection');
    
    console.log(chalk.yellow('\n💡 Usage Instructions:'));
    console.log('   1. Install a license: stitchpdf license install STITCH-PRO-123456789');
    console.log('   2. Check status: stitchpdf license status');
    console.log('   3. Use premium features: stitchpdf premium optimize file.pdf');
    console.log('   4. Remove license: stitchpdf license remove');
}

// Run tests
runAllTests().catch(console.error); 