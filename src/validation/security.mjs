// PDF Security Validation Module - Enhanced
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

/**
 * Comprehensive PDF security validation
 * @param {string} filePath - Path to PDF file
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Complete validation results
 */
export async function validatePdf(filePath, options = {}) {
    const {
        checkJavaScript = true,
        checkForms = true,
        checkEmbeddedFiles = true,
        checkMetadata = true,
        checkSuspiciousObjects = true,
        checkEncryption = true,
        checkUrls = true,
        checkActions = true
    } = options;

    try {
        const pdfData = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(pdfData);
        const pdfString = pdfData.toString('latin1');
        
        const results = {
            valid: true,
            fileSize: pdfData.length,
            pageCount: pdfDoc.getPageCount(),
            issues: [],
            warnings: [],
            securityChecks: {},
            riskLevel: 'LOW',
            recommendations: []
        };

        // Basic structure validation
        if (results.pageCount === 0) {
            results.issues.push('PDF contains no pages');
            results.valid = false;
        }

        // Run all security checks
        if (checkJavaScript) {
            results.securityChecks.javascript = await scanForJavaScript(filePath);
        }
        
        if (checkForms) {
            results.securityChecks.forms = scanForForms(pdfString);
        }
        
        if (checkEmbeddedFiles) {
            results.securityChecks.embeddedFiles = scanForEmbeddedFiles(pdfString);
        }
        
        if (checkMetadata) {
            results.securityChecks.metadata = scanForSuspiciousMetadata(pdfString);
        }
        
        if (checkSuspiciousObjects) {
            results.securityChecks.suspiciousObjects = scanForSuspiciousObjects(pdfString);
        }
        
        if (checkEncryption) {
            results.securityChecks.encryption = checkEncryptionSecurity(pdfDoc, pdfString);
        }
        
        if (checkUrls) {
            results.securityChecks.urls = scanForSuspiciousUrls(pdfString);
        }
        
        if (checkActions) {
            results.securityChecks.actions = scanForSuspiciousActions(pdfString);
        }

        // Calculate overall risk level
        results.riskLevel = calculateOverallRisk(results.securityChecks);
        
        // Generate recommendations
        results.recommendations = generateSecurityRecommendations(results.securityChecks);

        return results;
    } catch (error) {
        return {
            valid: false,
            issues: [`PDF validation failed: ${error.message}`],
            warnings: [],
            pageCount: 0,
            fileSize: 0,
            riskLevel: 'UNKNOWN',
            error: error.message
        };
    }
}

/**
 * Scan PDF for JavaScript content
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<Object>} JavaScript scan results
 */
