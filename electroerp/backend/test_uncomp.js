import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape', compress: false });
doc.pipe(fs.createWriteStream('test_uncompressed.pdf'));

const W = doc.page.width - 100; // usable width
const primaryColor = '#0F172A';
const accentColor = '#2563EB';
const greenColor = '#059669';
const redColor = '#DC2626';
const lightBg = '#F8FAFC';

const startY = 110;
const cardW = (W - 30) / 3;
const cardH = 100;
const drawSummaryCard = (x, y, title, main, sub1L, sub1V, sub2L, sub2V, color) => {
    doc.rect(x, y, cardW, cardH).fill(color || lightBg).stroke('#E2E8F0');
    doc.fontSize(7).fillColor(color ? '#FFFFFF' : '#64748B').font('Helvetica-Bold')
        .text(title, x + 10, y + 10, { width: cardW - 20 });
};

drawSummaryCard(50, startY, 'XYZ', '100', 'Taxable', '0', 'CGST/SGST', '0', null);

const tableStartY = startY + cardH + 20;

doc.rect(50, tableStartY, W, 20).fill(primaryColor);

let ty = tableStartY + 20;
const rowH = 16;
doc.rect(50, ty, W, rowH).fill('#FFFFFF').stroke('#E2E8F0');

doc.end();
console.log('Done');
