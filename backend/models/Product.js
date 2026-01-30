const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true },
    category: { type: String, required: true },

    cost_price: { type: Number, required: true },
    selling_price: { type: Number, required: true },
    quantity_in_stock: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
