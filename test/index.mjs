// Basic test file for stitchPDF
import { extractText, analyzeFonts, validatePdf } from '../src/index.mjs';

async function testLibrary() {
    console.log('stitchPDF Library Test');
    console.log('=====================');
    
    try {
        // Test with the BambooUAT file if it exists
        const testFile = 'Path/to/your/file';
        
        console.log(`Testing with: ${testFile}`);
        
        // Test font analysis
        console.log('\n1. Font Analysis Test:');
        const fontAnalysis = await analyzeFonts(testFile);
        console.log(`   Found ${fontAnalysis.totalFonts} fonts`);
        console.log(`   ${fontAnalysis.uniqueFamilies} unique families`);
        console.log(`   ${fontAnalysis.embeddedFonts} embedded fonts`);
        
        // Test validation
        console.log('\n2. PDF Validation Test:');
        const validation = await validatePdf(testFile);
        console.log(`   Valid: ${validation.valid}`);
        console.log(`   Pages: ${validation.pageCount}`);
        console.log(`   Size: ${(validation.fileSize / 1024 / 1024).toFixed(2)} MB`);
        
        console.log('\n✅ All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testLibrary(); 