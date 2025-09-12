// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

function toTitle(str) {
  if (!str) return "";
  return String(str)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Dashboard() {
  const { token, empresa, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumen, setResumen] = useState({
    pedidosPendientes: 0,
    ventasHoy: 0,
    produccionesHoy: 0,
    stockBajo: 0,
    ultimosPedidos: [],
  });

  useEffect(() => {
    let mounted = true;
    async function fetchResumen() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data } = await axiosAuth.get("/api/reportes/resumen");
        if (!mounted) return;
        setResumen((prev) => ({
          ...prev,
          ...(data || {}),
        }));
        setError("");
      } catch (err) {
        // Si el endpoint no existe en tu API, solo mostramos un aviso suave
        console.warn("Resumen no disponible:", err?.response?.status || err);
        setError("No pudimos cargar el resumen (opcional).");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchResumen();
    return () => {
      mounted = false;
    };
  }, [token]);

  const empresaNice = toTitle(empresa) || "Tu Empresa";

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="mb-2">Bienvenido</h2>
        <p className="text-muted">Iniciá sesión para ver tu panel.</p>
        <Link to="/onboarding" className="btn btn-primary">
          Ir a Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="mb-1">Gestión de {empresaNice}</h2>
      <p className="text-muted">
        {user?.username ? `Hola, ${user.username}. ` : ""}Resumen general del
        sistema.
      </p>

      {loading && <div className="alert alert-info">Cargando datos…</div>}
      {!loading && error && <div className="alert alert-warning">{error}</div>}

      {/* KPIs */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mt-1">
        <div className="col">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">
                Pedidos pendientes
              </h6>
              <h3 className="m-0">{resumen.pedidosPendientes ?? 0}</h3>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Ventas hoy</h6>
              <h3 className="m-0">{resumen.ventasHoy ?? 0}</h3>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">
                Producciones hoy
              </h6>
              <h3 className="m-0">{resumen.produccionesHoy ?? 0}</h3>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Stock bajo</h6>
              <h3 className="m-0">{resumen.stockBajo ?? 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <h5 className="mt-4">Accesos rápidos</h5>
      <div className="d-flex flex-wrap justify-content-center gap-2">
        <Link className="btn btn-outline-primary" to="/clientes">
          Clientes
        </Link>
        <Link className="btn btn-outline-primary" to="/productos">
          Productos
        </Link>
        <Link className="btn btn-outline-primary" to="/pedidos">
          Pedidos
        </Link>
        <Link className="btn btn-outline-primary" to="/compras">
          Compras
        </Link>
        <Link className="btn btn-outline-primary" to="/produccion">
          Producción
        </Link>
        <Link className="btn btn-outline-primary" to="/capital">
          Capital
        </Link>
        <Link className="btn btn-outline-primary" to="/reportes">
          Reportes
        </Link>
        <Link className="btn btn-outline-secondary" to="/config">
          Usuarios
        </Link>
      </div>

      {/* Últimos pedidos (si viene del resumen) */}
      {Array.isArray(resumen.ultimosPedidos) &&
        resumen.ultimosPedidos.length > 0 && (
          <>
            <h5 className="mt-4">Últimos pedidos</h5>
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.ultimosPedidos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.fecha_pedido
                          ? new Date(p.fecha_pedido).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>{p.cliente_nombre || "-"}</td>
                      <td>{p.producto_nombre || "-"}</td>
                      <td>{p.cantidad ?? "-"}</td>
                      <td>
                        <span className="badge bg-secondary">{p.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
    </div>
  );
}
