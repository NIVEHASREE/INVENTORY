import mongoose from 'mongoose';

const { Schema } = mongoose;

const CategorySchema = new Schema({
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Category = mongoose.model('Category', CategorySchema);
export default Category;
