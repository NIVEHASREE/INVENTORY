const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    supplier_name: { type: String, required: true },
    contact_person: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);