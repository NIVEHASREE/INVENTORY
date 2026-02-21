import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import Category from '../../models/Category.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    res.status(200).json(new ApiResponse(200, categories, 'Categories fetched'));
}));

router.post('/', requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
    const category = await Category.create(req.body);
    res.status(201).json(new ApiResponse(201, category, 'Category created'));
}));

router.put('/:id', requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) throw new ApiError(404, 'Category not found');
    res.status(200).json(new ApiResponse(200, category, 'Category updated'));
}));

router.delete('/:id', requireRole('ADMIN'), asyncHandler(async (req, res) => {
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json(new ApiResponse(200, null, 'Category deleted'));
}));

export default router;
