// src/pages/Pagos.jsx
import { useState, useEffect } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

function Pagos() {
  const { token } = useAuth();

  const [pagos, setPagos] = useState([]);
  const [form, setForm] = useState({
    concepto: "",
    categoria: "",
    monto: "",
    fecha: "",
    usuario: "admin",
  });

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [error, setError] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const fetchPagos = async () => {
    try {
      const res = await axiosAuth.get("/api/pagos");
      setPagos(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error("GET /api/pagos", err);
      setError(
        err?.response?.data?.message || "No se pudieron cargar los pagos."
      );
      setPagos([]);
    }
  };

  useEffect(() => {
    if (token) fetchPagos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const cancelarFormulario = () => {
    setForm({
      concepto: "",
      categoria: "",
      monto: "",
      fecha: "",
      usuario: "admin",
    });
    setEditandoId(null);
    setMostrarFormulario(false);
    setTimeout(() => setMensajeExito(""), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        monto: form.monto === "" ? "" : Number(form.monto),
      };

      if (editandoId) {
        await axiosAuth.put(`/api/pagos/${editandoId}`, payload);
        setMensajeExito("✅ Pago actualizado con éxito");
      } else {
        await axiosAuth.post("/api/pagos", payload);
        setMensajeExito("✅ Pago registrado con éxito");
      }

      await fetchPagos();
      cancelarFormulario();
    } catch (err) {
      console.error("SAVE pago", err);
      setError(err?.response?.data?.message || "Error al guardar el pago.");
    }
  };

  const handleEditar = (pago) => {
    setForm({
      concepto: pago.concepto || "",
      categoria: pago.categoria || "",
      monto: pago.monto ?? "",
      fecha: pago.fecha ? String(pago.fecha).slice(0, 10) : "",
      usuario: pago.usuario || "admin",
    });
    setEditandoId(pago.id);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    try {
      await axiosAuth.delete(`/api/pagos/${id}`);
      fetchPagos();
    } catch (err) {
      console.error("DELETE pago", err);
      setError(err?.response?.data?.message || "Error al eliminar el pago.");
    }
  };

  return (
    <div>
      <h2 className="mb-4">Pagos</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {mensajeExito && (
        <div className="alert alert-success">{mensajeExito}</div>
      )}

      {!mostrarFormulario && (
        <button
          className="btn btn-primary mb-3"
          onClick={() => setMostrarFormulario(true)}
        >
          ➕ Agregar pago
        </button>
      )}

      {mostrarFormulario && (
        <div className="card p-3 mb-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label>Concepto</label>
              <input
                type="text"
                name="concepto"
                className="form-control"
                value={form.concepto}
                onChange={handleChange}
                required
                placeholder="Ej: Sueldo julio"
              />
            </div>

            <div className="mb-3">
              <label>Categoría</label>
              <select
                name="categoria"
                className="form-control"
                value={form.categoria}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar</option>
                <option value="sueldos">Sueldos</option>
                <option value="luz">Luz</option>
                <option value="gas">Gas</option>
                <option value="alquiler">Alquiler</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div className="mb-3">
              <label>Monto</label>
              <input
                type="number"
                name="monto"
                className="form-control"
                value={form.monto}
                onChange={handleChange}
                required
                placeholder="Ej: 150000"
                step="0.01"
                min="0"
              />
            </div>

            <div className="mb-3">
              <label>Fecha</label>
              <input
                type="date"
                name="fecha"
                className="form-control"
                value={form.fecha}
                onChange={handleChange}
              />
            </div>

            <input type="hidden" name="usuario" value="admin" />

            <div className="d-flex justify-content-between">
              <button type="submit" className="btn btn-success">
                {editandoId ? "Actualizar" : "Guardar"} pago
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelarFormulario}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <h5>Pagos registrados</h5>
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th>Usuario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(pagos || []).map((pago) => (
              <tr key={pago.id}>
                <td>
                  {pago.fecha ? new Date(pago.fecha).toLocaleDateString() : "-"}
                </td>
                <td>{pago.concepto}</td>
                <td>{pago.categoria}</td>
                <td>${Number(pago.monto || 0).toLocaleString()}</td>
                <td>{pago.usuario || "admin"}</td>
                <td className="text-nowrap">
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => handleEditar(pago)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleEliminar(pago.id)}
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {pagos.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center">
                  No hay pagos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Pagos;
