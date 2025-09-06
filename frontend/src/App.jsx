// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Onboarding from "./pages/Onboarding"; // <- reemplaza al Login clásico
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Productos from "./pages/Productos";
import Insumos from "./pages/Insumos";
import Stock from "./pages/Stock";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Produccion from "./pages/Produccion";
import Compras from "./pages/Compras";
import Ventas from "./pages/Ventas";
import Pagos from "./pages/Pagos";
import Gastos from "./pages/Gastos";
import Capital from "./pages/Capital";
import Pedidos from "./pages/Pedidos";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import ResetPassword from "./pages/ResetPassword";

// RUTA PRIVADA
const PrivateRoute = ({ children, roleRequired }) => {
  const { token, empresa, user } = useAuth();
  const role = user?.role;

  if (!token || !empresa) return <Navigate to="/login" replace />;

  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex">
          <Sidebar />
          <div className="flex-grow-1">
            <Navbar />
            <div className="container mt-4">
              <Routes>
                {/* Mantengo /login pero muestra el onboarding (registrar empresa / ingresar) */}
                <Route path="/login" element={<Onboarding />} />
                <Route path="/reset" element={<ResetPassword />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/clientes"
                  element={
                    <PrivateRoute roleRequired="admin">
                      <Clientes />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/compras"
                  element={
                    <PrivateRoute>
                      <Compras />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/ventas"
                  element={
                    <PrivateRoute>
                      <Ventas />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/pedidos"
                  element={
                    <PrivateRoute>
                      <Pedidos />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/productos"
                  element={
                    <PrivateRoute roleRequired="admin">
                      <Productos />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/insumos"
                  element={
                    <PrivateRoute roleRequired="admin">
                      <Insumos />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/stock"
                  element={
                    <PrivateRoute>
                      <Stock />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/produccion"
                  element={
                    <PrivateRoute roleRequired="admin">
                      <Produccion />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/pagos"
                  element={
                    <PrivateRoute roleRequired="admin">
                      <Pagos />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/gastos"
                  element={
                    <PrivateRoute roleRequired="admin">
                      <Gastos />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/capital"
                  element={
                    <PrivateRoute roleRequired="admin">
                      <Capital />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/reportes"
                  element={
                    <PrivateRoute roleRequired="admin">
                      <Reportes />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/configuracion"
                  element={
                    <PrivateRoute roleRequired="admin">
                      <Configuracion />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
