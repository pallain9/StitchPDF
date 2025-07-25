// stitchPDF Core Library
// Main entry point for all PDF processing capabilities

// Text extraction functions
export { 
    extractText, 
    extractTextWithCoordinates 
} from './text/extractor.js';

// PDF validation and security
export { 
    validatePdf,
    scanForJavaScript 
} from './validation/security.js';

// Page insertion functions
export { 
    insertAtPage 
} from './insertion/pageInsertion.js';

// Mail merge capabilities
export { 
    createMailMerge,
    processMailMerge 
} from './merge/mailMerge.js';

// Font analysis
export { 
    analyzeFonts 
} from './analysis/fontAnalyzer.js';

// PDF optimization - Now with WORKING Ghostscript support!
export { 
    analyzePdfOptimization,
    optimizePdf 
} from './optimization/pdfOptimizer.js';

export {
    optimizePdfWithGhostscript,
    checkGhostscriptAvailability,
    estimateGhostscriptSavings,
    compareOptimizationMethods
} from './optimization/ghostscriptOptimizer.js';

// Licensing system
export { 
    LicenseManager 
} from './licensing/licenseManager.js';

// Secure licensing components (obfuscated exports)
export { 
    SecurityValidator,
    validateOptimization,
    validateMailMerge,
    validatePageInsertion,
    validateBulkProcessing,
    _0x9a8b 
} from './licensing/securityValidator.js';

export {
    LicenseApiClient,
    licenseApiClient
} from './licensing/apiClient.js';

// Library version and info
export const VERSION = '1.0.0';
export const LIBRARY_NAME = 'stitchPDF'; 