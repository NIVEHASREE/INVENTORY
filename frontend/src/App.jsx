import { useState } from "react";
import Inventory from "./pages/Inventory";
import "./styles/inventory.css";

function App() {
  const [showInventory] = useState(true);

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SME</div>
          <div>
            <p className="eyebrow">Operations Hub</p>
            <h2>Senthil Murugan Electricals</h2>
          </div>
        </div>

        <nav className="nav-list">
          <button
            type="button"
            className={`nav-item active`}
            aria-current="page"
          >
            <span className="nav-icon" aria-hidden>
              📦
            </span>
            <div className="nav-copy">
              <span className="nav-label">Inventory</span>
              <span className="nav-subtitle">Stock & suppliers</span>
            </div>
            <span className="nav-chevron" aria-hidden>
              &#8250;
            </span>
          </button>
        </nav>

        <div className="sidebar-card">
          <p className="eyebrow">Health pulse</p>
          <h3>Realtime insights</h3>
          <p>
            Keep inbound supplies in sync with warehousing capacity using live alerts
            and forecast snapshots.
          </p>
          <span className="badge badge-live">Live</span>
        </div>
      </aside>

      <section className="page-area">
        {showInventory && <Inventory />}
      </section>
    </div>
  );
}

export default App;