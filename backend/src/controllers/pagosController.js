// src/controllers/pagosController.js
import { readJSON, writeJSON } from "../utils/fileHandler.js";

const FILE = "/pagos.json";

const safeRead = () => {
  const d = readJSON(FILE);
  return Array.isArray(d) ? d : [];
};
const save = (arr) => writeJSON(FILE, Array.isArray(arr) ? arr : []);

// GET /api/pagos
export const getPagos = (_req, res) => {
  try {
    res.json(safeRead());
  } catch (err) {
    console.error("❌ Error al leer pagos:", err);
    res.status(500).json({ error: "Error al leer pagos" });
  }
};

// POST /api/pagos
export const registrarPago = (req, res) => {
  try {
    const { concepto, categoria, monto, fecha, usuario } = req.body || {};

    if (!concepto || !categoria || monto === undefined) {
      return res.status(400).json({ error: "Faltan datos del pago" });
    }

    const pagos = safeRead();

    const nuevoPago = {
      id: Date.now(),
      concepto,
      categoria,
      monto: parseFloat(monto),
      fecha: fecha || new Date().toISOString(),
      usuario: usuario || "admin",
    };

    pagos.push(nuevoPago);
    save(pagos);

    res.status(201).json({ message: "Pago registrado", data: nuevoPago });
  } catch (err) {
    console.error("❌ Error al registrar pago:", err);
    res.status(500).json({ error: "Error al registrar pago" });
  }
};

// PUT /api/pagos/:id
export const actualizarPago = (req, res) => {
  try {
    const { id } = req.params;
    const { concepto, categoria, monto, fecha, usuario } = req.body || {};

    const pagos = safeRead();
    const index = pagos.findIndex((p) => String(p.id) === String(id));

    if (index === -1) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    const actualizado = {
      ...pagos[index],
      ...(concepto !== undefined ? { concepto } : {}),
      ...(categoria !== undefined ? { categoria } : {}),
      ...(monto !== undefined ? { monto: parseFloat(monto) } : {}),
      ...(fecha !== undefined ? { fecha } : {}),
      ...(usuario !== undefined ? { usuario } : {}),
    };

    pagos[index] = actualizado;
    save(pagos);

    res.json({ message: "Pago actualizado", data: actualizado });
  } catch (err) {
    console.error("❌ Error al actualizar pago:", err);
    res.status(500).json({ error: "Error al actualizar pago" });
  }
};

// DELETE /api/pagos/:id
export const eliminarPago = (req, res) => {
  try {
    const { id } = req.params;

    const pagos = safeRead();
    const existe = pagos.some((p) => String(p.id) === String(id));

    if (!existe) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    const restantes = pagos.filter((p) => String(p.id) !== String(id));
    save(restantes);

    res.json({ message: "Pago eliminado" });
  } catch (err) {
    console.error("❌ Error al eliminar pago:", err);
    res.status(500).json({ error: "Error al eliminar pago" });
  }
};
