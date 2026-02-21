import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import Supplier from '../../models/Supplier.model.js';
import SupplierLedger from '../../models/SupplierLedger.model.js';

const router = express.Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
    const { search } = req.query;
    const query = { isActive: true };
    if (search) query.name = new RegExp(search, 'i');
    const suppliers = await Supplier.find(query).sort({ name: 1 }).lean();
    res.status(200).json(new ApiResponse(200, suppliers, 'Suppliers fetched'));
}));

router.post('/', requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
    const supplier = await Supplier.create(req.body);
    if (supplier.openingBalance > 0) {
        await SupplierLedger.create({
            supplier: supplier._id,
            type: 'opening',
            debit: supplier.openingBalance,
            credit: 0,
            balance: supplier.openingBalance,
            narration: 'Opening balance',
            createdBy: req.user._id,
        });
    }
    res.status(201).json(new ApiResponse(201, supplier, 'Supplier created'));
}));

router.put('/:id', requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) throw new ApiError(404, 'Supplier not found');
    res.status(200).json(new ApiResponse(200, supplier, 'Supplier updated'));
}));

router.get('/:id/ledger', asyncHandler(async (req, res) => {
    const { page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
        SupplierLedger.find({ supplier: req.params.id }).sort({ createdAt: -1 })
            .skip(skip).limit(parseInt(limit)).populate('createdBy', 'name').lean(),
        SupplierLedger.countDocuments({ supplier: req.params.id }),
    ]);
    res.status(200).json(new ApiResponse(200, entries, 'Supplier ledger', { total }));
}));

// Record payment to supplier
router.post('/:id/payment', requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
    const { amount, narration, mode } = req.body;
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) throw new ApiError(404, 'Supplier not found');

    supplier.currentBalance = Math.max(0, supplier.currentBalance - amount);
    await supplier.save({ validateBeforeSave: false });

    const ledger = await SupplierLedger.create({
        supplier: supplier._id,
        type: 'payment',
        debit: 0,
        credit: amount,
        balance: supplier.currentBalance,
        narration: narration || `Payment via ${mode || 'cash'}`,
        createdBy: req.user._id,
    });

    res.status(201).json(new ApiResponse(201, ledger, 'Payment recorded'));
}));

export default router;
