import axios from "axios";

const URL = "http://localhost:5000/api/suppliers";

export const fetchSuppliers = () => axios.get(URL);
export const addSupplier = (data) => axios.post(URL, data);
export const updateSupplier = (id, data) => axios.put(`${URL}/${id}`, data);
export const deleteSupplier = (id) => axios.delete(`${URL}/${id}`);