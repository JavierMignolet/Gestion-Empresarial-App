// src/pages/Compras.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

const fmtMoney = (n) =>
  n == null || n === "" ? "-" : `$${Number(n).toFixed(2)}`;

export default function Compras() {
  const { token, empresa, role } = useAuth();

  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    fecha: "",
    tipo: "insumo", // insumo | gasto | capital
    proveedor_id: "",
    descripcion: "",
    unidad: "",
    cantidad: "",
    precio_unitario: "",
  });

  const [filtros, setFiltros] = useState({
    fecha: "",
    tipo: "",
    proveedor: "",
    descripcion: "",
  });

  // ===== API =====
  const fetchCompras = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosAuth.get("/api/compras");
      setCompras(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("GET /api/compras", err);
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 401
            ? "Sesión inválida o expirada. Iniciá sesión nuevamente."
            : status === 403
            ? "Acceso denegado. Verificá empresa/rol."
            : err?.code === "ERR_NETWORK"
            ? "No se pudo conectar con la API (VITE_API_BASE/CORS)."
            : "No se pudieron cargar las compras.")
      );
      setCompras([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && empresa) fetchCompras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, empresa]);

  // ===== Handlers =====
  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleFiltroChange = (e) =>
    setFiltros((s) => ({ ...s, [e.target.name]: e.target.value }));

  const resetForm = () => {
    setEditId(null);
    setFormVisible(false);
    setForm({
      fecha: "",
      tipo: "insumo",
      proveedor_id: "",
      descripcion: "",
      unidad: "",
      cantidad: "",
      precio_unitario: "",
    });
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const payload = {
        ...form,
        cantidad: parseFloat(form.cantidad),
        precio_unitario: parseFloat(form.precio_unitario),
      };

      if (
        Number.isNaN(payload.cantidad) ||
        Number.isNaN(payload.precio_unitario)
      ) {
        setError("Cantidad y Precio Unitario deben ser numéricos.");
        return;
      }

      if (editId) {
        await axiosAuth.put(`/api/compras/${editId}`, payload);
        setMensaje("✅ Compra actualizada");
      } else {
        await axiosAuth.post("/api/compras", payload);
        setMensaje("✅ Compra registrada");
      }

      resetForm();
      fetchCompras();
      setTimeout(() => setMensaje(""), 2500);
    } catch (err) {
      console.error("SAVE /api/compras", err);
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 403
            ? "Acceso denegado (solo admin / empresa inválida)."
            : status === 401
            ? "Sesión inválida o expirada."
            : "No se pudo guardar la compra.")
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar compra?")) return;
    setError("");
    try {
      await axiosAuth.delete(`/api/compras/${id}`);
      fetchCompras();
    } catch (err) {
      console.error("DELETE /api/compras", err);
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 403
            ? "Acceso denegado (solo admin / empresa inválida)."
            : status === 401
            ? "Sesión inválida o expirada."
            : "No se pudo eliminar la compra.")
      );
    }
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setForm({
      fecha: (c.fecha || "").slice(0, 10),
      tipo: c.tipo || "insumo",
      proveedor_id: c.proveedor_id ?? "",
      descripcion: c.descripcion ?? "",
      unidad: c.unidad ?? "",
      cantidad: c.cantidad ?? "",
      precio_unitario: c.precio_unitario ?? "",
    });
    setFormVisible(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ===== Derivados =====
  const comprasFiltradas = useMemo(() => {
    return (compras || []).filter((c) => {
      const fechaStr = (c.fecha || "").slice(0, 10);
      return (
        (!filtros.fecha || fechaStr.includes(filtros.fecha)) &&
        (!filtros.tipo || c.tipo === filtros.tipo) &&
        (!filtros.proveedor ||
          String(c.proveedor_id || "")
            .toLowerCase()
            .includes(filtros.proveedor.toLowerCase())) &&
        (!filtros.descripcion ||
          String(c.descripcion || "")
            .toLowerCase()
            .includes(filtros.descripcion.toLowerCase()))
      );
    });
  }, [compras, filtros]);

  return (
    <div>
      <h3>🛒 Compras</h3>

      <div className="mb-3 d-flex align-items-center gap-2">
        {role === "admin" && (
          <button
            className="btn btn-primary"
            onClick={() => {
              if (formVisible) resetForm();
              else setFormVisible(true);
            }}
          >
            {formVisible ? "Cancelar" : "➕ Agregar compra"}
          </button>
        )}
        {mensaje && <span className="text-success">{mensaje}</span>}
      </div>

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-light"
            onClick={fetchCompras}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Formulario */}
      {formVisible && role === "admin" && (
        <div className="card p-3 mb-4">
          <div className="row g-2">
            <div className="col-md-2">
              <input
                type="date"
                name="fecha"
                className="form-control"
                value={form.fecha}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <select
                name="tipo"
                className="form-select"
                value={form.tipo}
                onChange={handleChange}
              >
                <option value="insumo">Insumo</option>
                <option value="gasto">Gasto</option>
                <option value="capital">Capital</option>
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="text"
                name="proveedor_id"
                placeholder="Proveedor"
                className="form-control"
                value={form.proveedor_id}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <input
                type="text"
                name="descripcion"
                placeholder="Descripción"
                className="form-control"
                value={form.descripcion}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-1">
              <input
                type="text"
                name="unidad"
                placeholder="Unidad"
                className="form-control"
                value={form.unidad}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-1">
              <input
                type="number"
                name="cantidad"
                placeholder="Cantidad"
                className="form-control"
                value={form.cantidad}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-1">
              <input
                type="number"
                name="precio_unitario"
                placeholder="Precio $"
                className="form-control"
                value={form.precio_unitario}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-1">
              <button className="btn btn-success w-100" onClick={handleSubmit}>
                {editId ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <h5>🔎 Filtros</h5>
      <div className="row g-2 mb-3">
        <div className="col">
          <input
            name="fecha"
            type="date"
            value={filtros.fecha}
            onChange={handleFiltroChange}
            className="form-control"
          />
        </div>
        <div className="col">
          <select
            name="tipo"
            value={filtros.tipo}
            onChange={handleFiltroChange}
            className="form-select"
          >
            <option value="">Todos</option>
            <option value="insumo">Insumo</option>
            <option value="gasto">Gasto</option>
            <option value="capital">Capital</option>
          </select>
        </div>
        <div className="col">
          <input
            name="proveedor"
            placeholder="Proveedor"
            value={filtros.proveedor}
            onChange={handleFiltroChange}
            className="form-control"
          />
        </div>
        <div className="col">
          <input
            name="descripcion"
            placeholder="Descripción"
            value={filtros.descripcion}
            onChange={handleFiltroChange}
            className="form-control"
          />
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-3">Cargando...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Proveedor</th>
                <th>Descripción</th>
                <th>Unidad</th>
                <th>Cantidad</th>
                <th>Precio U.</th>
                <th>Total</th>
                {role === "admin" && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {comprasFiltradas.map((c) => {
                const total =
                  c.total != null
                    ? c.total
                    : Number(c.cantidad || 0) * Number(c.precio_unitario || 0);
                return (
                  <tr key={c.id}>
                    <td>
                      {c.fecha ? new Date(c.fecha).toLocaleDateString() : "-"}
                    </td>
                    <td>{c.tipo}</td>
                    <td>{c.proveedor_id}</td>
                    <td>{c.descripcion}</td>
                    <td>{c.unidad}</td>
                    <td>{c.cantidad}</td>
                    <td>{fmtMoney(c.precio_unitario)}</td>
                    <td>{fmtMoney(total)}</td>
                    {role === "admin" && (
                      <td className="text-nowrap">
                        <button
                          className="btn btn-warning btn-sm me-2"
                          onClick={() => handleEdit(c)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(c.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {comprasFiltradas.length === 0 && (
                <tr>
                  <td
                    colSpan={role === "admin" ? 9 : 8}
                    className="text-center"
                  >
                    Sin registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
