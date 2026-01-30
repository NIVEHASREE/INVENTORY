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

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>PulseBill</h2>
        <a className="active">Inventory</a>
      </aside>

      <main className="main">
        <div className="topbar">
          <h1>Inventory</h1>
        </div>

        <div className="grid">
          {/* TABLE */}
          <div className="card">
            <h3>Inventory Overview</h3>

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
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>{p.product_name}</td>
                    <td>{p.category}</td>
                    <td>{p.quantity_in_stock}</td>
                    <td>
                      ₹{p.cost_price} → ₹{p.selling_price}
                    </td>
                    <td
                      className={
                        p.quantity_in_stock < 5
                          ? "status-low"
                          : "status-ok"
                      }
                    >
                      {p.quantity_in_stock < 5 ? "Low Stock" : "In stock"}
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

                <input
                  placeholder="Product name"
                  value={form.product_name}
                  onChange={(e) =>
                    setForm({ ...form, product_name: e.target.value })
                  }
                />

                <input
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />

                <input
                  type="number"
                  placeholder="Cost price"
                  value={form.cost_price}
                  onChange={(e) =>
                    setForm({ ...form, cost_price: e.target.value })
                  }
                />

                <input
                  type="number"
                  placeholder="Selling price"
                  value={form.selling_price}
                  onChange={(e) =>
                    setForm({ ...form, selling_price: e.target.value })
                  }
                />

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

                <button className="primary-btn" onClick={submit}>
                  Register Product
                </button>
              </>
            ) : (
              <>
                <h3>Update Product</h3>

                <input value={editProduct.product_name} disabled />

                <input
                  type="number"
                  value={editProduct.quantity_in_stock}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      quantity_in_stock: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  value={editProduct.cost_price}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      cost_price: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  value={editProduct.selling_price}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      selling_price: e.target.value,
                    })
                  }
                />

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
    </div>
  );
}
