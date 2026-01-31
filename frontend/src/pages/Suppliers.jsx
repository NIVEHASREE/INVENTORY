import { useState } from "react";
import SupplierList from "../components/SupplierList";
import SupplierForm from "../components/SupplierForm";

export default function Suppliers() {
  const [refresh, setRefresh] = useState(false);

  const handleSupplierAdded = () => {
    setRefresh(!refresh);
  };

  return (
    <>
      <div className="topbar">
        <h1>Suppliers</h1>
      </div>
      <div className="grid">
        <SupplierList key={refresh} />
        <SupplierForm onAdd={handleSupplierAdded} />
      </div>
    </>
  );
}