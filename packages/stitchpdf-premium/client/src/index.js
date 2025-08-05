// @stitchpdf/premium - Client SDK
// Premium PDF processing via secure AWS APIs

export { optimizePdf, estimateOptimization } from './optimization.js';
export { createMailMerge, processMailMerge } from './mailMerge.js';
export { insertConditional, smartInsert } from './conditionalInsertion.js';
export { PremiumClient } from './client.js';

// Re-export free features for convenience
export { 
    extractText, 
    extractTextWithCoordinates,
    analyzeFonts,
    validatePdf,
    insertAtPage 
} from 'stitchpdf';

export const VERSION = '1.0.0';
export const LIBRARY_NAME = '@stitchpdf/premium';

// Configuration helpers
export function configure(options = {}) {
    if (!options.apiKey) {
        throw new Error('API key is required. Get yours at https://stitchpdf.com/dashboard');
    }
    
    // Set global configuration
    global.STITCHPDF_CONFIG = {
        apiKey: options.apiKey,
        baseUrl: options.baseUrl || 'https://api.stitchpdf.com',
        timeout: options.timeout || 300000, // 5 minutes
        retries: options.retries || 3
    };
    
    console.log('✅ StitchPDF Premium configured successfully');
    return true;
}

// Helper to check configuration
export function isConfigured() {
    return global.STITCHPDF_CONFIG && global.STITCHPDF_CONFIG.apiKey;
}

// Premium feature showcase
export function showFeatures() {
    console.log(`
🚀 StitchPDF Premium Features:

📊 PDF Optimization:
• 90%+ file size reduction
• Ghostscript-powered compression  
• Smart image & font optimization

📧 Mail Merge:
• Template-based PDF generation
• CSV/JSON data integration
• Bulk personalized documents

🎯 Smart Insertion:
• Text-based conditional logic
• Pattern matching & rules
• Advanced placement algorithms

⚡ Enterprise Features:
• Bulk processing capabilities
• Priority API access
• Advanced analytics

Usage: configure({ apiKey: 'your-api-key' })
    `);
} 