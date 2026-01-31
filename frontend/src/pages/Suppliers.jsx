import { useState } from "react";
import SupplierList from "../components/SupplierList";
import SupplierForm from "../components/SupplierForm";

export default function Suppliers() {
  const [refresh, setRefresh] = useState(false);

  const handleSupplierAdded = () => {
    setRefresh(!refresh);
  };

  return (
    <section className="main">
      <div className="topbar">
        <div className="topbar-title">
          <p className="eyebrow">Partnership radar</p>
          <h1>Supplier Network</h1>
          <p className="topbar-subtitle">
            Track relationship health, onboarding status, and response velocity.
          </p>
        </div>
      </div>

      <div className="grid">
        <SupplierList key={refresh} />
        <SupplierForm onAdd={handleSupplierAdded} />
      </div>
    </section>
  );
}