// Premium Client Class
// Advanced API client with retry logic and error handling

import fetch from 'node-fetch';

export class PremiumClient {
    constructor(apiKey, options = {}) {
        if (!apiKey) {
            throw new Error('API key is required');
        }
        
        this.apiKey = apiKey;
        this.baseUrl = options.baseUrl || 'https://api.stitchpdf.com';
        this.timeout = options.timeout || 300000; // 5 minutes
        this.maxRetries = options.retries || 3;
        this.retryDelay = options.retryDelay || 1000;
    }

    /**
     * Make authenticated API request with retry logic
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': '@stitchpdf/premium/1.0.0',
                ...options.headers
            },
            ...options,
            body: options.body ? JSON.stringify({
                apiKey: this.apiKey,
                ...JSON.parse(options.body)
            }) : JSON.stringify({ apiKey: this.apiKey })
        };

        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(url, config);
                
                if (response.ok) {
                    return await response.json();
                }
                
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.response = errorData;
                
                // Don't retry client errors (4xx) except rate limits
                if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                    throw error;
                }
                
                lastError = error;
                
                if (attempt < this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    console.log(`⚠️  Request failed (attempt ${attempt}/${this.maxRetries}), retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
            } catch (error) {
                lastError = error;
                
                if (attempt < this.maxRetries && (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET')) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1);
                    console.log(`⚠️  Network error (attempt ${attempt}/${this.maxRetries}), retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw error;
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Get license information
     */
    async getLicenseInfo() {
        return await this.request('/license/info', { method: 'GET' });
    }

    /**
     * Get usage statistics
     */
    async getUsageStats(period = 'month') {
        return await this.request('/license/usage', {
            method: 'POST',
            body: JSON.stringify({ period })
        });
    }

    /**
     * Validate license and features
     */
    async validateLicense() {
        try {
            const info = await this.getLicenseInfo();
            return {
                valid: true,
                ...info
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Upload file and get S3 key
     */
    async uploadFile(filePath, purpose = 'processing') {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const stats = await fs.stat(filePath);
        const fileName = path.basename(filePath);
        
        // Get upload URL
        const uploadData = await this.request(`/${purpose}/upload-url`, {
            method: 'POST',
            body: JSON.stringify({
                fileName,
                fileSize: stats.size
            })
        });

        // Upload file
        const fileBuffer = await fs.readFile(filePath);
        const uploadResponse = await fetch(uploadData.uploadUrl, {
            method: 'PUT',
            body: fileBuffer,
            headers: {
                'Content-Type': 'application/pdf'
            }
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        return {
            key: uploadData.key,
            size: stats.size,
            fileName
        };
    }

    /**
     * Download file from presigned URL
     */
    async downloadFile(downloadUrl, outputPath = null) {
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
            throw new Error(`Download failed: ${response.statusText}`);
        }
        
        const buffer = await response.buffer();
        
        if (outputPath) {
            const fs = await import('fs/promises');
            await fs.writeFile(outputPath, buffer);
            return outputPath;
        }
        
        return buffer;
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await this.request('/health', { method: 'GET' });
            return {
                healthy: true,
                ...response
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message
            };
        }
    }
} 