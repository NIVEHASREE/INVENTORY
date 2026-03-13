import PDFDocument from 'pdfkit';

const formatCurrency = (amount) => Number(amount || 0).toFixed(2);

export const generateInvoicePDF = async (bill) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const buffers = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const shop = {
                name: process.env.SHOP_NAME || 'SENTHIL MURUGAN ELECTRICALS',
                address: process.env.SHOP_ADDRESS || '',
                phone: process.env.SHOP_PHONE || '',
                gstin: process.env.SHOP_GSTIN || '',
            };

            const primaryColor = '#000000';
            const secondaryColor = '#333333';

            // ─── Header ────────────────────────────────────────────────────────────
            const topSeparator = '==================================================================================';
            doc.fillColor(secondaryColor).fontSize(10).text(topSeparator, 40, 30, { align: 'center' });
            
            doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text(shop.name, 40, 45, { align: 'center' });
            doc.fontSize(10).font('Helvetica').text(shop.address, 40, 70, { align: 'center' });
            doc.fontSize(10).text(`Phone: ${shop.phone}`, 40, 85, { align: 'center' });
            doc.fontSize(10).font('Helvetica-Bold').text(`GSTIN: ${shop.gstin}`, 40, 100, { align: 'center' });
            
            doc.fillColor(secondaryColor).fontSize(10).text(topSeparator, 40, 115, { align: 'center' });

            // ─── Metadata ──────────────────────────────────────────────────────────
            let currentY = 140;
            const invoiceSeq = parseInt(bill.billNumber.split('-').pop());
            doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold');
            doc.text(`Invoice No: ${invoiceSeq}`, 40, currentY);
            doc.text(`Date: ${new Date(bill.billDate).toLocaleDateString('en-IN')}`, 40, currentY + 15);
            doc.text(`Payment Mode: ${(bill.paymentMode || 'cash').toUpperCase()}`, 40, currentY + 30);

            doc.text('Bill To:', 350, currentY);
            doc.font('Helvetica').text(bill.customer?.name || 'Walk-in Customer', 350, currentY + 15);
            if (bill.customer?.phone) doc.text(`Phone: ${bill.customer.phone}`, 350, currentY + 30);
            if (bill.customer?.gstin) doc.text(`GSTIN: ${bill.customer.gstin}`, 350, currentY + 45);

            // ─── Items Table ───────────────────────────────────────────────────────
            currentY = 210;
            const tableSeparator = '------------------------------------------------------------------------------------------------------------------------------------------------';
            doc.fillColor(secondaryColor).fontSize(8).text(tableSeparator, 40, currentY);
            
            currentY += 10;
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9);
            doc.text('Item Name', 40, currentY);
            doc.text('HSN', 280, currentY, { width: 60, align: 'center' });
            doc.text('Qty', 350, currentY, { width: 40, align: 'center' });
            doc.text('Price', 400, currentY, { width: 75, align: 'right' });
            doc.text('Amount', 490, currentY, { width: 75, align: 'right' });

            currentY += 15;
            doc.fillColor(secondaryColor).fontSize(8).text(tableSeparator, 40, currentY);
            
            currentY += 10;
            doc.fillColor(primaryColor).font('Helvetica').fontSize(9);
            
            bill.items.forEach((item) => {
                doc.text(item.productName, 40, currentY, { width: 230 });
                doc.text(item.hsnCode || '-', 280, currentY, { width: 60, align: 'center' });
                doc.text(item.quantity, 350, currentY, { width: 40, align: 'center' });
                doc.text(formatCurrency(item.sellingPrice), 400, currentY, { width: 75, align: 'right' });
                doc.text(formatCurrency(item.totalAmount), 490, currentY, { width: 75, align: 'right' });
                currentY += 20;
            });

            doc.fillColor(secondaryColor).fontSize(8).text(tableSeparator, 40, currentY);

            // ─── Summary ───────────────────────────────────────────────────────────
            currentY += 20;
            const summaryX = 350;
            const valX = 490;
            
            doc.fillColor(primaryColor).fontSize(10).font('Helvetica');
            doc.text('Subtotal', summaryX, currentY, { width: 140, align: 'right' });
            doc.text(formatCurrency(bill.totalTaxable), valX, currentY, { width: 75, align: 'right' });
            
            if (!bill.isInterstate) {
                currentY += 18;
                doc.text(`CGST (${(bill.items[0]?.gstRate / 2) || 9}%)`, summaryX, currentY, { width: 140, align: 'right' });
                doc.text(formatCurrency(bill.cgst), valX, currentY, { width: 75, align: 'right' });
                
                currentY += 18;
                doc.text(`SGST (${(bill.items[0]?.gstRate / 2) || 9}%)`, summaryX, currentY, { width: 140, align: 'right' });
                doc.text(formatCurrency(bill.sgst), valX, currentY, { width: 75, align: 'right' });
            } else {
                currentY += 18;
                doc.text(`IGST (${bill.items[0]?.gstRate || 18}%)`, summaryX, currentY, { width: 140, align: 'right' });
                doc.text(formatCurrency(bill.igst), valX, currentY, { width: 75, align: 'right' });
            }

            currentY += 10;
            doc.fillColor(secondaryColor).fontSize(8).text('------------------------------------------', 360, currentY, { align: 'right', width: 205 });
            
            currentY += 10;
            doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold');
            doc.text('TOTAL', summaryX, currentY, { width: 140, align: 'right' });
            doc.text(formatCurrency(bill.grandTotal), valX, currentY, { width: 75, align: 'right' });
            
            currentY += 15;
            doc.fillColor(secondaryColor).fontSize(8).text('------------------------------------------', 360, currentY, { align: 'right', width: 205 });

            // ─── footer info ───────────────────────────────────────────────────────
            currentY += 40;
            doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold').text('Amount in Words:', 40, currentY);
            doc.font('Helvetica').text(`${amountToWords(bill.grandTotal)}`, 40, currentY + 15);

            currentY += 80;
            doc.fillColor(secondaryColor).fontSize(10).text('------------------------------------------', 40, currentY, { align: 'center' });
            doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('Thank you for shopping with us', 40, currentY + 15, { align: 'center' });
            doc.fillColor(secondaryColor).fontSize(10).text('------------------------------------------', 40, currentY + 30, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

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
    
    let words = convert(n);
    return words + ' Rupees Only';
}
