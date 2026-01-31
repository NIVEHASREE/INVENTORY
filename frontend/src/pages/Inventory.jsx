import "../styles/inventory.css";
import { useEffect, useState } from "react";
import {
  fetchProducts,
  addProduct,
  updateProduct,
} from "../api/productApi";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    product_name: "",
    category: "",
    cost_price: "",
    selling_price: "",
    quantity_in_stock: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const res = await fetchProducts();
    setProducts(res.data);
  };

  const submit = async () => {
    await addProduct(form);
    setForm({
      product_name: "",
      category: "",
      cost_price: "",
      selling_price: "",
      quantity_in_stock: "",
    });
    loadProducts();
  };

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="main">
      <div className="topbar">
        <h1>Inventory</h1>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="stats-container">
        <div className="stat-box">
          <div className="stat-title">Total Products</div>
          <div className="stat-value">{products.length}</div>
          <div className="stat-change positive">
            <span>▲</span> 12% from last month
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-title">Low Stock Items</div>
          <div className="stat-value">{products.filter(p => p.quantity_in_stock < 5).length}</div>
          <div className="stat-change negative">
            <span>▼</span> 5 items need attention
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-title">Total Value</div>
          <div className="stat-value">
            ${products.reduce((sum, p) => sum + (p.quantity_in_stock * p.selling_price), 0).toFixed(2)}
          </div>
          <div className="stat-change positive">
            <span>▲</span> 8% from last month
          </div>
        </div>
      </div>

      <div className="grid">
        {/* TABLE */}
        <div className="card">
          <div className="card-header">
            <h3>Inventory Overview</h3>
            <button className="primary-btn" style={{width: 'auto', margin: 0}}>
              Add Product
            </button>
          </div>

          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Pricing</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p._id}>
                  <td>{p.product_name}</td>
                  <td>{p.category}</td>
                  <td>{p.quantity_in_stock}</td>
                  <td>
                    ${p.cost_price} → ${p.selling_price}
                  </td>
                  <td>
                    <span
                      className={
                        p.quantity_in_stock < 5
                          ? "status-low"
                          : "status-ok"
                      }
                    >
                      {p.quantity_in_stock < 5 ? "Low Stock" : "In stock"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => setEditProduct(p)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FORM */}
        <div className="form-box">
          {!editProduct ? (
            <>
              <h3>Register Product</h3>

              <div className="form-group">
                <input
                  placeholder="Product name"
                  value={form.product_name}
                  onChange={(e) =>
                    setForm({ ...form, product_name: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <input
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder="Cost price"
                  value={form.cost_price}
                  onChange={(e) =>
                    setForm({ ...form, cost_price: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder="Selling price"
                  value={form.selling_price}
                  onChange={(e) =>
                    setForm({ ...form, selling_price: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={form.quantity_in_stock}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantity_in_stock: e.target.value,
                    })
                  }
                />
              </div>

              <button className="primary-btn" onClick={submit}>
                Register Product
              </button>
            </>
          ) : (
            <>
              <h3>Update Product</h3>

              <div className="form-group">
                <input value={editProduct.product_name} disabled />
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={editProduct.quantity_in_stock}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      quantity_in_stock: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder="Cost price"
                  value={editProduct.cost_price}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      cost_price: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <input
                  type="number"
                  placeholder="Selling price"
                  value={editProduct.selling_price}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      selling_price: e.target.value,
                    })
                  }
                />
              </div>

              <button
                className="primary-btn"
                onClick={async () => {
                  await updateProduct(editProduct._id, editProduct);
                  setEditProduct(null);
                  loadProducts();
                }}
              >
                Update
              </button>

              <button
                className="secondary-btn"
                onClick={() => setEditProduct(null)}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}