// src/pages/Pedidos.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Pedidos() {
  const { token, role } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [formVisible, setFormVisible] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Modal Nuevo Cliente
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    cuit_dni: "",
    direccion: "",
    telefono: "",
    email: "",
    condicion_iva: "",
  });

  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    // cliente
    cliente_id: "",
    cliente_nombre: "",
    // producto
    producto_id: "",
    producto_nombre: "",
    cantidad: "",
    // precio
    precio_mode: "consumidor", // "mayorista" | "minorista" | "consumidor" | "diferenciado"
    precio_diferenciado: "",
    precio_unitario: "",
    // fechas
    fecha_estimada_entrega: "",
    // pago
    metodo_pago: "contado", // contado | contra_entrega | cuenta_corriente
  });

  // ===== fetch =====
  const fetchPedidos = async () => {
    const res = await axios.get("http://localhost:4000/api/pedidos", {
      headers,
    });
    setPedidos(res.data || []);
  };
  const fetchClientes = async () => {
    const res = await axios.get("http://localhost:4000/api/clientes", {
      headers,
    });
    setClientes(res.data || []);
  };
  const fetchProductos = async () => {
    const res = await axios.get("http://localhost:4000/api/productos", {
      headers,
    });
    setProductos(res.data || []);
  };

  useEffect(() => {
    fetchPedidos();
    fetchClientes();
    fetchProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== maps =====
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

  // ===== helpers =====
  const calcTotal = (q, pu) => {
    const a = parseFloat(q);
    const b = parseFloat(pu);
    if (isNaN(a) || isNaN(b)) return 0;
    return a * b;
  };
  const displayDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
  };

  // ===== cliente sync =====
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

  // ===== precio desde producto por modo =====
  const pickPriceFromProduct = (prod, mode, diferenciado) => {
    if (!prod) return "";
    if (mode === "mayorista") return prod.precio_mayorista ?? "";
    if (mode === "minorista") return prod.precio_minorista ?? "";
    if (mode === "consumidor") return prod.precio_consumidor ?? "";
    if (mode === "diferenciado") return diferenciado ?? "";
    return "";
  };

  // ===== producto sync + aplicar precio por modo =====
  const onChangeProductoId = (e) => {
    const id = e.target.value;
    const p = productosById.get(String(id));
    setForm((prev) => ({
      ...prev,
      producto_id: id,
      producto_nombre: p?.nombre || "",
      precio_unitario: pickPriceFromProduct(
        p,
        prev.precio_mode,
        prev.precio_diferenciado
      ),
    }));
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
      precio_unitario: pickPriceFromProduct(
        p,
        prev.precio_mode,
        prev.precio_diferenciado
      ),
    }));
  };

  // ===== cambio de modo de precio =====
  const onChangePrecioMode = (mode) => {
    setForm((prev) => {
      const prod =
        productosById.get(String(prev.producto_id)) ||
        productos.find((x) => (x.nombre || "") === prev.producto_nombre);
      return {
        ...prev,
        precio_mode: mode,
        precio_unitario: pickPriceFromProduct(
          prod,
          mode,
          prev.precio_diferenciado
        ),
      };
    });
  };
  const onChangePrecioDiferenciado = (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      precio_diferenciado: val,
      precio_unitario:
        prev.precio_mode === "diferenciado" ? val : prev.precio_unitario,
    }));
  };

  // ===== form general =====
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ===== submit =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        cliente_id: form.cliente_id || null,
        cliente_nombre: form.cliente_nombre || null,
        producto_id: form.producto_id,
        producto_nombre: form.producto_nombre,
        cantidad: form.cantidad,
        precio_unitario: form.precio_unitario,
        fecha_estimada_entrega: form.fecha_estimada_entrega || null,
        metodo_pago: form.metodo_pago, // contado | contra_entrega | cuenta_corriente
      };

      if (editId) {
        await axios.put(
          `http://localhost:4000/api/pedidos/${editId}`,
          payload,
          { headers }
        );
      } else {
        await axios.post("http://localhost:4000/api/pedidos", payload, {
          headers,
        });
      }

      setFormVisible(false);
      setEditId(null);
      setForm({
        cliente_id: "",
        cliente_nombre: "",
        producto_id: "",
        producto_nombre: "",
        cantidad: "",
        precio_mode: "consumidor",
        precio_diferenciado: "",
        precio_unitario: "",
        fecha_estimada_entrega: "",
        metodo_pago: "contado",
      });
      fetchPedidos();
    } catch (err) {
      console.error("❌ Error al guardar pedido:", err);
      alert("No se pudo guardar el pedido.");
    }
  };

  // ===== estado =====
  const actualizarEstado = async (pedido, nuevoEstado) => {
    try {
      await axios.put(
        `http://localhost:4000/api/pedidos/${pedido.id}`,
        { estado: nuevoEstado },
        { headers }
      );
      fetchPedidos();
    } catch (err) {
      console.error("❌ Error al actualizar estado:", err);
      alert("No se pudo actualizar el estado del pedido.");
    }
  };

  // ===== editar / eliminar =====
  const onEdit = (p) => {
    setFormVisible(true);
    setEditId(p.id);

    // Deducir mode por coincidencia con precios del producto
    const prod = productosById.get(String(p.producto_id));
    let precio_mode = "consumidor";
    let precio_diferenciado = "";

    if (prod) {
      if (Number(p.precio_unitario) === Number(prod.precio_mayorista))
        precio_mode = "mayorista";
      else if (Number(p.precio_unitario) === Number(prod.precio_minorista))
        precio_mode = "minorista";
      else if (Number(p.precio_unitario) === Number(prod.precio_consumidor))
        precio_mode = "consumidor";
      else {
        precio_mode = "diferenciado";
        precio_diferenciado = p.precio_unitario;
      }
    } else {
      precio_mode = "diferenciado";
      precio_diferenciado = p.precio_unitario;
    }

    setForm({
      cliente_id: p.cliente_id || "",
      cliente_nombre: p.cliente_nombre || "",
      producto_id: p.producto_id || "",
      producto_nombre: p.producto_nombre || "",
      cantidad: p.cantidad || "",
      precio_mode,
      precio_diferenciado,
      precio_unitario: p.precio_unitario || "",
      fecha_estimada_entrega: p.fecha_estimada_entrega
        ? new Date(p.fecha_estimada_entrega).toISOString().slice(0, 10)
        : "",
      metodo_pago: p.metodo_pago || "contado",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar pedido?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/pedidos/${id}`, {
        headers,
      });
      fetchPedidos();
    } catch (err) {
      console.error("❌ Error al eliminar pedido:", err);
      alert("No se pudo eliminar el pedido.");
    }
  };

  // ===== nuevo cliente =====
  const guardarNuevoCliente = async () => {
    try {
      const res = await axios.post(
        "http://localhost:4000/api/clientes",
        nuevoCliente,
        { headers }
      );
      const c = res.data;
      await fetchClientes();
      setShowNuevoCliente(false);
      setNuevoCliente({
        nombre: "",
        cuit_dni: "",
        direccion: "",
        telefono: "",
        email: "",
        condicion_iva: "",
      });
      // setearlo en el form actual
      setForm((prev) => ({
        ...prev,
        cliente_id: c.id,
        cliente_nombre: c.nombre,
      }));
    } catch (err) {
      console.error("❌ Error al crear cliente:", err);
      alert("No se pudo crear el cliente.");
    }
  };

  const pedidosFiltrados = useMemo(() => {
    if (filtroEstado === "todos") return pedidos;
    return (pedidos || []).filter((p) => p.estado === filtroEstado);
  }, [pedidos, filtroEstado]);

  return (
    <div>
      <h3>📦 Gestión de Pedidos</h3>

      <div className="mb-3 d-flex gap-2 align-items-end">
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormVisible((s) => !s);
            if (!formVisible) {
              setEditId(null);
            }
          }}
        >
          {formVisible ? "Cancelar" : "➕ Agregar pedido"}
        </button>

        <div className="ms-auto">
          <label className="me-2">Filtrar por estado:</label>
          <select
            className="form-select d-inline-block w-auto"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pendiente">pendiente</option>
            <option value="pendiente/pagado">pendiente/pagado</option>
            <option value="pendiente/contra entrega">
              pendiente/contra entrega
            </option>
            <option value="pendiente/cta cte">pendiente/cta cte</option>
            <option value="entregado">entregado</option>
            <option value="entregado/pagado">entregado/pagado</option>
            <option value="entregado/pendiente">entregado/pendiente</option>
            <option value="pagada">pagada</option>
          </select>
        </div>
      </div>

      {formVisible && (
        <div className="card p-3 mb-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Cliente por ID */}
              <div className="col-md-3">
                <label className="form-label">Cliente (ID)</label>
                <div className="d-flex gap-2">
                  <select
                    className="form-select"
                    value={form.cliente_id}
                    onChange={onChangeClienteId}
                  >
                    <option value="">Seleccionar…</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} - {c.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-success"
                    onClick={() => setShowNuevoCliente(true)}
                    title="Nuevo cliente"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cliente por nombre */}
              <div className="col-md-3">
                <label className="form-label">Cliente (Nombre)</label>
                <input
                  className="form-control"
                  placeholder="Escribe nombre…"
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
              <div className="col-md-3">
                <label className="form-label">Producto (ID)</label>
                <select
                  className="form-select"
                  value={form.producto_id}
                  onChange={onChangeProductoId}
                >
                  <option value="">Seleccionar…</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Producto por nombre */}
              <div className="col-md-3">
                <label className="form-label">Producto (Nombre)</label>
                <input
                  className="form-control"
                  placeholder="Escribe nombre…"
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

              {/* Cantidad */}
              <div className="col-md-2">
                <label className="form-label">Cantidad</label>
                <input
                  type="number"
                  name="cantidad"
                  className="form-control"
                  value={form.cantidad}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Precio - modos */}
              <div className="col-md-10">
                <label className="form-label d-block">Precio</label>
                <div className="d-flex flex-wrap gap-3 align-items-center">
                  {["mayorista", "minorista", "consumidor", "diferenciado"].map(
                    (m) => (
                      <div className="form-check" key={m}>
                        <input
                          className="form-check-input"
                          type="radio"
                          id={`pm_${m}`}
                          name="precio_mode_r"
                          checked={form.precio_mode === m}
                          onChange={() => onChangePrecioMode(m)}
                        />
                        <label className="form-check-label" htmlFor={`pm_${m}`}>
                          {m === "consumidor" ? "consumidor final" : m}
                        </label>
                      </div>
                    )
                  )}
                  {form.precio_mode === "diferenciado" && (
                    <input
                      type="number"
                      className="form-control w-auto"
                      placeholder="Precio diferenciado"
                      value={form.precio_diferenciado}
                      onChange={onChangePrecioDiferenciado}
                    />
                  )}
                  <div className="ms-auto">
                    <input
                      type="number"
                      className="form-control"
                      value={form.precio_unitario}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          precio_unitario: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Fecha estimada de entrega */}
              <div className="col-md-3">
                <label className="form-label">Fecha estimada de entrega</label>
                <input
                  type="date"
                  name="fecha_estimada_entrega"
                  className="form-control"
                  value={form.fecha_estimada_entrega}
                  onChange={handleChange}
                />
              </div>

              {/* Método de pago */}
              <div className="col-md-5">
                <label className="form-label">Método de pago</label>
                <div className="d-flex gap-3 align-items-center">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="mp_contado"
                      name="metodo_pago_r"
                      checked={form.metodo_pago === "contado"}
                      onChange={() =>
                        setForm((s) => ({ ...s, metodo_pago: "contado" }))
                      }
                    />
                    <label className="form-check-label" htmlFor="mp_contado">
                      Contado
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="mp_ce"
                      name="metodo_pago_r"
                      checked={form.metodo_pago === "contra_entrega"}
                      onChange={() =>
                        setForm((s) => ({
                          ...s,
                          metodo_pago: "contra_entrega",
                        }))
                      }
                    />
                    <label className="form-check-label" htmlFor="mp_ce">
                      Contra entrega
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="mp_cc"
                      name="metodo_pago_r"
                      checked={form.metodo_pago === "cuenta_corriente"}
                      onChange={() =>
                        setForm((s) => ({
                          ...s,
                          metodo_pago: "cuenta_corriente",
                        }))
                      }
                    />
                    <label className="form-check-label" htmlFor="mp_cc">
                      Cuenta corriente
                    </label>
                  </div>
                </div>
              </div>

              {/* Total (solo visual) */}
              <div className="col-md-4">
                <label className="form-label">Total</label>
                <input
                  className="form-control"
                  value={calcTotal(form.cantidad, form.precio_unitario)}
                  disabled
                />
              </div>

              <div className="col-12">
                <button className="btn btn-success" type="submit">
                  {editId ? "Actualizar pedido" : "Guardar pedido"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL Nuevo Cliente */}
      {showNuevoCliente && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuevo cliente</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowNuevoCliente(false)}
                />
              </div>
              <div className="modal-body">
                {[
                  ["nombre", "Nombre"],
                  ["cuit_dni", "CUIT / DNI"],
                  ["direccion", "Dirección"],
                  ["telefono", "Teléfono"],
                  ["email", "Email"],
                  ["condicion_iva", "Condición IVA"],
                ].map(([k, label]) => (
                  <div className="mb-2" key={k}>
                    <label className="form-label">{label}</label>
                    <input
                      className="form-control"
                      value={nuevoCliente[k]}
                      onChange={(e) =>
                        setNuevoCliente((prev) => ({
                          ...prev,
                          [k]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowNuevoCliente(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={guardarNuevoCliente}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>Fecha pedido</th>
              <th>Cliente</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio U.</th>
              <th>Total</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Fecha estimada</th>
              <th>Fecha entrega</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.map((p) => (
              <tr key={p.id}>
                <td>{displayDate(p.fecha_pedido)}</td>
                <td>{p.cliente_nombre || p.cliente || "-"}</td>
                <td>{p.producto_nombre}</td>
                <td>{p.cantidad}</td>
                <td>{Number(p.precio_unitario ?? 0)}</td>
                <td>{Number(p.precio_total ?? 0)}</td>
                <td>{p.metodo_pago}</td>
                <td>
                  {role === "admin" ? (
                    <select
                      className="form-select"
                      value={p.estado}
                      onChange={(e) => actualizarEstado(p, e.target.value)}
                    >
                      <option value="pendiente">pendiente</option>
                      <option value="pendiente/pagado">pendiente/pagado</option>
                      <option value="pendiente/contra entrega">
                        pendiente/contra entrega
                      </option>
                      <option value="pendiente/cta cte">
                        pendiente/cta cte
                      </option>
                      <option value="entregado">entregado</option>
                      <option value="entregado/pagado">entregado/pagado</option>
                      <option value="entregado/pendiente">
                        entregado/pendiente
                      </option>
                      <option value="pagada">pagada</option>
                    </select>
                  ) : (
                    <span className="badge bg-secondary">{p.estado}</span>
                  )}
                </td>
                <td>
                  {p.fecha_estimada_entrega
                    ? new Date(p.fecha_estimada_entrega).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  {p.fecha_entrega
                    ? new Date(p.fecha_entrega).toLocaleDateString()
                    : "-"}
                </td>
                <td className="text-nowrap">
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => onEdit(p)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onDelete(p.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {pedidosFiltrados.length === 0 && (
              <tr>
                <td colSpan="11" className="text-center">
                  Sin pedidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Pedidos;
