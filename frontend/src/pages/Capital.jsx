// src/pages/Capital.jsx
import { useEffect, useMemo, useState } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

const fmtMoney = (n) =>
  typeof n === "number"
    ? `$${n.toFixed(2)}`
    : n != null
    ? `$${Number(n).toFixed(2)}`
    : "-";

function RowActions({ onEdit, onDelete }) {
  return (
    <>
      <button className="btn btn-sm btn-warning me-2" onClick={onEdit}>
        Editar
      </button>
      <button className="btn btn-sm btn-danger" onClick={onDelete}>
        Eliminar
      </button>
    </>
  );
}

export default function Capital() {
  const { token } = useAuth();

  const [view, setView] = useState("menu"); // menu | inversion | fijos | cvu | gastos
  const [mensaje, setMensaje] = useState("");

  // ----------- CAPITAL DE INVERSIÓN -----------
  const [invData, setInvData] = useState([]);
  const [invFormOpen, setInvFormOpen] = useState(false);
  const [invEditId, setInvEditId] = useState(null);
  const [invForm, setInvForm] = useState({
    fecha: "",
    descripcion: "",
    tipo: "inversion", // inversion | insumo | capital_trabajo
    cantidad: "",
    precio_unitario: "",
    total: 0,
  });

  // ----------- COSTOS FIJOS -----------
  const [fixData, setFixData] = useState([]);
  const [fixFormOpen, setFixFormOpen] = useState(false);
  const [fixEditId, setFixEditId] = useState(null);
  const [fixForm, setFixForm] = useState({
    fecha: "",
    descripcion: "",
    cantidad: "",
    precio_unitario: "",
    total: 0,
  });

  // ----------- GASTOS -----------
  const [gData, setGData] = useState([]);
  const [gFormOpen, setGFormOpen] = useState(false);
  const [gEditId, setGEditId] = useState(null);
  const [gForm, setGForm] = useState({
    fecha: "",
    descripcion: "",
    cantidad: "",
    precio_unitario: "",
    total: 0,
  });

  // ----------- CVU (solo lectura) -----------
  const [cvu, setCvu] = useState({ detalle: [], total: 0 });

  // ====== LOADERS ======
  const loadInversion = async () => {
    try {
      const { data } = await axiosAuth.get("/api/capital/inversion");
      setInvData(Array.isArray(data) ? data : []);
    } catch (e) {
      setInvData([]);
    }
  };
  const loadFijos = async () => {
    try {
      const { data } = await axiosAuth.get("/api/capital/costos-fijos");
      setFixData(Array.isArray(data) ? data : []);
    } catch (e) {
      setFixData([]);
    }
  };
  const loadGastos = async () => {
    try {
      const { data } = await axiosAuth.get("/api/capital/gastos");
      setGData(Array.isArray(data) ? data : []);
    } catch (e) {
      setGData([]);
    }
  };
  const loadCVU = async () => {
    try {
      const { data } = await axiosAuth.get("/api/capital/cvu");
      setCvu(
        data && typeof data === "object"
          ? {
              detalle: Array.isArray(data.detalle) ? data.detalle : [],
              total: Number(data.total || 0),
            }
          : { detalle: [], total: 0 }
      );
    } catch (e) {
      setCvu({ detalle: [], total: 0 });
    }
  };

  useEffect(() => {
    if (!token) return;
    if (view === "inversion") loadInversion();
    if (view === "fijos") loadFijos();
    if (view === "gastos") loadGastos();
    if (view === "cvu") loadCVU();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, token]);

  const handleAutoTotal = (form, setForm) => (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    const q = parseFloat(next.cantidad) || 0;
    const pu = parseFloat(next.precio_unitario) || 0;
    next.total = +(q * pu).toFixed(2);
    setForm(next);
  };

  const resetMsg = () => setTimeout(() => setMensaje(""), 2200);

  // ====== CRUD Capital de Inversión ======
  const invSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...invForm,
      cantidad: +invForm.cantidad || 0,
      precio_unitario: +invForm.precio_unitario || 0,
      total: +invForm.total || 0,
    };
    if (invEditId) {
      await axiosAuth.put(`/api/capital/inversion/${invEditId}`, payload);
      setMensaje("✅ Inversión actualizada");
    } else {
      await axiosAuth.post("/api/capital/inversion", payload);
      setMensaje("✅ Inversión registrada");
    }
    await loadInversion();
    setInvEditId(null);
    setInvFormOpen(false);
    setInvForm({
      fecha: "",
      descripcion: "",
      tipo: "inversion",
      cantidad: "",
      precio_unitario: "",
      total: 0,
    });
    resetMsg();
  };

  const invEdit = (row) => {
    setInvEditId(row.id);
    setInvForm({
      fecha: row.fecha?.substring(0, 10) || "",
      descripcion: row.descripcion || "",
      tipo: row.tipo || "inversion",
      cantidad: row.cantidad ?? "",
      precio_unitario: row.precio_unitario ?? "",
      total: row.total ?? 0,
    });
    setInvFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const invDelete = async (id) => {
    if (!window.confirm("¿Eliminar ítem de inversión?")) return;
    await axiosAuth.delete(`/api/capital/inversion/${id}`);
    await loadInversion();
  };

  // ====== CRUD Costos Fijos ======
  const fixSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...fixForm,
      cantidad: +fixForm.cantidad || 0,
      precio_unitario: +fixForm.precio_unitario || 0,
      total: +fixForm.total || 0,
    };
    if (fixEditId) {
      await axiosAuth.put(`/api/capital/costos-fijos/${fixEditId}`, payload);
      setMensaje("✅ Costo fijo actualizado");
    } else {
      await axiosAuth.post("/api/capital/costos-fijos", payload);
      setMensaje("✅ Costo fijo registrado");
    }
    await loadFijos();
    setFixEditId(null);
    setFixFormOpen(false);
    setFixForm({
      fecha: "",
      descripcion: "",
      cantidad: "",
      precio_unitario: "",
      total: 0,
    });
    resetMsg();
  };

  const fixEdit = (row) => {
    setFixEditId(row.id);
    setFixForm({
      fecha: row.fecha?.substring(0, 10) || "",
      descripcion: row.descripcion || "",
      cantidad: row.cantidad ?? "",
      precio_unitario: row.precio_unitario ?? "",
      total: row.total ?? 0,
    });
    setFixFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const fixDelete = async (id) => {
    if (!window.confirm("¿Eliminar costo fijo?")) return;
    await axiosAuth.delete(`/api/capital/costos-fijos/${id}`);
    await loadFijos();
  };

  // ====== CRUD Gastos ======
  const gSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...gForm,
      cantidad: +gForm.cantidad || 0,
      precio_unitario: +gForm.precio_unitario || 0,
      total: +gForm.total || 0,
    };
    if (gEditId) {
      await axiosAuth.put(`/api/capital/gastos/${gEditId}`, payload);
      setMensaje("✅ Gasto actualizado");
    } else {
      await axiosAuth.post("/api/capital/gastos", payload);
      setMensaje("✅ Gasto registrado");
    }
    await loadGastos();
    setGEditId(null);
    setGFormOpen(false);
    setGForm({
      fecha: "",
      descripcion: "",
      cantidad: "",
      precio_unitario: "",
      total: 0,
    });
    resetMsg();
  };

  const gEditRow = (row) => {
    setGEditId(row.id);
    setGForm({
      fecha: row.fecha?.substring(0, 10) || "",
      descripcion: row.descripcion || "",
      cantidad: row.cantidad ?? "",
      precio_unitario: row.precio_unitario ?? "",
      total: row.total ?? 0,
    });
    setGFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const gDelete = async (id) => {
    if (!window.confirm("¿Eliminar gasto?")) return;
    await axiosAuth.delete(`/api/capital/gastos/${id}`);
    await loadGastos();
  };

  // ====== Helpers UI ======
  const Back = () => (
    <button
      className="btn btn-outline-secondary mb-3"
      onClick={() => setView("menu")}
    >
      ← Volver
    </button>
  );

  // ====== VISTAS ======
  if (view === "inversion") {
    return (
      <div>
        <Back />
        <h3>🏗️ Capital de inversión</h3>

        <div className="my-3 d-flex align-items-center gap-2">
          <button
            className="btn btn-primary"
            onClick={() => setInvFormOpen((v) => !v)}
          >
            {invFormOpen ? "Cancelar" : "➕ Agregar"}
          </button>
          {mensaje && <span className="text-success">{mensaje}</span>}
        </div>

        {invFormOpen && (
          <div className="card p-3 mb-3">
            <form onSubmit={invSubmit} className="row g-2">
              <div className="col-md-2">
                <input
                  type="date"
                  name="fecha"
                  className="form-control"
                  value={invForm.fecha}
                  onChange={(e) =>
                    setInvForm({ ...invForm, fecha: e.target.value })
                  }
                />
              </div>
              <div className="col-md-4">
                <input
                  name="descripcion"
                  className="form-control"
                  placeholder="Descripción"
                  value={invForm.descripcion}
                  onChange={(e) =>
                    setInvForm({ ...invForm, descripcion: e.target.value })
                  }
                  required
                />
              </div>
              <div className="col-md-2">
                <select
                  name="tipo"
                  className="form-select"
                  value={invForm.tipo}
                  onChange={(e) =>
                    setInvForm({ ...invForm, tipo: e.target.value })
                  }
                >
                  <option value="inversion">Inversión</option>
                  <option value="insumo">Insumo</option>
                  <option value="capital_trabajo">Capital de trabajo</option>
                </select>
              </div>
              <div className="col-md-1">
                <input
                  name="cantidad"
                  type="number"
                  className="form-control"
                  placeholder="Cant."
                  value={invForm.cantidad}
                  onChange={handleAutoTotal(invForm, setInvForm)}
                />
              </div>
              <div className="col-md-1">
                <input
                  name="precio_unitario"
                  type="number"
                  className="form-control"
                  placeholder="PU"
                  value={invForm.precio_unitario}
                  onChange={handleAutoTotal(invForm, setInvForm)}
                />
              </div>
              <div className="col-md-2">
                <input
                  name="total"
                  className="form-control"
                  value={fmtMoney(invForm.total)}
                  disabled
                />
              </div>
              <div className="col-12">
                <button className="btn btn-success">Guardar</button>
              </div>
            </form>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Cant.</th>
                <th>PU</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invData.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.fecha ? new Date(r.fecha).toLocaleDateString() : "-"}
                  </td>
                  <td>{r.descripcion}</td>
                  <td>{r.tipo}</td>
                  <td>{r.cantidad}</td>
                  <td>{fmtMoney(r.precio_unitario)}</td>
                  <td>{fmtMoney(r.total)}</td>
                  <td>
                    <RowActions
                      onEdit={() => invEdit(r)}
                      onDelete={() => invDelete(r.id)}
                    />
                  </td>
                </tr>
              ))}
              {invData.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center">
                    Sin registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (view === "fijos") {
    return (
      <div>
        <Back />
        <h3>🏢 Costos Fijos</h3>

        <div className="my-3 d-flex align-items-center gap-2">
          <button
            className="btn btn-primary"
            onClick={() => setFixFormOpen((v) => !v)}
          >
            {fixFormOpen ? "Cancelar" : "➕ Agregar"}
          </button>
          {mensaje && <span className="text-success">{mensaje}</span>}
        </div>

        {fixFormOpen && (
          <div className="card p-3 mb-3">
            <form onSubmit={fixSubmit} className="row g-2">
              <div className="col-md-2">
                <input
                  type="date"
                  name="fecha"
                  className="form-control"
                  value={fixForm.fecha}
                  onChange={(e) =>
                    setFixForm({ ...fixForm, fecha: e.target.value })
                  }
                />
              </div>
              <div className="col-md-5">
                <input
                  name="descripcion"
                  className="form-control"
                  placeholder="Descripción"
                  value={fixForm.descripcion}
                  onChange={(e) =>
                    setFixForm({ ...fixForm, descripcion: e.target.value })
                  }
                  required
                />
              </div>
              <div className="col-md-1">
                <input
                  name="cantidad"
                  type="number"
                  className="form-control"
                  placeholder="Cant."
                  value={fixForm.cantidad}
                  onChange={handleAutoTotal(fixForm, setFixForm)}
                />
              </div>
              <div className="col-md-1">
                <input
                  name="precio_unitario"
                  type="number"
                  className="form-control"
                  placeholder="PU"
                  value={fixForm.precio_unitario}
                  onChange={handleAutoTotal(fixForm, setFixForm)}
                />
              </div>
              <div className="col-md-2">
                <input
                  name="total"
                  className="form-control"
                  value={fmtMoney(fixForm.total)}
                  disabled
                />
              </div>
              <div className="col-12">
                <button className="btn btn-success">Guardar</button>
              </div>
            </form>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Cant.</th>
                <th>PU</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {fixData.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.fecha ? new Date(r.fecha).toLocaleDateString() : "-"}
                  </td>
                  <td>{r.descripcion}</td>
                  <td>{r.cantidad}</td>
                  <td>{fmtMoney(r.precio_unitario)}</td>
                  <td>{fmtMoney(r.total)}</td>
                  <td>
                    <RowActions
                      onEdit={() => fixEdit(r)}
                      onDelete={() => fixDelete(r.id)}
                    />
                  </td>
                </tr>
              ))}
              {fixData.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">
                    Sin registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (view === "gastos") {
    return (
      <div>
        <Back />
        <h3>💸 Gastos</h3>

        <div className="my-3 d-flex align-items-center gap-2">
          <button
            className="btn btn-primary"
            onClick={() => setGFormOpen((v) => !v)}
          >
            {gFormOpen ? "Cancelar" : "➕ Agregar"}
          </button>
          {mensaje && <span className="text-success">{mensaje}</span>}
        </div>

        {gFormOpen && (
          <div className="card p-3 mb-3">
            <form onSubmit={gSubmit} className="row g-2">
              <div className="col-md-2">
                <input
                  type="date"
                  name="fecha"
                  className="form-control"
                  value={gForm.fecha}
                  onChange={(e) =>
                    setGForm({ ...gForm, fecha: e.target.value })
                  }
                />
              </div>
              <div className="col-md-5">
                <input
                  name="descripcion"
                  className="form-control"
                  placeholder="Descripción"
                  value={gForm.descripcion}
                  onChange={(e) =>
                    setGForm({ ...gForm, descripcion: e.target.value })
                  }
                  required
                />
              </div>
              <div className="col-md-1">
                <input
                  name="cantidad"
                  type="number"
                  className="form-control"
                  placeholder="Cant."
                  value={gForm.cantidad}
                  onChange={handleAutoTotal(gForm, setGForm)}
                />
              </div>
              <div className="col-md-1">
                <input
                  name="precio_unitario"
                  type="number"
                  className="form-control"
                  placeholder="PU"
                  value={gForm.precio_unitario}
                  onChange={handleAutoTotal(gForm, setGForm)}
                />
              </div>
              <div className="col-md-2">
                <input
                  name="total"
                  className="form-control"
                  value={fmtMoney(gForm.total)}
                  disabled
                />
              </div>
              <div className="col-12">
                <button className="btn btn-success">Guardar</button>
              </div>
            </form>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Cant.</th>
                <th>PU</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gData.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.fecha ? new Date(r.fecha).toLocaleDateString() : "-"}
                  </td>
                  <td>{r.descripcion}</td>
                  <td>{r.cantidad}</td>
                  <td>{fmtMoney(r.precio_unitario)}</td>
                  <td>{fmtMoney(r.total)}</td>
                  <td>
                    <RowActions
                      onEdit={() => gEditRow(r)}
                      onDelete={() => gDelete(r.id)}
                    />
                  </td>
                </tr>
              ))}
              {gData.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">
                    Sin registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (view === "cvu") {
    const total = useMemo(() => cvu.total || 0, [cvu]);
    return (
      <div>
        <Back />
        <h3>🧮 Costo Variable Unitario (por paquete)</h3>
        <p className="text-muted">
          Calculado desde Producción: consumo unitario por insumo × precio
          unitario promedio (Compras).
        </p>

        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>Detalle (insumo)</th>
                <th>Cant. unitaria</th>
                <th>PU (prom.)</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(cvu.detalle || []).map((r, i) => (
                <tr key={i}>
                  <td>{r.insumo}</td>
                  <td>
                    {r.cantidad_unidad} {r.unidad}
                  </td>
                  <td>{fmtMoney(r.precio_unitario)}</td>
                  <td>{fmtMoney(r.total)}</td>
                </tr>
              ))}
              {(!cvu.detalle || cvu.detalle.length === 0) && (
                <tr>
                  <td colSpan="4" className="text-center">
                    Sin datos suficientes para calcular CVU.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={3} className="text-end">
                  Total por paquete
                </th>
                <th>{fmtMoney(total)}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  // ---------- MENÚ ----------
  return (
    <div>
      <h2 className="mb-3">Capital</h2>
      <div className="d-flex flex-wrap gap-2">
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("inversion")}
        >
          Capital de inversión
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("fijos")}
        >
          Costos fijos
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("cvu")}
        >
          Costo variable unitario
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setView("gastos")}
        >
          Gastos
        </button>
      </div>
    </div>
  );
}
