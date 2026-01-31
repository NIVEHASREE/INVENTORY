import { useEffect, useState } from "react";
import { fetchSupplies } from "../api/supplyApi";

export default function SupplyList() {
  const [supplies, setSupplies] = useState([]);

  useEffect(() => {
    loadSupplies();
  }, []);

  const loadSupplies = async () => {
    const res = await fetchSupplies();
    setSupplies(res.data);
  };

  return (
    <div className="card">
      <h3>Supply Records</h3>
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Supplier</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Cost</th>
            <th>Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {supplies.map((supply) => (
            <tr key={supply._id}>
              <td>{new Date(supply.supply_date).toLocaleDateString()}</td>
              <td>{supply.supplier_id?.supplier_name || "N/A"}</td>
              <td>{supply.product_id?.product_name || "N/A"}</td>
              <td>{supply.quantity_supplied}</td>
              <td>${supply.unit_cost}</td>
              <td>${supply.total_cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}