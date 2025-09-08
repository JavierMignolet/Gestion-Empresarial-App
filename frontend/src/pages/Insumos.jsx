import { useEffect, useState } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

function Insumos() {
  const { token } = useAuth();
  const [insumos, setInsumos] = useState([]);
  const [error, setError] = useState("");

  const fetchInsumos = async () => {
    try {
      const res = await axiosAuth.get("/api/insumos");
      setInsumos(res.data || []);
    } catch (err) {
      console.error("Error al obtener insumos:", err);
      setError("No se pudieron cargar los insumos");
    }
  };

  useEffect(() => {
    if (token) fetchInsumos();
  }, [token]);

  return (
    <div>
      <h3 className="mb-3">Resumen de Insumos</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      {insumos.length === 0 ? (
        <p>No hay insumos registrados.</p>
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
              {insumos.map((insumo, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{insumo.insumo}</td>
                  <td>{insumo.cantidad_total}</td>
                  <td>{insumo.unidad}</td>
                  <td>${parseFloat(insumo.precio_unitario).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Insumos;
