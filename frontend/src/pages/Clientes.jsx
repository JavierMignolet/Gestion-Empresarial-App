// src/pages/Clientes.jsx
import { useEffect, useState } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

function Clientes() {
  const { token, empresa, role, logout } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    cuit_dni: "",
    direccion: "",
    telefono: "",
    email: "",
    condicion_iva: "",
  });

  const fetchClientes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosAuth.get("/api/clientes");
      setClientes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("GET /api/clientes", err);
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 401
          ? "Sesión inválida o expirada. Iniciá sesión nuevamente."
          : status === 403
          ? "Acceso denegado. Verificá que la empresa del token coincida y tu rol."
          : err?.code === "ERR_NETWORK"
          ? "No se pudo conectar con la API. Revisá VITE_API_BASE/CORS."
          : "No se pudieron cargar los clientes.");
      setError(msg);
      setClientes([]);
      // Deslogueo opcional ante 401/403 para evitar loops
      // if (status === 401 || status === 403) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && empresa) fetchClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, empresa]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openNuevo = () => {
    setEditMode(false);
    setFormData({
      id: null,
      nombre: "",
      cuit_dni: "",
      direccion: "",
      telefono: "",
      email: "",
      condicion_iva: "",
    });
    setShowModal(true);
  };

  const openEditar = (cliente) => {
    setEditMode(true);
    setFormData({
      id: cliente.id ?? null,
      nombre: cliente.nombre ?? "",
      cuit_dni: cliente.cuit_dni ?? "",
      direccion: cliente.direccion ?? "",
      telefono: cliente.telefono ?? "",
      email: cliente.email ?? "",
      condicion_iva: cliente.condicion_iva ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editMode) {
        await axiosAuth.put(`/api/clientes/${formData.id}`, formData);
      } else {
        const { id: _ignore, ...payload } = formData;
        await axiosAuth.post("/api/clientes", payload);
      }
      setShowModal(false);
      fetchClientes();
    } catch (err) {
      console.error("SAVE cliente", err);
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 403
            ? "Acceso denegado (solo admin o empresa inválida)."
            : status === 401
            ? "Sesión inválida o expirada."
            : "Error al guardar el cliente.")
      );
    }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm("¿Seguro que querés eliminar este cliente?")) return;
    setError("");
    try {
      await axiosAuth.delete(`/api/clientes/${id}`);
      fetchClientes();
    } catch (err) {
      console.error("DELETE cliente", err);
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 403
            ? "Acceso denegado (solo admin o empresa inválida)."
            : status === 401
            ? "Sesión inválida o expirada."
            : "Error al eliminar el cliente.")
      );
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">Clientes registrados</h3>

        {/* Ocultar acciones de escritura si no es admin */}
        {role === "admin" && (
          <button className="btn btn-primary" onClick={openNuevo}>
            Agregar cliente
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-light"
            onClick={fetchClientes}
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Cargando...</div>
      ) : !clientes || clientes.length === 0 ? (
        <p className="text-center">No hay clientes cargados aún.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>CUIT / DNI</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Cond. IVA</th>
                {role === "admin" && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.nombre}</td>
                  <td>{c.cuit_dni}</td>
                  <td>{c.direccion}</td>
                  <td>{c.telefono}</td>
                  <td>{c.email}</td>
                  <td>{c.condicion_iva}</td>
                  {role === "admin" && (
                    <td className="text-nowrap">
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => openEditar(c)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => eliminarCliente(c.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {editMode ? "Editar cliente" : "Nuevo cliente"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                {[
                  "nombre",
                  "cuit_dni",
                  "direccion",
                  "telefono",
                  "email",
                  "condicion_iva",
                ].map((field) => (
                  <div className="mb-3" key={field}>
                    <label className="form-label">
                      {field.replace("_", " ").toUpperCase()}
                    </label>
                    <input
                      type={field === "email" ? "email" : "text"}
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      className="form-control"
                      required={field === "nombre"}
                    />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editMode ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
