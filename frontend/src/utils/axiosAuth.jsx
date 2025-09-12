// src/utils/axiosAuth.js
import axios from "axios";

/**
 * Base de la API: usa VITE_API_BASE en prod (Vercel) y localhost en dev.
 * En el código de las páginas llamá SIEMPRE rutas relativas: "/api/...".
 */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
  "http://localhost:4000";

const axiosAuth = axios.create({
  baseURL: API_BASE,
});

// Antes de cada request, agrega token y empresa desde localStorage.session
axiosAuth.interceptors.request.use((config) => {
  try {
    const raw =
      localStorage.getItem("session") || sessionStorage.getItem("session");
    const session = raw ? JSON.parse(raw) : null;
    if (session?.token)
      config.headers.Authorization = `Bearer ${session.token}`;
    if (session?.empresa) config.headers["x-company"] = session.empresa;
  } catch {
    /* noop */
  }
  return config;
});

export default axiosAuth;
