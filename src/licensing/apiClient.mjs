// Secure License API Client
import crypto from 'crypto';
import https from 'https';
import { URL } from 'url';

// Obfuscated API configuration
const _0xdef0 = Buffer.from('YXBpLnN0aXRjaHBkZi5jb20=', 'base64').toString();
const _0xabc1 = Buffer.from('djEvcHJvZHVjdGlvbg==', 'base64').toString();
const _0x1234 = Buffer.from('YXBwbGljYXRpb24vanNvbg==', 'base64').toString();

/**
 * Secure API Client for License Validation
 */
export class LicenseApiClient {
    constructor() {
        this._baseUrl = `https://${_0xdef0}/${_0xabc1}`;
        this._timeout = 30000; // 30 seconds
        this._retryCount = 3;
        this._userAgent = this._generateUserAgent();
        this._apiKey = this._generateApiKey();
    }

    /**
     * Generate obfuscated user agent
     */
    _generateUserAgent() {
        const components = [
            'stitchPDF',
            '1.0.0',
            process.platform,
            process.arch,
            process.version
        ];
        return `${components[0]}/${components[1]} (${components[2]} ${components[3]}) Node/${components[4].substring(1)}`;
    }

    /**
     * Generate API authentication key
     */
    _generateApiKey() {
        const seed = 'stitchpdf-api-2025';
        return crypto
            .createHash('sha256')
            .update(seed + Date.now().toString().substring(0, 10))
            .digest('hex')
            .substring(0, 32);
    }

    /**
     * Encrypt API payload
     */
    _encryptPayload(data) {
        const key = crypto.scryptSync(this._apiKey, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', key);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            data: encrypted,
            iv: iv.toString('hex'),
            tag: authTag.toString('hex')
        };
    }

