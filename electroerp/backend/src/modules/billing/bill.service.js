import mongoose from 'mongoose';
import Bill from '../../models/Bill.model.js';
import Product from '../../models/Product.model.js';
import GSTLedger from '../../models/GSTLedger.model.js';
import StockHistory from '../../models/StockHistory.model.js';
import ActivityLog from '../../models/ActivityLog.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { calculateBillTotals } from '../../utils/gstCalculator.js';
import { generateInvoicePDF } from '../../utils/pdfGenerator.js';
import QRCode from 'qrcode';

// Auto-generate bill number: BILL-YYYYMM-XXXX
const generateBillNumber = async () => {
    const now = new Date();
    const prefix = `BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
    const lastBill = await Bill.findOne({ billNumber: new RegExp(`^${prefix}`) })
        .sort({ billNumber: -1 }).lean();
    const seq = lastBill ? parseInt(lastBill.billNumber.split('-')[2]) + 1 : 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
};

export const createBill = async (billData, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Enrich items with product data
        const enrichedItems = await Promise.all(
            billData.items.map(async (item) => {
                const product = await Product.findById(item.product).session(session);
                if (!product) throw new ApiError(404, `Product not found: ${item.product}`);
                if (!product.isActive) throw new ApiError(400, `Product ${product.name} is inactive`);
                if (product.stockQty < item.quantity) {
                    throw new ApiError(400, `Insufficient stock for ${product.name}. Available: ${product.stockQty}`);
                }
                return {
                    ...item,
                    productName: product.name,
                    sku: product.sku,
                    unit: product.unit,
                    costPrice: product.costPrice,
                    sellingPrice: item.sellingPrice || product.sellingPrice,
                    gstRate: product.gstRate,
                    hsnCode: product.hsnCode,
                    mrp: product.mrp,
                };
            })
        );

        // 2. Calculate totals
        const totals = calculateBillTotals(enrichedItems, billData.isInterstate || false);
        const billNumber = await generateBillNumber();

        // 3. Generate QR (UPI payment link)
        const upiString = `upi://pay?pa=${process.env.SHOP_UPI || 'shop@upi'}&pn=${process.env.SHOP_NAME}&am=${totals.finalTotal}&cu=INR&tn=${billNumber}`;
        let qrCodeData = upiString;

        // 4. Create Bill
        const [bill] = await Bill.create([{
            billNumber,
            billDate: billData.billDate || new Date(),
            customer: billData.customer || {},
            items: totals.processedItems,
            subtotal: totals.subtotal,
            totalDiscount: totals.totalDiscount,
            totalTaxable: totals.totalTaxable,
            totalGST: totals.totalGST,
            cgst: totals.cgst,
            sgst: totals.sgst,
            igst: totals.igst,
            grandTotal: totals.finalTotal,
            roundOff: totals.roundOff,
            paymentMode: billData.paymentMode || 'cash',
            paymentStatus: billData.paymentStatus || 'paid',
            amountPaid: billData.amountPaid ?? totals.finalTotal,
            amountDue: billData.amountDue ?? 0,
            isInterstate: billData.isInterstate || false,
            profitAmount: totals.profitAmount,
            qrCodeData,
            createdBy: userId,
            notes: billData.notes,
        }], { session });

        // 5. Reduce stock + create stock history
        await Promise.all(
            totals.processedItems.map(async (item) => {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stockQty: -item.quantity } },
                    { session }
                );
                await StockHistory.create([{
                    product: item.product,
                    type: 'SALE',
                    quantity: -item.quantity,
                    referenceId: bill._id,
                    referenceNo: billNumber,
                    createdBy: userId,
                }], { session });
            })
        );

        // 6. GST Ledger - OUTPUT entry for each unique HSN/rate combo
        const gstDate = new Date(bill.billDate);
        await GSTLedger.create([{
            type: 'OUTPUT',
            referenceModel: 'Bill',
            referenceId: bill._id,
            referenceNo: billNumber,
            date: gstDate,
            month: gstDate.getMonth() + 1,
            year: gstDate.getFullYear(),
            taxableAmount: totals.totalTaxable,
            totalGST: totals.totalGST,
            cgst: totals.cgst,
            sgst: totals.sgst,
            igst: totals.igst,
            isInterstate: billData.isInterstate || false,
            party: {
                name: billData.customer?.name || 'Walk-in Customer',
                gstin: billData.customer?.gstin || '',
            },
            createdBy: userId,
        }], { session });

        await session.commitTransaction();
        session.endSession();

        // 7. Generate PDF asynchronously (after transaction)
        try {
            const pdfBuffer = await generateInvoicePDF(bill.toObject());
            // In production: upload to Cloudinary & update bill
            // For now: return as buffer URL
            await Bill.findByIdAndUpdate(bill._id, { invoicePdfUrl: `/api/bills/${bill._id}/pdf` });
        } catch (pdfErr) {
            console.error('PDF generation failed:', pdfErr.message);
        }

        // 8. Activity log
        await ActivityLog.create({
            user: userId,
            action: 'CREATE_BILL',
            resource: 'Bill',
            resourceId: bill._id,
            details: { billNumber, grandTotal: totals.finalTotal, items: totals.processedItems.length },
        });

        return bill;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

