import { useState, useEffect } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

function Gastos() {
  const { token } = useAuth();

  const [gastos, setGastos] = useState([]);
  const [form, setForm] = useState({
    concepto: "",
    categoria: "",
    monto: "",
    fecha: "",
    usuario: "admin",
  });

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [editId, setEditId] = useState(null);

  const fetchGastos = async () => {
    try {
      const res = await axiosAuth.get("/api/gastos");
      setGastos(res.data || []);
    } catch (err) {
      console.error("Error al obtener gastos", err);
    }
  };

  useEffect(() => {
    if (token) fetchGastos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resetForm = () => {
    setForm({
      concepto: "",
      categoria: "",
      monto: "",
      fecha: "",
      usuario: "admin",
    });
    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "monto" && Number(value) < 0) return;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      monto: form.monto === "" ? "" : Number(form.monto),
    };

    try {
      if (editId) {
        await axiosAuth.put(`/api/gastos/${editId}`, payload);
        setMensajeExito("✅ Gasto actualizado con éxito");
      } else {
        await axiosAuth.post("/api/gastos", payload);
        setMensajeExito("✅ Gasto registrado con éxito");
      }

      await fetchGastos();
      resetForm();
      setMostrarFormulario(false);
      setTimeout(() => setMensajeExito(""), 3000);
    } catch (err) {
      console.error("Error al guardar/actualizar gasto", err);
    }
  };

  const handleEdit = (g) => {
    setForm({
      concepto: g.concepto || "",
      categoria: g.categoria || "",
      monto: g.monto ?? "",
      fecha: g.fecha ? g.fecha.slice(0, 10) : "",
      usuario: g.usuario || "admin",
    });
    setEditId(g.id);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    try {
      await axiosAuth.delete(`/api/gastos/${id}`);
      fetchGastos();
    } catch (err) {
      console.error("Error al eliminar gasto", err);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Gastos</h2>

      {!mostrarFormulario && (
        <button
          className="btn btn-primary mb-3"
          onClick={() => {
            resetForm();
            setMostrarFormulario(true);
          }}
        >
          ➕ Agregar gasto
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
                placeholder="Ej: Yerba, agua, bolsas"
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
                <option value="agua">Agua</option>
                <option value="comida">Comida empleados</option>
                <option value="limpieza">Limpieza</option>
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
                placeholder="Ej: 2500"
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

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-success">
                {editId ? "Actualizar" : "Guardar gasto"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  resetForm();
                  setMostrarFormulario(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <h5>Gastos registrados</h5>
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th>Usuario</th>
              <th style={{ width: 140 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastos.map((gasto) => (
              <tr key={gasto.id}>
                <td>
                  {gasto.fecha
                    ? new Date(gasto.fecha).toLocaleDateString()
                    : "-"}
                </td>
                <td>{gasto.concepto}</td>
                <td>{gasto.categoria}</td>
                <td>${Number(gasto.monto || 0).toLocaleString()}</td>
                <td>{gasto.usuario || "admin"}</td>
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => handleEdit(gasto)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(gasto.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {gastos.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center">
                  No hay gastos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Gastos;
