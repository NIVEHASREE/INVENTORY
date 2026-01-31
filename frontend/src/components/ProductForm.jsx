import { useState, useEffect } from "react";
import { addProduct, updateProduct } from "../api/productApi";

export default function ProductForm({ onSaved, product }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    productName: "",
    productCategory: "",
    quantityAvailable: 0,
    costPrice: "",
    sellingPrice: "",
    source: "supplier",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (product) {
      setForm({
        productName: product.productName || "",
        productCategory: product.productCategory || "",
        quantityAvailable: product.quantityAvailable ?? 0,
        costPrice: product.costPrice ?? "",
        sellingPrice: product.sellingPrice ?? "",
        source: product.source || "supplier",
      });
    }
  }, [product]);

  const validate = () => {
    setError("");
    if (!form.productName || !form.productCategory) {
      setError("Name and category are required.");
      return false;
    }
    if (parseFloat(form.costPrice) <= 0 || parseFloat(form.sellingPrice) <= 0) {
      setError("Cost and selling price must be positive numbers.");
      return false;
    }
    if (parseFloat(form.sellingPrice) < parseFloat(form.costPrice)) {
      setError("Selling price must be greater than or equal to cost price.");
      return false;
    }
    if (parseInt(form.quantityAvailable) < 0) {
      setError("Quantity cannot be negative.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!validate()) return;

    const payload = {
      productName: form.productName,
      productCategory: form.productCategory,
      quantityAvailable: Number(form.quantityAvailable),
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      source: form.source,
    };

    try {
      if (isEdit) {
        await updateProduct(product._id, payload);
      } else {
        await addProduct(payload);
      }
      onSaved();
      if (!isEdit) {
        setForm({ productName: "", productCategory: "", quantityAvailable: 0, costPrice: "", sellingPrice: "", source: "supplier" });
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save product");
    }
  };

  return (
    <div className="form-box">
      <p className="eyebrow">{isEdit ? "Quick edit" : "New entry"}</p>
      <h3>{isEdit ? "Update Product" : "Register Product"}</h3>
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <input
          placeholder="Product name"
          value={form.productName}
          onChange={(e) => setForm({ ...form, productName: e.target.value })}
        />
      </div>

      <div className="form-group">
        <input
          placeholder="Category"
          value={form.productCategory}
          onChange={(e) => setForm({ ...form, productCategory: e.target.value })}
        />
      </div>

      <div className="form-group">
        <input
          type="number"
          placeholder="Cost price"
          value={form.costPrice}
          onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
        />
      </div>

      <div className="form-group">
        <input
          type="number"
          placeholder="Selling price"
          value={form.sellingPrice}
          onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
        />
      </div>

      <div className="form-group">
        <input
          type="number"
          placeholder="Quantity"
          value={form.quantityAvailable}
          onChange={(e) => setForm({ ...form, quantityAvailable: e.target.value })}
        />
      </div>

      <div className="form-actions">
        <button className="primary-btn" onClick={handleSubmit}>
          {isEdit ? "Update" : "Register Product"}
        </button>
        {isEdit && (
          <button className="secondary-btn ghost" onClick={onSaved}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
