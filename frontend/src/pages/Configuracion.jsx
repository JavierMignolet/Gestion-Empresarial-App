// src/pages/Configuracion.jsx
import { useEffect, useState } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

// --- configuración flexible del endpoint de objetivos ---
const DEFAULT_OBJ_URL =
  import.meta?.env?.VITE_OBJETIVOS_URL || "/api/config/objetivos";
const OBJ_URL_CANDIDATES = [
  DEFAULT_OBJ_URL,          // primero .env si lo definiste
  "/api/config/objetivos",  // ruta recomendada
  "/api/objetivos",         // alternativas típicas
  "/api/reportes/objetivos",
];

export default function Configuracion() {
  const { token, empresa, role } = useAuth();

  // ---- Tabs: 'usuarios' | 'objetivos'
  const [tab, setTab] = useState("usuarios");

  // ---------------- USUARIOS (igual que antes) ----------------
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

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
    setLoading(true);
    setError("");
    try {
      const res = await axiosAuth.get("/api/config/cuentas");
      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("GET /api/config/cuentas", err);
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 401
            ? "Sesión inválida o expirada. Iniciá sesión nuevamente."
            : status === 403
            ? "Acceso denegado. Verificá tu rol y la empresa del token."
            : err?.code === "ERR_NETWORK"
            ? "No se pudo conectar con la API (revisá VITE_API_BASE/CORS)."
            : "No se pudieron cargar las cuentas.")
      );
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && empresa && tab === "usuarios") fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, empresa, tab]);

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
        await axiosAuth.put(`/api/config/cuentas/${form.id}`, payload);
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
        await axiosAuth.post("/api/config/cuentas", payload);
        setOkMsg("✅ Usuario creado.");
      }
      setShowModal(false);
      resetForm();
      fetchUsuarios();
      setTimeout(() => setOkMsg(""), 2200);
    } catch (err) {
      console.error("SAVE /api/config/cuentas", err);
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 403
          ? "Acceso denegado (solo admin / empresa inválida)."
          : status === 401
          ? "Sesión inválida o expirada."
          : "Error al guardar.");
      setError(msg);
    }
  };

  const eliminar = async (u) => {
    if (!window.confirm(`¿Eliminar usuario "${u.username}"?`)) return;
    setError("");
    try {
      await axiosAuth.delete(`/api/config/cuentas/${u.id}`);
      fetchUsuarios();
    } catch (err) {
      console.error("DELETE /api/config/cuentas", err);
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 403
            ? "Acceso denegado (solo admin / empresa inválida)."
            : status === 401
            ? "Sesión inválida o expirada."
            : "No se pudo eliminar.")
      );
    }
  };

  // ---------------- OBJETIVOS (nuevo y robusto) ----------------
  const [objUrl, setObjUrl] = useState(DEFAULT_OBJ_URL);
  const [obj, setObj] = useState({
    objetivo_mensual_unidades: "",
    objetivo_semestral_unidades: "",
    objetivo_anual_unidades: "",
  });
  const [objLoading, setObjLoading] = useState(false);
  const [objError, setObjError] = useState("");
  const [objOk, setObjOk] = useState("");

  // intenta descubrir la URL correcta probando candidatos
  const resolveObjUrl = async () => {
    for (const url of OBJ_URL_CANDIDATES) {
      try {
        const r = await axiosAuth.get(url);
        setObjUrl(url);
        return r.data || {};
      } catch (e) {
        if (e?.response?.status === 404) {
          // probar siguiente candidato
          continue;
        }
        // error distinto a 404: lo propago para informar
        throw e;
      }
    }
    const err = new Error(
      "No existe un endpoint de objetivos en el backend. Creá /api/config/objetivos o definí VITE_OBJETIVOS_URL con tu ruta."
    );
    err.code = "NO_ENDPOINT";
    throw err;
  };

  const fetchObjetivos = async () => {
    setObjLoading(true);
    setObjError("");
    try {
      const data = await resolveObjUrl();
      setObj({
        objetivo_mensual_unidades: data?.objetivo_mensual_unidades ?? 0,
        objetivo_semestral_unidades: data?.objetivo_semestral_unidades ?? 0,
        objetivo_anual_unidades: data?.objetivo_anual_unidades ?? 0,
      });
    } catch (e) {
      console.error("GET objetivos", e);
      setObjError(
        e?.message ||
          e?.response?.data?.message ||
          "No se pudieron cargar los objetivos de ventas."
      );
      setObj({
        objetivo_mensual_unidades: 0,
        objetivo_semestral_unidades: 0,
        objetivo_anual_unidades: 0,
      });
    } finally {
      setObjLoading(false);
    }
  };

  useEffect(() => {
    if (token && empresa && tab === "objetivos") fetchObjetivos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, empresa, tab]);

  const onChangeObj = (e) => {
    const { name, value } = e.target;
    const v = value === "" ? "" : Math.max(0, Number(value));
    setObj((s) => ({ ...s, [name]: v }));
  };

  const guardarObjetivos = async (e) => {
    e.preventDefault();
    setObjError("");
    setObjOk("");
    try {
      const payload = {
        objetivo_mensual_unidades: Number(obj.objetivo_mensual_unidades) || 0,
        objetivo_semestral_unidades:
          Number(obj.objetivo_semestral_unidades) || 0,
        objetivo_anual_unidades: Number(obj.objetivo_anual_unidades) || 0,
      };
      await axiosAuth.put(objUrl, payload);
      setObjOk("✅ Objetivos guardados. Se reflejarán en Reportes → Ventas.");
      setTimeout(() => setObjOk(""), 2200);
    } catch (e) {
      console.error("PUT objetivos", e);
      setObjError(
        e?.response?.status === 404
          ? "La ruta para guardar objetivos no existe en el backend. Creála o ajustá VITE_OBJETIVOS_URL."
          : e?.response?.data?.message || "No se pudieron guardar los objetivos."
      );
    }
  };

  // ---------------- RENDER ----------------
  return (
    <div>
      <h3 className="mb-3">⚙️ Configuración</h3>

      {/* Botones de pestañas */}
      <div className="d-flex gap-2 mb-3 justify-content-center">
        <button
          className={`btn ${
            tab === "usuarios" ? "btn-primary" : "btn-outline-secondary"
          }`}
          onClick={() => setTab("usuarios")}
        >
          👤 Usuarios
        </button>
        <button
          className={`btn ${
            tab === "objetivos" ? "btn-primary" : "btn-outline-secondary"
          }`}
          onClick={() => setTab("objetivos")}
        >
          🎯 Objetivos
        </button>
      </div>

      {/* ======== TAB: USUARIOS ======== */}
      {tab === "usuarios" && (
        <>
          {okMsg && <div className="alert alert-success">{okMsg}</div>}
          {error && (
            <div className="alert alert-danger d-flex justify-content-between align-items-center">
              <span>{error}</span>
              <button
                className="btn btn-sm btn-outline-light"
                onClick={fetchUsuarios}
              >
                Reintentar
              </button>
            </div>
          )}

          <div className="d-flex justify-content-end mb-3">
            {role === "admin" && (
              <button className="btn btn-primary" onClick={openNuevo}>
                ➕ Nuevo usuario
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-3">Cargando...</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    {role === "admin" && <th>Acciones</th>}
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
                      {role === "admin" && (
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
                      )}
                    </tr>
                  ))}
                  {(!usuarios || usuarios.length === 0) && (
                    <tr>
                      <td
                        colSpan={role === "admin" ? 6 : 5}
                        className="text-center"
                      >
                        Sin usuarios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* MODAL USUARIO */}
          {showModal && role === "admin" && (
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
                              showPass
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                            }
                            title={
                              showPass
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
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
        </>
      )}

      {/* ======== TAB: OBJETIVOS ======== */}
      {tab === "objetivos" && (
        <div className="card p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">🎯 Objetivos de ventas</h5>
            <button
              className="btn btn-outline-secondary"
              onClick={fetchObjetivos}
            >
              Recargar
            </button>
          </div>

          <p className="lead">
            Estos objetivos se usan en <strong>Reportes → Ventas</strong> para
            el comparativo.
          </p>

          {objError && <div className="alert alert-danger">{objError}</div>}
          {objOk && <div className="alert alert-success">{objOk}</div>}

          {objLoading ? (
            <div className="text-center py-3">Cargando…</div>
          ) : (
            <form className="row g-3" onSubmit={guardarObjetivos}>
              <div className="col-md-4">
                <label className="form-label">
                  Objetivo mensual (unidades)
                </label>
                <input
                  type="number"
                  className="form-control"
                  name="objetivo_mensual_unidades"
                  value={obj.objetivo_mensual_unidades}
                  onChange={onChangeObj}
                  min={0}
                  disabled={role !== "admin"}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">
                  Objetivo semestral (unidades)
                </label>
                <input
                  type="number"
                  className="form-control"
                  name="objetivo_semestral_unidades"
                  value={obj.objetivo_semestral_unidades}
                  onChange={onChangeObj}
                  min={0}
                  disabled={role !== "admin"}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Objetivo anual (unidades)</label>
                <input
                  type="number"
                  className="form-control"
                  name="objetivo_anual_unidades"
                  value={obj.objetivo_anual_unidades}
                  onChange={onChangeObj}
                  min={0}
                  disabled={role !== "admin"}
                />
              </div>

              <div className="col-12 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={fetchObjetivos}
                >
                  Deshacer cambios
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={role !== "admin"}
                  title={role !== "admin" ? "Solo admin puede guardar" : ""}
                >
                  Guardar objetivos
                </button>
              </div>

              {role !== "admin" && (
                <div className="form-text text-center">
                  (Solo un administrador puede modificar los objetivos)
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
 