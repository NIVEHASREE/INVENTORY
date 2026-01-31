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

  return (
    <div className="card">
      <h3>Suppliers</h3>
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
          {suppliers.map((supplier) => (
            <tr key={supplier._id}>
              <td>{supplier.supplier_name}</td>
              <td>{supplier.contact_person}</td>
              <td>{supplier.phone}</td>
              <td>{supplier.email}</td>
              <td>
                <button 
                  className="edit-btn"
                  onClick={() => handleDelete(supplier._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}