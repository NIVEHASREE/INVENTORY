import express from 'express';
import * as productController from './product.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

router.get('/search', searchProducts);
router.get('/low-stock', authorize('products', 'read'), productController.getLowStockProducts);
router.get('/:id/stock-history', authorize('products', 'read'), productController.getStockHistory);
router.get('/', authorize('products', 'read'), productController.getProducts);
router.get('/:id', authorize('products', 'read'), productController.getProductById);
router.post('/', authorize('products', 'create'), productController.createProduct);
router.put('/:id', authorize('products', 'update'), productController.updateProduct);
router.delete('/:id', authorize('products', 'delete'), productController.deleteProduct);

function searchProducts(req, res, next) {
    return productController.searchProducts(req, res, next);
}

export default router;
