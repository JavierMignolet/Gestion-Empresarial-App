// src/utils/axiosAuth.js
import axios from "axios";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
  "http://localhost:4000";

const axiosAuth = axios.create({
  baseURL: API_BASE,
});

function readSession() {
  const stores = [localStorage, sessionStorage];
  const keys = ["session", "auth"]; // primero la actual
  for (const st of stores) {
    for (const k of keys) {
      const raw = st.getItem(k);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
    }
  }
  return null;
}

axiosAuth.interceptors.request.use((config) => {
  const s = readSession();
  // formato guardado por AuthContext: { token, empresa, user: {…} }
  const token = s?.token || s?.user?.token;
  const empresa = s?.empresa || s?.user?.empresa;

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (empresa) config.headers["x-company"] = empresa;
  return config;
});

export default axiosAuth;
