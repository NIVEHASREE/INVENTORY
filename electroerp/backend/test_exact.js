import PDFDocument from 'pdfkit';
import fs from 'fs';

const fmt = (n) => Number((n || 0).toFixed(2));
const fmtRs = (n) => `Rs ${Number((n || 0).toFixed(2)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape', compress: false });
doc.pipe(fs.createWriteStream('test_exact.pdf'));

const fileBase = "GST_Protocol_Feb_2026";
const periodLabel = "February 2026";
let inputTaxable = 4238900, inputCGST = 113967, inputSGST = 113967, inputIGST = 0, inputGST = 227934;
let outputTaxable = 908720, outputCGST = 0, outputSGST = 0, outputIGST = 49782.8, outputGST = 49782.8;
let netBalance = 178151.2;

const rows = [
    { Date: '22 Feb 2026', Protocol: 'PURCHASE', 'Reference ID': 'PUR-202602-0002', Counterparty: 'Apex Electrics Corp', 'Taxable Value': 63000, CGST: 3780, SGST: 3780, IGST: 0, 'Total GST': 7560 }
];


const W = doc.page.width - 100; // usable width
const primaryColor = '#0F172A';
const accentColor = '#2563EB';
const greenColor = '#059669';
const redColor = '#DC2626';
const lightBg = '#F8FAFC';

// ─ Header banner
doc.rect(50, 30, W, 60).fill(primaryColor);
doc.fontSize(20).fillColor('#FFFFFF').font('Helvetica-Bold')
    .text('GST PROTOCOL REPORT', 50, 45, { width: W - 160, align: 'center' });
doc.fontSize(9).fillColor('#94A3B8').font('Helvetica')
    .text('Senthil Murugan Electricals', 50, 72, { width: W - 160, align: 'center' });
doc.rect(W - 60, 30, 110, 60).fill(accentColor);
doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold')
    .text(periodLabel, W - 60, 50, { width: 110, align: 'center' });
doc.fontSize(7).fillColor('#BFDBFE').font('Helvetica')
    .text('Report Period', W - 60, 63, { width: 110, align: 'center' });

const startY = 110;

// ─ Summary Cards (3 columns)
const cardW = (W - 30) / 3;
const cardH = 100;
const drawSummaryCard = (x, y, title, main, sub1L, sub1V, sub2L, sub2V, color) => {
    doc.rect(x, y, cardW, cardH).fill(color || lightBg).stroke('#E2E8F0');
    doc.fontSize(7).fillColor(color ? '#FFFFFF' : '#64748B').font('Helvetica-Bold')
        .text(title, x + 10, y + 10, { width: cardW - 20 });
    doc.fontSize(16).fillColor(color ? '#FFFFFF' : primaryColor).font('Helvetica-Bold')
        .text(main, x + 10, y + 24, { width: cardW - 20 });
    doc.fontSize(7).fillColor(color ? '#BFDBFE' : '#94A3B8').font('Helvetica')
        .text(`${sub1L}: ${sub1V}`, x + 10, y + 62);
    doc.fontSize(7).fillColor(color ? '#BFDBFE' : '#94A3B8').font('Helvetica')
        .text(`${sub2L}: ${sub2V}`, x + 10, y + 76);
};

drawSummaryCard(50, startY, 'INPUT TAX CREDIT', fmtRs(inputGST), 'Taxable', fmtRs(inputTaxable), 'CGST/SGST', fmtRs(inputCGST), null);
drawSummaryCard(50 + cardW + 15, startY, 'OUTPUT GST LIABILITY', fmtRs(outputGST), 'Taxable', fmtRs(outputTaxable), 'IGST', fmtRs(outputIGST), null);
drawSummaryCard(50 + (cardW + 15) * 2, startY, 'NET GST POSITION', fmtRs(Math.abs(netBalance)),
    'Status', netBalance >= 0 ? 'SURPLUS ITC' : 'NET PAYABLE',
    'Direction', netBalance >= 0 ? 'Credit to business' : 'Payable to govt.',
    netBalance >= 0 ? greenColor : redColor);

const tableStartY = startY + cardH + 20;

// ─ Table header
const cols2 = [
    { label: 'Date', w: 65 },
    { label: 'Protocol', w: 60 },
    { label: 'Reference ID', w: 100 },
    { label: 'Counterparty', w: 140 },
    { label: 'Taxable Value', w: 80 },
    { label: 'CGST', w: 65 },
    { label: 'SGST', w: 65 },
    { label: 'IGST', w: 55 },
    { label: 'Total GST', w: 80 },
];
// Adjust widths proportionally to fill W
const totalColW = cols2.reduce((s, c) => s + c.w, 0);
cols2.forEach(c => { c.w = (c.w / totalColW) * W; });

doc.rect(50, tableStartY, W, 20).fill(primaryColor);
let cx = 50;
cols2.forEach(c => {
    doc.fontSize(7).fillColor('#FFFFFF').font('Helvetica-Bold')
        .text(c.label, cx + 4, tableStartY + 6, { width: c.w - 8, align: 'center' });
    cx += c.w;
});

// ─ Table rows
let ty = tableStartY + 20;
const rowH = 16;
const pageBottom = doc.page.height - 60;

rows.forEach((r, idx) => {
    if (ty + rowH > pageBottom) {
        doc.addPage({ margin: 50, size: 'A4', layout: 'landscape' });
        ty = 50;
        // Reprint header
        doc.rect(50, ty, W, 20).fill(primaryColor);
        let hx = 50;
        cols2.forEach(c => {
            doc.fontSize(7).fillColor('#FFFFFF').font('Helvetica-Bold')
                .text(c.label, hx + 4, ty + 6, { width: c.w - 8, align: 'center' });
            hx += c.w;
        });
        ty += 20;
    }

    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    doc.rect(50, ty, W, rowH).fill(rowBg).stroke('#E2E8F0');

    const vals = [r.Date, r.Protocol, r['Reference ID'], r.Counterparty,
    r['Taxable Value'].toFixed(2), r.CGST.toFixed(2), r.SGST.toFixed(2),
    r.IGST.toFixed(2), r['Total GST'].toFixed(2)];
    let rx = 50;
    vals.forEach((v, vi) => {
        const isAmount = vi >= 4;
        const isProtocol = vi === 1;
        const color = isProtocol ? (v === 'PURCHASE' ? accentColor : greenColor) : primaryColor;
        doc.fontSize(7).fillColor(color).font(isAmount || isProtocol ? 'Helvetica-Bold' : 'Helvetica')
            .text(String(v), rx + 4, ty + 4, { width: cols2[vi].w - 8, align: isAmount ? 'right' : 'left', ellipsis: true });
        rx += cols2[vi].w;
    });
    ty += rowH;
});

// ─ Totals row
if (ty + rowH > pageBottom) {
    doc.addPage({ margin: 50, size: 'A4', layout: 'landscape' });
    ty = 50;
}
doc.rect(50, ty, W, rowH + 2).fill(primaryColor);

let tx2 = 50;
let pdfTotals = { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
rows.forEach(r => { pdfTotals.taxable += r['Taxable Value']; pdfTotals.cgst += r['CGST']; pdfTotals.sgst += r['SGST']; pdfTotals.igst += r['IGST']; pdfTotals.total += r['Total GST']; });
const pdfTotalVals = ['', 'TOTAL', '', '', pdfTotals.taxable.toFixed(2), pdfTotals.cgst.toFixed(2), pdfTotals.sgst.toFixed(2), pdfTotals.igst.toFixed(2), pdfTotals.total.toFixed(2)];
pdfTotalVals.forEach((v, vi) => {
    doc.fontSize(7).fillColor('#FFFFFF').font('Helvetica-Bold')
        .text(String(v), tx2 + 4, ty + 5, { width: cols2[vi].w - 8, align: vi >= 4 ? 'right' : 'center' });
    tx2 += cols2[vi].w;
});

// Footer
doc.fontSize(6).fillColor('#94A3B8').font('Helvetica')
    .text(`Generated by Senthil Murugan Electricals ERP`,
        50, doc.page.height - 35, { width: W, align: 'center' });

doc.end();

