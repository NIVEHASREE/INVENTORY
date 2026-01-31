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

  const sampleSupplies = [
    { _id: 'sup-1', supply_date: new Date().toISOString(), supplier_id: { supplier_name: 'ABC Distributors' }, product_id: { productName: 'Copper Wire' }, quantity_supplied: 20, unit_cost: 2.5, total_cost: 50 },
  ];

  const display = supplies.length ? supplies : sampleSupplies;

  return (
    <div className="card">
      <h3>Supply Records {supplies.length === 0 && <small style={{ marginLeft: 8, color: '#64748b' }}>(example data)</small>}</h3>
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
          {display.map((supply) => (
            <tr key={supply._id}>
              <td>{new Date(supply.supply_date).toLocaleDateString()}</td>
              <td>{supply.supplier_id?.supplier_name || 'N/A'}</td>
              <td>{supply.product_id?.productName || supply.product_id?.product_name || 'N/A'}</td>
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