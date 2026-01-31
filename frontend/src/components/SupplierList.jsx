import { useEffect, useState } from "react";
import { fetchSuppliers, deleteSupplier } from "../api/supplierApi";

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const res = await fetchSuppliers();
    setSuppliers(res.data);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      await deleteSupplier(id);
      loadSuppliers();
    }
  };

  const sampleSuppliers = [
    { _id: "s-1", supplier_name: "ABC Distributors", contact_person: "Ravi", phone: "9876543210", email: "abc@dist.com", address: "Trichy" },
    { _id: "s-2", supplier_name: "ElectroParts", contact_person: "Meena", phone: "9876501234", email: "meena@electro.com", address: "Chennai" },
  ];

  const display = suppliers.length ? suppliers : sampleSuppliers;

  return (
    <div className="card">
      <h3>Suppliers {suppliers.length === 0 && <small style={{ marginLeft: 8, color: '#64748b' }}>(example data)</small>}</h3>
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact Person</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {display.map((supplier) => (
            <tr key={supplier._id}>
              <td>{supplier.supplier_name}</td>
              <td>{supplier.contact_person}</td>
              <td>{supplier.phone}</td>
              <td>{supplier.email}</td>
              <td>
                {suppliers.length ? (
                  <button 
                    className="edit-btn"
                    onClick={() => handleDelete(supplier._id)}
                  >
                    Delete
                  </button>
                ) : (
                  <span style={{ color: '#94a3b8' }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}