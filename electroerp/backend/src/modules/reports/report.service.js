import Bill from '../../models/Bill.model.js';
import Purchase from '../../models/Purchase.model.js';
import Product from '../../models/Product.model.js';
import GSTLedger from '../../models/GSTLedger.model.js';
import Supplier from '../../models/Supplier.model.js';

export const getDashboardStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

    const [
        todaySales, monthSales, lastMonthSales,
        monthPurchases, lowStockCount,
        supplierDues, totalProducts, pendingBillsCount,
    ] = await Promise.all([
        // Today's sales
        Bill.aggregate([
            { $match: { billDate: { $gte: today, $lt: tomorrow }, isCancelled: false } },
            { $group: { _id: null, revenue: { $sum: '$grandTotal' }, profit: { $sum: '$profitAmount' }, count: { $sum: 1 } } },
        ]),
        // This month's sales
        Bill.aggregate([
            { $match: { billDate: { $gte: thisMonthStart }, isCancelled: false } },
            { $group: { _id: null, revenue: { $sum: '$grandTotal' }, profit: { $sum: '$profitAmount' }, count: { $sum: 1 } } },
        ]),
        // Last month's sales
        Bill.aggregate([
            { $match: { billDate: { $gte: lastMonthStart, $lte: lastMonthEnd }, isCancelled: false } },
            { $group: { _id: null, revenue: { $sum: '$grandTotal' } } },
        ]),
        // This month's purchases
        Purchase.aggregate([
            { $match: { purchaseDate: { $gte: thisMonthStart } } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } },
        ]),
        // Low stock count
        Product.countDocuments({ isActive: true, $expr: { $lte: ['$stockQty', '$minStockQty'] } }),
        // Supplier pending dues
        Supplier.aggregate([
            { $match: { isActive: true, currentBalance: { $gt: 0 } } },
            { $group: { _id: null, totalDue: { $sum: '$currentBalance' }, count: { $sum: 1 } } },
        ]),
        // Total active products
        Product.countDocuments({ isActive: true }),
        // Pending/credit bills
        Bill.countDocuments({ paymentStatus: { $in: ['partial', 'credit'] }, isCancelled: false }),
    ]);

    return {
        today: {
            revenue: todaySales[0]?.revenue || 0,
            profit: todaySales[0]?.profit || 0,
            bills: todaySales[0]?.count || 0,
        },
        month: {
            revenue: monthSales[0]?.revenue || 0,
            profit: monthSales[0]?.profit || 0,
            bills: monthSales[0]?.count || 0,
            purchases: monthPurchases[0]?.total || 0,
        },
        lastMonth: { revenue: lastMonthSales[0]?.revenue || 0 },
        revenueGrowth: lastMonthSales[0]?.revenue
            ? parseFloat((((monthSales[0]?.revenue || 0) - lastMonthSales[0].revenue) / lastMonthSales[0].revenue * 100).toFixed(1))
            : 0,
        inventory: { lowStockCount, totalProducts },
        suppliers: {
            totalDue: supplierDues[0]?.totalDue || 0,
            dueCount: supplierDues[0]?.count || 0,
        },
        pendingBillsCount,
    };
};

export const getSalesChart = async (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return Bill.aggregate([
        { $match: { billDate: { $gte: startDate }, isCancelled: false } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$billDate' } },
                revenue: { $sum: '$grandTotal' },
                profit: { $sum: '$profitAmount' },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);
};

export const getTopProducts = async (limit = 10, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return Bill.aggregate([
        { $match: { billDate: { $gte: startDate }, isCancelled: false } },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.product',
                productName: { $first: '$items.productName' },
                sku: { $first: '$items.sku' },
                totalQty: { $sum: '$items.quantity' },
                totalRevenue: { $sum: '$items.totalAmount' },
                totalProfit: { $sum: '$items.profitAmount' },
            },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: parseInt(limit) },
    ]);
};

export const getCategoryRevenue = async (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return Bill.aggregate([
        { $match: { billDate: { $gte: startDate }, isCancelled: false } },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product',
            },
        },
        { $unwind: '$product' },
        {
            $lookup: {
                from: 'categories',
                localField: 'product.category',
                foreignField: '_id',
                as: 'category',
            },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: '$category._id',
                categoryName: { $first: '$category.name' },
                revenue: { $sum: '$items.totalAmount' },
                qty: { $sum: '$items.quantity' },
            },
        },
        { $sort: { revenue: -1 } },
    ]);
};

export const getSalesReport = async (startDate, endDate, groupBy = 'day') => {
    const match = { isCancelled: false };
    if (startDate) match.billDate = { $gte: new Date(startDate) };
    if (endDate) match.billDate = { ...(match.billDate || {}), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };

    const dateFormat = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
    return Bill.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $dateToString: { format: dateFormat, date: '$billDate' } },
                revenue: { $sum: '$grandTotal' },
                profit: { $sum: '$profitAmount' },
                totalGST: { $sum: '$totalGST' },
                discountGiven: { $sum: '$totalDiscount' },
                billCount: { $sum: 1 },
                avgBillValue: { $avg: '$grandTotal' },
            },
        },
        { $sort: { _id: 1 } },
    ]);
};
