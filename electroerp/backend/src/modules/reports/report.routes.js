import express from 'express';
import * as reportController from './report.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

router.get('/dashboard', reportController.getDashboard);
router.get('/sales-chart', reportController.getSalesChart);
router.get('/top-products', reportController.getTopProducts);
router.get('/category-revenue', reportController.getCategoryRevenue);
router.get('/sales', requireRole('ADMIN', 'MANAGER', 'ACCOUNTANT'), reportController.getSalesReport);

export default router;
