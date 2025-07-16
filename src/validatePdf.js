const fs = require('fs-extra');
const { PDFDocument } = require('pdf-lib');

async function validatePdf(pdfPath) {
  const bytes = await fs.readFile(pdfPath);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = doc.getPageCount();
  const isEncrypted = doc.isEncrypted || false;
  return {
    isValid: pageCount > 0 && !isEncrypted,
    pageCount,
    isEncrypted
  };
}
module.exports = { validatePdf };