import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import * as authService from './auth.service.js';

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

    res
        .cookie('refreshToken', refreshToken, cookieOptions)
        .status(200)
        .json(new ApiResponse(200, { user, accessToken }, 'Login successful'));
});

export const refresh = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const { accessToken, refreshToken } = await authService.refreshAccessToken(token);

    res
        .cookie('refreshToken', refreshToken, cookieOptions)
        .status(200)
        .json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
});

export const logout = asyncHandler(async (req, res) => {
    await authService.logoutUser(req.user._id);
    res
        .clearCookie('refreshToken')
        .status(200)
        .json(new ApiResponse(200, null, 'Logged out successfully'));
});

export const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, req.user, 'Profile fetched'));
});

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id, currentPassword, newPassword);
    res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});
