//Pagos.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Pagos() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

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
  const [editandoId, setEditandoId] = useState(null);

  const fetchPagos = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/pagos", {
        headers,
      });
      setPagos(res.data);
    } catch (err) {
      console.error("Error al obtener pagos", err);
    }
  };

  useEffect(() => {
    fetchPagos();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await axios.put(`http://localhost:4000/api/pagos/${editandoId}`, form, {
          headers,
        });
        setMensajeExito("✅ Pago actualizado con éxito");
      } else {
        await axios.post("http://localhost:4000/api/pagos", form, { headers });
        setMensajeExito("✅ Pago registrado con éxito");
      }
      fetchPagos();
      cancelarFormulario();
    } catch (err) {
      console.error("Error al guardar pago", err);
    }
  };

  const handleEditar = (pago) => {
    setForm({
      concepto: pago.concepto,
      categoria: pago.categoria,
      monto: pago.monto,
      fecha: pago.fecha.split("T")[0],
      usuario: pago.usuario || "admin",
    });
    setEditandoId(pago.id);
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este pago?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/pagos/${id}`, { headers });
      fetchPagos();
    } catch (err) {
      console.error("Error al eliminar pago", err);
    }
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

  return (
    <div>
      <h2 className="mb-4">Pagos</h2>

      {!mostrarFormulario && (
        <button
          className="btn btn-primary mb-3"
          onClick={() => setMostrarFormulario(true)}
        >
          ➕ Agregar pago
        </button>
      )}

      {mensajeExito && (
        <div className="alert alert-success">{mensajeExito}</div>
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
      <table className="table table-bordered">
        <thead>
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
          {pagos.map((pago) => (
            <tr key={pago.id}>
              <td>{new Date(pago.fecha).toLocaleDateString()}</td>
              <td>{pago.concepto}</td>
              <td>{pago.categoria}</td>
              <td>${pago.monto.toLocaleString()}</td>
              <td>{pago.usuario || "admin"}</td>
              <td>
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
        </tbody>
      </table>
    </div>
  );
}

export default Pagos;
