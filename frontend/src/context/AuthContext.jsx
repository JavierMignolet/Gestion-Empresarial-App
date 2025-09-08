// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:4000";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [user, setUser] = useState(null); // { username, role }

  // Cargar sesión guardada
  useEffect(() => {
    const raw = localStorage.getItem("session");
    if (raw) {
      try {
        const s = JSON.parse(raw);
        setToken(s.token || null);
        setEmpresa(s.empresa || null);
        setUser(s.user || null);
      } catch {}
    }
  }, []);

  const saveSession = ({ token, empresa, username, role }) => {
    const session = { token, empresa, user: { username, role } };
    localStorage.setItem("session", JSON.stringify(session));
    setToken(token);
    setEmpresa(empresa);
    setUser({ username, role });
  };

  const clearSession = () => {
    localStorage.removeItem("session");
    setToken(null);
    setEmpresa(null);
    setUser(null);
  };

  // Cliente Axios autenticado con headers automáticos
  const axiosAuth = useMemo(() => {
    const instance = axios.create({ baseURL: `${API_BASE}` });
    instance.interceptors.request.use((config) => {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      if (empresa) config.headers["x-company"] = empresa;
      return config;
    });
    return instance;
  }, [token, empresa]);

  const login = async ({ empresa, username, password }) => {
    const res = await axios.post(
      `${API_BASE}/api/auth/login`,
      { empresa, username, password },
      { headers: { "x-company": empresa } }
    );
    const { token, role, username: uName, empresa: emp } = res.data || {};
    saveSession({ token, empresa: emp || empresa, username: uName, role });
    return res.data;
  };

  const logout = () => clearSession();

  const value = {
    token,
    empresa,
    user,
    role: user?.role ?? null,
    axiosAuth,
    login,
    logout,
    saveSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
