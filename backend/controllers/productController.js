const productService = require("../services/productService");
const asyncHandler = require("../middleware/asyncHandler");

// GET all products
exports.getProducts = asyncHandler(async (req, res) => {
  const products = await productService.getAll();
  res.json(products);
});

// GET product by id
exports.getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productService.getById(id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

// ADD product
exports.addProduct = asyncHandler(async (req, res) => {
  const product = await productService.create(req.body);
  res.status(201).json(product);
});

// UPDATE product
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await productService.update(id, req.body);
  res.json(updated);
});

// DELETE product
exports.deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const removed = await productService.delete(id);
  if (!removed) return res.status(404).json({ message: "Product not found" });
  res.status(204).send();
});
