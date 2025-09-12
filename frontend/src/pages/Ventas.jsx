// src/pages/Ventas.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosAuth from "../utils/axiosAuth";
import { useAuth } from "../context/AuthContext"; // opcional: role/username en UI

function Ventas() {
  const { role } = useAuth(); // (si no lo usás, podés quitarlo)

  // ======== Estado principal ========
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [formVisible, setFormVisible] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [editId, setEditId] = useState(null);

  // Filtros de fecha para el resumen
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mostrarTodas, setMostrarTodas] = useState(false);

  // Form Venta
  const [form, setForm] = useState({
    fecha: "",
    cliente_id: "",
    cliente_nombre: "",
    producto_id: "",
    producto_nombre: "",
    cantidad: "",
    precio_unitario: "",
    total: 0,
  });

  // Precio
  const [tipoPrecio, setTipoPrecio] = useState("consumidor");
  const [precioDiferenciado, setPrecioDiferenciado] = useState("");

  // ======== Modal: Nuevo Cliente ========
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    cuit_dni: "",
    direccion: "",
    telefono: "",
    email: "",
    condicion_iva: "",
  });
  const resetNuevoCliente = () =>
    setNuevoCliente({
      nombre: "",
      cuit_dni: "",
      direccion: "",
      telefono: "",
      email: "",
      condicion_iva: "",
    });

  // ======== Fetch (axiosAuth) ========
  const fetchVentas = async () => {
    const res = await axiosAuth.get("/api/ventas");
    setVentas(res.data || []);
  };

  const fetchClientes = async () => {
    const res = await axiosAuth.get("/api/clientes");
    setClientes(res.data || []);
  };

  const fetchProductos = async () => {
    const res = await axiosAuth.get("/api/productos");
    setProductos(res.data || []);
  };

  useEffect(() => {
    // Evita golpear API antes de estar logueado y tener headers listos
    (async () => {
      try {
        await Promise.all([fetchVentas(), fetchClientes(), fetchProductos()]);
      } catch (e) {
        console.error("ventas init", e);
      }
    })();
  }, []);

  // ======== Maps rápidos ========
  const clientesById = useMemo(() => {
    const m = new Map();
    clientes.forEach((c) => m.set(String(c.id), c));
    return m;
  }, [clientes]);

  const productosById = useMemo(() => {
    const m = new Map();
    productos.forEach((p) => m.set(String(p.id), p));
    return m;
  }, [productos]);

  // ======== Helpers ========
  const calcTotal = (cantidad, precio) => {
    const q = parseFloat(cantidad);
    const pu = parseFloat(precio);
    if (isNaN(q) || isNaN(pu)) return 0;
    return +(q * pu).toFixed(2);
  };

  const displayDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString();
  };

  // ======== Handlers Form Venta ========
  const handleChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    next.total = calcTotal(next.cantidad, next.precio_unitario);
    setForm(next);
  };

  // Cliente: ID <-> Nombre
  const onChangeClienteId = (e) => {
    const id = e.target.value;
    const c = clientesById.get(String(id));
    setForm((prev) => ({
      ...prev,
      cliente_id: id,
      cliente_nombre: c?.nombre || "",
    }));
  };

  const onChangeClienteNombre = (e) => {
    const nombre = e.target.value;
    const found = clientes.find(
      (c) => (c.nombre || "").toLowerCase() === nombre.toLowerCase()
    );
    setForm((prev) => ({
      ...prev,
      cliente_nombre: nombre,
      cliente_id: found ? found.id : "",
    }));
  };

  // Producto: ID <-> Nombre + precio
  const precioDesdeProducto = (p, tipo) => {
    if (!p) return "";
    switch (tipo) {
      case "mayorista":
        return p.precio_mayorista ?? "";
      case "minorista":
        return p.precio_minorista ?? "";
      case "consumidor":
        return p.precio_consumidor ?? "";
      default:
        return "";
    }
  };

  const aplicarPrecioProducto = (productoSel, tipo, diferenciado) => {
    if (!productoSel) {
      setForm((prev) => ({
        ...prev,
        precio_unitario: "",
        total: calcTotal(prev.cantidad, 0),
      }));
      return;
    }
    let pu;
    if (tipo === "diferenciado") {
      pu = diferenciado !== "" ? Number(diferenciado) : "";
    } else {
      pu = precioDesdeProducto(productoSel, tipo);
    }
    setForm((prev) => ({
      ...prev,
      precio_unitario: pu !== "" ? Number(pu) : "",
      total: calcTotal(prev.cantidad, pu !== "" ? pu : 0),
    }));
  };

  const onChangeProductoId = (e) => {
    const id = e.target.value;
    const p = productosById.get(String(id));
    setForm((prev) => ({
      ...prev,
      producto_id: id,
      producto_nombre: p?.nombre || "",
    }));
    aplicarPrecioProducto(p, tipoPrecio, precioDiferenciado);
  };

  const onChangeProductoNombre = (e) => {
    const nombre = e.target.value;
    const p = productos.find(
      (x) => (x.nombre || "").toLowerCase() === nombre.toLowerCase()
    );
    setForm((prev) => ({
      ...prev,
      producto_nombre: nombre,
      producto_id: p ? p.id : "",
    }));
    aplicarPrecioProducto(p || null, tipoPrecio, precioDiferenciado);
  };

  const onChangeTipoPrecio = (e) => {
    const tipo = e.target.value;
    setTipoPrecio(tipo);
    const p = productosById.get(String(form.producto_id));
    aplicarPrecioProducto(p || null, tipo, precioDiferenciado);
  };

  const onChangePrecioDiferenciado = (e) => {
    const val = e.target.value;
    setPrecioDiferenciado(val);
    if (tipoPrecio === "diferenciado") {
      const p = productosById.get(String(form.producto_id));
      aplicarPrecioProducto(p || null, "diferenciado", val);
    }
  };

  // ======== Guardar/Editar/Eliminar ========
  const handleSubmit = async () => {
    try {
      if (!form.cliente_id || !form.producto_id) {
        alert("Seleccioná un cliente y un producto válidos.");
        return;
      }

      const cantidad = +form.cantidad || 0;
      const pu = +form.precio_unitario || 0;

      const payload = {
        fecha: form.fecha || new Date().toISOString().slice(0, 10),
        cliente_id: form.cliente_id,
        producto_id: form.producto_id,
        cantidad,
        precio_unitario: pu,
        total: +(cantidad * pu).toFixed(2),
      };

      if (editId) {
        await axiosAuth.put(`/api/ventas/${editId}`, payload);
        setMensaje("✅ Venta actualizada con éxito");
      } else {
        await axiosAuth.post("/api/ventas", payload);
        setMensaje("✅ Venta registrada con éxito");
      }

      await fetchVentas();
      setFormVisible(false);
      setEditId(null);
      setTipoPrecio("consumidor");
      setPrecioDiferenciado("");
      setForm({
        fecha: "",
        cliente_id: "",
        cliente_nombre: "",
        producto_id: "",
        producto_nombre: "",
        cantidad: "",
        precio_unitario: "",
        total: 0,
      });
      setTimeout(() => setMensaje(""), 2200);
    } catch (err) {
      console.error("Error al guardar/editar venta:", err);
      alert("No se pudo guardar la venta.");
    }
  };

  const handleEdit = (venta) => {
    const cli = clientesById.get(String(venta.cliente_id));
    const pro = productosById.get(String(venta.producto_id));
    setForm({
      fecha: venta.fecha ? ("" + venta.fecha).substring(0, 10) : "",
      cliente_id: venta.cliente_id || "",
      cliente_nombre: cli?.nombre || "",
      producto_id: venta.producto_id || "",
      producto_nombre: pro?.nombre || "",
      cantidad: venta.cantidad ?? "",
      precio_unitario: venta.precio_unitario ?? "",
      total: venta.total ?? 0,
    });
    setTipoPrecio("consumidor");
    setPrecioDiferenciado("");
    setEditId(venta.id);
    setFormVisible(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar venta?")) {
      await axiosAuth.delete(`/api/ventas/${id}`);
      fetchVentas();
    }
  };

  // ======== Resumen: filtro & orden ========
  const ventasFiltradasOrdenadas = useMemo(() => {
    const fromD = from ? new Date(`${from}T00:00:00.000Z`) : null;
    const toD = to ? new Date(`${to}T23:59:59.999Z`) : null;
    const inRange = (v) => {
      const d = v.fecha ? new Date(v.fecha) : null;
      if (!d || isNaN(d.getTime())) return true;
      if (fromD && d < fromD) return false;
      if (toD && d > toD) return false;
      return true;
    };
    return [...ventas].filter(inRange).sort((a, b) => {
      const da = a.fecha ? new Date(a.fecha).getTime() : 0;
      const db = b.fecha ? new Date(b.fecha).getTime() : 0;
      return db - da; // DESC
    });
  }, [ventas, from, to]);

  const ventasAMostrar = useMemo(
    () =>
      mostrarTodas
        ? ventasFiltradasOrdenadas
        : ventasFiltradasOrdenadas.slice(0, 5),
    [ventasFiltradasOrdenadas, mostrarTodas]
  );

  // ======== Nuevo Cliente ========
  const abrirNuevoCliente = () => {
    resetNuevoCliente();
    setShowNuevoCliente(true);
  };

  const guardarNuevoCliente = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosAuth.post("/api/clientes", nuevoCliente);
      const creado = res.data; // {id, ...}
      await fetchClientes();
      setForm((prev) => ({
        ...prev,
        cliente_id: creado.id,
        cliente_nombre: creado.nombre,
      }));
      setShowNuevoCliente(false);
    } catch (err) {
      console.error("Error al crear cliente:", err);
      alert("No se pudo crear el cliente");
    }
  };

  return (
    <div>
      <h3>🧾 Ventas</h3>

      {/* Filtros de fecha */}
      <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
        <div>
          <label className="form-label mb-1">Desde</label>
          <input
            type="date"
            className="form-control"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label mb-1">Hasta</label>
          <input
            type="date"
            className="form-control"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="ms-auto d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormVisible((s) => !s);
              if (!formVisible) {
                setEditId(null);
                setTipoPrecio("consumidor");
                setPrecioDiferenciado("");
                setForm({
                  fecha: "",
                  cliente_id: "",
                  cliente_nombre: "",
                  producto_id: "",
                  producto_nombre: "",
                  cantidad: "",
                  precio_unitario: "",
                  total: 0,
                });
              }
            }}
          >
            {formVisible ? "Cancelar" : "➕ Agregar venta"}
          </button>
        </div>
      </div>

      {mensaje && <div className="alert alert-success mt-2">{mensaje}</div>}

      {/* Formulario de Venta */}
      {formVisible && (
        <div className="card p-3 mb-4">
          <div className="row g-3">
            <div className="col-md-2">
              <label className="form-label">Fecha</label>
              <input
                type="date"
                name="fecha"
                className="form-control"
                value={form.fecha}
                onChange={handleChange}
              />
            </div>

            {/* Cliente por ID */}
            <div className="col-md-3">
              <label className="form-label">Cliente (ID)</label>
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  value={form.cliente_id}
                  onChange={onChangeClienteId}
                >
                  <option value="">Seleccionar...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.nombre}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-outline-success"
                  onClick={abrirNuevoCliente}
                >
                  + Nuevo
                </button>
              </div>
            </div>

            {/* Cliente por Nombre */}
            <div className="col-md-3">
              <label className="form-label">Cliente (Nombre)</label>
              <input
                className="form-control"
                placeholder="Escribe nombre..."
                value={form.cliente_nombre}
                onChange={onChangeClienteNombre}
                list="clientes-nombres"
              />
              <datalist id="clientes-nombres">
                {clientes.map((c) => (
                  <option key={c.id} value={c.nombre} />
                ))}
              </datalist>
            </div>

            {/* Producto por ID */}
            <div className="col-md-2">
              <label className="form-label">Producto (ID)</label>
              <select
                className="form-select"
                value={form.producto_id}
                onChange={onChangeProductoId}
              >
                <option value="">Seleccionar...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} - {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Producto por Nombre */}
            <div className="col-md-2">
              <label className="form-label">Producto (Nombre)</label>
              <input
                className="form-control"
                placeholder="Escribe nombre..."
                value={form.producto_nombre}
                onChange={onChangeProductoNombre}
                list="productos-nombres"
              />
              <datalist id="productos-nombres">
                {productos.map((p) => (
                  <option key={p.id} value={p.nombre} />
                ))}
              </datalist>
            </div>

            <div className="col-md-2">
              <label className="form-label">Cantidad</label>
              <input
                type="number"
                name="cantidad"
                className="form-control"
                value={form.cantidad}
                onChange={handleChange}
              />
            </div>

            {/* Precios */}
            <div className="col-12">
              <label className="form-label me-3">Precio:</label>
              <div className="d-flex flex-wrap gap-3 align-items-center">
                {[
                  ["mayorista", "Mayorista"],
                  ["minorista", "Minorista"],
                  ["consumidor", "Consumidor"],
                ].map(([val, label]) => (
                  <div className="form-check" key={val}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="tipoPrecio"
                      id={`precio_${val}`}
                      value={val}
                      checked={tipoPrecio === val}
                      onChange={onChangeTipoPrecio}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`precio_${val}`}
                    >
                      {label}
                    </label>
                  </div>
                ))}

                <div className="form-check d-flex align-items-center">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="tipoPrecio"
                    id="precio_dif"
                    value="diferenciado"
                    checked={tipoPrecio === "diferenciado"}
                    onChange={onChangeTipoPrecio}
                  />
                  <label className="form-check-label me-2" htmlFor="precio_dif">
                    Diferenciado
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ width: 140 }}
                    placeholder="Ingresar precio"
                    value={precioDiferenciado}
                    onChange={onChangePrecioDiferenciado}
                    disabled={tipoPrecio !== "diferenciado"}
                  />
                </div>

                <div className="ms-auto d-flex gap-2 align-items-center">
                  <span>Precio unitario:</span>
                  <input
                    type="number"
                    name="precio_unitario"
                    className="form-control"
                    style={{ width: 160 }}
                    value={form.precio_unitario}
                    onChange={handleChange}
                  />
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <span>Total:</span>
                  <input
                    type="text"
                    name="total"
                    className="form-control"
                    style={{ width: 160 }}
                    value={form.total}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="col-12">
              <button className="btn btn-success" onClick={handleSubmit}>
                {editId ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla resumen */}
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio U.</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventasAMostrar.map((v) => {
              const cli = clientesById.get(String(v.cliente_id));
              const pro = productosById.get(String(v.producto_id));
              return (
                <tr key={v.id}>
                  <td>{displayDate(v.fecha)}</td>
                  <td>{cli?.nombre || v.cliente_id}</td>
                  <td>{pro?.nombre || v.producto_id}</td>
                  <td>{v.cantidad}</td>
                  <td>{Number(v.precio_unitario ?? 0)}</td>
                  <td>{Number(v.total ?? 0)}</td>
                  <td>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => handleEdit(v)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(v.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
            {ventasAMostrar.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center">
                  Sin ventas para el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {ventasFiltradasOrdenadas.length > 5 && (
        <div className="text-center">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setMostrarTodas((s) => !s)}
          >
            {mostrarTodas ? "Mostrar menos" : "Mostrar más"}
          </button>
        </div>
      )}

      {/* MODAL: Nuevo Cliente */}
      {showNuevoCliente && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={guardarNuevoCliente}>
              <div className="modal-header">
                <h5 className="modal-title">Nuevo cliente</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowNuevoCliente(false)}
                ></button>
              </div>
              <div className="modal-body">
                {[
                  "nombre",
                  "cuit_dni",
                  "direccion",
                  "telefono",
                  "email",
                  "condicion_iva",
                ].map((field) => (
                  <div className="mb-3" key={field}>
                    <label className="form-label">
                      {field.replace("_", " ").toUpperCase()}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required={field === "nombre"}
                      value={nuevoCliente[field]}
                      onChange={(e) =>
                        setNuevoCliente((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNuevoCliente(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ventas;
