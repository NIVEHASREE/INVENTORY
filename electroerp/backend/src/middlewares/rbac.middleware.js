import { ApiError } from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * RBAC factory middleware
 * Usage: authorize('products', 'create')
 */
export const authorize = (resource, action) =>
    asyncHandler(async (req, res, next) => {
        if (!req.user) throw new ApiError(401, 'Not authenticated.');

        const { role } = req.user;
        if (!role || !role.permissions) {
            throw new ApiError(403, 'Role has no permissions defined.');
        }

        // ADMIN can do everything
        if (role.name === 'ADMIN') return next();

        const perm = role.permissions.find((p) => p.resource === resource);
        if (!perm || !perm.actions.includes(action)) {
            throw new ApiError(403, `Insufficient permission: ${action} on ${resource}`);
        }

        next();
    });

/**
 * Role check middleware
 * Usage: requireRole('ADMIN', 'MANAGER')
 */
export const requireRole = (...roles) =>
    asyncHandler(async (req, res, next) => {
        if (!req.user?.role) throw new ApiError(401, 'Not authenticated.');
        if (!roles.includes(req.user.role.name)) {
            throw new ApiError(403, `Access restricted to: ${roles.join(', ')}`);
        }
        next();
    });
