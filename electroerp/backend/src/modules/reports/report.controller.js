import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import * as reportService from './report.service.js';

export const getDashboard = asyncHandler(async (req, res) => {
    const stats = await reportService.getDashboardStats();
    res.status(200).json(new ApiResponse(200, stats, 'Dashboard stats'));
});

export const getSalesChart = asyncHandler(async (req, res) => {
    const data = await reportService.getSalesChart(parseInt(req.query.days) || 30);
    res.status(200).json(new ApiResponse(200, data, 'Sales chart data'));
});

export const getTopProducts = asyncHandler(async (req, res) => {
    const data = await reportService.getTopProducts(req.query.limit, req.query.days);
    res.status(200).json(new ApiResponse(200, data, 'Top products'));
});

export const getCategoryRevenue = asyncHandler(async (req, res) => {
    const data = await reportService.getCategoryRevenue(req.query.days);
    res.status(200).json(new ApiResponse(200, data, 'Category revenue'));
});

export const getSalesReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, groupBy } = req.query;
    const data = await reportService.getSalesReport(startDate, endDate, groupBy);
    res.status(200).json(new ApiResponse(200, data, 'Sales report'));
});

export const getAdvancedAnalytics = asyncHandler(async (req, res) => {
    const data = await reportService.getAdvancedAnalytics(parseInt(req.query.days) || 30);
    res.status(200).json(new ApiResponse(200, data, 'Advanced analytics fetched'));
});