export async function scanForJavaScript(filePath) {
    try {
        const pdfData = fs.readFileSync(filePath);
        const pdfString = pdfData.toString('latin1');
        
        const jsPatterns = [
            { pattern: /\/JavaScript/gi, type: 'JavaScript Object', risk: 'HIGH' },
            { pattern: /\/JS/gi, type: 'JavaScript Object Short', risk: 'HIGH' },
            { pattern: /this\.print/gi, type: 'Auto-print Command', risk: 'MEDIUM' },
            { pattern: /app\.alert/gi, type: 'Alert Dialog', risk: 'LOW' },
            { pattern: /eval\(/gi, type: 'Dynamic Code Execution', risk: 'HIGH' },
            { pattern: /document\.write/gi, type: 'Document Manipulation', risk: 'MEDIUM' },
            { pattern: /window\.open/gi, type: 'Window/Popup Creation', risk: 'MEDIUM' },
            { pattern: /XMLHttpRequest/gi, type: 'Network Request', risk: 'HIGH' },
            { pattern: /ActiveXObject/gi, type: 'ActiveX Usage', risk: 'HIGH' },
            { pattern: /WScript\.Shell/gi, type: 'Shell Command', risk: 'CRITICAL' },
            { pattern: /new\s+Function/gi, type: 'Dynamic Function Creation', risk: 'HIGH' }
        ];
        
        const detectedScripts = [];
        
        jsPatterns.forEach(({ pattern, type, risk }) => {
            const matches = pdfString.match(pattern);
            if (matches) {
                detectedScripts.push({
                    pattern: pattern.toString(),
                    type,
                    risk,
                    matches: matches.length
                });
            }
        });
        
        const hasJavaScript = detectedScripts.length > 0;
        const riskLevel = hasJavaScript ? 
            (detectedScripts.some(s => s.risk === 'CRITICAL') ? 'CRITICAL' : 
             detectedScripts.some(s => s.risk === 'HIGH') ? 'HIGH' : 'MEDIUM') : 'LOW';

        return {
            hasJavaScript,
            detectedScripts,
            riskLevel,
            recommendation: hasJavaScript ? 'Review JavaScript code for malicious content' : 'No JavaScript detected'
        };
    } catch (error) {
        return {
            hasJavaScript: false,
            detectedScripts: [],
            riskLevel: 'UNKNOWN',
            error: error.message
        };
    }
}

/**
 * Scan for interactive forms
 */
function scanForForms(pdfString) {
    const formPatterns = [
        { pattern: /\/AcroForm/gi, type: 'Interactive Form', risk: 'MEDIUM' },
        { pattern: /\/Widget/gi, type: 'Form Widget', risk: 'LOW' },
        { pattern: /\/Btn/gi, type: 'Button Field', risk: 'MEDIUM' },
        { pattern: /\/Tx/gi, type: 'Text Field', risk: 'LOW' },
        { pattern: /\/Ch/gi, type: 'Choice Field', risk: 'LOW' },
        { pattern: /\/Sig/gi, type: 'Signature Field', risk: 'MEDIUM' }
    ];
    
    const detectedForms = [];
    formPatterns.forEach(({ pattern, type, risk }) => {
        const matches = pdfString.match(pattern);
        if (matches) {
            detectedForms.push({ type, risk, count: matches.length });
        }
    });
    
    return {
        hasForms: detectedForms.length > 0,
        detectedForms,
        riskLevel: detectedForms.some(f => f.risk === 'MEDIUM') ? 'MEDIUM' : 'LOW',
        recommendation: detectedForms.length > 0 ? 'Review form fields for data collection' : 'No forms detected'
    };
}

/**
 * Scan for embedded files
 */
function scanForEmbeddedFiles(pdfString) {
    const embeddedPatterns = [
        { pattern: /\/EmbeddedFile/gi, type: 'Embedded File', risk: 'HIGH' },
        { pattern: /\/FileAttachment/gi, type: 'File Attachment', risk: 'HIGH' },
        { pattern: /\/RichMedia/gi, type: 'Rich Media Content', risk: 'MEDIUM' },
        { pattern: /\/Movie/gi, type: 'Movie Annotation', risk: 'MEDIUM' },
        { pattern: /\/Sound/gi, type: 'Sound Annotation', risk: 'LOW' }
    ];
    
    const detectedEmbedded = [];
    embeddedPatterns.forEach(({ pattern, type, risk }) => {
        const matches = pdfString.match(pattern);
        if (matches) {
            detectedEmbedded.push({ type, risk, count: matches.length });
        }
    });
    
    return {
        hasEmbeddedFiles: detectedEmbedded.length > 0,
        detectedEmbedded,
        riskLevel: detectedEmbedded.some(e => e.risk === 'HIGH') ? 'HIGH' : 'MEDIUM',
        recommendation: detectedEmbedded.length > 0 ? 'Scan embedded files for malware' : 'No embedded files detected'
    };
}

/**
 * Scan for suspicious metadata
 */
function scanForSuspiciousMetadata(pdfString) {
    const metadataPatterns = [
        { pattern: /\/Creator\s*\([^)]*(?:script|hack|exploit|payload)/gi, type: 'Suspicious Creator', risk: 'HIGH' },
        { pattern: /\/Producer\s*\([^)]*(?:bot|auto|tool)/gi, type: 'Automated Producer', risk: 'MEDIUM' },
        { pattern: /\/Title\s*\([^)]*(?:confidential|internal|secret)/gi, type: 'Sensitive Title', risk: 'LOW' },
        { pattern: /\/Subject\s*\([^)]*(?:test|phish|scam)/gi, type: 'Suspicious Subject', risk: 'HIGH' }
    ];
    
    const detectedMetadata = [];
    metadataPatterns.forEach(({ pattern, type, risk }) => {
        const matches = pdfString.match(pattern);
        if (matches) {
            detectedMetadata.push({ type, risk, examples: matches.slice(0, 3) });
        }
    });
    
    return {
        hasSuspiciousMetadata: detectedMetadata.length > 0,
        detectedMetadata,
        riskLevel: detectedMetadata.some(m => m.risk === 'HIGH') ? 'HIGH' : 'MEDIUM',
        recommendation: detectedMetadata.length > 0 ? 'Review metadata for suspicious content' : 'Metadata appears normal'
    };
}

/**
 * Scan for suspicious PDF objects
 */
function scanForSuspiciousObjects(pdfString) {
    const suspiciousPatterns = [
        { pattern: /\/Launch/gi, type: 'Launch Action', risk: 'CRITICAL' },
        { pattern: /\/GoToR/gi, type: 'Remote Go-To Action', risk: 'HIGH' },
        { pattern: /\/ImportData/gi, type: 'Data Import Action', risk: 'HIGH' },
        { pattern: /\/SubmitForm/gi, type: 'Form Submission', risk: 'MEDIUM' },
        { pattern: /\/Hide/gi, type: 'Hide Action', risk: 'MEDIUM' },
        { pattern: /\/Named/gi, type: 'Named Action', risk: 'MEDIUM' },
        { pattern: /\/OpenAction/gi, type: 'Open Action', risk: 'MEDIUM' },
        { pattern: /\/XFA/gi, type: 'XFA Forms', risk: 'MEDIUM' }
    ];
    
    const detectedObjects = [];
    suspiciousPatterns.forEach(({ pattern, type, risk }) => {
        const matches = pdfString.match(pattern);
        if (matches) {
            detectedObjects.push({ type, risk, count: matches.length });
        }
    });
    
    return {
        hasSuspiciousObjects: detectedObjects.length > 0,
        detectedObjects,
        riskLevel: detectedObjects.some(o => o.risk === 'CRITICAL') ? 'CRITICAL' : 
                   detectedObjects.some(o => o.risk === 'HIGH') ? 'HIGH' : 'MEDIUM',
        recommendation: detectedObjects.length > 0 ? 'Review suspicious PDF objects' : 'No suspicious objects detected'
    };
}

/**
 * Check encryption and security settings
 */
function checkEncryptionSecurity(pdfDoc, pdfString) {
    const encryptionChecks = {
        isEncrypted: false,
        hasOwnerPassword: false,
        hasUserPassword: false,
        weakEncryption: false,
        permissions: {}
    };
    
    try {
        encryptionChecks.isEncrypted = pdfDoc.isEncrypted;
        
        // Check for weak encryption algorithms
        const weakPatterns = [
            /\/V\s+1/gi,  // RC4 40-bit
            /\/V\s+2/gi,  // RC4 128-bit
            /\/Length\s+40/gi  // 40-bit key
        ];
        
        weakPatterns.forEach(pattern => {
            if (pdfString.match(pattern)) {
                encryptionChecks.weakEncryption = true;
            }
        });
        
        // Check for password protection indicators
        if (pdfString.match(/\/U\s*\(/gi)) {
            encryptionChecks.hasUserPassword = true;
        }
        if (pdfString.match(/\/O\s*\(/gi)) {
            encryptionChecks.hasOwnerPassword = true;
        }
        
    } catch (error) {
        encryptionChecks.error = error.message;
    }
    
    const riskLevel = encryptionChecks.weakEncryption ? 'HIGH' : 
                     encryptionChecks.isEncrypted ? 'LOW' : 'MEDIUM';
    
    return {
        ...encryptionChecks,
        riskLevel,
        recommendation: encryptionChecks.weakEncryption ? 'Upgrade to stronger encryption' :
                       !encryptionChecks.isEncrypted ? 'Consider adding encryption for sensitive content' :
                       'Encryption appears adequate'
    };
}

/**
 * Scan for suspicious URLs
 */
function scanForSuspiciousUrls(pdfString) {
    const urlPatterns = [
        { pattern: /https?:\/\/[^\s)]+/gi, type: 'HTTP URL', risk: 'LOW' },
        { pattern: /ftp:\/\/[^\s)]+/gi, type: 'FTP URL', risk: 'MEDIUM' },
        { pattern: /file:\/\/[^\s)]+/gi, type: 'Local File URL', risk: 'HIGH' },
        { pattern: /javascript:[^\s)]+/gi, type: 'JavaScript URL', risk: 'CRITICAL' },
        { pattern: /data:[^\s)]+/gi, type: 'Data URL', risk: 'HIGH' }
    ];
    
    const detectedUrls = [];
    urlPatterns.forEach(({ pattern, type, risk }) => {
        const matches = pdfString.match(pattern);
        if (matches) {
            detectedUrls.push({ 
                type, 
                risk, 
                count: matches.length,
                examples: matches.slice(0, 3).map(url => url.substring(0, 100))
            });
        }
    });
    
    return {
        hasUrls: detectedUrls.length > 0,
        detectedUrls,
        riskLevel: detectedUrls.some(u => u.risk === 'CRITICAL') ? 'CRITICAL' :
                   detectedUrls.some(u => u.risk === 'HIGH') ? 'HIGH' : 'MEDIUM',
        recommendation: detectedUrls.length > 0 ? 'Verify all URLs before clicking' : 'No URLs detected'
    };
}

