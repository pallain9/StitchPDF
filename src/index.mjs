// stitchPDF Core Library
// Main entry point for all PDF processing capabilities

// Text extraction functions
export { 
    extractText, 
    extractTextWithCoordinates 
} from './text/extractor.mjs';

// PDF validation and security
export { 
    validatePdf,
    scanForJavaScript 
} from './validation/security.mjs';

// Page insertion functions
export { 
    insertAtPage 
} from './insertion/pageInsertion.mjs';

// Mail merge capabilities
export { 
    createMailMerge,
    processMailMerge 
} from './merge/mailMerge.mjs';

// Font analysis
export { 
    analyzeFonts 
} from './analysis/fontAnalyzer.mjs';

// PDF optimization - Now with WORKING Ghostscript support!
export { 
    analyzePdfOptimization,
    optimizePdf 
} from './optimization/pdfOptimizer.mjs';

export {
    optimizePdfWithGhostscript,
    checkGhostscriptAvailability,
    estimateGhostscriptSavings,
    compareOptimizationMethods
} from './optimization/ghostscriptOptimizer.mjs';

// Licensing system
export { 
    LicenseManager 
} from './licensing/licenseManager.mjs';

// Secure licensing components (obfuscated exports)
export { 
    SecurityValidator,
    validateOptimization,
    validateMailMerge,
    validatePageInsertion,
    validateBulkProcessing,
    _0x9a8b 
} from './licensing/securityValidator.mjs';

export {
    LicenseApiClient,
    licenseApiClient
} from './licensing/apiClient.mjs';

// Library version and info
export const VERSION = '1.0.0';
export const LIBRARY_NAME = 'stitchPDF'; 