const router = require("express").Router();
const {
  getSupplies,
  addSupply,
  getSupplyByProduct,
  getSupplyBySupplier,
} = require("../controllers/supplyController");

router.get("/", getSupplies);
router.post("/", addSupply);
router.get("/product/:productId", getSupplyByProduct);
router.get("/supplier/:supplierId", getSupplyBySupplier);

module.exports = router;