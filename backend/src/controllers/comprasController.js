//src/controllers/comprasController.js
import { readJSON, writeJSON } from "../utils/fileHandler.js";

const comprasFile = "./src/data/compras.json";

// ✅ Obtener todas las compras
export const getCompras = (req, res) => {
  try {
    const compras = readJSON(comprasFile);
    res.json(compras);
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
    } = req.body;

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

    const compras = readJSON(comprasFile);
    const total = parsedCantidad * parsedPrecio;

    const nuevaCompra = {
      id: Date.now(),
      fecha,
      tipo,
      proveedor_id,
      descripcion,
      unidad,
      cantidad: parsedCantidad,
      precio_unitario: parsedPrecio,
      total,
    };

    compras.push(nuevaCompra);
    writeJSON(comprasFile, compras);

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
    const {
      fecha,
      tipo,
      proveedor_id,
      descripcion,
      unidad,
      cantidad,
      precio_unitario,
    } = req.body;

    const compras = readJSON(comprasFile);
    const index = compras.findIndex((c) => c.id == id);

    if (index === -1) {
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    const parsedCantidad = parseFloat(cantidad);
    const parsedPrecio = parseFloat(precio_unitario);

    const total = parsedCantidad * parsedPrecio;

    compras[index] = {
      ...compras[index],
      fecha,
      tipo,
      proveedor_id,
      descripcion,
      unidad,
      cantidad: parsedCantidad,
      precio_unitario: parsedPrecio,
      total,
    };

    writeJSON(comprasFile, compras);
    res.json(compras[index]);
  } catch (error) {
    console.error("❌ Error en updateCompra:", error);
    res.status(500).json({ message: "Error al editar compra" });
  }
};

// ✅ Eliminar compra
export const deleteCompra = (req, res) => {
  try {
    const { id } = req.params;
    let compras = readJSON(comprasFile);

    const existe = compras.find((c) => c.id == id);
    if (!existe) {
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    compras = compras.filter((c) => c.id != id);
    writeJSON(comprasFile, compras);
    res.json({ message: "Compra eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error en deleteCompra:", error);
    res.status(500).json({ message: "Error al eliminar compra" });
  }
};
