import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import ActivityLog from '../../models/ActivityLog.model.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

router.get('/', requireRole('ADMIN'), asyncHandler(async (req, res) => {
    const { page = 1, limit = 30, userId, action } = req.query;
    const query = {};
    if (userId) query.user = userId;
    if (action) query.action = action;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
        ActivityLog.find(query).sort({ createdAt: -1 })
            .skip(skip).limit(parseInt(limit))
            .populate('user', 'name email').lean(),
        ActivityLog.countDocuments(query),
    ]);
    res.status(200).json(new ApiResponse(200, logs, 'Activity logs', { total, page: parseInt(page) }));
}));

export default router;
