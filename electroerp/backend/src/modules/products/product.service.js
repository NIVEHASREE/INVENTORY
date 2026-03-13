import Product from '../../models/Product.model.js';
import StockHistory from '../../models/StockHistory.model.js';
import InventoryBatch from '../../models/InventoryBatch.model.js';
import { ApiError } from '../../utils/ApiError.js';

const attachBatchStock = async (products) => {
    if (!products || products.length === 0) return products;
    const isArray = Array.isArray(products);
    const prodList = isArray ? products : [products];
    const ids = prodList.map(p => p._id);

    const batchAgg = await InventoryBatch.aggregate([
        { $match: { productId: { $in: ids } } },
        { $group: { _id: '$productId', stock: { $sum: '$quantityRemaining' } } }
    ]);
    const stockMap = {};
    batchAgg.forEach(b => { stockMap[b._id.toString()] = b.stock; });

    prodList.forEach(p => {
        if (stockMap[p._id.toString()] !== undefined) {
            p.stockQty = stockMap[p._id.toString()];
        }
    });

    return isArray ? prodList : prodList[0];
};

export const getProducts = async (filters = {}) => {
    const { page = 1, limit = 20, search, category, isActive } = filters;
    const query = {};
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    else query.isActive = true;

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
        Product.find(query).sort({ name: 1 }).skip(skip).limit(parseInt(limit))
            .populate('category', 'name').populate('supplier', 'name').lean(),
        Product.countDocuments(query),
    ]);
    const productsWithStock = await attachBatchStock(products);
    return { products: productsWithStock, total, page: parseInt(page), limit: parseInt(limit) };
};

export const searchProducts = async (q) => {
    if (!q) return [];
    const products = await Product.find({
        isActive: true,
        $or: [
            { name: new RegExp(q, 'i') },
            { sku: new RegExp(q, 'i') },
            { barcode: new RegExp(q, 'i') },
        ],
    }).limit(20).populate('category', 'name').lean();

    const enriched = await attachBatchStock(products);
    return enriched.filter(p => p.stockQty > 0);
};

export const getLowStockProducts = async () => {
    const products = await Product.find({ isActive: true }).populate('category', 'name').lean();
    const enriched = await attachBatchStock(products);
    return enriched.filter(p => p.stockQty <= p.minStockQty);
};

export const getProductById = async (id) => {
    const product = await Product.findById(id).populate('category supplier').lean();
    if (!product) throw new ApiError(404, 'Product not found');
    return await attachBatchStock(product);
};

export const createProduct = async (data, userId) => {
    if (!data.category || (typeof data.category === 'string' && data.category.trim() === '')) data.category = undefined;
    if (!data.supplier || (typeof data.supplier === 'string' && data.supplier.trim() === '')) data.supplier = undefined;
    const product = await Product.create({ ...data });
    if (data.stockQty > 0) {
        await StockHistory.create({
            product: product._id, type: 'OPENING',
            quantity: data.stockQty, balanceQty: data.stockQty,
            notes: 'Opening stock', createdBy: userId,
        });
        await InventoryBatch.create({
            productId: product._id,
            quantityPurchased: data.stockQty,
            quantityRemaining: data.stockQty,
            costPerUnit: data.costPrice || 0,
            purchaseDate: new Date()
        });
    }
    return await attachBatchStock(product);
};

export const updateProduct = async (id, data) => {
    if (!data.category || (typeof data.category === 'string' && data.category.trim() === '')) data.category = null;
    if (!data.supplier || (typeof data.supplier === 'string' && data.supplier.trim() === '')) data.supplier = null;
    const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!product) throw new ApiError(404, 'Product not found');
    return product;
};

export const deleteProduct = async (id) => {
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) throw new ApiError(404, 'Product not found');
    return product;
};

export const getStockHistory = async (productId, page = 1, limit = 30) => {
    const skip = (page - 1) * limit;
    const [history, total] = await Promise.all([
        StockHistory.find({ product: productId }).sort({ createdAt: -1 })
            .skip(skip).limit(parseInt(limit)).populate('createdBy', 'name').lean(),
        StockHistory.countDocuments({ product: productId }),
    ]);
    return { history, total };
};
