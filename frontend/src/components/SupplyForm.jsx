import { useState, useEffect } from "react";
import { addSupply } from "../api/supplyApi";
import { fetchProducts } from "../api/productApi";
import { fetchSuppliers } from "../api/supplierApi";

export default function SupplyForm({ onAdd }) {
  const [form, setForm] = useState({
    supplier_id: "",
    product_id: "",
    quantity_supplied: "",
    unit_cost: "",
    supply_date: new Date().toISOString().split('T')[0],
  });
  
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const productsRes = await fetchProducts();
      const suppliersRes = await fetchSuppliers();
      setProducts(productsRes.data);
      setSuppliers(suppliersRes.data);
    };
    loadData();
  }, []);

  useEffect(() => {
    const cost = parseFloat(form.quantity_supplied || 0) * parseFloat(form.unit_cost || 0);
    setTotalCost(cost.toFixed(2));
  }, [form.quantity_supplied, form.unit_cost]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addSupply({ ...form, total_cost: totalCost });
    onAdd();
    setForm({
      supplier_id: "",
      product_id: "",
      quantity_supplied: "",
      unit_cost: "",
      supply_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="form-box">
      <h3>Record Supply</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <select
            name="supplier_id"
            value={form.supplier_id}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="">Select Supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier._id} value={supplier._id}>
                {supplier.supplier_name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <select
            name="product_id"
            value={form.product_id}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="">Select Product</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.productName || product.product_name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <input
            name="quantity_supplied"
            type="number"
            placeholder="Quantity Supplied"
            value={form.quantity_supplied}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            name="unit_cost"
            type="number"
            step="0.01"
            placeholder="Unit Cost"
            value={form.unit_cost}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            name="supply_date"
            type="date"
            value={form.supply_date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <div className="total-cost">
            Total Cost: ${totalCost}
          </div>
        </div>
        <button type="submit" className="primary-btn">
          Record Supply
        </button>
      </form>
    </div>
  );
}