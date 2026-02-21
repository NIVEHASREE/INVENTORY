import mongoose from 'mongoose';

const { Schema } = mongoose;

const ProductSchema = new Schema({
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    sku: { type: String, required: [true, 'SKU is required'], unique: true, uppercase: true },
    barcode: { type: String, trim: true, sparse: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    brand: { type: String, trim: true },
    unit: { type: String, enum: ['pcs', 'mtr', 'box', 'roll', 'kg', 'set', 'pair'], default: 'pcs' },
    costPrice: { type: Number, required: [true, 'Cost price is required'], min: 0 },
    sellingPrice: { type: Number, required: [true, 'Selling price is required'], min: 0 },
    mrp: { type: Number, min: 0 },
    gstRate: { type: Number, enum: [0, 5, 12, 18, 28], default: 18 },
    hsnCode: { type: String, trim: true },
    stockQty: { type: Number, default: 0 },
    minStockQty: { type: Number, default: 5 },
    location: { type: String, trim: true },
    images: [String],
    isActive: { type: Boolean, default: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    description: { type: String },
}, { timestamps: true });

// Indexes
ProductSchema.index({ name: 'text', sku: 'text', barcode: 'text', brand: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ stockQty: 1, minStockQty: 1 });
ProductSchema.index({ isActive: 1 });

// Virtual for profit margin
ProductSchema.virtual('profitMargin').get(function () {
    if (this.costPrice === 0) return 0;
    return parseFloat((((this.sellingPrice - this.costPrice) / this.costPrice) * 100).toFixed(2));
});

ProductSchema.set('toJSON', { virtuals: true });

const Product = mongoose.model('Product', ProductSchema);
export default Product;
