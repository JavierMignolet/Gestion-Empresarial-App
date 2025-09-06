//Sidebar.jsx
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

function Sidebar() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = role === "admin";

  return (
    <div
      className="bg-dark text-white p-3"
      style={{ minHeight: "100vh", width: "220px" }}
    >
      <h5 className="mb-4">Menú</h5>
      <ul className="nav flex-column">
        <li className="nav-item mb-2">
          <Link className="nav-link text-white" to="/dashboard">
            Dashboard
          </Link>
        </li>

        {isAdmin && (
          <>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/clientes">
                Clientes
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/compras">
                Compras
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/ventas">
                Ventas
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/pedidos">
                Pedidos
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/insumos">
                Insumos
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/productos">
                Productos
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/stock">
                Stock
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/produccion">
                Producción
              </Link>
            </li>

            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/pagos">
                Pagos
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/gastos">
                Gastos
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/capital">
                Capital
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/reportes">
                Reportes
              </Link>
            </li>

            {/* 👇 NUEVO LINK: Configuración (solo admin) */}
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/configuracion">
                Configuración
              </Link>
            </li>
          </>
        )}

        {role === "vendedor" && (
          <>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/ventas">
                Ventas
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/compras">
                Compras
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/pedidos">
                Pedidos pendientes
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/stock">
                Stock
              </Link>
            </li>
          </>
        )}

        <li className="nav-item mt-3">
          <button
            onClick={handleLogout}
            className="btn btn-sm btn-outline-light w-100"
          >
            Cerrar sesión
          </button>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