/**
 * Scan for suspicious actions
 */
function scanForSuspiciousActions(pdfString) {
    const actionPatterns = [
        { pattern: /\/S\s*\/Launch/gi, type: 'File Launch Action', risk: 'CRITICAL' },
        { pattern: /\/S\s*\/GoToR/gi, type: 'Remote Document Action', risk: 'HIGH' },
        { pattern: /\/S\s*\/URI/gi, type: 'URI Action', risk: 'MEDIUM' },
        { pattern: /\/S\s*\/SubmitForm/gi, type: 'Form Submit Action', risk: 'MEDIUM' },
        { pattern: /\/S\s*\/ImportData/gi, type: 'Data Import Action', risk: 'HIGH' },
        { pattern: /\/S\s*\/JavaScript/gi, type: 'JavaScript Action', risk: 'HIGH' }
    ];
    
    const detectedActions = [];
    actionPatterns.forEach(({ pattern, type, risk }) => {
        const matches = pdfString.match(pattern);
        if (matches) {
            detectedActions.push({ type, risk, count: matches.length });
        }
    });
    
    return {
        hasSuspiciousActions: detectedActions.length > 0,
        detectedActions,
        riskLevel: detectedActions.some(a => a.risk === 'CRITICAL') ? 'CRITICAL' :
                   detectedActions.some(a => a.risk === 'HIGH') ? 'HIGH' : 'MEDIUM',
        recommendation: detectedActions.length > 0 ? 'Review all PDF actions carefully' : 'No suspicious actions detected'
    };
}

/**
 * Calculate overall risk level
 */
function calculateOverallRisk(securityChecks) {
    const risks = Object.values(securityChecks).map(check => check.riskLevel).filter(Boolean);
    
    if (risks.includes('CRITICAL')) return 'CRITICAL';
    if (risks.includes('HIGH')) return 'HIGH';
    if (risks.includes('MEDIUM')) return 'MEDIUM';
    return 'LOW';
}

/**
 * Generate security recommendations
 */
function generateSecurityRecommendations(securityChecks) {
    const recommendations = [];
    
    Object.entries(securityChecks).forEach(([checkType, result]) => {
        if (result.recommendation && result.riskLevel !== 'LOW') {
            recommendations.push({
                category: checkType,
                level: result.riskLevel,
                message: result.recommendation
            });
        }
    });
    
    return recommendations;
} 