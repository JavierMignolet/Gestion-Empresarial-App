import { useEffect, useState } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

const fmtCurrency = (n) => {
  const val = Number(n ?? 0);
  if (Number.isNaN(val)) return "$0";
  return val.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
};

export default function Insumos() {
  const { token } = useAuth();
  const [insumos, setInsumos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchInsumos = async () => {
    try {
      setLoading(true);
      const res = await axiosAuth.get("/api/insumos");
      setInsumos(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error("GET /api/insumos", err);
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 401
            ? "Sesión inválida. Iniciá sesión nuevamente."
            : status === 403
            ? "Acceso denegado."
            : "No se pudieron cargar los insumos.")
      );
      setInsumos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInsumos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div>
      <h3 className="mb-3 text-center">Resumen de Insumos</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p className="text-center">Cargando…</p>
      ) : insumos.length === 0 ? (
        <p className="text-center">No hay insumos registrados.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Insumo</th>
                <th>Cantidad total</th>
                <th>Unidad</th>
                <th>Precio unitario promedio</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((insumo, index) => {
                // algunos backends devuelven "precio_unitario_promedio"
                const precio =
                  insumo.precio_unitario ??
                  insumo.precio_unitario_promedio ??
                  0;
                return (
                  <tr key={`${insumo.insumo}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{insumo.insumo}</td>
                    <td>
                      {Number(insumo.cantidad_total ?? 0).toLocaleString(
                        "es-AR"
                      )}
                    </td>
                    <td>{insumo.unidad || "-"}</td>
                    <td>{fmtCurrency(precio)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
