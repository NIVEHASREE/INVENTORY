const Product = require("../models/Product");

exports.getAll = async () => {
  return Product.find().sort({ createdAt: -1 });
};

exports.getById = async (id) => {
  return Product.findById(id);
};

exports.create = async (payload) => {
  // Basic input mapping / sanitization
  const allowed = {
    productName: payload.productName,
    productCategory: payload.productCategory,
    quantityAvailable: payload.quantityAvailable ?? 0,
    costPrice: payload.costPrice,
    sellingPrice: payload.sellingPrice,
    unitsSold: payload.unitsSold ?? 0,
    source: payload.source ?? "supplier",
  };

  const product = new Product(allowed);
  return product.save();
};

exports.update = async (id, payload) => {
  // Only allow specific fields to be updated
  const allowed = {};
  [
    "productName",
    "productCategory",
    "quantityAvailable",
    "costPrice",
    "sellingPrice",
    "unitsSold",
    "source",
  ].forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(payload, k)) allowed[k] = payload[k];
  });

  const updated = await Product.findByIdAndUpdate(id, allowed, {
    new: true,
    runValidators: true,
  });

  return updated;
};

exports.delete = async (id) => {
  return Product.findByIdAndDelete(id);
};