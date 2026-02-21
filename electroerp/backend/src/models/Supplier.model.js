import mongoose from 'mongoose';

const { Schema } = mongoose;

const SupplierSchema = new Schema({
    name: { type: String, required: [true, 'Supplier name is required'], trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    email: { type: String, lowercase: true, trim: true },
    gstin: { type: String, uppercase: true, trim: true },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
    },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    paymentTerms: { type: String, trim: true },
    bankDetails: {
        accountName: String,
        accountNumber: String,
        bankName: String,
        ifscCode: String,
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

SupplierSchema.index({ name: 'text' });
SupplierSchema.index({ isActive: 1 });

const Supplier = mongoose.model('Supplier', SupplierSchema);
export default Supplier;
