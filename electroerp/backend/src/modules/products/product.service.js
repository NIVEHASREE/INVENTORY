import Product from '../../models/Product.model.js';
import StockHistory from '../../models/StockHistory.model.js';
import { ApiError } from '../../utils/ApiError.js';

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
    return { products, total, page: parseInt(page), limit: parseInt(limit) };
};

export const searchProducts = async (q) => {
    if (!q) return [];
    return Product.find({
        isActive: true,
        stockQty: { $gt: 0 },
        $or: [
            { name: new RegExp(q, 'i') },
            { sku: new RegExp(q, 'i') },
            { barcode: new RegExp(q, 'i') },
        ],
    }).limit(20).populate('category', 'name').lean();
};

export const getLowStockProducts = async () => {
    return Product.find({
        isActive: true,
        $expr: { $lte: ['$stockQty', '$minStockQty'] },
    }).populate('category', 'name').lean();
};

export const getProductById = async (id) => {
    const product = await Product.findById(id).populate('category supplier').lean();
    if (!product) throw new ApiError(404, 'Product not found');
    return product;
};

export const createProduct = async (data, userId) => {
    const product = await Product.create({ ...data });
    if (data.stockQty > 0) {
        await StockHistory.create({
            product: product._id, type: 'OPENING',
            quantity: data.stockQty, balanceQty: data.stockQty,
            notes: 'Opening stock', createdBy: userId,
        });
    }
    return product;
};

export const updateProduct = async (id, data) => {
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
