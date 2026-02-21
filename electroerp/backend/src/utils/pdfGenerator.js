import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Readable } from 'stream';

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toFixed(2)}`;

export const generateInvoicePDF = async (bill) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const buffers = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const shop = {
                name: process.env.SHOP_NAME || 'ElectroMart',
                address: process.env.SHOP_ADDRESS || '123 Main Street',
                phone: process.env.SHOP_PHONE || '+91-9876543210',
                email: process.env.SHOP_EMAIL || 'info@electromart.com',
                gstin: process.env.SHOP_GSTIN || '27AAAAA0000A1Z5',
                state: process.env.SHOP_STATE || 'Maharashtra',
                stateCode: process.env.SHOP_STATE_CODE || '27',
            };

            // ─── Header ────────────────────────────────────────────────────────────
            doc.rect(0, 0, doc.page.width, 110).fill('#1e40af');
            doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text(shop.name, 40, 20);
            doc.fontSize(9).font('Helvetica').text(shop.address, 40, 48);
            doc.text(`Phone: ${shop.phone}  |  Email: ${shop.email}`, 40, 60);
            doc.text(`GSTIN: ${shop.gstin}  |  State: ${shop.state} (${shop.stateCode})`, 40, 72);

            // TAX INVOICE title
            doc.fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', 380, 30);
            doc.fontSize(9).font('Helvetica').fillColor('white').opacity(0.8).text(`Bill No: ${bill.billNumber}`, 380, 52);
            doc.text(`Date: ${new Date(bill.billDate).toLocaleDateString('en-IN')}`, 380, 64);
            doc.opacity(1);

            // ─── Customer Info ─────────────────────────────────────────────────────
            doc.fillColor('#111827').rect(40, 120, 330, 80).stroke('#e5e7eb');
            doc.rect(390, 120, 175, 80).stroke('#e5e7eb');
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151').text('BILL TO:', 50, 128);
            doc.font('Helvetica').fillColor('#111827');
            doc.text(bill.customer?.name || 'Walk-in Customer', 50, 142);
            if (bill.customer?.phone) doc.text(`Phone: ${bill.customer.phone}`, 50, 154);
            if (bill.customer?.gstin) doc.text(`GSTIN: ${bill.customer.gstin}`, 50, 166);
            if (bill.customer?.address) doc.text(bill.customer.address, 50, 178, { width: 310 });

            doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151').text('PAYMENT:', 400, 128);
            doc.font('Helvetica').fillColor('#111827');
            doc.text(`Mode: ${(bill.paymentMode || 'cash').toUpperCase()}`, 400, 142);
            doc.text(`Status: ${(bill.paymentStatus || 'paid').toUpperCase()}`, 400, 154);
            if (bill.amountDue > 0) doc.text(`Due: ${formatCurrency(bill.amountDue)}`, 400, 166);

            // ─── Items Table ───────────────────────────────────────────────────────
            const tableTop = 215;
            const colWidths = [25, 150, 40, 40, 50, 40, 50, 55, 65];
            const cols = [40, 65, 215, 255, 295, 345, 385, 435, 490];
            const headers = ['#', 'Product', 'HSN', 'Qty', 'Rate', 'GST%', 'Disc%', 'Taxable', 'Amount'];

            // Table header
            doc.rect(40, tableTop, 525, 20).fill('#1e40af');
            doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
            headers.forEach((h, i) => doc.text(h, cols[i], tableTop + 6, { width: colWidths[i], align: i > 2 ? 'right' : 'left' }));

            // Table rows
            let y = tableTop + 20;
            doc.fillColor('#111827').font('Helvetica').fontSize(8);
            bill.items.forEach((item, idx) => {
                const rowBg = idx % 2 === 0 ? '#f9fafb' : 'white';
                doc.rect(40, y, 525, 18).fill(rowBg);
                doc.fillColor('#111827');
                doc.text(idx + 1, cols[0], y + 5, { width: colWidths[0] });
                doc.text(item.productName || '', cols[1], y + 5, { width: 148, lineBreak: false });
                doc.text(item.hsnCode || '-', cols[2], y + 5, { width: colWidths[2], align: 'right' });
                doc.text(item.quantity, cols[3], y + 5, { width: colWidths[3], align: 'right' });
                doc.text(formatCurrency(item.sellingPrice), cols[4], y + 5, { width: colWidths[4], align: 'right' });
                doc.text(`${item.gstRate}%`, cols[5], y + 5, { width: colWidths[5], align: 'right' });
                doc.text(`${item.discount || 0}%`, cols[6], y + 5, { width: colWidths[6], align: 'right' });
                doc.text(formatCurrency(item.taxableAmount), cols[7], y + 5, { width: colWidths[7], align: 'right' });
                doc.text(formatCurrency(item.totalAmount), cols[8], y + 5, { width: colWidths[8], align: 'right' });
                y += 18;
            });

            // ─── GST Summary ──────────────────────────────────────────────────────
            y += 10;
            const summaryX = 350;
            doc.rect(40, y, 200, 18).fill('#f0fdf4').stroke('#bbf7d0');
            doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text(`Total Items: ${bill.items.length}`, 50, y + 5);

            const rows = [
                ['Subtotal:', formatCurrency(bill.subtotal)],
                ['Total Discount:', `-${formatCurrency(bill.totalDiscount)}`],
                ['Taxable Amount:', formatCurrency(bill.totalTaxable)],
                bill.isInterstate
                    ? ['IGST:', formatCurrency(bill.igst)]
                    : ['CGST:', formatCurrency(bill.cgst)],
                ...(!bill.isInterstate ? [['SGST:', formatCurrency(bill.sgst)]] : []),
                ['Total GST:', formatCurrency(bill.totalGST)],
                ['Round Off:', formatCurrency(bill.roundOff)],
            ];

            doc.font('Helvetica').fillColor('#374151');
            rows.forEach(([label, value]) => {
                doc.text(label, summaryX, y + 5, { width: 120 });
                doc.text(value, summaryX + 125, y + 5, { width: 60, align: 'right' });
                y += 16;
            });

            y += 4;
            doc.rect(summaryX - 5, y, 185, 24).fill('#1e40af');
            doc.fillColor('white').fontSize(11).font('Helvetica-Bold');
            doc.text('GRAND TOTAL:', summaryX, y + 7, { width: 120 });
            doc.text(formatCurrency(bill.grandTotal), summaryX + 125, y + 7, { width: 60, align: 'right' });
            y += 30;

            // ─── Amount in Words ──────────────────────────────────────────────────
            doc.fillColor('#374151').fontSize(8).font('Helvetica').text(
                `Amount in Words: Rupees ${amountToWords(bill.grandTotal)} Only`,
                40, y + 10
            );

            // ─── QR Code ──────────────────────────────────────────────────────────
            if (bill.qrCodeData) {
                try {
                    const qrImage = await QRCode.toBuffer(bill.qrCodeData, { width: 80 });
                    doc.image(qrImage, 460, y - 40, { width: 80, height: 80 });
                    doc.fontSize(7).text('Scan to Pay', 462, y + 42, { width: 76, align: 'center' });
                } catch (e) { /* QR generation failed, skip */ }
            }

            // ─── Footer ───────────────────────────────────────────────────────────
            doc.rect(40, doc.page.height - 80, 525, 1).fill('#e5e7eb');
            doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
                .text('Thank you for your business! Goods once sold will not be taken back or exchanged.', 40, doc.page.height - 70, { align: 'center', width: 525 });
            doc.text(`Authorized Signatory: ${shop.name}`, 40, doc.page.height - 56, { align: 'right', width: 525 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

// Simple number to words (for amounts up to crores)
function amountToWords(amount) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const n = Math.round(amount);
    if (n === 0) return 'Zero';
    const convert = (num) => {
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
        if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
        if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
        if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
        return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
    };
    return convert(n);
}
