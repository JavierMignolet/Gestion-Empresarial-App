// src/pages/Produccion.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Produccion() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [producciones, setProducciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [insumosResumen, setInsumosResumen] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    fecha: "",
    producto_id: "", // 👈 NUEVO
    producto: "", // nombre del producto (compatibilidad)
    nombre: "", // idem (dejamos igual por compatibilidad con tus datos)
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
    const res = await axios.get("http://localhost:4000/api/produccion", {
      headers,
    });
    // orden opcional por fecha desc para que veas lo último arriba en el resumen
    const ordenadas = [...res.data].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );
    setProducciones(ordenadas);
  };

  const fetchProductos = async () => {
    const res = await axios.get("http://localhost:4000/api/productos", {
      headers,
    });
    setProductos(res.data || []);
  };

  const fetchResumenInsumos = async () => {
    const res = await axios.get("http://localhost:4000/api/insumos", {
      headers,
    });
    setInsumosResumen(res.data || []);
  };

  useEffect(() => {
    fetchProducciones();
    fetchProductos();
    fetchResumenInsumos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      (p) => p.nombre.toLowerCase() === value.toLowerCase()
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
      nuevoInsumo.cantidad &&
      !isNaN(parseFloat(nuevoInsumo.cantidad)) &&
      nuevoInsumo.unidad
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
    try {
      const data = {
        ...form,
        cantidad: parseFloat(form.cantidad),
        // backend actual ignora producto_id (lo dejamos por si luego lo usas),
        // pero enviamos producto y nombre (ambos = nombre seleccionado) por compatibilidad.
        producto: form.producto || form.nombre,
        nombre: form.nombre || form.producto,
        insumos: form.insumos.map((i) => ({
          ...i,
          cantidad: parseFloat(i.cantidad),
        })),
      };

      if (editId) {
        await axios.put(
          `http://localhost:4000/api/produccion/${editId}`,
          data,
          {
            headers,
          }
        );
      } else {
        await axios.post("http://localhost:4000/api/produccion", data, {
          headers,
        });
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
    } catch (error) {
      console.error("❌ Error al guardar producción:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
    }
  };

  const handleEditar = (p) => {
    // busco producto por nombre para recuperar su id (si existe)
    const prod = productos.find(
      (x) =>
        x.nombre.toLowerCase() === String(p.producto || p.nombre).toLowerCase()
    );
    setForm({
      fecha: p.fecha || "",
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
    if (window.confirm("¿Eliminar esta producción?")) {
      try {
        await axios.delete(`http://localhost:4000/api/produccion/${id}`, {
          headers,
        });
        await fetchProducciones();
      } catch (err) {
        console.error("❌ Error al eliminar producción:", err);
      }
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

  return (
    <div>
      <h3>🏭 Producción</h3>

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

            {/* ID PRODUCTO (autocomplete por id) */}
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

            {/* NOMBRE PRODUCTO (autocomplete por nombre) */}
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

            {/* NOMBRE (campo espejo para compatibilidad) */}
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
              <th>Acciones</th> {/* 👈 NUEVO */}
            </tr>
          </thead>
          <tbody>
            {producciones.map((p) => {
              const costoTotal = calcularCostoTotal(p);
              const costoUnitario = (
                costoTotal / (parseFloat(p.cantidad) || 1)
              ).toFixed(2);
              return (
                <tr key={p.id}>
                  <td>{p.fecha}</td>
                  <td>{p.producto || p.nombre}</td>
                  <td>{p.lote}</td>
                  <td>
                    {p.cantidad}{" "}
                    {p.stock <= 0 && (
                      <span className="badge bg-danger ms-2">Agotado</span>
                    )}
                  </td>
                  <td>${costoTotal.toFixed(2)}</td>
                  <td>${costoUnitario}</td>
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
                  <td>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Produccion;
