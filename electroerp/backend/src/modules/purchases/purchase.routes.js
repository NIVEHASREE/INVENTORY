import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import Purchase from '../../models/Purchase.model.js';
import Product from '../../models/Product.model.js';
import Supplier from '../../models/Supplier.model.js';
import SupplierLedger from '../../models/SupplierLedger.model.js';
import GSTLedger from '../../models/GSTLedger.model.js';
import StockHistory from '../../models/StockHistory.model.js';
import ActivityLog from '../../models/ActivityLog.model.js';
import InventoryBatch from '../../models/InventoryBatch.model.js';
import { calculateBillTotals } from '../../utils/gstCalculator.js';

const router = express.Router();
router.use(authenticate);

// Auto-generate purchase number
const genPurchaseNo = async () => {
    const now = new Date();
    const prefix = `PUR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
    const last = await Purchase.findOne({ purchaseNumber: new RegExp(`^${prefix}`) }).sort({ purchaseNumber: -1 }).lean();
    const seq = last ? parseInt(last.purchaseNumber.split('-')[2]) + 1 : 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
};

router.post('/', requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
    const { supplierId, items, paymentStatus, amountPaid, supplierInvoiceNo, notes, isInterstate } = req.body;

    try {
        // Enrich items
        const enrichedItems = await Promise.all(items.map(async (item) => {
            const product = await Product.findById(item.product);
            if (!product) throw new ApiError(404, `Product ${item.product} not found`);
            return {
                ...item,
                productName: product.name,
                sku: product.sku,
            };
        }));

        // Use GST calculator
        const totals = calculateBillTotals(
            enrichedItems.map(i => ({ ...i, sellingPrice: i.purchasePrice, discount: 0, costPrice: i.purchasePrice })),
            isInterstate || false
        );

        const purchaseNumber = await genPurchaseNo();
        const grandTotal = totals.finalTotal;
        const amtPaid = amountPaid || (paymentStatus === 'paid' ? grandTotal : 0);
        const amtDue = grandTotal - amtPaid;

        const purchase = await Purchase.create({
            purchaseNumber,
            supplier: supplierId,
            items: enrichedItems.map((item, i) => ({
                ...item,
                taxableAmount: totals.processedItems[i].taxableAmount,
                cgst: totals.processedItems[i].cgst,
                sgst: totals.processedItems[i].sgst,
                igst: totals.processedItems[i].igst,
                gstAmount: totals.processedItems[i].gstAmount,
                totalAmount: totals.processedItems[i].totalAmount,
            })),
            subtotal: totals.subtotal,
            totalTaxable: totals.totalTaxable,
            totalGST: totals.totalGST,
            cgst: totals.cgst, sgst: totals.sgst, igst: totals.igst,
            grandTotal,
            paymentStatus: paymentStatus || 'credit',
            amountPaid: amtPaid,
            amountDue: amtDue,
            supplierInvoiceNo,
            isInterstate: isInterstate || false,
            notes,
            createdBy: req.user._id,
        });

        // Increase stock
        const batchesToCreate = [];
        await Promise.all(enrichedItems.map(async (item) => {
            await Product.findByIdAndUpdate(item.product, { $inc: { stockQty: item.quantity } });
            await StockHistory.create({
                product: item.product, type: 'PURCHASE',
                quantity: item.quantity, referenceId: purchase._id,
                referenceNo: purchaseNumber, createdBy: req.user._id,
            });
            batchesToCreate.push({
                productId: item.product,
                purchaseId: purchase._id,
                quantityPurchased: item.quantity,
                quantityRemaining: item.quantity,
                costPerUnit: item.purchasePrice,
                purchaseDate: purchase.createdAt || new Date()
            });
        }));

        if (batchesToCreate.length > 0) {
            await InventoryBatch.insertMany(batchesToCreate);
        }

        // GST INPUT entry
        const gstDate = new Date();
        const supplier = await Supplier.findById(supplierId);
        await GSTLedger.create({
            type: 'INPUT', referenceModel: 'Purchase', referenceId: purchase._id,
            referenceNo: purchaseNumber, date: gstDate,
            month: gstDate.getMonth() + 1, year: gstDate.getFullYear(),
            taxableAmount: totals.totalTaxable, totalGST: totals.totalGST,
            cgst: totals.cgst, sgst: totals.sgst, igst: totals.igst,
            isInterstate: isInterstate || false,
            party: { name: supplier?.name, gstin: supplier?.gstin },
            createdBy: req.user._id,
        });

        // Update supplier balance
        await Supplier.findByIdAndUpdate(supplierId, { $inc: { currentBalance: amtDue } });
        await SupplierLedger.create({
            supplier: supplierId, type: 'purchase',
            referenceId: purchase._id, referenceNo: purchaseNumber,
            debit: grandTotal, credit: amtPaid,
            balance: (supplier?.currentBalance || 0) + amtDue,
            narration: `Purchase ${purchaseNumber}`,
            createdBy: req.user._id,
        });

        await ActivityLog.create({
            user: req.user._id, action: 'CREATE_PURCHASE',
            resource: 'Purchase', resourceId: purchase._id,
            details: { purchaseNumber, grandTotal },
        });

        res.status(201).json(new ApiResponse(201, purchase, 'Purchase recorded successfully'));
    } catch (err) {
        throw err;
    }
}));

router.get('/', requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
    const { page = 1, limit = 100, supplierId, startDate, endDate, status, minAmount, maxAmount, search } = req.query;
    const query = {};

    console.log('--- Purchase Filter Request ---');
    console.log('Query Params:', req.query);

    if (supplierId) query.supplier = supplierId;
    if (status) query.paymentStatus = status.toLowerCase();

    if (startDate || endDate) {
        query.purchaseDate = {};
        if (startDate) query.purchaseDate.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.purchaseDate.$lte = end;
        }
    }

    if (minAmount || maxAmount) {
        query.grandTotal = {};
        if (minAmount) query.grandTotal.$gte = parseFloat(minAmount);
        if (maxAmount) query.grandTotal.$lte = parseFloat(maxAmount);
    }

    if (search) {
        query.$or = [
            { purchaseNumber: { $regex: search, $options: 'i' } },
            { supplierInvoiceNo: { $regex: search, $options: 'i' } }
        ];
    }

    console.log('Constructed Mongo Query:', JSON.stringify(query, null, 2));

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [purchases, total] = await Promise.all([
        Purchase.find(query)
            .sort({ purchaseDate: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('supplier', 'name phone')
            .populate('createdBy', 'name')
            .lean(),
        Purchase.countDocuments(query),
    ]);

    res.status(200).json(new ApiResponse(200, purchases, 'Purchases fetched', {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
    }));
}));

router.get('/:id', requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
    const purchase = await Purchase.findById(req.params.id)
        .populate('supplier').populate('createdBy', 'name').lean();
    if (!purchase) throw new ApiError(404, 'Purchase not found');
    res.status(200).json(new ApiResponse(200, purchase, 'Purchase fetched'));
}));

router.post('/:id/payments', requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
    const { paymentAmount, paymentMode, referenceNo, narration, date } = req.body;

    try {
        const purchase = await Purchase.findById(req.params.id);
        if (!purchase) throw new ApiError(404, 'Purchase sequence not found');
        if (purchase.paymentStatus === 'paid') throw new ApiError(400, 'Purchase is already fully settled');

        const amountToPay = parseFloat(paymentAmount);
        if (isNaN(amountToPay) || amountToPay <= 0) throw new ApiError(400, 'Invalid payment amount');
        if (amountToPay > purchase.amountDue) throw new ApiError(400, `Payment exceeds remaining balance of ${purchase.amountDue}`);

        const supplier = await Supplier.findById(purchase.supplier);
        if (!supplier) throw new ApiError(404, 'Supplier not found');

        // Update Purchase
        purchase.amountPaid += amountToPay;
        purchase.amountDue -= amountToPay;

        if (purchase.amountDue === 0) {
            purchase.paymentStatus = 'paid';
        } else {
            purchase.paymentStatus = 'partial';
        }
        await purchase.save();

        // Update Supplier
        const oldBalance = supplier.currentBalance;
        supplier.currentBalance -= amountToPay;
        await supplier.save();

        // Ledger Entry
        const ledgerEntry = await SupplierLedger.create({
            supplier: supplier._id,
            date: date || new Date(),
            type: 'payment',
            referenceId: purchase._id,
            referenceNo: referenceNo || purchase.purchaseNumber,
            debit: 0,
            credit: amountToPay,
            balance: oldBalance - amountToPay,
            narration: narration || `Settlement for ${purchase.purchaseNumber} [${paymentMode}]`,
            createdBy: req.user._id,
        });

        await ActivityLog.create({
            user: req.user._id,
            action: 'RECORD_PURCHASE_PAYMENT',
            resource: 'Purchase',
            resourceId: purchase._id,
            details: {
                purchaseNumber: purchase.purchaseNumber,
                amount: amountToPay,
                mode: paymentMode
            },
        });

        res.status(200).json(new ApiResponse(200, { purchase, ledgerEntry }, 'Payment crystallized in ledger'));
    } catch (err) {
        throw err;
    }
}));

export default router;
