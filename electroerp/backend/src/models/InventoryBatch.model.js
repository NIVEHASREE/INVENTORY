import mongoose from 'mongoose';

const InventoryBatchSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    purchaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Purchase'
    },
    quantityPurchased: {
        type: Number,
        required: true,
        min: 0
    },
    quantityRemaining: {
        type: Number,
        required: true,
        min: 0,
        index: true
    },
    costPerUnit: {
        type: Number,
        required: true,
        min: 0
    },
    purchaseDate: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    }
}, { timestamps: true });

export default mongoose.model('InventoryBatch', InventoryBatchSchema);
