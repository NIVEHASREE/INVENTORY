const router = require("express").Router();
const {
  getProducts,
  addProduct,
  updateProduct,
} = require("../controllers/productController");

router.get("/", getProducts);
router.post("/", addProduct);
router.put("/:id", updateProduct);

module.exports = router;
