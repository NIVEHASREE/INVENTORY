import { useState } from "react";
import SupplyList from "../components/SupplyList";
import SupplyForm from "../components/SupplyForm";

export default function Supplies() {
  const [refresh, setRefresh] = useState(false);

  const handleSupplyAdded = () => {
    setRefresh(!refresh);
  };

  return (
    <section className="main">
      <div className="topbar">
        <div className="topbar-title">
          <p className="eyebrow">Inbound tracking</p>
          <h1>Supply Records</h1>
          <p className="topbar-subtitle">
            Log inbound deliveries and monitor costs per shipment in real time.
          </p>
        </div>
      </div>

      <div className="grid">
        <SupplyList key={refresh} />
        <SupplyForm onAdd={handleSupplyAdded} />
      </div>
    </section>
  );
}