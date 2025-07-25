// stitchPDF TypeScript Definitions

export interface ExtractTextOptions {
  preserveLayout?: boolean;
  pageNumbers?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  unit?: 'pt' | 'in' | 'mm';
  page?: number;
}

export interface ExtractTextResult {
  rawText: string;
  logSummary: string;
}

export interface TextWithCoordinates {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface ValidationOptions {
  checkJavaScript?: boolean;
  checkForms?: boolean;
  checkEmbeddedFiles?: boolean;
  checkMetadata?: boolean;
  checkSuspiciousObjects?: boolean;
  checkEncryption?: boolean;
  checkUrls?: boolean;
  checkActions?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  fileSize: number;
  pageCount: number;
  issues?: string[];
  recommendations?: Array<{
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
  }>;
  securityChecks?: Record<string, any>;
}

export interface FontAnalysisResult {
  summary: {
    totalFonts: number;
    embeddedFonts: number;
    systemFonts: number;
    uniqueFamilies: number;
    totalCharacters: number;
  };
  fonts: Array<{
    name: string;
    family: string;
    style: string;
    embedded: boolean;
    pages?: Set<number>;
    totalCharacters?: number;
    textItems?: Array<{
      text: string;
      x: number;
      y: number;
    }>;
  }>;
  analysis: {
    fontFamilies: Record<string, any[]>;
    mostUsedFont?: {
      name: string;
      totalCharacters: number;
    };
  };
}

export interface OptimizationOptions {
  outputPath: string;
  deduplicateFonts?: boolean;
  compressImages?: boolean;
  removeUnusedObjects?: boolean;
  compressionLevel?: 'low' | 'medium' | 'high';
}

export interface OptimizationResult {
  success: boolean;
  savings?: number;
  savingsPercent?: number;
  tool?: string;
  version?: string;
  error?: string;
  upgradeUrl?: string;
}

export interface LicenseInfo {
  tier: 'free' | 'demo' | 'pro' | 'enterprise';
  email?: string;
  expires?: string;
  hardwareId?: string;
  availableFeatures: string[];
}

// Main API functions
export function extractText(
  pdfPath: string, 
  options?: ExtractTextOptions
): Promise<string>;

export function extractTextWithCoordinates(
  pdfPath: string, 
  options?: ExtractTextOptions
): Promise<TextWithCoordinates[]>;

export function validatePdf(
  pdfPath: string, 
  options?: ValidationOptions
): Promise<ValidationResult>;

export function analyzeFonts(pdfPath: string): Promise<FontAnalysisResult>;

export function analyzePdfOptimization(pdfPath: string): Promise<{
  fileSizeMB: number;
  pageCount: number;
  estimatedSavings: number;
  estimatedSavingsPercent: string;
  opportunities: Array<{
    priority: 'low' | 'medium' | 'high';
    description: string;
    estimatedSaving: number;
  }>;
}>;

// Premium functions (require license)
export function optimizePdf(
  pdfPath: string, 
  options: OptimizationOptions
): Promise<OptimizationResult>;

export function insertAtPage(
  targetPdf: string,
  insertPdf: string,
  pageNumbers: number[],
  options: { outputPath: string }
): Promise<void>;

export function insertConditional(
  targetPdf: string,
  insertPdf: string,
  conditions: {
    textContains?: string;
    textMatches?: string;
  },
  options: {
    outputPath: string;
    insertBefore?: boolean;
  }
): Promise<void>;

// Mail merge functions
export function createMailMerge(
  templatePath: string,
  options: {
    fieldMarkers?: string[];
    outputPath?: string;
  }
): Promise<{
  fields: Array<{
    name: string;
    page: number;
  }>;
}>;

export function processMailMerge(
  config: any,
  dataPath: string,
  options: {
    outputDirectory?: string;
    outputPrefix?: string;
    onProgress?: (progress: {
      percentage: number;
      processed: number;
      total: number;
    }) => void;
  }
): Promise<string[]>;

// License management
export class LicenseManager {
  getLicenseInfo(): LicenseInfo;
  installLicense(key: string): Promise<{
    success: boolean;
    message?: string;
    license?: {
      tier: string;
      email: string;
    };
  }>;
  removeLicense(): Promise<boolean>;
  activateDemo(): boolean;
}

// Utility functions
export function inToPt(inches: number): number;
export function mmToPt(mm: number): number;
export function loadPdf(path: string): Promise<any>;

// Re-exports for convenience
export { scanForJavaScript } from './validation/security.js'; 