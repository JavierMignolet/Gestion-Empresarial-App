// src/pages/Gastos.jsx
import { useEffect, useState } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

const fmtCurrency = (n) => {
  const val = Number(n ?? 0);
  if (Number.isNaN(val)) return "$0";
  return val.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
};

export default function Gastos() {
  const { token } = useAuth();

  const [gastos, setGastos] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    concepto: "",
    categoria: "",
    monto: "",
    fecha: "",
    usuario: "admin", // si tu backend lo ignora, no molesta
  });

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

  const fetchGastos = async () => {
    try {
      const { data } = await axiosAuth.get("/api/gastos");
      setGastos(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 401
            ? "Sesión inválida. Iniciá sesión nuevamente."
            : status === 403
            ? "Acceso denegado."
            : "No se pudieron cargar los gastos.")
      );
      setGastos([]);
    }
  };

  useEffect(() => {
    if (token) fetchGastos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "monto") {
      // bloquear negativos
      if (value !== "" && Number(value) < 0) return;
    }
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    const payload = {
      ...form,
      monto:
        form.monto === "" || form.monto === null
          ? null
          : Number.parseFloat(form.monto),
      fecha: form.fecha || null,
    };

    if (payload.monto !== null && Number.isNaN(payload.monto)) {
      return setError("El monto debe ser un número válido.");
    }

    try {
      if (editId) {
        await axiosAuth.put(`/api/gastos/${editId}`, payload);
        setOk("✅ Gasto actualizado con éxito");
      } else {
        await axiosAuth.post("/api/gastos", payload);
        setOk("✅ Gasto registrado con éxito");
      }
      await fetchGastos();
      resetForm();
      setFormOpen(false);
      setTimeout(() => setOk(""), 2500);
    } catch (err) {
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 403
            ? "Acceso denegado (solo admin / empresa inválida)."
            : "Error al guardar el gasto.")
      );
    }
  };

  const onEdit = (g) => {
    setForm({
      concepto: g.concepto || "",
      categoria: g.categoria || "",
      monto: g.monto ?? "",
      fecha: g.fecha ? String(g.fecha).slice(0, 10) : "",
      usuario: g.usuario || "admin",
    });
    setEditId(g.id);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    try {
      await axiosAuth.delete(`/api/gastos/${id}`);
      fetchGastos();
    } catch (err) {
      const status = err?.response?.status;
      setError(
        err?.response?.data?.message ||
          (status === 403
            ? "Acceso denegado (solo admin / empresa inválida)."
            : "Error al eliminar el gasto.")
      );
    }
  };

  return (
    <div>
      <h2 className="mb-3 text-center">Gastos</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {ok && <div className="alert alert-success">{ok}</div>}

      {!formOpen && (
        <div className="mb-3 d-flex justify-content-end">
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
          >
            ➕ Agregar gasto
          </button>
        </div>
      )}

      {formOpen && (
        <div className="card p-3 mb-4">
          <form onSubmit={onSubmit} className="row g-2">
            <div className="col-md-4">
              <label className="form-label">Concepto</label>
              <input
                name="concepto"
                className="form-control"
                value={form.concepto}
                onChange={onChange}
                required
                placeholder="Ej: Yerba, agua, bolsas"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Categoría</label>
              <select
                name="categoria"
                className="form-select"
                value={form.categoria}
                onChange={onChange}
                required
              >
                <option value="">Seleccionar</option>
                <option value="agua">Agua</option>
                <option value="comida">Comida empleados</option>
                <option value="limpieza">Limpieza</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Monto</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="monto"
                className="form-control"
                value={form.monto}
                onChange={onChange}
                required
                placeholder="Ej: 2500"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Fecha</label>
              <input
                type="date"
                name="fecha"
                className="form-control"
                value={form.fecha}
                onChange={onChange}
              />
            </div>

            {/* Por compatibilidad si tu backend lo usa */}
            <input type="hidden" name="usuario" value="admin" />

            <div className="col-12 d-flex gap-2">
              <button type="submit" className="btn btn-success">
                {editId ? "Actualizar" : "Guardar gasto"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  resetForm();
                  setFormOpen(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <h5 className="mt-2 text-center">Gastos registrados</h5>
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
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
            {gastos.map((g) => (
              <tr key={g.id}>
                <td>
                  {g.fecha ? new Date(g.fecha).toLocaleDateString() : "-"}
                </td>
                <td>{g.concepto}</td>
                <td>{g.categoria}</td>
                <td>{fmtCurrency(g.monto)}</td>
                <td>{g.usuario || "admin"}</td>
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => onEdit(g)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onDelete(g.id)}
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
