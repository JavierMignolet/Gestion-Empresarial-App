// src/pages/Configuracion.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:4000";

export default function Configuracion() {
  const { token, empresa } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, "x-company": empresa };

  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // toggles de visibilidad
  const [showPass, setShowPass] = useState(false); // creación
  const [showNewPass, setShowNewPass] = useState(false); // edición

  const [form, setForm] = useState({
    id: null,
    username: "",
    role: "vendedor",
    email: "",
    telefono: "",
    password: "",
    newPassword: "",
  });

  const resetForm = () =>
    setForm({
      id: null,
      username: "",
      role: "vendedor",
      email: "",
      telefono: "",
      password: "",
      newPassword: "",
    });

  const fetchUsuarios = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/config/cuentas`, {
        headers,
      });
      setUsuarios(res.data || []);
    } catch (err) {
      console.error("GET cuentas", err);
      setError("No se pudieron cargar las cuentas.");
    }
  };

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNuevo = () => {
    setEditMode(false);
    resetForm();
    setShowPass(false);
    setShowNewPass(false);
    setShowModal(true);
  };

  const openEditar = (u) => {
    setEditMode(true);
    setForm({
      id: u.id,
      username: u.username,
      role: u.role,
      email: u.email || "",
      telefono: u.telefono || "",
      password: "",
      newPassword: "",
    });
    setShowPass(false);
    setShowNewPass(false);
    setShowModal(true);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setOkMsg("");
    try {
      if (editMode) {
        const payload = {
          username: form.username,
          role: form.role,
          email: form.email || "",
          telefono: form.telefono || "",
        };
        if (form.newPassword) {
          if (String(form.newPassword).trim().length < 6) {
            return setError(
              "La nueva contraseña debe tener al menos 6 caracteres."
            );
          }
          payload.newPassword = form.newPassword;
        }

        await axios.put(`${API_BASE}/api/config/cuentas/${form.id}`, payload, {
          headers,
        });
        setOkMsg("✅ Usuario actualizado.");
      } else {
        if (!form.username || !form.password) {
          return setError("Usuario y contraseña son obligatorios.");
        }
        if (String(form.password).trim().length < 6) {
          return setError("La contraseña debe tener al menos 6 caracteres.");
        }
        const payload = {
          username: form.username,
          role: form.role,
          password: form.password,
          email: form.email || "",
          telefono: form.telefono || "",
        };
        await axios.post(`${API_BASE}/api/config/cuentas`, payload, {
          headers,
        });
        setOkMsg("✅ Usuario creado.");
      }
      setShowModal(false);
      resetForm();
      fetchUsuarios();
      setTimeout(() => setOkMsg(""), 2200);
    } catch (err) {
      console.error("save cuenta", err);
      const msg = err?.response?.data?.message || "Error al guardar.";
      setError(msg);
    }
  };

  const eliminar = async (u) => {
    if (!window.confirm(`¿Eliminar usuario "${u.username}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/config/cuentas/${u.id}`, { headers });
      fetchUsuarios();
    } catch (err) {
      console.error("delete cuenta", err);
      setError("No se pudo eliminar.");
    }
  };

  return (
    <div>
      <h3 className="mb-3">⚙️ Configuración de usuarios</h3>

      {okMsg && <div className="alert alert-success">{okMsg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-primary" onClick={openNuevo}>
          ➕ Nuevo usuario
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(usuarios || []).map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>
                  <span
                    className={`badge ${
                      u.role === "admin" ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td>{u.email || "-"}</td>
                <td>{u.telefono || "-"}</td>
                <td className="text-nowrap">
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => openEditar(u)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => eliminar(u)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center">
                  Sin usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={guardar}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {editMode ? "Editar usuario" : "Nuevo usuario"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Usuario</label>
                  <input
                    className="form-control"
                    name="username"
                    value={form.username}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Rol</label>
                  <select
                    className="form-select"
                    name="role"
                    value={form.role}
                    onChange={onChange}
                  >
                    <option value="admin">Administrador</option>
                    <option value="vendedor">Vendedor</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="para recuperar contraseña"
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Teléfono</label>
                  <input
                    className="form-control"
                    name="telefono"
                    value={form.telefono}
                    onChange={onChange}
                    placeholder="+54911..."
                  />
                </div>

                {editMode ? (
                  <div className="mb-2">
                    <label className="form-label">
                      Cambiar contraseña (opcional)
                    </label>
                    <div className="input-group">
                      <input
                        type={showNewPass ? "text" : "password"}
                        className="form-control"
                        name="newPassword"
                        value={form.newPassword}
                        onChange={onChange}
                        placeholder="dejar en blanco para no cambiar"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowNewPass((s) => !s)}
                        aria-label={
                          showNewPass
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                        title={
                          showNewPass
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showNewPass ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                    <div className="form-text">
                      Mínimo 6 caracteres si la cambiás.
                    </div>
                  </div>
                ) : (
                  <div className="mb-2">
                    <label className="form-label">Contraseña</label>
                    <div className="input-group">
                      <input
                        type={showPass ? "text" : "password"}
                        className="form-control"
                        name="password"
                        value={form.password}
                        onChange={onChange}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPass((s) => !s)}
                        aria-label={
                          showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                        title={
                          showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                      >
                        {showPass ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                    <div className="form-text">Mínimo 6 caracteres.</div>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger mt-2">{error}</div>
                )}
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
