# stitchPDF Integration Examples

## ES Modules (Node.js 18+)

### Simple Usage
```javascript
import { extractText, validatePdf, analyzeFonts } from 'stitchpdf';

// Extract text from PDF
const text = await extractText('./document.pdf');
console.log(text);

// Validate PDF security
const validation = await validatePdf('./document.pdf');
console.log(`Risk Level: ${validation.riskLevel}`);

// Analyze fonts
const fonts = await analyzeFonts('./document.pdf');
console.log(`Found ${fonts.summary.totalFonts} fonts`);
```

### TypeScript Project
```typescript
import { 
  extractText, 
  validatePdf, 
  FontAnalysisResult,
  ValidationOptions 
} from 'stitchpdf';

async function processPdf(path: string): Promise<void> {
  // TypeScript provides full intellisense and type checking
  const options: ValidationOptions = {
    checkJavaScript: true,
    checkForms: true,
    checkEmbeddedFiles: true
  };

  const validation = await validatePdf(path, options);
  
  // Type-safe access to properties
  if (validation.riskLevel === 'HIGH') {
    console.warn('High risk PDF detected!');
  }

  const fonts: FontAnalysisResult = await analyzeFonts(path);
  console.log(`Embedded fonts: ${fonts.summary.embeddedFonts}`);
}
```

## Webpack/Bundler Projects

### React/Vue/Angular
```javascript
// Works seamlessly with modern bundlers
import { extractText, LicenseManager } from 'stitchpdf';

export class PdfProcessor {
  constructor() {
    this.license = new LicenseManager();
  }

  async processFile(file) {
    try {
      const text = await extractText(file.path);
      return { success: true, text };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

## Next.js API Routes

### API Route Example
```javascript
// pages/api/pdf/analyze.js or app/api/pdf/analyze/route.js
import { validatePdf, analyzeFonts } from 'stitchpdf';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf');
    
    // Save file temporarily
    const tempPath = `/tmp/${file.name}`;
    await writeFile(tempPath, Buffer.from(await file.arrayBuffer()));
    
    // Process with stitchPDF
    const [validation, fonts] = await Promise.all([
      validatePdf(tempPath),
      analyzeFonts(tempPath)
    ]);
    
    return Response.json({
      validation,
      fonts: fonts.summary
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## Express.js Server

### Middleware Integration
```javascript
import express from 'express';
import multer from 'multer';
import { validatePdf, optimizePdf } from 'stitchpdf';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/api/pdf/validate', upload.single('pdf'), async (req, res) => {
  try {
    const result = await validatePdf(req.file.path);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pdf/optimize', upload.single('pdf'), async (req, res) => {
  try {
    const outputPath = `optimized_${req.file.filename}.pdf`;
    const result = await optimizePdf(req.file.path, { outputPath });
    
    if (result.success) {
      res.download(outputPath);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Electron App

### Main Process
```javascript
// main.js
import { app, ipcMain } from 'electron';
import { validatePdf, extractText } from 'stitchpdf';

ipcMain.handle('pdf:validate', async (event, filePath) => {
  return await validatePdf(filePath);
});

ipcMain.handle('pdf:extract-text', async (event, filePath) => {
  return await extractText(filePath);
});
```

### Renderer Process
```javascript
// renderer.js
const { ipcRenderer } = require('electron');

async function processPdf(filePath) {
  const validation = await ipcRenderer.invoke('pdf:validate', filePath);
  const text = await ipcRenderer.invoke('pdf:extract-text', filePath);
  
  return { validation, text };
}
```

## Vite Projects

### Vite Configuration
```javascript
// vite.config.js
export default {
  optimizeDeps: {
    include: ['stitchpdf']
  },
  build: {
    rollupOptions: {
      external: ['canvas'] // Canvas is optional for some features
    }
  }
};
```

### Usage in Vite Project
```javascript
import { analyzeFonts, validatePdf } from 'stitchpdf';

// Works out of the box with Vite's ES module support
export async function analyzePdfFile(file) {
  const fonts = await analyzeFonts(file.path);
  const security = await validatePdf(file.path);
  
  return {
    fontCount: fonts.summary.totalFonts,
    riskLevel: security.riskLevel
  };
}
```

## Package.json Dependencies

### For Node.js Projects
```json
{
  "dependencies": {
    "stitchpdf": "^1.0.0"
  },
  "type": "module"
}
```

### For TypeScript Projects
```json
{
  "dependencies": {
    "stitchpdf": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Benefits of the New Structure

1. **Clean Imports**: No more `.mjs` extensions to remember
2. **TypeScript Support**: Full type definitions and intellisense
3. **Bundler Friendly**: Works with Webpack, Vite, Rollup, etc.
4. **IDE Support**: Better autocomplete and error detection
5. **Standard Compliance**: Follows Node.js ES module conventions

## Migration from .mjs

If you were using the old `.mjs` structure:

```javascript
// Old way
import { extractText } from 'stitchpdf/src/text/extractor.mjs';

// New way - much cleaner!
import { extractText } from 'stitchpdf';
```

The new structure provides a single, clean entry point with proper TypeScript support for all modern JavaScript environments. 