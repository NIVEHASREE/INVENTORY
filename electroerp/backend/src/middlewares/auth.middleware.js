import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokenService.js';
import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'Authentication required. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = verifyAccessToken(token);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new ApiError(401, 'Token expired. Please refresh.');
        }
        throw new ApiError(401, 'Invalid token.');
    }

    const user = await User.findById(decoded._id).populate('role').lean();
    if (!user) throw new ApiError(401, 'User not found.');
    if (!user.isActive) throw new ApiError(403, 'Account is deactivated. Contact admin.');

    req.user = user;
    next();
});
