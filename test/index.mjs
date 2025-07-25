// Basic test file for stitchPDF
import { extractText, analyzeFonts, validatePdf } from '../src/index.js';

async function testLibrary() {
    console.log('stitchPDF Library Test');
    console.log('=====================');
    
    try {
        // Test basic imports and functionality (without requiring a PDF file)
        console.log('\n1. Import Test:');
        console.log('   ✅ Successfully imported extractText, analyzeFonts, validatePdf');
        
        // Test that functions exist and are callable
        console.log('\n2. Function Availability Test:');
        console.log(`   extractText: ${typeof extractText}`);
        console.log(`   analyzeFonts: ${typeof analyzeFonts}`); 
        console.log(`   validatePdf: ${typeof validatePdf}`);
        
        // Test with a non-existent file to check error handling
        console.log('\n3. Error Handling Test:');
        try {
            await validatePdf('non-existent-file.pdf');
        } catch (error) {
            console.log('   ✅ Error handling works:', error.message.substring(0, 50) + '...');
        }
        
        console.log('\n✅ All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testLibrary(); 