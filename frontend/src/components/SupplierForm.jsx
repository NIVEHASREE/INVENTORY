import { useState } from "react";
import { addSupplier } from "../api/supplierApi";

export default function SupplierForm({ onAdd }) {
  const [form, setForm] = useState({
    supplier_name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addSupplier(form);
    onAdd();
    setForm({
      supplier_name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
    });
  };

  return (
    <div className="form-box">
      <h3>Add Supplier</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            name="supplier_name"
            placeholder="Supplier Name"
            value={form.supplier_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            name="contact_person"
            placeholder="Contact Person"
            value={form.contact_person}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="primary-btn">
          Add Supplier
        </button>
      </form>
    </div>
  );
}