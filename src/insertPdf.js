import fs from 'fs-extra';
import { PDFDocument } from 'pdf-lib';

export async function insertPdf({ base, insert, output, page = null, every = null }) {
  const baseBytes = await fs.readFile(base);
  const insertBytes = await fs.readFile(insert);
  const baseDoc = await PDFDocument.load(baseBytes);
  const insertDoc = await PDFDocument.load(insertBytes);
  const pages = await baseDoc.copyPages(insertDoc, insertDoc.getPageIndices());
  if (page !== null) {
    pages.forEach(p => baseDoc.insertPage(page, p));
  } else if (every !== null) {
    for (let i = every; i < baseDoc.getPageCount(); i += every + pages.length) {
      pages.forEach((p, idx) => baseDoc.insertPage(i + idx, p));
    }
  }
  const pdfBytes = await baseDoc.save();
  await fs.writeFile(output, pdfBytes);
}