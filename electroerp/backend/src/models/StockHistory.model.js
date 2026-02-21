import mongoose from 'mongoose';

const { Schema } = mongoose;

const StockHistorySchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: { type: String, enum: ['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'OPENING'], required: true },
    quantity: { type: Number, required: true },
    balanceQty: { type: Number },
    referenceId: { type: Schema.Types.ObjectId },
    referenceNo: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

StockHistorySchema.index({ product: 1, createdAt: -1 });

const StockHistory = mongoose.model('StockHistory', StockHistorySchema);
export default StockHistory;
