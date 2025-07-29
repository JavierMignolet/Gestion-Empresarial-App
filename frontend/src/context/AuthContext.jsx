import { createContext, useContext, useState, useEffect } from "react";

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para acceder al contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    username: null,
    role: null,
    token: null,
  });

  // Al iniciar, cargar sesión desde localStorage
  useEffect(() => {
    const storedAuth = JSON.parse(localStorage.getItem("auth"));
    if (storedAuth?.token) {
      setAuth(storedAuth);
    }
  }, []);

  // Función para hacer login
  const login = ({ username, role, token }) => {
    const newAuth = { username, role, token };
    setAuth(newAuth);
    localStorage.setItem("auth", JSON.stringify(newAuth));
  };

  // Función para cerrar sesión
  const logout = () => {
    setAuth({ username: null, role: null, token: null });
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
