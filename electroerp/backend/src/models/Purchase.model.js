import mongoose from 'mongoose';

const { Schema } = mongoose;

const PurchaseItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number },
    gstRate: { type: Number, default: 18 },
    hsnCode: { type: String },
    taxableAmount: { type: Number },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    gstAmount: { type: Number },
    totalAmount: { type: Number },
}, { _id: false });

const PurchaseSchema = new Schema({
    purchaseNumber: { type: String, unique: true },
    purchaseDate: { type: Date, default: Date.now, index: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    items: [PurchaseItemSchema],
    subtotal: { type: Number },
    totalDiscount: { type: Number, default: 0 },
    totalTaxable: { type: Number },
    totalGST: { type: Number },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    grandTotal: { type: Number },
    paymentStatus: { type: String, enum: ['paid', 'partial', 'credit'], default: 'credit' },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    supplierInvoiceNo: { type: String, trim: true },
    invoicePdfUrl: { type: String },
    isInterstate: { type: Boolean, default: false },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

PurchaseSchema.index({ purchaseDate: -1 });
PurchaseSchema.index({ supplier: 1, purchaseDate: -1 });

const Purchase = mongoose.model('Purchase', PurchaseSchema);
export default Purchase;
