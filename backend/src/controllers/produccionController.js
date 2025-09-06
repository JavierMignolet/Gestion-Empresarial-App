//src/controllers/produccionController.js
import { readJSON, writeJSON } from "../utils/fileHandler.js";

const PRODUCCION_FILE = "./src/data/producciones.json";

// utilidades internas
const leer = () => readJSON(PRODUCCION_FILE);
const guardar = (data) => writeJSON(PRODUCCION_FILE, data);

// GET: devolver producciones tal cual
export const getProducciones = (req, res) => {
  try {
    const producciones = leer();
    res.json(producciones);
  } catch (error) {
    console.error("❌ Error al obtener producciones:", error);
    res.status(500).json({ message: "Error al obtener producciones" });
  }
};

// POST: agregar nueva producción
export const agregarProduccion = (req, res) => {
  try {
    const { fecha, producto, nombre, cantidad, lote, insumos } = req.body;

    if (!fecha || !producto || !nombre || !cantidad || !lote || !insumos) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const cantidadNum = parseFloat(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      return res.status(400).json({ message: "Cantidad inválida" });
    }

    const insumosNormalizados = Array.isArray(insumos)
      ? insumos.map((i) => ({
          insumo: String(i.insumo || "").trim(),
          unidad: String(i.unidad || "").trim(),
          cantidad: parseFloat(i.cantidad),
        }))
      : [];

    if (
      insumosNormalizados.length === 0 ||
      insumosNormalizados.some(
        (i) => !i.insumo || isNaN(i.cantidad) || !i.unidad
      )
    ) {
      return res.status(400).json({ message: "Insumos inválidos" });
    }

    const nueva = {
      id: Date.now(),
      fecha,
      producto,
      nombre,
      cantidad: cantidadNum,
      lote,
      insumos: insumosNormalizados,
      stock: cantidadNum, // stock inicial = cantidad producida
    };

    const prods = leer();
    prods.push(nueva);
    guardar(prods);

    return res.status(201).json(nueva);
  } catch (error) {
    console.error("❌ Error al agregar producción:", error);
    res.status(500).json({ message: "Error al guardar producción" });
  }
};

// GET por ID
export const getProduccionPorId = (req, res) => {
  try {
    const { id } = req.params;
    const prods = leer();
    const prod = prods.find((p) => p.id == id);

    if (!prod) {
      return res.status(404).json({ message: "Producción no encontrada" });
    }

    res.json(prod);
  } catch (error) {
    console.error("❌ Error al buscar producción:", error);
    res.status(500).json({ message: "Error al buscar producción" });
  }
};

// PUT: actualizar producción
export const actualizarProduccion = (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const prods = leer();
    const idx = prods.findIndex((p) => p.id == id);
    if (idx === -1) {
      return res.status(404).json({ message: "Producción no encontrada" });
    }

    const prev = prods[idx];

    // normalizaciones opcionales
    let cantidadFinal =
      body.cantidad !== undefined ? parseFloat(body.cantidad) : prev.cantidad;
    if (isNaN(cantidadFinal) || cantidadFinal <= 0) {
      cantidadFinal = prev.cantidad;
    }

    let insumosFinal = Array.isArray(body.insumos)
      ? body.insumos.map((i) => ({
          insumo: String(i.insumo || "").trim(),
          unidad: String(i.unidad || "").trim(),
          cantidad: parseFloat(i.cantidad),
        }))
      : prev.insumos;

    if (
      !Array.isArray(insumosFinal) ||
      insumosFinal.length === 0 ||
      insumosFinal.some((i) => !i.insumo || isNaN(i.cantidad) || !i.unidad)
    ) {
      insumosFinal = prev.insumos;
    }

    // stock: si te lo pasan, lo respetamos; sino lo dejamos como estaba
    // (no lo recalculamos para no romper consumos ya realizados)
    const stockFinal =
      body.stock !== undefined ? parseFloat(body.stock) : prev.stock;

    prods[idx] = {
      ...prev,
      fecha: body.fecha ?? prev.fecha,
      producto: body.producto ?? prev.producto,
      nombre: body.nombre ?? prev.nombre,
      lote: body.lote ?? prev.lote,
      cantidad: cantidadFinal,
      insumos: insumosFinal,
      stock: isNaN(stockFinal) ? prev.stock : stockFinal,
    };

    guardar(prods);
    res.json(prods[idx]);
  } catch (error) {
    console.error("❌ Error al actualizar producción:", error);
    res.status(500).json({ message: "Error al actualizar producción" });
  }
};

// DELETE: eliminar producción
export const eliminarProduccion = (req, res) => {
  try {
    const { id } = req.params;
    const prods = leer();
    const existe = prods.some((p) => p.id == id);
    if (!existe) {
      return res.status(404).json({ message: "Producción no encontrada" });
    }
    const nuevos = prods.filter((p) => p.id != id);
    guardar(nuevos);
    res.json({ message: "Producción eliminada" });
  } catch (error) {
    console.error("❌ Error al eliminar producción:", error);
    res.status(500).json({ message: "Error al eliminar producción" });
  }
};
