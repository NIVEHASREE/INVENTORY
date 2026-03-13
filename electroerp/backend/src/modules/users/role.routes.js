import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import Role from '../../models/Role.model.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const router = express.Router();
router.use(authenticate);

// GET all roles
router.get('/', asyncHandler(async (req, res) => {
    const roles = await Role.find().sort({ name: 1 }).lean();
    res.status(200).json(new ApiResponse(200, roles, 'Roles fetched'));
}));

export default router;
