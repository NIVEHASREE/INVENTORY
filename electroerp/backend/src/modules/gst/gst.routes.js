import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import GSTLedger from '../../models/GSTLedger.model.js';
import ExcelJS from 'exceljs';
import { Parser as CsvParser } from 'json2csv';
import PDFDocument from 'pdfkit';

const router = express.Router();
router.use(authenticate);

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt = (n) => Number((n || 0).toFixed(2));
const fmtRs = (n) => `₹${Number((n || 0).toFixed(2)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtPdfRs = (n) => `Rs. ${Number((n || 0).toFixed(2)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// GST Ledger (paginated)
router.get('/ledger', asyncHandler(async (req, res) => {
    const { type, month, year, page = 1, limit = 30 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
        GSTLedger.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit)).lean(),
        GSTLedger.countDocuments(query),
    ]);
    res.status(200).json(new ApiResponse(200, entries, 'GST Ledger', { total, page: parseInt(page) }));
}));

// Monthly GST Summary
router.get('/summary', asyncHandler(async (req, res) => {
    const { month, year } = req.query;
    const matchQuery = {};
    if (month) matchQuery.month = parseInt(month);
    if (year) matchQuery.year = parseInt(year);

    const summary = await GSTLedger.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$type',
                totalTaxable: { $sum: '$taxableAmount' },
                totalCGST: { $sum: '$cgst' },
                totalSGST: { $sum: '$sgst' },
                totalIGST: { $sum: '$igst' },
                totalGST: { $sum: '$totalGST' },
                count: { $sum: 1 },
            },
        },
    ]);

    const gstInput = summary.find(s => s._id === 'INPUT') || {};
    const gstOutput = summary.find(s => s._id === 'OUTPUT') || {};
    const netPayable = (gstOutput.totalGST || 0) - (gstInput.totalGST || 0);

    res.status(200).json(new ApiResponse(200, {
        input: gstInput,
        output: gstOutput,
        netPayable: parseFloat(netPayable.toFixed(2)),
        month: parseInt(month),
        year: parseInt(year),
    }, 'GST Summary'));
}));

