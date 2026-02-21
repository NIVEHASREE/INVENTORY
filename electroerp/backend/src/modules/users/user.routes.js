import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import User from '../../models/User.model.js';
import Role from '../../models/Role.model.js';
import { ApiError } from '../../utils/ApiError.js';

const router = express.Router();
router.use(authenticate);

// GET all users (Admin only)
router.get('/', requireRole('ADMIN'), asyncHandler(async (req, res) => {
    const users = await User.find().populate('role', 'name').sort({ createdAt: -1 }).lean();
    res.status(200).json(new ApiResponse(200, users, 'Users fetched'));
}));

// Create user (Admin only)
router.post('/', requireRole('ADMIN'), asyncHandler(async (req, res) => {
    const { name, email, password, phone, roleId } = req.body;
    const role = await Role.findById(roleId);
    if (!role) throw new ApiError(404, 'Role not found');
    const user = await User.create({ name, email, password, phone, role: roleId, createdBy: req.user._id });
    res.status(201).json(new ApiResponse(201, user, 'User created'));
}));

// Toggle user active status (Admin only)
router.patch('/:id/toggle-status', requireRole('ADMIN'), asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found');
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.status(200).json(new ApiResponse(200, user, `User ${user.isActive ? 'activated' : 'deactivated'}`));
}));

export default router;
