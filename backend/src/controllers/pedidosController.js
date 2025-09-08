// src/controllers/pedidosController.js
import { readJSON, writeJSON } from "../utils/fileHandler.js";

const PEDIDOS_FILE = "/pedidos.json";
const PRODUCTOS_FILE = "/productos.json";
const VENTAS_FILE = "/ventas.json";

/* ============ Helpers ============ */
const nowISO = () => new Date().toISOString();

const normalizeDateOnlyToISO = (d) => {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d))
    return new Date(`${d}T00:00:00.000Z`).toISOString();
  const x = new Date(d);
  return isNaN(x.getTime()) ? null : x.toISOString();
};

const safeRead = (file) => {
  const d = readJSON(file);
  return Array.isArray(d) ? d : [];
};
const save = (file, arr) => writeJSON(file, Array.isArray(arr) ? arr : []);
const nextId = (arr) =>
  arr.length ? Math.max(...arr.map((x) => +x.id || 0)) + 1 : 1;

function ajustarStock(producto_id, cantidad, signo = -1) {
  const productos = safeRead(PRODUCTOS_FILE);
  const idx = productos.findIndex((p) => String(p.id) === String(producto_id));
  if (idx === -1) return false;
  const delta = signo * (Number(cantidad) || 0);
  const stockPrev = Number(productos[idx].stock || 0);
  const nuevoStock = stockPrev + delta;
  productos[idx].stock = nuevoStock < 0 ? 0 : nuevoStock;
  save(PRODUCTOS_FILE, productos);
  return true;
}

function crearVentaDesdePedido(p) {
  const ventas = safeRead(VENTAS_FILE);
  const nueva = {
    id: nextId(ventas),
    fecha: nowISO(),
    cliente_id: p.cliente_id ?? null,
    producto_id: p.producto_id,
    cantidad: Number(p.cantidad) || 0,
    precio_unitario: Number(p.precio_unitario) || 0,
    total: (Number(p.cantidad) || 0) * (Number(p.precio_unitario) || 0),
  };
  ventas.push(nueva);
  save(VENTAS_FILE, ventas);
  return nueva;
}

/* ============ GET ============ */
export const getPedidos = (_req, res) => {
  try {
    const pedidos = safeRead(PEDIDOS_FILE);
    pedidos.sort((a, b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido));
    res.json(pedidos);
  } catch (err) {
    console.error("❌ Error al leer pedidos:", err);
    res.status(500).json({ error: "Error al leer pedidos" });
  }
};

/* ============ POST: crear pedido ============ */
export const createPedido = (req, res) => {
  try {
    const {
      cliente_id,
      cliente_nombre,
      producto_id,
      producto_nombre,
      cantidad,
      precio_unitario,
      fecha_estimada_entrega, // YYYY-MM-DD
      metodo_pago, // contado | contra_entrega | cuenta_corriente
    } = req.body || {};

    if (!producto_id || !cantidad || !precio_unitario) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const productos = safeRead(PRODUCTOS_FILE);
    const prod = productos.find((p) => String(p.id) === String(producto_id));
    if (!prod) return res.status(404).json({ error: "Producto no encontrado" });

    let estado = "pendiente";
    if (metodo_pago === "contado") estado = "pendiente/pagado";
    else if (metodo_pago === "contra_entrega")
      estado = "pendiente/contra entrega";
    else if (metodo_pago === "cuenta_corriente") estado = "pendiente/cta cte";

    const nuevo = {
      id: nextId(safeRead(PEDIDOS_FILE)),
      fecha_pedido: nowISO(),
      fecha_estimada_entrega: normalizeDateOnlyToISO(fecha_estimada_entrega),
      cliente_id: cliente_id ?? null,
      cliente_nombre: cliente_nombre ?? null,
      producto_id,
      producto_nombre: producto_nombre || prod.nombre,
      cantidad: Number(cantidad) || 0,
      precio_unitario: Number(precio_unitario) || 0,
      precio_total: (Number(cantidad) || 0) * (Number(precio_unitario) || 0),
      metodo_pago: metodo_pago || "contado",
      estado,
      fecha_entrega: null,
      venta_registrada: false,
      stock_descontado: false,
    };

    // Contado => registrar venta ya (el stock se descuenta al entregar)
    if (nuevo.metodo_pago === "contado") {
      crearVentaDesdePedido(nuevo);
      nuevo.venta_registrada = true;
    }

    const pedidos = safeRead(PEDIDOS_FILE);
    pedidos.push(nuevo);
    save(PEDIDOS_FILE, pedidos);

    res.status(201).json({ message: "Pedido creado", pedido: nuevo });
  } catch (err) {
    console.error("❌ Error en createPedido:", err);
    res.status(500).json({ error: "Error al registrar pedido" });
  }
};

