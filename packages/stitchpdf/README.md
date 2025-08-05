# 📄 stitchPDF

**stitchPDF** is a powerful Node.js library and CLI tool for advanced PDF processing with **real optimization capabilities**. Unlike other solutions, stitchPDF delivers actual file size reduction through Ghostscript integration.

## 🚀 Key Features

- **🔥 REAL PDF Optimization** - 90%+ compression using Ghostscript
- **📊 Font Analysis & Deduplication** - Advanced font detection and optimization
- **📝 Text Extraction** - Coordinate-based text extraction with PDF.js
- **🔍 PDF Validation** - Security scanning and document validation
- **📄 Page Insertion** - Insert pages at specific positions
- **📧 Mail Merge** - Create personalized documents
- **🛡️ Security Scanning** - Detect JavaScript and malicious content

## ⚙️ Installation

```bash
npm install stitchpdf
```

For **real PDF optimization**, ensure Ghostscript is installed:

### macOS
```bash
brew install ghostscript
```

### Ubuntu/Debian
```bash
sudo apt-get install ghostscript
```

### Windows
```bash
# Using Chocolatey
choco install ghostscript
```

## 📚 CLI Usage

stitchPDF provides a comprehensive CLI interface:

### PDF Optimization (Premium Feature)

**Analyze optimization opportunities:**
```bash
# Basic analysis
stitchpdf optimize analyze document.pdf

# Save analysis report
stitchpdf optimize analyze document.pdf --output analysis.json
```

**Optimize PDF files:**
```bash
# Basic optimization with Ghostscript
stitchpdf premium optimize input.pdf --output optimized.pdf

# Advanced optimization options
stitchpdf premium optimize large-file.pdf \
  --output compressed.pdf \
  --compression high \
  --fonts true \
  --images true \
  --cleanup true
```

**Compression levels:**
- `--compression low` - 15% reduction, preserve quality
- `--compression medium` - 35% reduction, balanced (default)
- `--compression high` - 55% reduction, aggressive

### Font Analysis

```bash
# Analyze fonts in PDF
stitchpdf fonts analyze document.pdf

# Detailed font analysis with output
stitchpdf fonts analyze document.pdf --output fonts.json --details
```

### Text Extraction

```bash
# Extract all text
stitchpdf text extract document.pdf

# Extract with coordinates
stitchpdf text extract document.pdf --coordinates

# Save to file
stitchpdf text extract document.pdf --output extracted.txt
```

### PDF Validation

```bash
# Basic validation
stitchpdf validate document.pdf

# Security scan with options
stitchpdf validate document.pdf \
  --javascript \
  --forms \
  --metadata \
  --output security-report.json
```

### Page Operations

```bash
# Insert page at specific position
stitchpdf pages insert source.pdf \
  --page-to-insert insert.pdf \
  --position 5 \
  --output result.pdf
```

### Mail Merge

```bash
# Create mail merge template
stitchpdf merge create template.pdf data.json --output merged.pdf

# Process mail merge
stitchpdf merge process template.pdf recipients.csv --output-dir ./output
```

### License Management

```bash
# Check current license status
stitchpdf license status

# Activate 7-day demo license (unlocks all Pro features)
stitchpdf license demo
```

### Information Commands

```bash
# Show version
stitchpdf --version

# Show help for any command
stitchpdf optimize --help
stitchpdf premium --help
```

## 📦 NPM/JavaScript Usage

### ES Modules (Recommended)
```javascript
import { 
  optimizePdfWithGhostscript,
  analyzeFonts,
  extractText,
  validatePdf,
  insertAtPage,
  createMailMerge
} from 'stitchpdf';

// Real PDF optimization with Ghostscript
const result = await optimizePdfWithGhostscript('large-file.pdf', {
  outputPath: 'optimized.pdf',
  compressionLevel: 'medium',
  optimizeImages: true,
  optimizeFonts: true
});

console.log(`Saved ${result.savingsPercent}%!`); // e.g., "Saved 94.6%!"

// Font analysis
const fontAnalysis = await analyzeFonts('document.pdf');
console.log(`Found ${fontAnalysis.totalFonts} fonts`);

// Text extraction with coordinates
const text = await extractText('document.pdf', { includeCoordinates: true });

// PDF validation
const validation = await validatePdf('document.pdf');
console.log(`Valid: ${validation.isValid}`);
```

### CommonJS
```javascript
const { 
  optimizePdfWithGhostscript,
  analyzeFonts,
  extractText 
} = require('stitchpdf');

// Same usage as above
```

### All Available Exports
```javascript
import {
  // PDF Optimization (REAL results with Ghostscript)
  optimizePdfWithGhostscript,
  optimizePdf,
  analyzePdfOptimization,
  checkGhostscriptAvailability,
  estimateGhostscriptSavings,
  compareOptimizationMethods,
  
  // Font Analysis
  analyzeFonts,
  
  // Text Extraction
  extractText,
  extractTextWithCoordinates,
  
  // PDF Validation
  validatePdf,
  scanForJavaScript,
  
  // Page Operations
  insertAtPage,
  
  // Mail Merge
  createMailMerge,
  processMailMerge,
  
  // Licensing
  LicenseManager,
  
  // Constants
  VERSION,
  LIBRARY_NAME
} from 'stitchpdf';
```

