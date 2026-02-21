import express from 'express';
import { createBill, getBills, getBillById, downloadBillPDF, cancelBill } from './bill.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('bills', 'create'), createBill);
router.get('/', authorize('bills', 'read'), getBills);
router.get('/:id', authorize('bills', 'read'), getBillById);
router.get('/:id/pdf', authorize('bills', 'read'), downloadBillPDF);
router.delete('/:id', authorize('bills', 'delete'), cancelBill);

export default router;
