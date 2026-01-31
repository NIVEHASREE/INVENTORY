const mongoose = require("mongoose");
const crypto = require("crypto");

const MIN_PRICE = 0.01;

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      unique: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    productCategory: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    quantityAvailable: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    costPrice: {
      type: Number,
      required: true,
      min: MIN_PRICE,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: MIN_PRICE,
      validate: {
        validator(value) {
          return value >= this.costPrice;
        },
        message: "Selling price must be greater than or equal to cost price.",
      },
    },
    unitsSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    source: {
      type: String,
      enum: ["supplier", "distributor", "shop", "other"],
      default: "supplier",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const createProductId = () =>
  `PRD-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

productSchema.pre("save", function (next) {
  if (!this.productId) {
    this.productId = createProductId();
  }
  this.lastUpdated = new Date();
  next();
});

productSchema.pre("findOneAndUpdate", function (next) {
  this.setOptions({ runValidators: true, new: true });
  const update = this.getUpdate();
  if (update) {
    const costPrice =
      typeof update.costPrice === "number" ? update.costPrice : undefined;
    const sellingPrice =
      typeof update.sellingPrice === "number" ? update.sellingPrice : undefined;

    if (
      typeof sellingPrice === "number" &&
      ((typeof costPrice === "number" && sellingPrice < costPrice) ||
        (!costPrice && update.$set &&
          sellingPrice < update.$set.costPrice))
    ) {
      return next(
        new Error("Selling price must be greater than or equal to cost price.")
      );
    }
  }

  this.set({ lastUpdated: new Date() });
  next();
});

module.exports = mongoose.model("Product", productSchema);
