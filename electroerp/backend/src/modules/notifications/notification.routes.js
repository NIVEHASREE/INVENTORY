import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import Notification from '../../models/Notification.model.js';

const router = express.Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ isRead: false })
        .sort({ createdAt: -1 }).limit(20).lean();
    res.status(200).json(new ApiResponse(200, notifications, 'Notifications'));
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json(new ApiResponse(200, null, 'Marked as read'));
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json(new ApiResponse(200, null, 'All marked as read'));
}));

export default router;
