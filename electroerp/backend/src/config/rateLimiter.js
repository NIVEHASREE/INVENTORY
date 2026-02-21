import rateLimit from 'express-rate-limit';

const createLimiter = (windowMs, max, message) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message },
    });

export const generalRateLimiter = createLimiter(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    parseInt(process.env.RATE_LIMIT_MAX) || 500,
    'Too many requests, please try again later.'
);

export const authRateLimiter = createLimiter(
    15 * 60 * 1000,
    parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20,
    'Too many login attempts, please try again in 15 minutes.'
);
