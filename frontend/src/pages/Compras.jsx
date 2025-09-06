//Compras.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Compras() {
  const { token } = useAuth();
  const [compras, setCompras] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    fecha: "",
    tipo: "insumo",
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

  const fetchCompras = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/compras", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompras(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error al obtener compras:", err);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...form,
        cantidad: parseFloat(form.cantidad),
        precio_unitario: parseFloat(form.precio_unitario),
      };

      if (isNaN(data.cantidad) || isNaN(data.precio_unitario)) {
        alert("Cantidad y Precio Unitario deben ser numéricos.");
        return;
      }

      if (editId) {
        await axios.put(`http://localhost:4000/api/compras/${editId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMensaje("✅ Compra editada con éxito");
      } else {
        await axios.post("http://localhost:4000/api/compras", data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMensaje("✅ Compra guardada con éxito");
      }

      setFormVisible(false);
      setEditId(null);
      setForm({
        fecha: "",
        tipo: "insumo",
        proveedor_id: "",
        descripcion: "",
        unidad: "",
        cantidad: "",
        precio_unitario: "",
      });
      fetchCompras();
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error al guardar/editar compra:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar compra?")) {
      try {
        await axios.delete(`http://localhost:4000/api/compras/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchCompras();
      } catch (error) {
        console.error("Error al eliminar compra:", error);
      }
    }
  };

  const handleEdit = (compra) => {
    setForm({
      fecha: compra.fecha || "",
      tipo: compra.tipo || "insumo",
      proveedor_id: compra.proveedor_id || "",
      descripcion: compra.descripcion || "",
      unidad: compra.unidad || "",
      cantidad: compra.cantidad || "",
      precio_unitario: compra.precio_unitario || "",
    });
    setEditId(compra.id);
    setFormVisible(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const comprasFiltradas = compras.filter((c) => {
    return (
      (!filtros.fecha || c.fecha.includes(filtros.fecha)) &&
      (!filtros.tipo || c.tipo === filtros.tipo) &&
      (!filtros.proveedor ||
        (c.proveedor_id + "")
          .toLowerCase()
          .includes(filtros.proveedor.toLowerCase())) &&
      (!filtros.descripcion ||
        c.descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase()))
    );
  });

  return (
    <div>
      <h3>🛒 Compras</h3>

      <div className="mb-3">
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormVisible(!formVisible);
            setForm({
              fecha: "",
              tipo: "insumo",
              proveedor_id: "",
              descripcion: "",
              unidad: "",
              cantidad: "",
              precio_unitario: "",
            });
            setEditId(null);
          }}
        >
          {formVisible ? "Cancelar" : "➕ Agregar compra"}
        </button>
        {mensaje && <div className="alert alert-success mt-2">{mensaje}</div>}
      </div>

      {formVisible && (
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

      {/* FILTROS */}
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

      {/* TABLA */}
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
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {comprasFiltradas.map((c) => (
            <tr key={c.id}>
              <td>{c.fecha}</td>
              <td>{c.tipo}</td>
              <td>{c.proveedor_id}</td>
              <td>{c.descripcion}</td>
              <td>{c.unidad}</td>
              <td>{c.cantidad}</td>
              <td>${c.precio_unitario}</td>
              <td>${c.total}</td>
              <td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Compras;
