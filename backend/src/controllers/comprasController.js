// src/controllers/comprasController.js
import { readJSON, writeJSON } from "../utils/fileHandler.js";

const FILE = "/compras.json";

const safeRead = () => {
  const d = readJSON(FILE);
  return Array.isArray(d) ? d : [];
};
const save = (arr) => writeJSON(FILE, Array.isArray(arr) ? arr : []);

const nextId = (arr) =>
  arr.length ? Math.max(...arr.map((x) => +x.id || 0)) + 1 : 1;

// ✅ Obtener todas las compras
export const getCompras = (_req, res) => {
  try {
    res.json(safeRead());
  } catch (error) {
    res.status(500).json({ message: "Error al leer las compras" });
  }
};

// ✅ Agregar nueva compra
export const addCompra = (req, res) => {
  try {
    const {
      fecha,
      tipo,
      proveedor_id,
      descripcion,
      unidad,
      cantidad,
      precio_unitario,
    } = req.body || {};

    if (
      !fecha ||
      !tipo ||
      !proveedor_id ||
      !descripcion ||
      !unidad ||
      cantidad === undefined ||
      precio_unitario === undefined
    ) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const parsedCantidad = parseFloat(cantidad);
    const parsedPrecio = parseFloat(precio_unitario);
    if (isNaN(parsedCantidad) || isNaN(parsedPrecio)) {
      return res.status(400).json({ message: "Cantidad o precio inválido" });
    }

    const tiposValidos = ["insumo", "gasto", "capital"];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ message: "Tipo inválido" });
    }

    const compras = safeRead();
    const total = parsedCantidad * parsedPrecio;

    const nuevaCompra = {
      id: nextId(compras),
      fecha,
      tipo,
      proveedor_id,
      descripcion,
      unidad,
      cantidad: parsedCantidad,
      precio_unitario: parsedPrecio,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    compras.push(nuevaCompra);
    save(compras);

    res.status(201).json(nuevaCompra);
  } catch (error) {
    console.error("❌ Error en addCompra:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ✅ Editar compra
export const updateCompra = (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const compras = safeRead();
    const idx = compras.findIndex((c) => String(c.id) === String(id));

    if (idx === -1) {
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    const prev = compras[idx];
    const parsedCantidad =
      body.cantidad !== undefined ? parseFloat(body.cantidad) : prev.cantidad;
    const parsedPrecio =
      body.precio_unitario !== undefined
        ? parseFloat(body.precio_unitario)
        : prev.precio_unitario;

    if (isNaN(parsedCantidad) || isNaN(parsedPrecio)) {
      return res.status(400).json({ message: "Cantidad o precio inválido" });
    }

    const total =
      body.total !== undefined
        ? parseFloat(body.total)
        : parsedCantidad * parsedPrecio;

    compras[idx] = {
      ...prev,
      fecha: body.fecha ?? prev.fecha,
      tipo: body.tipo ?? prev.tipo,
      proveedor_id: body.proveedor_id ?? prev.proveedor_id,
      descripcion: body.descripcion ?? prev.descripcion,
      unidad: body.unidad ?? prev.unidad,
      cantidad: parsedCantidad,
      precio_unitario: parsedPrecio,
      total: isNaN(total) ? prev.total : total,
      updatedAt: new Date().toISOString(),
    };

    save(compras);
    res.json(compras[idx]);
  } catch (error) {
    console.error("❌ Error en updateCompra:", error);
    res.status(500).json({ message: "Error al editar compra" });
  }
};

// ✅ Eliminar compra
export const deleteCompra = (req, res) => {
  try {
    const { id } = req.params;
    const compras = safeRead();

    const existe = compras.some((c) => String(c.id) === String(id));
    if (!existe) {
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    const nuevo = compras.filter((c) => String(c.id) !== String(id));
    save(nuevo);
    res.json({ message: "Compra eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error en deleteCompra:", error);
    res.status(500).json({ message: "Error al eliminar compra" });
  }
};
