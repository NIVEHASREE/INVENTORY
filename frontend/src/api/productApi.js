import axios from "axios";

const URL = "http://localhost:5000/api/products";

export const fetchProducts = () => axios.get(URL);
export const getProduct = (id) => axios.get(`${URL}/${id}`);
export const addProduct = (data) => axios.post(URL, data);
export const updateProduct = (id, data) => axios.put(`${URL}/${id}`, data);
export const deleteProduct = (id) => axios.delete(`${URL}/${id}`);