    /**
     * Decrypt API response
     */
    _decryptResponse(encryptedResponse) {
        try {
            const key = crypto.scryptSync(this._apiKey, 'salt', 32);
            const decipher = crypto.createDecipher('aes-256-gcm', key);
            
            decipher.setAuthTag(Buffer.from(encryptedResponse.tag, 'hex'));
            
            let decrypted = decipher.update(encryptedResponse.data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            throw new Error('Response decryption failed');
        }
    }

    /**
     * Make secure HTTPS request with retries
     */
    async _makeSecureRequest(endpoint, payload, method = 'POST') {
        let lastError;
        
        for (let attempt = 0; attempt < this._retryCount; attempt++) {
            try {
                return await this._performRequest(endpoint, payload, method);
            } catch (error) {
                lastError = error;
                
                // Exponential backoff
                if (attempt < this._retryCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Perform actual HTTPS request
     */
    async _performRequest(endpoint, payload, method) {
        return new Promise((resolve, reject) => {
            const url = new URL(`${this._baseUrl}${endpoint}`);
            
            const encryptedPayload = this._encryptPayload(payload);
            const postData = JSON.stringify(encryptedPayload);
            
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: method,
                headers: {
                    'Content-Type': _0x1234,
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': this._userAgent,
                    'X-API-Version': '1.0',
                    'X-Client-ID': this._generateClientId(),
                    'X-Timestamp': Date.now().toString()
                },
                timeout: this._timeout
            };

            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            const response = JSON.parse(data);
                            if (response.encrypted) {
                                const decrypted = this._decryptResponse(response);
                                resolve(decrypted);
                            } else {
                                resolve(response);
                            }
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                        }
                    } catch (error) {
                        reject(new Error(`Response parsing failed: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Generate unique client identifier
     */
    _generateClientId() {
        const components = [
            process.platform,
            process.arch,
            process.version,
            this._userAgent
        ];
        
        return crypto
            .createHash('md5')
            .update(components.join('|'))
            .digest('hex')
            .substring(0, 16);
    }

    /**
     * Validate license with secure API
     */
    async validateLicense(licenseKey, hardwareId, productVersion = '1.0.0') {
        try {
            const payload = {
                action: 'validate',
                license: licenseKey,
                hardware: hardwareId,
                version: productVersion,
                timestamp: Date.now(),
                client: this._generateClientId()
            };

            const response = await this._makeSecureRequest('/license/validate', payload);
            
            return {
                success: true,
                valid: response.valid === true,
                license: response.license || null,
                expires: response.expires || null,
                features: response.features || [],
                message: response.message || 'Validation completed'
            };
            
        } catch (error) {
            // Return error but don't throw to allow graceful degradation
            return {
                success: false,
                valid: false,
                error: error.message,
                offline: true
            };
        }
    }

    /**
     * Activate license with API
     */
    async activateLicense(licenseKey, hardwareId, email) {
        try {
            const payload = {
                action: 'activate',
                license: licenseKey,
                hardware: hardwareId,
                email: email,
                timestamp: Date.now(),
                client: this._generateClientId()
            };

            const response = await this._makeSecureRequest('/license/activate', payload);
            
            return {
                success: response.success === true,
                license: response.license || null,
                message: response.message || 'Activation completed'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Deactivate license
     */
    async deactivateLicense(licenseKey, hardwareId) {
        try {
            const payload = {
                action: 'deactivate',
                license: licenseKey,
                hardware: hardwareId,
                timestamp: Date.now(),
                client: this._generateClientId()
            };

            const response = await this._makeSecureRequest('/license/deactivate', payload);
            
            return {
                success: response.success === true,
                message: response.message || 'Deactivation completed'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check license status
     */
    async checkLicenseStatus(licenseKey) {
        try {
            const payload = {
                action: 'status',
                license: licenseKey,
                timestamp: Date.now(),
                client: this._generateClientId()
            };

            const response = await this._makeSecureRequest('/license/status', payload);
            
            return {
                success: true,
                status: response.status || 'unknown',
                activations: response.activations || 0,
                maxActivations: response.maxActivations || 1,
                expires: response.expires || null
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

/**
 * Mock API server for development and testing
 */
export class MockLicenseServer {
    constructor() {
        this._licenses = new Map([
            ['STITCH-PRO-123456789', {
                tier: 'pro',
                email: 'user@example.com',
                expires: Date.now() + (30 * 24 * 60 * 60 * 1000),
                features: ['text-extraction', 'font-analysis', 'pdf-validation', 'page-insertion', 'optimization', 'mail-merge'],
                maxActivations: 2,
                activations: []
            }],
            ['STITCH-ENT-987654321', {
                tier: 'enterprise',
                email: 'enterprise@example.com',
                expires: Date.now() + (365 * 24 * 60 * 60 * 1000),
                features: ['text-extraction', 'font-analysis', 'pdf-validation', 'page-insertion', 'optimization', 'mail-merge', 'bulk-processing'],
                maxActivations: 10,
                activations: []
            }]
        ]);
    }

    /**
     * Simulate license validation
     */
    async validateLicense(licenseKey, hardwareId) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        const license = this._licenses.get(licenseKey);
        
        if (!license) {
            return {
                valid: false,
                error: 'Invalid license key'
            };
        }
        
        if (Date.now() > license.expires) {
            return {
                valid: false,
                error: 'License expired'
            };
        }
        
        // Check if hardware is activated
        if (!license.activations.includes(hardwareId)) {
            if (license.activations.length >= license.maxActivations) {
                return {
                    valid: false,
                    error: 'Maximum activations exceeded'
                };
            }
            
            // Auto-activate on first use
            license.activations.push(hardwareId);
        }
        
        return {
            valid: true,
            license: {
                key: licenseKey,
                tier: license.tier,
                email: license.email
            },
            expires: license.expires,
            features: license.features
        };
    }
}

// Singleton instance for production use
export const licenseApiClient = new LicenseApiClient();

// Mock server for development
export const mockLicenseServer = new MockLicenseServer(); 