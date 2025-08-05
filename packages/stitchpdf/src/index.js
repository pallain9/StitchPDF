// stitchPDF Open Source Library
// Free tier PDF processing capabilities

// 🆓 FREE: Text extraction functions
export { 
    extractText, 
    extractTextWithCoordinates 
} from './text/extractor.js';

// 🆓 FREE: PDF validation and security
export { 
    validatePdf,
    scanForJavaScript 
} from './validation/security.js';

// 🆓 FREE: Font analysis
export { 
    analyzeFonts 
} from './analysis/fontAnalyzer.js';

// 🆓 FREE: Basic page insertion (no conditional logic)
export { 
    insertAtPage 
} from './insertion/pageInsertion.js';

// 🆓 FREE: Utility functions
export { 
    loadPdf 
} from './utils/loadPdf.js';

export {
    pointsToInches,
    pointsToMm,
    inchesToPoints,
    mmToPoints
} from './utils/units.js';

// Library version and info
export const VERSION = '1.0.0';
export const LIBRARY_NAME = 'stitchPDF';

// 💡 Premium features notice
export const PREMIUM_FEATURES = {
    optimization: '@stitchpdf/premium',
    mailMerge: '@stitchpdf/premium', 
    conditionalInsertion: '@stitchpdf/premium',
    bulkProcessing: '@stitchpdf/premium'
};

export function showPremiumInfo() {
    console.log(`
🚀 Want more features? 

Premium features available in @stitchpdf/premium:
• PDF Optimization (90%+ compression)
• Mail Merge with templates
• Smart conditional page insertion  
• Bulk processing capabilities
• Enterprise support

Visit https://stitchpdf.com/pricing for details.
    `);
} 