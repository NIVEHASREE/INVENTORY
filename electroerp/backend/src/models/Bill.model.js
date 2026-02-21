import mongoose from 'mongoose';

const { Schema } = mongoose;

const BillItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String },
    costPrice: { type: Number },
    sellingPrice: { type: Number, required: true },
    mrp: { type: Number },
    gstRate: { type: Number, default: 18 },
    hsnCode: { type: String },
    discount: { type: Number, default: 0 },
    taxableAmount: { type: Number },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    gstAmount: { type: Number },
    totalAmount: { type: Number },
    profitAmount: { type: Number },
}, { _id: false });

const BillSchema = new Schema({
    billNumber: { type: String, required: true, unique: true },
    billDate: { type: Date, default: Date.now, index: true },
    customer: {
        name: { type: String, default: 'Walk-in Customer' },
        phone: String,
        email: String,
        gstin: String,
        address: String,
    },
    items: [BillItemSchema],
    subtotal: { type: Number },
    totalDiscount: { type: Number, default: 0 },
    totalTaxable: { type: Number },
    totalGST: { type: Number },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    grandTotal: { type: Number },
    roundOff: { type: Number, default: 0 },
    paymentMode: { type: String, enum: ['cash', 'upi', 'card', 'cheque', 'credit'], default: 'cash' },
    paymentStatus: { type: String, enum: ['paid', 'partial', 'credit'], default: 'paid' },
    amountPaid: { type: Number },
    amountDue: { type: Number, default: 0 },
    isInterstate: { type: Boolean, default: false },
    profitAmount: { type: Number },
    invoicePdfUrl: { type: String },
    qrCodeData: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
    isCancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

BillSchema.index({ billDate: -1 });
BillSchema.index({ billDate: -1, paymentStatus: 1 });
BillSchema.index({ createdBy: 1, billDate: -1 });
BillSchema.index({ 'customer.phone': 1 });
BillSchema.index({ isCancelled: 1, billDate: -1 });

const Bill = mongoose.model('Bill', BillSchema);
export default Bill;
