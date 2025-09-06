 //gastosController.js
import { readJSON, writeJSON } from "../utils/fileHandler.js";

const GASTOS_FILE = "./src/data/gastos.json";

// GET: listar todos
export const getGastos = (req, res) => {
  try {
    const gastos = readJSON(GASTOS_FILE);
    res.json(gastos);
  } catch (err) {
    console.error("❌ Error al leer los gastos:", err);
    res.status(500).json({ error: "Error al leer los gastos" });
  }
};

// POST: crear
export const registrarGasto = (req, res) => {
  try {
    const { concepto, categoria, monto, fecha, usuario } = req.body;

    if (!concepto || !categoria || monto === undefined || monto === null) {
      return res.status(400).json({ error: "Faltan datos del gasto" });
    }

    const nMonto = parseFloat(monto);
    if (Number.isNaN(nMonto)) {
      return res.status(400).json({ error: "Monto inválido" });
    }

    const gastos = readJSON(GASTOS_FILE);

    const nuevoGasto = {
      id: Date.now(),
      concepto,
      categoria,
      monto: nMonto,
      fecha: fecha || new Date().toISOString(),
      usuario: usuario || "admin",
    };

    gastos.push(nuevoGasto);
    writeJSON(GASTOS_FILE, gastos);

    res.status(201).json({ message: "Gasto registrado", data: nuevoGasto });
  } catch (err) {
    console.error("❌ Error al registrar gasto:", err);
    res.status(500).json({ error: "Error al registrar gasto" });
  }
};

// PUT: actualizar por id
export const actualizarGasto = (req, res) => {
  try {
    const { id } = req.params;
    const { concepto, categoria, monto, fecha, usuario } = req.body;

    const gastos = readJSON(GASTOS_FILE);
    const idx = gastos.findIndex((g) => g.id == id);
    if (idx === -1) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }

    // Validaciones mínimas si vino "monto"
    let nMonto = gastos[idx].monto;
    if (monto !== undefined) {
      const parsed = parseFloat(monto);
      if (Number.isNaN(parsed)) {
        return res.status(400).json({ error: "Monto inválido" });
      }
      nMonto = parsed;
    }

    gastos[idx] = {
      ...gastos[idx],
      concepto: concepto ?? gastos[idx].concepto,
      categoria: categoria ?? gastos[idx].categoria,
      monto: nMonto,
      fecha: fecha ?? gastos[idx].fecha,
      usuario: usuario ?? gastos[idx].usuario,
    };

    writeJSON(GASTOS_FILE, gastos);
    res.json({ message: "Gasto actualizado", data: gastos[idx] });
  } catch (err) {
    console.error("❌ Error al actualizar gasto:", err);
    res.status(500).json({ error: "Error al actualizar gasto" });
  }
};

// DELETE: eliminar por id
export const eliminarGasto = (req, res) => {
  try {
    const { id } = req.params;
    const gastos = readJSON(GASTOS_FILE);

    const existe = gastos.some((g) => g.id == id);
    if (!existe) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }

    const nuevos = gastos.filter((g) => g.id != id);
    writeJSON(GASTOS_FILE, nuevos);

    res.json({ message: "Gasto eliminado" });
  } catch (err) {
    console.error("❌ Error al eliminar gasto:", err);
    res.status(500).json({ error: "Error al eliminar gasto" });
  }
};