## 🏆 Real Performance Results

Our Ghostscript integration delivers **actual optimization** unlike broken pdf-lib solutions:

| File | Original Size | Optimized Size | Savings | Tool |
|------|---------------|----------------|---------|------|
| BambooUAT Policy | 65.3 MB | 3.6 MB | **94.6%** | Ghostscript |
| NN_DO Policies | 723.0 MB | 79.1 MB | **89.1%** | Ghostscript |
| Sample Document | 2.0 GB | ~200 MB | **90%+** | Ghostscript |

**vs. pdf-lib**: 0.9% savings (BROKEN) 
**vs. stitchPDF**: 90%+ savings (WORKS!)

## 🛠️ API Examples

### PDF Optimization Analysis
```javascript
import { analyzePdfOptimization } from 'stitchpdf';

const analysis = await analyzePdfOptimization('document.pdf');
console.log(`Estimated savings: ${analysis.estimatedSavingsPercent}%`);
console.log(`Optimization score: ${analysis.optimizationScore}`);
```

### Font Analysis
```javascript
import { analyzeFonts } from 'stitchpdf';

const fonts = await analyzeFonts('document.pdf');
console.log(`Total fonts: ${fonts.totalFonts}`);
console.log(`Unique families: ${fonts.uniqueFamilies}`);
console.log(`Embedded fonts: ${fonts.embeddedFonts}`);
```

### Advanced Text Extraction
```javascript
import { extractTextWithCoordinates } from 'stitchpdf';

const result = await extractTextWithCoordinates('document.pdf');
result.pages.forEach((page, index) => {
  console.log(`Page ${index + 1}:`);
  page.textItems.forEach(item => {
    console.log(`  "${item.str}" at (${item.x}, ${item.y})`);
  });
});
```

## 🔧 Configuration

### Optimization Options
```javascript
const options = {
  outputPath: 'optimized.pdf',
  compressionLevel: 'medium', // 'low', 'medium', 'high'
  optimizeImages: true,
  optimizeFonts: true,
  removeMetadata: true
};

const result = await optimizePdfWithGhostscript('input.pdf', options);
```

### Analysis Options
```javascript
const fontOptions = {
  includeDetails: true,
  analyzeEmbedding: true,
  detectDuplicates: true
};

const fonts = await analyzeFonts('document.pdf', fontOptions);
```

## 🔒 Licensing & Features

stitchPDF uses a **freemium model** with three tiers:

### 📗 FREE Tier
- ✅ **Font Analysis** - Detect fonts and duplicates
- ✅ **Text Extraction** - Extract text with coordinates 
- ✅ **PDF Validation** - Security scanning and document validation
- ✅ **Basic Analysis** - Optimization opportunities assessment

### 📘 PRO Tier ($29/month)
- ✅ **All FREE features**
- 🚀 **PDF Optimization** - Real 90%+ compression with Ghostscript
- 📄 **Page Insertion** - Insert pages at specific positions
- 📧 **Mail Merge** - Create personalized documents
- 📊 **Font Deduplication** - Remove duplicate fonts
- 🛠️ **Advanced Processing** - High-performance operations

### 📕 ENTERPRISE Tier ($99/month)  
- ✅ **All PRO features**
- ⚡ **Bulk Processing** - Process multiple files simultaneously
- 🏢 **Team License** - Multiple user access
- 📞 **Priority Support** - Direct technical support
- 🔧 **Custom Integrations** - API customization

### Try Before You Buy
```bash
# Activate 7-day free trial of PRO features
stitchpdf license demo

# Check what features you have access to
stitchpdf license status
```

## ⚡ Performance Tips

1. **Use Ghostscript optimization** for files > 10MB
2. **Medium compression** balances size vs quality
3. **Font analysis** before optimization shows potential savings
4. **Validation** ensures PDF integrity after processing

## 🛡️ Security Features

```javascript
import { validatePdf, scanForJavaScript } from 'stitchpdf';

// Comprehensive security scan
const validation = await validatePdf('document.pdf', {
  checkJavaScript: true,
  checkForms: true,
  checkMetadata: true
});

// Specific JavaScript detection
const jsResult = await scanForJavaScript('document.pdf');
console.log(`JavaScript found: ${jsResult.hasJavaScript}`);
```

## 🚀 System Requirements

- **Node.js** 18+
- **Ghostscript** (for real optimization)
- **Memory**: 2GB+ for large PDF processing

## 📄 License

MIT License © 2025

## 🔗 Links

- [npm package](https://www.npmjs.com/package/stitchpdf)
- [GitHub repository](https://github.com/pallain9/stitchPDF)
- [Issue tracker](https://github.com/pallain9/stitchPDF/issues)

---

**stitchPDF**: Finally, PDF optimization that actually works! 🎉
