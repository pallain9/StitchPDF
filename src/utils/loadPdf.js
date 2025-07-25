import { PDFDocument } from 'pdf-lib';
import fs from 'fs-extra';

export async function loadPdf(path) {
  const bytes = await fs.readFile(path);
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}