const Supply = require("../models/Supply");
const Product = require("../models/Product");

// GET all supplies
exports.getSupplies = async (req, res) => {
  try {
    const supplies = await Supply.find()
      .populate("supplier_id", "supplier_name contact_person")
      .populate("product_id", "product_name category")
      .sort({ createdAt: -1 });
    res.json(supplies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD supply
exports.addSupply = async (req, res) => {
  try {
    const { supplier_id, product_id, quantity_supplied, unit_cost } = req.body;
    
    // Calculate total cost
    const total_cost = quantity_supplied * unit_cost;
    
    // Create supply record
    const supply = await Supply.create({
      ...req.body,
      total_cost,
    });
    
    // Update product quantity in stock
    await Product.findByIdAndUpdate(
      product_id,
      { $inc: { quantity_in_stock: quantity_supplied } }
    );
    
    // Return populated supply record
    const populatedSupply = await Supply.findById(supply._id)
      .populate("supplier_id", "supplier_name contact_person")
      .populate("product_id", "product_name category");
    
    res.status(201).json(populatedSupply);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET supply history by product
exports.getSupplyByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const supplies = await Supply.find({ product_id: productId })
      .populate("supplier_id", "supplier_name")
      .sort({ createdAt: -1 });
    res.json(supplies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET supply history by supplier
exports.getSupplyBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplies = await Supply.find({ supplier_id: supplierId })
      .populate("product_id", "product_name category")
      .sort({ createdAt: -1 });
    res.json(supplies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};