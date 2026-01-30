const Product = require("../models/Product");

// GET all products
exports.getProducts = async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
};

// ADD product
exports.addProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
};

// UPDATE product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const updated = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  res.json(updated);
};