/* ============ PUT: actualizar pedido (cualquier campo) ============ */
export const actualizarPedido = (req, res) => {
  try {
    const { id } = req.params;
    const cambios = req.body || {};

    const pedidos = safeRead(PEDIDOS_FILE);
    const idx = pedidos.findIndex((p) => String(p.id) === String(id));
    if (idx === -1)
      return res.status(404).json({ message: "Pedido no encontrado" });

    let p = { ...pedidos[idx] };

    // Actualizaciones de datos básicos
    if ("cliente_id" in cambios) p.cliente_id = cambios.cliente_id ?? null;
    if ("cliente_nombre" in cambios)
      p.cliente_nombre = cambios.cliente_nombre ?? null;

    if ("producto_id" in cambios) p.producto_id = cambios.producto_id;
    if ("producto_nombre" in cambios)
      p.producto_nombre = cambios.producto_nombre;

    if ("cantidad" in cambios) p.cantidad = Number(cambios.cantidad) || 0;
    if ("precio_unitario" in cambios)
      p.precio_unitario = Number(cambios.precio_unitario) || 0;

    // Recalcular total si cambia cantidad o precio
    if ("cantidad" in cambios || "precio_unitario" in cambios) {
      p.precio_total =
        (Number(p.cantidad) || 0) * (Number(p.precio_unitario) || 0);
    }

    if ("fecha_estimada_entrega" in cambios) {
      p.fecha_estimada_entrega = normalizeDateOnlyToISO(
        cambios.fecha_estimada_entrega
      );
    }

    if ("metodo_pago" in cambios) {
      p.metodo_pago = cambios.metodo_pago;
    }

    // Lógica de estado y efectos colaterales
    if ("estado" in cambios) {
      const nuevoEstado = cambios.estado;
      p.estado = nuevoEstado;

      if (
        nuevoEstado.startsWith("entregado") ||
        nuevoEstado === "entregado" ||
        nuevoEstado === "entregado/pendiente" ||
        nuevoEstado === "entregado/pagado" ||
        nuevoEstado === "entregado/cobrado"
      ) {
        p.fecha_entrega = nowISO();
      }

      const metodo = p.metodo_pago;

      if (metodo === "contado") {
        // Venta ya creada en POST; al entregar => descontar stock si no se hizo
        if (
          !p.stock_descontado &&
          (nuevoEstado === "entregado" ||
            nuevoEstado === "entregado/pagado" ||
            nuevoEstado === "entregado/pendiente")
        ) {
          ajustarStock(p.producto_id, p.cantidad, -1);
          p.stock_descontado = true;
        }
      } else if (metodo === "contra_entrega") {
        if (nuevoEstado === "entregado/pagado") {
          if (!p.venta_registrada) {
            crearVentaDesdePedido(p);
            p.venta_registrada = true;
          }
          if (!p.stock_descontado) {
            ajustarStock(p.producto_id, p.cantidad, -1);
            p.stock_descontado = true;
          }
        }
        if (!p.stock_descontado && nuevoEstado === "entregado") {
          ajustarStock(p.producto_id, p.cantidad, -1);
          p.stock_descontado = true;
        }
      } else if (metodo === "cuenta_corriente") {
        if (
          !p.stock_descontado &&
          (nuevoEstado === "entregado/pendiente" || nuevoEstado === "entregado")
        ) {
          ajustarStock(p.producto_id, p.cantidad, -1);
          p.stock_descontado = true;
        }
        if (nuevoEstado === "pagada" && !p.venta_registrada) {
          crearVentaDesdePedido(p);
          p.venta_registrada = true;
        }
      }
    }

    pedidos[idx] = p;
    save(PEDIDOS_FILE, pedidos);
    res.json(p);
  } catch (error) {
    console.error("❌ Error al actualizar pedido:", error);
    res.status(500).json({ message: "Error interno" });
  }
};

/* ============ DELETE: eliminar pedido ============ */
export const eliminarPedido = (req, res) => {
  try {
    const { id } = req.params;
    const pedidos = safeRead(PEDIDOS_FILE);
    const existe = pedidos.some((p) => String(p.id) === String(id));
    if (!existe)
      return res.status(404).json({ message: "Pedido no encontrado" });
    const nuevos = pedidos.filter((p) => String(p.id) !== String(id));
    save(PEDIDOS_FILE, nuevos);
    res.json({ message: "Pedido eliminado" });
  } catch (error) {
    console.error("❌ Error al eliminar pedido:", error);
    res.status(500).json({ message: "Error interno" });
  }
};
