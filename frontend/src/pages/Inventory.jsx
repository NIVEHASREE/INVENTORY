import "../styles/inventory.css";
import { useEffect, useState, useMemo } from "react";
import { fetchProducts, deleteProduct } from "../api/productApi";
import ProductTable from "../components/ProductTable";
import ProductForm from "../components/ProductForm";
import ProductDetailModal from "../components/ProductDetailModal";
import SupplierList from "../components/SupplierList";
import SupplierForm from "../components/SupplierForm";
import SupplyList from "../components/SupplyList";
import SupplyForm from "../components/SupplyForm";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [activeSection, setActiveSection] = useState("products");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProducts();
  }, [refreshKey]);

  const loadProducts = async () => {
    const res = await fetchProducts();
    setProducts(res.data);
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete product "${p.productName}"? This action cannot be undone.`)) return;
    try {
      await deleteProduct(p._id);
      setRefreshKey((k) => k + 1);
      alert("Product deleted");
    } catch (err) {
      alert(err?.response?.data?.message || "Unable to delete product");
    }
  };

  const handleView = (p) => {
    setDetailProduct(p);
  };

  const onSaved = () => {
    setSelectedProduct(null);
    setDetailProduct(null);
    setRefreshKey((k) => k + 1);
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(term) ||
        p.productCategory.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const lowStockCount = products.filter((p) => p.quantityAvailable < 5).length;
  const totalInventoryValue = products
    .reduce((sum, p) => sum + (p.quantityAvailable ?? 0) * (p.sellingPrice ?? 0), 0)
    .toFixed(2);
  const averageMargin = products.length
    ? (
        products.reduce((acc, p) => acc + ((p.sellingPrice ?? 0) - (p.costPrice ?? 0)), 0) /
        products.length
      ).toFixed(2)
    : 0;

  return (
    <main className="main">
      <div className="topbar">
        <div className="topbar-title">
          <p className="eyebrow">Senthil Murugan Electricals</p>
          <h1>Inventory</h1>
          <p className="topbar-subtitle">Products, suppliers and inbound supplies in one place.</p>
        </div>
        <div className="topbar-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search products, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="section-tabs">
            <button className={`tab ${activeSection === "products" ? "active" : ""}`} onClick={() => setActiveSection("products")}>Products</button>
            <button className={`tab ${activeSection === "suppliers" ? "active" : ""}`} onClick={() => setActiveSection("suppliers")}>Suppliers</button>
            <button className={`tab ${activeSection === "supplies" ? "active" : ""}`} onClick={() => setActiveSection("supplies")}>Supplies</button>
            <button type="button" className="ghost-btn" onClick={loadProducts}>Refresh</button>
          </div>
        </div>
      </div>

      <div className="stats-container">
        <div className="stat-box">
          <span className="stat-icon">📦</span>
          <div className="stat-title">Total Products</div>
          <div className="stat-value">{products.length}</div>
          <p className="stat-meta">{filteredProducts.length} currently visible</p>
        </div>
        <div className="stat-box">
          <span className="stat-icon">⚠️</span>
          <div className="stat-title">Low Stock Items</div>
          <div className="stat-value">{lowStockCount}</div>
          <p className="stat-meta">Threshold set at 5 units</p>
        </div>
        <div className="stat-box">
          <span className="stat-icon">💰</span>
          <div className="stat-title">Total Value</div>
          <div className="stat-value">${totalInventoryValue}</div>
          <p className="stat-meta">Avg margin ${averageMargin}</p>
        </div>
      </div>

      <div className="grid">
        {activeSection === "products" && (
          <>
            <ProductTable products={filteredProducts} onEdit={(p) => setSelectedProduct(p)} onDelete={handleDelete} onView={handleView} />
            <ProductForm key={selectedProduct?._id || "new"} product={selectedProduct} onSaved={onSaved} />
            {detailProduct && (
              <ProductDetailModal product={detailProduct} onClose={() => setDetailProduct(null)} />
            )}
          </>
        )} 

        {activeSection === "suppliers" && (
          <>
            <SupplierList key={refreshKey} />
            <SupplierForm onAdd={() => setRefreshKey((k) => k + 1)} />
          </>
        )}

        {activeSection === "supplies" && (
          <>
            <SupplyList key={refreshKey} />
            <SupplyForm onAdd={() => setRefreshKey((k) => k + 1)} />
          </>
        )}
      </div>
    </main>
  );
}