// ─────────────────────────────────────────────────────────
// GST EXPORT  GET /gst/export?month=2&year=2026&format=xlsx
// ─────────────────────────────────────────────────────────
router.get('/export', asyncHandler(async (req, res) => {
    const { month, year, format = 'xlsx' } = req.query;
    const m = parseInt(month);
    const y = parseInt(year);

    if (!m || !y) return res.status(400).json({ success: false, message: 'month and year are required' });
    if (!['xlsx', 'csv', 'pdf'].includes(format)) return res.status(400).json({ success: false, message: 'Invalid format. Use xlsx, csv, or pdf.' });

    // Fetch all ledger entries for the period
    const entries = await GSTLedger.find({ month: m, year: y }).sort({ date: -1 }).lean();

    // Build summary
    let inputTaxable = 0, inputCGST = 0, inputSGST = 0, inputIGST = 0, inputGST = 0;
    let outputTaxable = 0, outputCGST = 0, outputSGST = 0, outputIGST = 0, outputGST = 0;
    for (const e of entries) {
        if (e.type === 'INPUT') {
            inputTaxable += e.taxableAmount || 0;
            inputCGST += e.cgst || 0;
            inputSGST += e.sgst || 0;
            inputIGST += e.igst || 0;
            inputGST += e.totalGST || 0;
        } else {
            outputTaxable += e.taxableAmount || 0;
            outputCGST += e.cgst || 0;
            outputSGST += e.sgst || 0;
            outputIGST += e.igst || 0;
            outputGST += e.totalGST || 0;
        }
    }
    const netBalance = inputGST - outputGST;
    const periodLabel = `${MONTH_NAMES[m - 1]} ${y}`;
    const fileBase = `GST_Protocol_${SHORT_MONTHS[m - 1]}_${y}`;

    // Ledger rows
    const rows = entries.map(e => ({
        Date: new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        Protocol: e.type === 'INPUT' ? 'PURCHASE' : 'SALE',
        'Reference ID': e.referenceNo || '',
        Counterparty: e.party?.name || 'CASH',
        'Taxable Value': fmt(e.taxableAmount),
        CGST: fmt(e.cgst),
        SGST: fmt(e.sgst),
        IGST: fmt(e.igst),
        'Total GST': fmt(e.totalGST),
    }));

    // ── EXCEL ─────────────────────────────────────────────
    if (format === 'xlsx') {
        const wb = new ExcelJS.Workbook();
        wb.creator = 'Senthil Murugan Electricals ERP';
        wb.created = new Date();

        // Sheet 1 – Summary
        const ws1 = wb.addWorksheet('GST Summary');
        ws1.columns = [{ width: 30 }, { width: 40 }];

        const headerStyle = { font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }, alignment: { horizontal: 'center' } };
        const subHeaderStyle = { font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } } };
        const labelStyle = { font: { bold: true, size: 10, color: { argb: 'FF475569' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } } };
        const valueStyle = { font: { size: 10, color: { argb: 'FF0F172A' } } };
        const greenValueStyle = { font: { bold: true, size: 11, color: { argb: 'FF059669' } } };
        const redValueStyle = { font: { bold: true, size: 11, color: { argb: 'FFDC2626' } } };

        const addRow = (label, value, lStyle, vStyle) => {
            const row = ws1.addRow([label, value]);
            row.getCell(1).style = lStyle || labelStyle;
            row.getCell(2).style = vStyle || valueStyle;
            row.height = 22;
        };

        // Title block
        const titleRow = ws1.addRow(['GST PROTOCOL REPORT', '']);
        ws1.mergeCells(`A${titleRow.number}:B${titleRow.number}`);
        titleRow.getCell(1).style = { ...headerStyle, alignment: { horizontal: 'center', vertical: 'middle' } };
        titleRow.height = 36;

        ws1.addRow([]);
        addRow('Business Name', 'Senthil Murugan Electricals', labelStyle);
        addRow('Report Period', periodLabel, labelStyle);
        addRow('Generated On', new Date().toLocaleDateString('en-IN'), labelStyle);
        ws1.addRow([]);

        // Input section
        const inRow = ws1.addRow(['INPUT TAX CREDIT', '']);
        ws1.mergeCells(`A${inRow.number}:B${inRow.number}`);
        inRow.getCell(1).style = subHeaderStyle;
        inRow.height = 24;

        addRow('Taxable Value', fmtRs(inputTaxable));
        addRow('CGST', fmtRs(inputCGST));
        addRow('SGST', fmtRs(inputSGST));
        addRow('IGST', fmtRs(inputIGST));
        addRow('Total Input Tax Credit', fmtRs(inputGST), labelStyle, greenValueStyle);
        ws1.addRow([]);

        // Output section
        const outRow = ws1.addRow(['OUTPUT GST LIABILITY', '']);
        ws1.mergeCells(`A${outRow.number}:B${outRow.number}`);
        outRow.getCell(1).style = { ...subHeaderStyle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } } };
        outRow.height = 24;

        addRow('Taxable Value', fmtRs(outputTaxable));
        addRow('CGST', fmtRs(outputCGST));
        addRow('SGST', fmtRs(outputSGST));
        addRow('IGST', fmtRs(outputIGST));
        addRow('Total Output Liability', fmtRs(outputGST), labelStyle, redValueStyle);
        ws1.addRow([]);

        // Net balance
        const netRow = ws1.addRow(['NET GST POSITION', '']);
        ws1.mergeCells(`A${netRow.number}:B${netRow.number}`);
        netRow.getCell(1).style = { ...subHeaderStyle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: netBalance >= 0 ? 'FF059669' : 'FFDC2626' } } };
        netRow.height = 24;

        const netBalRow = ws1.addRow(['Net Balance (ITC – Output)', fmtRs(Math.abs(netBalance))]);
        netBalRow.getCell(1).style = labelStyle;
        netBalRow.getCell(2).style = netBalance >= 0 ? greenValueStyle : redValueStyle;
        netBalRow.height = 24;
        const statusRow = ws1.addRow(['Status', netBalance >= 0 ? 'SURPLUS INPUT CREDIT' : 'NET PAYABLE TO GOVERNMENT']);
        statusRow.getCell(1).style = labelStyle;
        statusRow.getCell(2).style = netBalance >= 0 ? greenValueStyle : redValueStyle;
        statusRow.height = 22;

        // Sheet 2 – Transaction Ledger
        const ws2 = wb.addWorksheet('Transaction Ledger');
        const cols = ['Date', 'Protocol', 'Reference ID', 'Counterparty', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total GST'];
        ws2.columns = [
            { key: 'Date', width: 15 },
            { key: 'Protocol', width: 14 },
            { key: 'Reference ID', width: 22 },
            { key: 'Counterparty', width: 30 },
            { key: 'Taxable Value', width: 18 },
            { key: 'CGST', width: 14 },
            { key: 'SGST', width: 14 },
            { key: 'IGST', width: 14 },
            { key: 'Total GST', width: 16 },
        ];

        // Header row
        const ledgerHeaderRow = ws2.addRow(cols);
        ledgerHeaderRow.eachCell(cell => {
            cell.style = {
                font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: { bottom: { style: 'thin', color: { argb: 'FF2563EB' } } },
            };
        });
        ledgerHeaderRow.height = 24;

        // Data rows
        rows.forEach((r, idx) => {
            const row = ws2.addRow(Object.values(r));
            const isPurchase = r.Protocol === 'PURCHASE';
            row.eachCell((cell, colNum) => {
                cell.style = {
                    font: { size: 9.5, color: { argb: colNum === 2 ? (isPurchase ? 'FF2563EB' : 'FF059669') : 'FF0F172A' }, bold: colNum >= 5 },
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' } },
                    alignment: { horizontal: colNum >= 5 ? 'right' : 'left' },
                };
            });
            row.height = 20;
        });

        // Totals row
        const numericFields = rows.reduce((acc, r) => {
            acc['Taxable Value'] = (acc['Taxable Value'] || 0) + r['Taxable Value'];
            acc['CGST'] = (acc['CGST'] || 0) + r['CGST'];
            acc['SGST'] = (acc['SGST'] || 0) + r['SGST'];
            acc['IGST'] = (acc['IGST'] || 0) + r['IGST'];
            acc['Total GST'] = (acc['Total GST'] || 0) + r['Total GST'];
            return acc;
        }, {});
        const totalsRow = ws2.addRow(['', 'TOTAL', '', '', fmt(numericFields['Taxable Value']), fmt(numericFields['CGST']), fmt(numericFields['SGST']), fmt(numericFields['IGST']), fmt(numericFields['Total GST'])]);
        totalsRow.eachCell(cell => {
            cell.style = {
                font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } },
                alignment: { horizontal: cell.col >= 5 ? 'right' : 'center' },
            };
        });
        totalsRow.height = 22;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.xlsx"`);
        await wb.xlsx.write(res);
        res.end();
        return;
    }

    // ── CSV ───────────────────────────────────────────────
    if (format === 'csv') {
        const parser = new CsvParser({ fields: Object.keys(rows[0] || { Date: '', Protocol: '', 'Reference ID': '', Counterparty: '', 'Taxable Value': 0, CGST: 0, SGST: 0, IGST: 0, 'Total GST': 0 }) });
        const csv = parser.parse(rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.csv"`);
        res.send(csv);
        return;
    }

    // ── PDF ───────────────────────────────────────────────
    if (format === 'pdf') {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.pdf"`);
            doc.pipe(res);

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

            drawSummaryCard(50, startY, 'INPUT TAX CREDIT', fmtPdfRs(inputGST), 'Taxable', fmtPdfRs(inputTaxable), 'CGST/SGST', fmtPdfRs(inputCGST), null);
            drawSummaryCard(50 + cardW + 15, startY, 'OUTPUT GST LIABILITY', fmtPdfRs(outputGST), 'Taxable', fmtPdfRs(outputTaxable), 'IGST', fmtPdfRs(outputIGST), null);
            drawSummaryCard(50 + (cardW + 15) * 2, startY, 'NET GST POSITION', fmtPdfRs(Math.abs(netBalance)),
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
            // Rebuild numericFields for totals in PDF
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
                .text(`Generated by Senthil Murugan Electricals ERP · ${new Date().toLocaleString('en-IN')} · Period: ${periodLabel}`,
                    50, doc.page.height - 35, { width: W, align: 'center' });

            doc.end();
            return;
        } catch (err) {
            console.error('PDF GEN ERROR:', err);
            if (!res.headersSent) res.status(500).json({ error: err.message });
            return;
        }

    }
}));

export default router;
