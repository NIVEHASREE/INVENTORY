import mongoose from 'mongoose';

const SaleBatchAllocationSchema = new mongoose.Schema({
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill',
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryBatch',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    costPerUnit: {
        type: Number,
        required: true,
        min: 0
    }
}, { timestamps: true });

export default mongoose.model('SaleBatchAllocation', SaleBatchAllocationSchema);
