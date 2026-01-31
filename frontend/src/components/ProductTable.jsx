export default function ProductTable({ products, onEdit, onDelete, onView }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h3>Inventory Overview</h3>
        </div>
      </div>

      <div className="table-wrapper">
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
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 40, color: '#94a3b8' }}>
                  No products yet — register the first product using the form on the right.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="cell-primary">
                      <span className="cell-title">{p.productName}</span>
                      <span className="cell-subtitle">SKU · {p.productId?.slice(-6) || p._id.slice(-6)}</span>
                    </div>
                  </td>
                  <td>{p.productCategory}</td>
                  <td>
                    <span className="badge badge-soft">{p.quantityAvailable} units</span>
                  </td>
                  <td>
                    ${p.costPrice} → ${p.sellingPrice}
                  </td>
                  <td>
                    <span className={p.quantityAvailable < 5 ? "status-low" : "status-ok"}>
                      {p.quantityAvailable < 5 ? "Low Stock" : "In stock"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button className="edit-btn" onClick={() => onView && onView(p)}>
                      View
                    </button>
                    <button className="edit-btn" onClick={() => onEdit && onEdit(p)}>
                      Edit
                    </button>
                    <button className="edit-btn" onClick={() => onDelete && onDelete(p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
