// src/pages/Stock.jsx
import { useEffect, useState } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

function Badge({ estado }) {
  const map = {
    ok: "bg-success",
    parcial: "bg-warning",
    agotado: "bg-danger",
  };
  return (
    <span className={`badge ${map[estado] || "bg-secondary"}`}>{estado}</span>
  );
}

function Alerta({ alerta }) {
  const map = {
    "sin-datos": "bg-secondary",
    ok: "bg-success",
    amarillo: "bg-warning",
    rojo: "bg-danger",
  };
  const label =
    {
      "sin-datos": "Sin datos",
      ok: "OK",
      amarillo: "2 semanas",
      rojo: "1 semana",
    }[alerta] || alerta;
  return (
    <span className={`badge ${map[alerta] || "bg-secondary"}`}>{label}</span>
  );
}

export default function Stock() {
  const { token } = useAuth();
  const [lotes, setLotes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    try {
      const [r1, r2] = await Promise.all([
        axiosAuth.get("/api/stock/produccion"),
        axiosAuth.get("/api/stock/insumos"),
      ]);
      setLotes(r1.data || []);
      setInsumos(r2.data || []);
      setError("");
    } catch (err) {
      console.error("❌ Error al cargar stock:", err);
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 401
            ? "Sesión inválida. Volvé a iniciar sesión."
            : status === 403
            ? "Acceso denegado. Verificá que la empresa/tokens coincidan."
            : "No se pudo cargar el stock.")
      );
      setLotes([]);
      setInsumos([]);
    }
  };

  useEffect(() => {
    if (token) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div>
      <h3 className="mb-3">📦 Stock</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* PRODUCCIÓN */}
      <div className="card p-3 mb-4">
        <h5 className="mb-3">Stock de Producción (últimos lotes primero)</h5>
        {lotes.length === 0 ? (
          <p>No hay producciones registradas.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Lote</th>
                  <th>Cantidad original</th>
                  <th>Remanente</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {[...lotes]
                  .sort((a, b) => {
                    const byFecha =
                      new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
                    if (byFecha !== 0) return byFecha;
                    return String(b.lote).localeCompare(String(a.lote));
                  })
                  .map((l) => (
                    <tr key={l.id}>
                      <td>{l.fecha}</td>
                      <td>{l.producto}</td>
                      <td>{l.lote}</td>
                      <td>{l.cantidad}</td>
                      <td>
                        {l.remanente}
                        {l.remanente <= 0 && (
                          <span className="badge bg-danger ms-2">
                            Agotado / Consumido
                          </span>
                        )}
                      </td>
                      <td>
                        <Badge estado={l.estado} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSUMOS */}
      <div className="card p-3">
        <h5 className="mb-3">Stock de Insumos</h5>
        {insumos.length === 0 ? (
          <p>No hay insumos registrados.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Insumo</th>
                  <th>Unidad</th>
                  <th>Stock</th>
                  <th>Precio unit. prom.</th>
                  <th>Consumo diario (14d)</th>
                  <th>Cobertura (días)</th>
                  <th>Alerta</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((i, idx) => (
                  <tr key={`${i.insumo}-${i.unidad}-${idx}`}>
                    <td>{i.insumo}</td>
                    <td>{i.unidad}</td>
                    <td>{i.stock}</td>
                    <td>
                      $
                      {i.precio_unitario_promedio?.toFixed?.(2) ??
                        i.precio_unitario_promedio}
                    </td>
                    <td>{i.consumo_diario_promedio_14d}</td>
                    <td>{i.cobertura_dias ?? "-"}</td>
                    <td>
                      <Alerta alerta={i.alerta} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
