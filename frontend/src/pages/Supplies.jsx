import { useState } from "react";
import SupplyList from "../components/SupplyList";
import SupplyForm from "../components/SupplyForm";

export default function Supplies() {
  const [refresh, setRefresh] = useState(false);

  const handleSupplyAdded = () => {
    setRefresh(!refresh);
  };

  return (
    <>
      <div className="topbar">
        <h1>Supply Records</h1>
      </div>

      <div className="grid">
        <SupplyList key={refresh} />
        <SupplyForm onAdd={handleSupplyAdded} />
      </div>
    </>
  );
}