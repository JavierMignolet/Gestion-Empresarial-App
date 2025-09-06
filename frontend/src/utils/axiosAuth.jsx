// /frontend/src/utils/axiosAuth.js
import axios from "axios";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:4000";
const axiosAuth = axios.create({ baseURL: API_BASE });

axiosAuth.interceptors.request.use((config) => {
  // lee token/empresa como los guardes en tu AuthContext
  const token = localStorage.getItem("token");
  const empresa = localStorage.getItem("empresa"); // o slug/razón social exacta
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (empresa) config.headers["x-company"] = empresa; // clave para multi-tenant
  return config;
});

export default axiosAuth;
