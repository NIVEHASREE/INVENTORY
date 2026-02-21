import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import * as productService from './product.service.js';

export const getProducts = asyncHandler(async (req, res) => {
    const result = await productService.getProducts(req.query);
    res.status(200).json(new ApiResponse(200, result.products, 'Products fetched', {
        page: result.page, limit: result.limit, total: result.total,
    }));
});

export const searchProducts = asyncHandler(async (req, res) => {
    const products = await productService.searchProducts(req.query.q);
    res.status(200).json(new ApiResponse(200, products, 'Search results'));
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
    const products = await productService.getLowStockProducts();
    res.status(200).json(new ApiResponse(200, products, 'Low stock products'));
});

export const getProductById = asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json(new ApiResponse(200, product, 'Product fetched'));
});

export const createProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body, req.user._id);
    res.status(201).json(new ApiResponse(201, product, 'Product created'));
});

export const updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, product, 'Product updated'));
});

export const deleteProduct = asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Product deactivated'));
});

export const getStockHistory = asyncHandler(async (req, res) => {
    const result = await productService.getStockHistory(req.params.id, req.query.page, req.query.limit);
    res.status(200).json(new ApiResponse(200, result.history, 'Stock history', { total: result.total }));
});
