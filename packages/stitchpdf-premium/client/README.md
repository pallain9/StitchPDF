# 💎 stitchPDF Premium

**Advanced PDF processing capabilities** with enterprise-grade features. Built on the reliable stitchPDF foundation with premium functionality for commercial applications.

## 🚀 Premium Features

- **🔥 Real PDF Optimization** - 90%+ compression using Ghostscript
- **📧 Advanced Mail Merge** - Create personalized documents with data
- **⚡ Bulk Processing** - Process multiple files simultaneously  
- **📄 Advanced Page Operations** - Insert, merge, split with precision
- **🛡️ Enterprise Security** - Advanced validation and scanning
- **🏢 Commercial License** - Full commercial usage rights
- **📞 Priority Support** - Direct access to the development team

## ⚙️ Installation

```bash
npm install stitchpdf-premium
```

**Requires License Key** - Contact us for your premium license.

## 🎯 Quick Start

```javascript
import StitchPDFPremium from 'stitchpdf-premium';

// Initialize with your license key
const pdf = new StitchPDFPremium({
  apiKey: 'your-license-key-here'
});

// Real PDF optimization with 90%+ compression
const optimized = await pdf.optimize('large-file.pdf', {
  compressionLevel: 'high',
  quality: 'balanced'
});

console.log(`Saved ${optimized.savingsPercent}%!`); // e.g., "Saved 94.6%!"

// Advanced mail merge
const merged = await pdf.mailMerge('template.pdf', {
  data: [
    { name: 'John Doe', company: 'Acme Corp' },
    { name: 'Jane Smith', company: 'Tech Ltd' }
  ],
  outputDir: './output'
});

// Bulk processing
const results = await pdf.processBatch([
  'file1.pdf',
  'file2.pdf', 
  'file3.pdf'
], {
  operation: 'optimize',
  compressionLevel: 'medium'
});
```

## 📊 Real Performance Results

Premium optimization delivers actual results where other tools fail:

| File Type | Original Size | Optimized Size | Savings | Time |
|-----------|---------------|----------------|---------|------|
| Policy Documents | 65.3 MB | 3.6 MB | **94.6%** | 12s |
| Technical Manuals | 723.0 MB | 79.1 MB | **89.1%** | 45s |
| Bulk Reports | 2.0 GB | ~200 MB | **90%+** | 3m |

**vs. pdf-lib**: 0.9% savings (BROKEN)  
**vs. stitchPDF Premium**: 90%+ savings (WORKS!)

## 🛠️ API Reference

### PDF Optimization
```javascript
// Basic optimization
const result = await pdf.optimize('input.pdf');

// Advanced optimization with options
const result = await pdf.optimize('input.pdf', {
  compressionLevel: 'high',    // 'low', 'medium', 'high'
  optimizeImages: true,
  optimizeFonts: true,
  removeMetadata: true,
  quality: 'balanced',         // 'maximum', 'balanced', 'minimum'
  outputPath: 'optimized.pdf'
});
```

### Mail Merge
```javascript
// Single document mail merge
const result = await pdf.mailMerge('template.pdf', {
  data: { name: 'John', company: 'Acme' },
  outputPath: 'personalized.pdf'
});

// Batch mail merge
const results = await pdf.mailMergeBatch('template.pdf', {
  data: [
    { name: 'John', company: 'Acme' },
    { name: 'Jane', company: 'Tech' }
  ],
  outputDir: './merged-docs',
  fileNameTemplate: '{name}-{company}.pdf'
});
```

### Bulk Processing
```javascript
// Process multiple files
const results = await pdf.processBatch([
  'doc1.pdf',
  'doc2.pdf',
  'doc3.pdf'
], {
  operation: 'optimize',
  compressionLevel: 'medium',
  outputDir: './optimized',
  concurrent: 3  // Process 3 files simultaneously
});

// Batch with different operations
const results = await pdf.processBatch(files, {
  operations: [
    { file: 'doc1.pdf', operation: 'optimize' },
    { file: 'doc2.pdf', operation: 'mailMerge', data: {...} }
  ]
});
```

## 💰 Pricing & Licensing

**📞 Get Your Premium License**  
**Contact**: Peter Allain, Founder  
**Email**: pballain910@gmail.com  
**Subject**: "stitchPDF Premium License Request"

### Pricing Tiers:
- 💎 **Pro**: $29/month (1,000 operations)
  - All premium features
  - Email support
  - Perfect for individual developers

- 🏢 **Business**: $99/month (10,000 operations)  
  - All premium features
  - Priority email support
  - Team usage rights
  
- 🚀 **Enterprise**: $299/month (50,000 operations)
  - All premium features
  - Priority support
  - Custom integrations
  - Bulk processing optimized

**🎁 Free 7-day trial included with every license!**

### What You Get:
- ✅ **Immediate access** to all premium features
- ✅ **Commercial usage rights** for your applications
- ✅ **Direct founder support** - I personally help with setup
- ✅ **Regular updates** and new features
- ✅ **No hidden fees** - transparent pricing

## 🎯 Perfect For:

### Developers & Agencies
- **Document automation** in client applications
- **PDF optimization** for web applications  
- **Mail merge** for personalized documents
- **Bulk processing** for client projects

### Businesses
- **Invoice generation** with optimization
- **Report processing** and compression
- **Document workflows** and automation
- **Customer communications** (mail merge)

### Enterprises  
- **High-volume document processing**
- **Custom PDF workflows**
- **Integration with existing systems**
- **Reliable, scalable PDF operations**

## 🚀 Getting Started

1. **Email me**: pballain910@gmail.com with "stitchPDF Premium License Request"
2. **Tell me your use case**: What do you need to process and how much?
3. **Get your trial license**: I'll send a 7-day trial key within 2 hours
4. **Start building**: Full premium features available immediately
5. **Upgrade when ready**: Simple monthly billing via Stripe

## 🔧 System Requirements

- **Node.js** 18+
- **Ghostscript** (for optimization - installation help provided)
- **Memory**: 4GB+ recommended for bulk processing
- **License Key** (obtained from pballain910@gmail.com)

## 📞 Support

**Personal Founder Support**  
As the creator of stitchPDF, I personally support all premium customers:

- **Email**: pballain910@gmail.com
- **Response Time**: Under 2 hours (often much faster)
- **Setup Help**: I'll help you get up and running
- **Custom Solutions**: Need something specific? Let's discuss it

## 🔗 Links

- [Free stitchpdf package](https://www.npmjs.com/package/stitchpdf)
- [GitHub repository](https://github.com/pallain9/stitchPDF)
- [Issue tracker](https://github.com/pallain9/stitchPDF/issues)

---

**Ready to process PDFs like a pro?** Email pballain910@gmail.com to get started! 🚀