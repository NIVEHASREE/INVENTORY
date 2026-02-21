import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import GSTLedger from '../../models/GSTLedger.model.js';

const router = express.Router();
router.use(authenticate);

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

export default router;
