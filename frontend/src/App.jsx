import { useState } from "react";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import Supplies from "./pages/Supplies";
import "./styles/inventory.css";

function App() {
  const [activeTab, setActiveTab] = useState("inventory");

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>SANCAX</h2>
        <nav>
          <a 
            className={activeTab === "inventory" ? "active" : ""}
            onClick={() => setActiveTab("inventory")}
          >
            Inventory
          </a>
          <a 
            className={activeTab === "suppliers" ? "active" : ""}
            onClick={() => setActiveTab("suppliers")}
          >
            Suppliers
          </a>
          <a 
            className={activeTab === "supplies" ? "active" : ""}
            onClick={() => setActiveTab("supplies")}
          >
            Supplies
          </a>
        </nav>
      </aside>

      {activeTab === "inventory" && <Inventory />}
      {activeTab === "suppliers" && <Suppliers />}
      {activeTab === "supplies" && <Supplies />}
    </div>
  );
}

export default App;