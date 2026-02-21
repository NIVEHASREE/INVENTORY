import mongoose from 'mongoose';

const { Schema } = mongoose;

const NotificationSchema = new Schema({
    type: { type: String, enum: ['LOW_STOCK', 'PAYMENT_DUE', 'GST_REMINDER', 'SYSTEM'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    isRead: { type: Boolean, default: false, index: true },
    target: { type: String, enum: ['ALL', 'ADMIN', 'MANAGER'], default: 'ALL' },
    metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

NotificationSchema.index({ isRead: 1, createdAt: -1 });
NotificationSchema.index({ target: 1, isRead: 1 });

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
