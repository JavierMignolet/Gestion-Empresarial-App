//src/controllers/pagosController.js
import { readJSON, writeJSON } from "../utils/fileHandler.js";

const PAGOS_FILE = "./src/data/pagos.json";

// GET /api/pagos
export const getPagos = async (req, res) => {
  try {
    const pagos = await readJSON(PAGOS_FILE);
    res.json(pagos);
  } catch (err) {
    console.error("❌ Error al leer pagos:", err);
    res.status(500).json({ error: "Error al leer pagos" });
  }
};

// POST /api/pagos
export const registrarPago = async (req, res) => {
  try {
    const { concepto, categoria, monto, fecha, usuario } = req.body;

    if (!concepto || !categoria || monto === undefined) {
      return res.status(400).json({ error: "Faltan datos del pago" });
    }

    const pagos = await readJSON(PAGOS_FILE);

    const nuevoPago = {
      id: Date.now(),
      concepto,
      categoria,
      monto: parseFloat(monto),
      fecha: fecha || new Date().toISOString(),
      usuario: usuario || "admin",
    };

    pagos.push(nuevoPago);
    await writeJSON(PAGOS_FILE, pagos);

    res.status(201).json({ message: "Pago registrado", data: nuevoPago });
  } catch (err) {
    console.error("❌ Error al registrar pago:", err);
    res.status(500).json({ error: "Error al registrar pago" });
  }
};

// PUT /api/pagos/:id
export const actualizarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { concepto, categoria, monto, fecha, usuario } = req.body;

    const pagos = await readJSON(PAGOS_FILE);
    const index = pagos.findIndex((p) => p.id == id);

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
    await writeJSON(PAGOS_FILE, pagos);

    res.json({ message: "Pago actualizado", data: actualizado });
  } catch (err) {
    console.error("❌ Error al actualizar pago:", err);
    res.status(500).json({ error: "Error al actualizar pago" });
  }
};

// DELETE /api/pagos/:id
export const eliminarPago = async (req, res) => {
  try {
    const { id } = req.params;

    const pagos = await readJSON(PAGOS_FILE);
    const existe = pagos.some((p) => p.id == id);

    if (!existe) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    const restantes = pagos.filter((p) => p.id != id);
    await writeJSON(PAGOS_FILE, restantes);

    res.json({ message: "Pago eliminado" });
  } catch (err) {
    console.error("❌ Error al eliminar pago:", err);
    res.status(500).json({ error: "Error al eliminar pago" });
  }
};
