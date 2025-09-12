// src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layouts
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Páginas públicas
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

// Páginas privadas
import Dashboard from "./pages/Dashboard";
import Ventas from "./pages/Ventas";
import Pedidos from "./pages/Pedidos";
import Productos from "./pages/Productos";
import Produccion from "./pages/Produccion";
import Compras from "./pages/Compras";
import Gastos from "./pages/Gastos";
import Clientes from "./pages/Clientes";
import Stock from "./pages/Stock";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";

// ---- Guard ----
function RequireAuth({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/onboarding" replace />;
  return children;
}

// ---- Layouts ----
function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="container mt-3">
        <Outlet />
      </main>
    </>
  );
}

function PrivateLayout() {
  return (
    <>
      <Navbar />
      <Sidebar />
      {/* en desktop el .with-sidebar hace el offset; en mobile el sidebar es drawer */}
      <main className="with-sidebar container mt-3">
        <Outlet />
      </main>
    </>
  );
}

// ---- App Root ----
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route element={<PublicLayout />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Redirigir raíz pública al dashboard (si ya tiene sesión, el guard te lleva igual) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Privadas */}
          <Route
            element={
              <RequireAuth>
                <PrivateLayout />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/produccion" element={<Produccion />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
