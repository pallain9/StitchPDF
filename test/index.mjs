// index.mjs or index.js with "type": "module"
import fs from 'fs';
import path from 'path';
import pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

const { getDocument } = pdfjs;

const extractTextFromPDF = async (filePath) => {
    const data = new Uint8Array(await fs.promises.readFile(filePath));
    const loadingTask = getDocument({ data });
    const pdf = await loadingTask.promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();

        console.log(`\n🔹 Page ${pageNum}:`);
        for (const item of content.items) {
            console.log(`"${item.str}" at x=${item.transform[4]}, y=${item.transform[5]}`);
        }
    }
};

const inputPDF = path.resolve('../Entering Time.pdf');
extractTextFromPDF(inputPDF);
