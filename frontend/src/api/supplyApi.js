import axios from "axios";

const URL = "http://localhost:5000/api/supplies";

export const fetchSupplies = () => axios.get(URL);
export const addSupply = (data) => axios.post(URL, data);
export const getSupplyByProduct = (productId) => 
  axios.get(`${URL}/product/${productId}`);
export const getSupplyBySupplier = (supplierId) => 
  axios.get(`${URL}/supplier/${supplierId}`);