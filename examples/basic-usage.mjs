// Basic Usage Examples for stitchPDF
import path from 'path';
import { fileURLToPath } from 'url';
import {
    extractText,
    extractTextWithCoordinates,
    validatePdf,
    insertAtPage,
    createMailMerge,
    processMailMerge,
    LicenseManager
} from '../src/index.mjs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample PDF path (using the test PDF from the project)
const samplePdf = path.resolve(__dirname, '../Entering Time.pdf');

console.log('🎯 stitchPDF Basic Usage Examples\n');

// Example 1: Text Extraction
console.log('📄 Example 1: Text Extraction');
try {
    const text = await extractText(samplePdf, { preserveLayout: true });
    console.log('✅ Plain text extracted');
    console.log('First 200 characters:', text.substring(0, 200) + '...\n');
} catch (error) {
    console.error('❌ Text extraction failed:', error.message);
}

// Example 2: Text Extraction with Coordinates
console.log('📍 Example 2: Text with Coordinates');
try {
    const coordinateData = await extractTextWithCoordinates(samplePdf);
    console.log('✅ Text with coordinates extracted');
    console.log(`📊 Found ${coordinateData.numPages} pages`);
    
    // Show first few items from first page
    if (coordinateData.pages.length > 0) {
        const firstPage = coordinateData.pages[0];
        console.log(`Page 1 has ${firstPage.items.length} text items`);
        console.log('First 3 items:');
        firstPage.items.slice(0, 3).forEach((item, index) => {
            console.log(`  ${index + 1}. "${item.text}" at (${item.x.toFixed(2)}", ${item.y.toFixed(2)}")`);
        });
    }
    console.log();
} catch (error) {
    console.error('❌ Coordinate extraction failed:', error.message);
}

// Example 3: PDF Validation
console.log('🔍 Example 3: PDF Security Validation');
try {
    const validation = await validatePdf(samplePdf);
    console.log('✅ PDF validation completed');
    console.log('Valid:', validation.isValid ? '✅' : '❌');
    console.log('Issues:', validation.issues.length);
    console.log('Warnings:', validation.warnings.length);
    console.log('Has JavaScript:', validation.security.hasJavaScript ? '⚠️' : '✅');
    console.log('Has Forms:', validation.security.hasForms ? 'Yes' : 'No');
    console.log('Page Count:', validation.pageCount);
    console.log();
} catch (error) {
    console.error('❌ Validation failed:', error.message);
}

// Example 4: License Management
console.log('📜 Example 4: License Management');
try {
    const licenseManager = new LicenseManager();
    const status = await licenseManager.getLicenseStatus();
    console.log('✅ License status checked');
    console.log('Licensed:', status.licensed ? 'Yes' : 'No');
    console.log('Tier:', status.tier);
    console.log('Available features:', status.features.join(', '));
    console.log();
} catch (error) {
    console.error('❌ License check failed:', error.message);
}

// Example 5: Mail Merge Configuration
console.log('📋 Example 5: Mail Merge Setup');
try {
    // Create a sample mail merge configuration
    const mergeConfig = await createMailMerge(samplePdf, {
        fieldMarkers: ['{{', '}}'],
        autoDetectFields: true
    });
    
    console.log('✅ Mail merge configuration created');
    console.log('Template pages:', mergeConfig.pages);
    console.log('Detected fields:', mergeConfig.fields.length);
    
    if (mergeConfig.fields.length > 0) {
        console.log('Fields found:');
        mergeConfig.fields.forEach(field => {
            console.log(`  - ${field.name} (page ${field.page})`);
        });
    } else {
        console.log('ℹ️  No merge fields detected in this PDF');
        console.log('   To use mail merge, add fields like {{name}} or {{email}} to your PDF template');
    }
    console.log();
} catch (error) {
    console.error('❌ Mail merge setup failed:', error.message);
}

// Example 6: Working with Premium Features
console.log('🔒 Example 6: Premium Features');
try {
    const licenseManager = new LicenseManager();
    
    // Try to use a premium feature
    console.log('Checking premium feature access...');
    const hasSecurityFeature = await licenseManager.checkFeatureLicense('security');
    const hasInsertionFeature = await licenseManager.checkFeatureLicense('insertion');
    
    console.log('Advanced Security Analysis:', hasSecurityFeature ? '✅ Available' : '🔒 Requires license');
    console.log('Conditional Page Insertion:', hasInsertionFeature ? '✅ Available' : '🔒 Requires license');
    
    if (!hasSecurityFeature || !hasInsertionFeature) {
        console.log('💡 To unlock premium features, visit: https://stitchpdf.com/license');
    }
    console.log();
} catch (error) {
    console.error('❌ Premium feature check failed:', error.message);
}

// Example 7: Error Handling
console.log('⚠️  Example 7: Error Handling');
try {
    // Try to extract from non-existent file
    await extractText('non-existent-file.pdf');
} catch (error) {
    console.log('✅ Error handling working correctly');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    console.log();
}

// Example 8: Performance Tips
console.log('🚀 Example 8: Performance Tips');
console.log('✅ Tips for optimal performance:');
console.log('1. Use specific page ranges when possible: extractText(pdf, { pageNumbers: [1, 2, 3] })');
console.log('2. For large files, consider processing in batches');
console.log('3. Cache validation results for repeated checks');
console.log('4. Use coordinate extraction only when layout matters');
console.log('5. For mail merge, process in batches to manage memory');
console.log();

console.log('🎉 All examples completed!');
console.log('📚 Check the documentation for more advanced usage patterns.');
console.log('🔧 Run with: node examples/basic-usage.mjs'); 