// src/pages/Produccion.jsx
import { useEffect, useState } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext";

function Produccion() {
  const { token } = useAuth();

  const [producciones, setProducciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [insumosResumen, setInsumosResumen] = useState([]);

  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState(null);

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [form, setForm] = useState({
    fecha: "",
    producto_id: "",
    producto: "",
    nombre: "",
    lote: "",
    cantidad: "",
    insumos: [],
  });

  const [nuevoInsumo, setNuevoInsumo] = useState({
    insumo: "",
    cantidad: "",
    unidad: "",
  });

  // ------- FETCHERS -------
  const fetchProducciones = async () => {
    try {
      const res = await axiosAuth.get("/api/produccion");
      const arr = Array.isArray(res.data) ? res.data : [];
      // ordenar por fecha desc
      const ordenadas = [...arr].sort((a, b) => {
        const da = new Date(a.fecha || a.createdAt || 0).getTime();
        const db = new Date(b.fecha || b.createdAt || 0).getTime();
        return db - da;
      });
      setProducciones(ordenadas);
      setError("");
    } catch (err) {
      console.error("GET /api/produccion", err);
      setError(err?.response?.data?.message || "No se pudo cargar Producción.");
      setProducciones([]);
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await axiosAuth.get("/api/productos");
      setProductos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("GET /api/productos", err);
    }
  };

  const fetchResumenInsumos = async () => {
    try {
      const res = await axiosAuth.get("/api/insumos");
      setInsumosResumen(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("GET /api/insumos", err);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchProducciones();
    fetchProductos();
    fetchResumenInsumos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ------- AUTOCOMPLETADO PRODUCTOS -------
  const onChangeProductoId = (e) => {
    const value = e.target.value;
    const prod = productos.find((p) => String(p.id) === String(value));
    if (prod) {
      setForm((prev) => ({
        ...prev,
        producto_id: prod.id,
        producto: prod.nombre,
        nombre: prod.nombre,
      }));
    } else {
      setForm((prev) => ({ ...prev, producto_id: value }));
    }
  };

  const onChangeProductoNombre = (e) => {
    const value = e.target.value;
    const prod = productos.find(
      (p) => (p.nombre || "").toLowerCase() === value.toLowerCase()
    );
    if (prod) {
      setForm((prev) => ({
        ...prev,
        producto_id: prod.id,
        producto: prod.nombre,
        nombre: prod.nombre,
      }));
    } else {
      setForm((prev) => ({ ...prev, producto: value, nombre: value }));
    }
  };

  // ------- INSUMOS -------
  const agregarInsumo = () => {
    if (
      nuevoInsumo.insumo &&
      nuevoInsumo.unidad &&
      nuevoInsumo.cantidad !== "" &&
      !isNaN(parseFloat(nuevoInsumo.cantidad))
    ) {
      setForm((prev) => ({
        ...prev,
        insumos: [...prev.insumos, { ...nuevoInsumo }],
      }));
      setNuevoInsumo({ insumo: "", cantidad: "", unidad: "" });
    }
  };

  const quitarInsumo = (idx) => {
    setForm((prev) => ({
      ...prev,
      insumos: prev.insumos.filter((_, i) => i !== idx),
    }));
  };

  // ------- GUARDAR / EDITAR / ELIMINAR -------
  const guardarProduccion = async () => {
    setError("");
    setOkMsg("");
    try {
      const data = {
        ...form,
        cantidad: form.cantidad === "" ? "" : parseFloat(form.cantidad),
        // por compatibilidad con tu backend actual:
        producto: form.producto || form.nombre,
        nombre: form.nombre || form.producto,
        insumos: (form.insumos || []).map((i) => ({
          ...i,
          cantidad: i.cantidad === "" ? "" : parseFloat(i.cantidad),
        })),
      };

      if (editId) {
        await axiosAuth.put(`/api/produccion/${editId}`, data);
        setOkMsg("✅ Producción actualizada");
      } else {
        await axiosAuth.post("/api/produccion", data);
        setOkMsg("✅ Producción guardada");
      }

      // reset
      setForm({
        fecha: "",
        producto_id: "",
        producto: "",
        nombre: "",
        lote: "",
        cantidad: "",
        insumos: [],
      });
      setEditId(null);
      setFormVisible(false);
      await fetchProducciones();
      setTimeout(() => setOkMsg(""), 2200);
    } catch (error) {
      console.error("❌ SAVE /api/produccion", error);
      setError(
        error?.response?.data?.message || "No se pudo guardar la Producción."
      );
    }
  };

  const handleEditar = (p) => {
    const prod = productos.find(
      (x) =>
        (x.nombre || "").toLowerCase() ===
        String(p.producto || p.nombre || "").toLowerCase()
    );
    setForm({
      fecha: (p.fecha || "").substring(0, 10),
      producto_id: prod?.id ?? "",
      producto: p.producto || prod?.nombre || "",
      nombre: p.nombre || p.producto || prod?.nombre || "",
      lote: p.lote || "",
      cantidad: p.cantidad ?? "",
      insumos: Array.isArray(p.insumos) ? p.insumos : [],
    });
    setEditId(p.id);
    setFormVisible(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta producción?")) return;
    try {
      await axiosAuth.delete(`/api/produccion/${id}`);
      await fetchProducciones();
    } catch (err) {
      console.error("❌ DELETE /api/produccion", err);
      setError(err?.response?.data?.message || "No se pudo eliminar.");
    }
  };

  // ------- COSTOS (como tenías) -------
  const calcularCostoTotal = (produccion) => {
    return (produccion.insumos || []).reduce((total, ins) => {
      const insumoData = insumosResumen.find(
        (i) => i.insumo?.toLowerCase?.() === ins.insumo?.toLowerCase?.()
      );
      const precioUnidad =
        insumoData?.precio_unitario ||
        insumoData?.precio_unitario_promedio ||
        0;
      return (
        total +
        (parseFloat(ins.cantidad) || 0) * (parseFloat(precioUnidad) || 0)
      );
    }, 0);
  };

  const fmtDate = (d) => {
    if (!d) return "-";
    const dd = new Date(d);
    return isNaN(dd.getTime()) ? d : dd.toLocaleDateString();
  };

  return (
    <div>
      <h3>🏭 Producción</h3>

      {error && <div className="alert alert-danger">{error}</div>}
      {okMsg && <div className="alert alert-success">{okMsg}</div>}

      <button
        className="btn btn-primary mb-3"
        onClick={() => {
          if (formVisible) {
            setEditId(null);
            setForm({
              fecha: "",
              producto_id: "",
              producto: "",
              nombre: "",
              lote: "",
              cantidad: "",
              insumos: [],
            });
          }
          setFormVisible(!formVisible);
        }}
      >
        {formVisible ? "Cancelar" : "➕ Agregar Producción"}
      </button>

      {formVisible && (
        <div className="card p-3 mb-4">
          <div className="row g-2">
            {/* FECHA */}
            <div className="col-md-2">
              <input
                type="date"
                name="fecha"
                className="form-control"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>

            {/* ID PRODUCTO */}
            <div className="col-md-2">
              <input
                list="dlProductosIds"
                name="producto_id"
                placeholder="ID Producto"
                className="form-control"
                value={form.producto_id}
                onChange={onChangeProductoId}
              />
              <datalist id="dlProductosIds">
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </datalist>
            </div>

            {/* NOMBRE PRODUCTO */}
            <div className="col-md-3">
              <input
                list="dlProductosNombres"
                name="producto"
                placeholder="Nombre de producto"
                className="form-control"
                value={form.producto}
                onChange={onChangeProductoNombre}
              />
              <datalist id="dlProductosNombres">
                {productos.map((p) => (
                  <option key={p.id} value={p.nombre}>
                    {p.id}
                  </option>
                ))}
              </datalist>
            </div>

            {/* NOMBRE (compat) */}
            <div className="col-md-2">
              <input
                name="nombre"
                placeholder="Nombre"
                className="form-control"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>

            {/* LOTE */}
            <div className="col-md-2">
              <input
                name="lote"
                placeholder="Lote"
                className="form-control"
                value={form.lote}
                onChange={(e) => setForm({ ...form, lote: e.target.value })}
              />
            </div>

            {/* CANTIDAD */}
            <div className="col-md-1">
              <input
                name="cantidad"
                placeholder="Cant."
                type="number"
                className="form-control"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
              />
            </div>
          </div>

          {/* INSUMOS */}
          <h5 className="mt-4">➕ Insumos utilizados</h5>
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <input
                name="insumo"
                placeholder="Insumo"
                className="form-control"
                value={nuevoInsumo.insumo}
                onChange={(e) =>
                  setNuevoInsumo({ ...nuevoInsumo, insumo: e.target.value })
                }
              />
            </div>
            <div className="col-md-2">
              <input
                name="cantidad"
                placeholder="Cantidad"
                type="number"
                className="form-control"
                value={nuevoInsumo.cantidad}
                onChange={(e) =>
                  setNuevoInsumo({ ...nuevoInsumo, cantidad: e.target.value })
                }
              />
            </div>
            <div className="col-md-2">
              <input
                name="unidad"
                placeholder="Unidad"
                className="form-control"
                value={nuevoInsumo.unidad}
                onChange={(e) =>
                  setNuevoInsumo({ ...nuevoInsumo, unidad: e.target.value })
                }
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-success w-100" onClick={agregarInsumo}>
                Agregar insumo
              </button>
            </div>
          </div>

          {form.insumos.length > 0 && (
            <ul className="mt-3">
              {form.insumos.map((i, idx) => (
                <li key={idx}>
                  {i.insumo} - {i.cantidad} {i.unidad}{" "}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={() => quitarInsumo(idx)}
                  >
                    quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3">
            <button className="btn btn-primary" onClick={guardarProduccion}>
              {editId ? "Actualizar producción" : "Guardar producción"}
            </button>
          </div>
        </div>
      )}

      {/* RESUMEN */}
      <h4>Resumen</h4>
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Lote</th>
              <th>Cantidad</th>
              <th>Costo total</th>
              <th>Costo unitario</th>
              <th>Detalles</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(producciones || []).map((p) => {
              const costoTotal = calcularCostoTotal(p);
              const cu = (costoTotal / (parseFloat(p.cantidad) || 1)).toFixed(
                2
              );
              return (
                <tr key={p.id}>
                  <td>{fmtDate(p.fecha)}</td>
                  <td>{p.producto || p.nombre}</td>
                  <td>{p.lote}</td>
                  <td>
                    {p.cantidad}{" "}
                    {p.stock <= 0 && (
                      <span className="badge bg-danger ms-2">Agotado</span>
                    )}
                  </td>
                  <td>${costoTotal.toFixed(2)}</td>
                  <td>${cu}</td>
                  <td>
                    <details>
                      <summary>Ver insumos</summary>
                      <ul>
                        {(p.insumos || []).map((i, iidx) => (
                          <li key={iidx}>
                            {i.insumo}: {i.cantidad} {i.unidad}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>
                  <td className="text-nowrap">
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEditar(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleEliminar(p.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
            {producciones.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center">
                  Sin registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Produccion;
