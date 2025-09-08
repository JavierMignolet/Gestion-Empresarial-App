// src/controllers/ventasController.js
import { readJSON, writeJSON } from "../utils/fileHandler.js";

const VENTAS_FILE = "/ventas.json";

// Normaliza fecha (evita desfase de huso)
const normalizeFecha = (f) => {
  if (!f) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(f)) {
    return new Date(`${f}T12:00:00.000Z`).toISOString();
  }
  const d = new Date(f);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

const isEmpty = (v) => v === undefined || v === null || v === "";

const leer = () => {
  const d = readJSON(VENTAS_FILE);
  return Array.isArray(d) ? d : [];
};
const guardar = (arr) => writeJSON(VENTAS_FILE, Array.isArray(arr) ? arr : []);

// ✅ Obtener ventas
export const getVentas = (_req, res) => {
  try {
    res.json(leer());
  } catch (err) {
    console.error("getVentas error:", err);
    res.status(500).json({ message: "Error al leer ventas" });
  }
};

// ✅ Agregar nueva venta
export const addVenta = (req, res) => {
  try {
    const { fecha, cliente_id, producto_id, cantidad, precio_unitario, total } =
      req.body || {};

    if (
      isEmpty(cliente_id) ||
      isEmpty(producto_id) ||
      cantidad === undefined ||
      precio_unitario === undefined
    ) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const qty = parseFloat(cantidad);
    const pu = parseFloat(precio_unitario);
    if (isNaN(qty) || isNaN(pu)) {
      return res.status(400).json({ message: "Valores numéricos inválidos" });
    }

    const ventas = leer();

    const nuevaVenta = {
      id: Date.now(),
      fecha: normalizeFecha(fecha),
      cliente_id,
      producto_id,
      cantidad: qty,
      precio_unitario: pu,
      total:
        total !== undefined && !isNaN(parseFloat(total))
          ? parseFloat(total)
          : qty * pu,
    };

    ventas.push(nuevaVenta);
    guardar(ventas);

    res.status(201).json(nuevaVenta);
  } catch (err) {
    console.error("addVenta error:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ✅ Editar venta (parcial o total)
export const updateVenta = (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const ventas = leer();
    const index = ventas.findIndex((v) => String(v.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    const prev = ventas[index];

    const qty =
      body.cantidad !== undefined ? parseFloat(body.cantidad) : prev.cantidad;
    const pu =
      body.precio_unitario !== undefined
        ? parseFloat(body.precio_unitario)
        : prev.precio_unitario;

    if (isNaN(qty) || isNaN(pu)) {
      return res.status(400).json({ message: "Valores numéricos inválidos" });
    }

    const fechaFinal =
      body.fecha !== undefined ? normalizeFecha(body.fecha) : prev.fecha;

    const totalFinal =
      body.total !== undefined && !isNaN(parseFloat(body.total))
        ? parseFloat(body.total)
        : qty * pu;

    ventas[index] = {
      ...prev,
      fecha: fechaFinal,
      cliente_id:
        body.cliente_id !== undefined ? body.cliente_id : prev.cliente_id,
      producto_id:
        body.producto_id !== undefined ? body.producto_id : prev.producto_id,
      cantidad: qty,
      precio_unitario: pu,
      total: totalFinal,
    };

    guardar(ventas);
    res.json(ventas[index]);
  } catch (err) {
    console.error("updateVenta error:", err);
    res.status(500).json({ message: "Error al editar venta" });
  }
};

// ✅ Eliminar venta
export const deleteVenta = (req, res) => {
  try {
    const { id } = req.params;
    const ventas = leer();
    const existe = ventas.some((v) => String(v.id) === String(id));
    if (!existe) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }
    const nuevas = ventas.filter((v) => String(v.id) !== String(id));
    guardar(nuevas);
    res.json({ message: "Venta eliminada" });
  } catch (err) {
    console.error("deleteVenta error:", err);
    res.status(500).json({ message: "Error al eliminar venta" });
  }
};
