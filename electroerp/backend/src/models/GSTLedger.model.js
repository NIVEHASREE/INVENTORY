import mongoose from 'mongoose';

const { Schema } = mongoose;

const GSTLedgerSchema = new Schema({
    type: { type: String, enum: ['INPUT', 'OUTPUT'], required: true, index: true },
    referenceModel: { type: String, enum: ['Purchase', 'Bill'] },
    referenceId: { type: Schema.Types.ObjectId, refPath: 'referenceModel' },
    referenceNo: { type: String },
    date: { type: Date, required: true, index: true },
    month: { type: Number, min: 1, max: 12 },
    year: { type: Number },
    hsnCode: { type: String },
    taxableAmount: { type: Number },
    gstRate: { type: Number },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    totalGST: { type: Number },
    isInterstate: { type: Boolean, default: false },
    party: {
        name: String,
        gstin: String,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

GSTLedgerSchema.index({ type: 1, year: 1, month: 1 });
GSTLedgerSchema.index({ date: -1 });
GSTLedgerSchema.index({ year: 1, month: 1 });

const GSTLedger = mongoose.model('GSTLedger', GSTLedgerSchema);
export default GSTLedger;
