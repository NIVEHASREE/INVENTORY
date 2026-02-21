import express from 'express';
import { login, refresh, logout, getMe, changePassword } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { loginSchema, changePasswordSchema } from './auth.schema.js';
import { authRateLimiter } from '../../config/rateLimiter.js';

const router = express.Router();

router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
