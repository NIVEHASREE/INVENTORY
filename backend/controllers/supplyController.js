const Supply = require("../models/Supply");
const Product = require("../models/Product");

// GET all supplies
exports.getSupplies = async (req, res, next) => {
  try {
    const supplies = await Supply.find()
      .populate("supplier_id", "supplier_name contact_person")
      .populate("product_id", "productName productCategory")
      .sort({ createdAt: -1 });
    res.json(supplies);
  } catch (error) {
    next(error);
  }
};

// ADD supply
exports.addSupply = async (req, res, next) => {
  try {
    const { supplier_id, product_id, quantity_supplied, unit_cost } = req.body;
    if (!supplier_id || !product_id || !quantity_supplied || !unit_cost) {
      return res.status(400).json({ message: "Missing required supply fields" });
    }

    // Calculate total cost
    const total_cost = quantity_supplied * unit_cost;

    // Create supply record
    const supply = await Supply.create({
      supplier_id,
      product_id,
      supply_date: req.body.supply_date || Date.now(),
      quantity_supplied,
      unit_cost,
      total_cost,
    });

    // Update product quantity in stock (quantityAvailable)
    await Product.findByIdAndUpdate(
      product_id,
      { $inc: { quantityAvailable: quantity_supplied } },
      { runValidators: true }
    );

    // Return populated supply record
    const populatedSupply = await Supply.findById(supply._id)
      .populate("supplier_id", "supplier_name contact_person")
      .populate("product_id", "productName productCategory");

    res.status(201).json(populatedSupply);
  } catch (error) {
    next(error);
  }
};

// GET supply history by product
exports.getSupplyByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const supplies = await Supply.find({ product_id: productId })
      .populate("supplier_id", "supplier_name")
      .sort({ createdAt: -1 });
    res.json(supplies);
  } catch (error) {
    next(error);
  }
};

// GET supply history by supplier
exports.getSupplyBySupplier = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const supplies = await Supply.find({ supplier_id: supplierId })
      .populate("product_id", "productName productCategory")
      .sort({ createdAt: -1 });
    res.json(supplies);
  } catch (error) {
    next(error);
  }
};