export const getBills = async (filters = {}) => {
    const {
        page = 1, limit = 20, startDate, endDate,
        paymentStatus, paymentMode, search,
    } = filters;

    const query = { isCancelled: false };
    if (startDate || endDate) {
        query.billDate = {};
        if (startDate) query.billDate.$gte = new Date(startDate);
        if (endDate) query.billDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (paymentMode) query.paymentMode = paymentMode;
    if (search) {
        query.$or = [
            { billNumber: new RegExp(search, 'i') },
            { 'customer.name': new RegExp(search, 'i') },
            { 'customer.phone': new RegExp(search, 'i') },
        ];
    }

    const skip = (page - 1) * limit;
    const [bills, total] = await Promise.all([
        Bill.find(query)
            .sort({ billDate: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email')
            .lean(),
        Bill.countDocuments(query),
    ]);

    return { bills, total, page: parseInt(page), limit: parseInt(limit) };
};

export const getBillById = async (id) => {
    const bill = await Bill.findById(id).populate('createdBy', 'name email').lean();
    if (!bill) throw new ApiError(404, 'Bill not found');
    return bill;
};

export const cancelBill = async (billId, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const bill = await Bill.findById(billId).session(session);
        if (!bill) throw new ApiError(404, 'Bill not found');
        if (bill.isCancelled) throw new ApiError(400, 'Bill is already cancelled');

        bill.isCancelled = true;
        bill.cancelledAt = new Date();
        bill.cancelledBy = userId;
        await bill.save({ session });

        // Restore stock
        await Promise.all(
            bill.items.map(async (item) => {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stockQty: item.quantity } },
                    { session }
                );
                await StockHistory.create([{
                    product: item.product,
                    type: 'RETURN',
                    quantity: item.quantity,
                    referenceId: bill._id,
                    referenceNo: bill.billNumber,
                    notes: 'Bill cancelled - stock restored',
                    createdBy: userId,
                }], { session });
            })
        );

        // Remove GST ledger entry
        await GSTLedger.deleteMany({ referenceId: billId }, { session });

        await session.commitTransaction();
        session.endSession();

        await ActivityLog.create({
            user: userId,
            action: 'CANCEL_BILL',
            resource: 'Bill',
            resourceId: billId,
            details: { billNumber: bill.billNumber },
        });

        return bill;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

export const generateBillPDF = async (billId) => {
    const bill = await Bill.findById(billId).lean();
    if (!bill) throw new ApiError(404, 'Bill not found');
    return generateInvoicePDF(bill);
};
