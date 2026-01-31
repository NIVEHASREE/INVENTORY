export default function ProductDetailModal({ product, onClose }) {
  if (!product) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Product details</h3>
          <button className="edit-btn" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <p><strong>Name:</strong> {product.productName}</p>
          <p><strong>SKU:</strong> {product.productId}</p>
          <p><strong>Category:</strong> {product.productCategory}</p>
          <p><strong>Available:</strong> {product.quantityAvailable}</p>
          <p><strong>Cost:</strong> ${product.costPrice}</p>
          <p><strong>Selling:</strong> ${product.sellingPrice}</p>
          <p><strong>Units Sold:</strong> {product.unitsSold}</p>
          <p><strong>Source:</strong> {product.source}</p>
          <p><strong>Last Updated:</strong> {new Date(product.lastUpdated).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
} 