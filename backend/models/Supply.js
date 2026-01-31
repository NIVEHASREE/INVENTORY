const mongoose = require("mongoose");

const supplySchema = new mongoose.Schema(
  {
    supplier_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Supplier", 
      required: true 
    },
    product_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    supply_date: { type: Date, required: true, default: Date.now },
    quantity_supplied: { type: Number, required: true },
    unit_cost: { type: Number, required: true },
    total_cost: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supply", supplySchema);