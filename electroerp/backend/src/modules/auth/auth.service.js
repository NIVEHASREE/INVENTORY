import User from '../../models/User.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateTokenPair, verifyRefreshToken } from '../../utils/tokenService.js';

export const loginUser = async (email, password) => {
    const user = await User.findOne({ email, isActive: true }).select('+password').populate('role');
    if (!user) throw new ApiError(401, 'Invalid email or password');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, 'Invalid email or password');

    const tokenPayload = { _id: user._id, role: user.role.name };
    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return { user, accessToken, refreshToken };
};

export const refreshAccessToken = async (incomingRefreshToken) => {
    if (!incomingRefreshToken) throw new ApiError(401, 'Refresh token required');

    let decoded;
    try {
        decoded = verifyRefreshToken(incomingRefreshToken);
    } catch {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded._id).select('+refreshToken').populate('role');
    if (!user || user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, 'Refresh token revoked');
    }

    const tokenPayload = { _id: user._id, role: user.role.name };
    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

export const logoutUser = async (userId) => {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};

export const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new ApiError(404, 'User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new ApiError(401, 'Current password is incorrect');

    user.password = newPassword;
    await user.save();
};
