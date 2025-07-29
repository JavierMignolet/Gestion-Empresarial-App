import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Productos from "./pages/Productos";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

// Componente para proteger rutas privadas
const PrivateRoute = ({ children, roleRequired }) => {
  const { token, role } = useAuth();

  if (!token) return <Navigate to="/login" />;
  if (roleRequired && role !== roleRequired)
    return <Navigate to="/dashboard" />;

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
                <Route path="/login" element={<Login />} />

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
                  path="/productos"
                  element={
                    <PrivateRoute roleRequired="admin">
                      <Productos />
                    </PrivateRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
