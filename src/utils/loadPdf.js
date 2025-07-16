const { PDFDocument } = require('pdf-lib');
const fs = require('fs-extra');
async function loadPdf(path) {
  const bytes = await fs.readFile(path);
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}
module.exports = { loadPdf };