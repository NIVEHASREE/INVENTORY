import mongoose from 'mongoose';

const { Schema } = mongoose;

const SupplierLedgerSchema = new Schema({
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['purchase', 'payment', 'adjustment', 'opening'], required: true },
    referenceId: { type: Schema.Types.ObjectId },
    referenceNo: { type: String },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    narration: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

SupplierLedgerSchema.index({ supplier: 1, createdAt: -1 });

const SupplierLedger = mongoose.model('SupplierLedger', SupplierLedgerSchema);
export default SupplierLedger;
