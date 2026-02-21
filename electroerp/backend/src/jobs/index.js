import cron from 'node-cron';
import Product from '../models/Product.model.js';
import Notification from '../models/Notification.model.js';
import logger from '../config/logger.js';

// Daily at 8 AM: check low stock
const lowStockJob = cron.schedule('0 8 * * *', async () => {
    try {
        const lowStockProducts = await Product.find({
            isActive: true,
            $expr: { $lte: ['$stockQty', '$minStockQty'] },
        }).lean();

        if (lowStockProducts.length > 0) {
            const notifications = lowStockProducts.map(p => ({
                type: 'LOW_STOCK',
                title: `Low Stock Alert: ${p.name}`,
                message: `${p.name} (SKU: ${p.sku}) has only ${p.stockQty} ${p.unit} left. Min: ${p.minStockQty}`,
                product: p._id,
                target: 'ADMIN',
            }));
            await Notification.insertMany(notifications);
            logger.info(`Low stock alert sent for ${lowStockProducts.length} products`);
        }
    } catch (err) {
        logger.error('Low stock job failed:', err);
    }
}, { scheduled: false });

export const startCronJobs = () => {
    lowStockJob.start();
    logger.info('⏰ Cron jobs started');
};
