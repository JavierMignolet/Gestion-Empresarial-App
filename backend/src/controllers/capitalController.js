//capitalController.js
import { readJSON, writeJSON } from "../utils/fileHandler.js";

const CAPITAL_FILE = "./src/data/capital.json"; // histórico (aporte/retiro) — opcional
const INVERSION_FILE = "./src/data/capital_inversion.json";
const COSTOS_FIJOS_FILE = "./src/data/costos_fijos.json";
const GASTOS_FILE = "./src/data/gastos.json"; // compartido con módulo Gastos

const COMPRAS_FILE = "./src/data/compras.json";
const PRODUCCIONES_FILE = "./src/data/producciones.json";

/* ========= Helpers ========= */
const safeRead = (p, fallback = []) => {
  try {
    const d = readJSON(p);
    return d ?? fallback;
  } catch {
    return fallback;
  }
};
const nextId = (arr) =>
  arr.length ? Math.max(...arr.map((x) => +x.id || 0)) + 1 : 1;

/* ========= Histórico anterior (aporte / retiro) ========= */
const calcularTotal = (historial) =>
  historial.reduce((acc, item) => {
    const m = parseFloat(item.monto) || 0;
    return item.tipo === "aporte" ? acc + m : acc - m;
  }, 0);

export const getCapital = (req, res) => {
  try {
    const historial = safeRead(CAPITAL_FILE, []);
    const total = calcularTotal(historial);
    res.json({ historial, total });
  } catch (err) {
    res.status(500).json({ error: "Error al leer el capital" });
  }
};

export const registrarMovimientoCapital = (req, res) => {
  try {
    const { concepto, tipo, monto, fecha, usuario } = req.body;
    if (!concepto || !tipo || monto === undefined) {
      return res.status(400).json({ error: "Faltan datos del capital" });
    }
    const nMonto = parseFloat(monto);
    if (Number.isNaN(nMonto))
      return res.status(400).json({ error: "Monto inválido" });
    if (!["aporte", "retiro"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo inválido (aporte/retiro)" });
    }

    const historial = safeRead(CAPITAL_FILE, []);
    const nuevo = {
      id: Date.now(),
      concepto,
      tipo,
      monto: nMonto,
      fecha: fecha || new Date().toISOString(),
      usuario: usuario || "admin",
    };
    historial.push(nuevo);
    writeJSON(CAPITAL_FILE, historial);
    res.status(201).json({
      message: "Capital registrado",
      data: nuevo,
      total: calcularTotal(historial),
    });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar capital" });
  }
};

export const actualizarMovimientoCapital = (req, res) => {
  try {
    const { id } = req.params;
    const { concepto, tipo, monto, fecha, usuario } = req.body;

    const historial = safeRead(CAPITAL_FILE, []);
    const idx = historial.findIndex((r) => r.id == id);
    if (idx === -1)
      return res.status(404).json({ error: "Movimiento no encontrado" });

    let nMonto = historial[idx].monto;
    if (monto !== undefined) {
      const parsed = parseFloat(monto);
      if (Number.isNaN(parsed))
        return res.status(400).json({ error: "Monto inválido" });
      nMonto = parsed;
    }
    let nTipo = historial[idx].tipo;
    if (tipo !== undefined) {
      if (!["aporte", "retiro"].includes(tipo)) {
        return res.status(400).json({ error: "Tipo inválido (aporte/retiro)" });
      }
      nTipo = tipo;
    }

    historial[idx] = {
      ...historial[idx],
      concepto: concepto ?? historial[idx].concepto,
      tipo: nTipo,
      monto: nMonto,
      fecha: fecha ?? historial[idx].fecha,
      usuario: usuario ?? historial[idx].usuario,
    };
    writeJSON(CAPITAL_FILE, historial);
    res.json({
      message: "Movimiento actualizado",
      data: historial[idx],
      total: calcularTotal(historial),
    });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar capital" });
  }
};

export const eliminarMovimientoCapital = (req, res) => {
  try {
    const { id } = req.params;
    const historial = safeRead(CAPITAL_FILE, []);
    if (!historial.some((r) => r.id == id))
      return res.status(404).json({ error: "Movimiento no encontrado" });
    const nuevo = historial.filter((r) => r.id != id);
    writeJSON(CAPITAL_FILE, nuevo);
    res.json({ message: "Movimiento eliminado", total: calcularTotal(nuevo) });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar capital" });
  }
};

/* ========= Capital de inversión ========= */
export const listInversion = (req, res) => {
  res.json(safeRead(INVERSION_FILE, []));
};
export const addInversion = (req, res) => {
  try {
    const { fecha, descripcion, tipo, cantidad, precio_unitario, total } =
      req.body;
    if (!descripcion)
      return res.status(400).json({ error: "Falta descripción" });
    const data = safeRead(INVERSION_FILE, []);
    const row = {
      id: nextId(data),
      fecha: fecha || new Date().toISOString(),
      descripcion,
      tipo: tipo || "inversion", // inversion | insumo | capital_trabajo
      cantidad: +cantidad || 0,
      precio_unitario: +precio_unitario || 0,
      total:
        total != null ? +total : (+cantidad || 0) * (+precio_unitario || 0),
    };
    data.push(row);
    writeJSON(INVERSION_FILE, data);
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: "Error al guardar inversión" });
  }
};
export const updateInversion = (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const data = safeRead(INVERSION_FILE, []);
    const idx = data.findIndex((x) => x.id == id);
    if (idx === -1) return res.status(404).json({ error: "No encontrado" });
    const prev = data[idx];
    const cantidad = body.cantidad != null ? +body.cantidad : prev.cantidad;
    const pu =
      body.precio_unitario != null
        ? +body.precio_unitario
        : prev.precio_unitario;
    const total = body.total != null ? +body.total : cantidad * pu;
    data[idx] = {
      ...prev,
      fecha: body.fecha ?? prev.fecha,
      descripcion: body.descripcion ?? prev.descripcion,
      tipo: body.tipo ?? prev.tipo,
      cantidad,
      precio_unitario: pu,
      total,
    };
    writeJSON(INVERSION_FILE, data);
    res.json(data[idx]);
  } catch {
    res.status(500).json({ error: "Error al actualizar inversión" });
  }
};
export const deleteInversion = (req, res) => {
  try {
    const { id } = req.params;
    const data = safeRead(INVERSION_FILE, []);
    if (!data.some((x) => x.id == id))
      return res.status(404).json({ error: "No encontrado" });
    const nuevo = data.filter((x) => x.id != id);
    writeJSON(INVERSION_FILE, nuevo);
    res.json({ message: "Eliminado" });
  } catch {
    res.status(500).json({ error: "Error al eliminar inversión" });
  }
};

/* ========= Costos fijos ========= */
export const listCostosFijos = (req, res) => {
  res.json(safeRead(COSTOS_FIJOS_FILE, []));
};
export const addCostoFijo = (req, res) => {
  try {
    const { fecha, descripcion, cantidad, precio_unitario, total } = req.body;
    if (!descripcion)
      return res.status(400).json({ error: "Falta descripción" });
    const data = safeRead(COSTOS_FIJOS_FILE, []);
    const row = {
      id: nextId(data),
      fecha: fecha || new Date().toISOString(),
      descripcion,
      cantidad: +cantidad || 0,
      precio_unitario: +precio_unitario || 0,
      total:
        total != null ? +total : (+cantidad || 0) * (+precio_unitario || 0),
    };
    data.push(row);
    writeJSON(COSTOS_FIJOS_FILE, data);
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Error al guardar costo fijo" });
  }
};
export const updateCostoFijo = (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const data = safeRead(COSTOS_FIJOS_FILE, []);
    const idx = data.findIndex((x) => x.id == id);
    if (idx === -1) return res.status(404).json({ error: "No encontrado" });
    const prev = data[idx];
    const cantidad = body.cantidad != null ? +body.cantidad : prev.cantidad;
    const pu =
      body.precio_unitario != null
        ? +body.precio_unitario
        : prev.precio_unitario;
    const total = body.total != null ? +body.total : cantidad * pu;
    data[idx] = {
      ...prev,
      fecha: body.fecha ?? prev.fecha,
      descripcion: body.descripcion ?? prev.descripcion,
      cantidad,
      precio_unitario: pu,
      total,
    };
    writeJSON(COSTOS_FIJOS_FILE, data);
    res.json(data[idx]);
  } catch {
    res.status(500).json({ error: "Error al actualizar costo fijo" });
  }
};
export const deleteCostoFijo = (req, res) => {
  try {
    const { id } = req.params;
    const data = safeRead(COSTOS_FIJOS_FILE, []);
    if (!data.some((x) => x.id == id))
      return res.status(404).json({ error: "No encontrado" });
    const nuevo = data.filter((x) => x.id != id);
    writeJSON(COSTOS_FIJOS_FILE, nuevo);
    res.json({ message: "Eliminado" });
  } catch {
    res.status(500).json({ error: "Error al eliminar costo fijo" });
  }
};

/* ========= Gastos (vinculado a modulo Gastos) ========= */
export const listGastos = (req, res) => {
  res.json(safeRead(GASTOS_FILE, []));
};
export const addGasto = (req, res) => {
  try {
    const { fecha, descripcion, cantidad, precio_unitario, total } = req.body;
    if (!descripcion)
      return res.status(400).json({ error: "Falta descripción" });
    const data = safeRead(GASTOS_FILE, []);
    const row = {
      id: nextId(data),
      fecha: fecha || new Date().toISOString(),
      descripcion,
      cantidad: +cantidad || 0,
      precio_unitario: +precio_unitario || 0,
      total:
        total != null ? +total : (+cantidad || 0) * (+precio_unitario || 0),
    };
    data.push(row);
    writeJSON(GASTOS_FILE, data);
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Error al guardar gasto" });
  }
};
export const updateGasto = (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const data = safeRead(GASTOS_FILE, []);
    const idx = data.findIndex((x) => x.id == id);
    if (idx === -1) return res.status(404).json({ error: "No encontrado" });
    const prev = data[idx];
    const cantidad = body.cantidad != null ? +body.cantidad : prev.cantidad;
    const pu =
      body.precio_unitario != null
        ? +body.precio_unitario
        : prev.precio_unitario;
    const total = body.total != null ? +body.total : cantidad * pu;
    data[idx] = {
      ...prev,
      fecha: body.fecha ?? prev.fecha,
      descripcion: body.descripcion ?? prev.descripcion,
      cantidad,
      precio_unitario: pu,
      total,
    };
    writeJSON(GASTOS_FILE, data);
    res.json(data[idx]);
  } catch {
    res.status(500).json({ error: "Error al actualizar gasto" });
  }
};
export const deleteGasto = (req, res) => {
  try {
    const { id } = req.params;
    const data = safeRead(GASTOS_FILE, []);
    if (!data.some((x) => x.id == id))
      return res.status(404).json({ error: "No encontrado" });
    const nuevo = data.filter((x) => x.id != id);
    writeJSON(GASTOS_FILE, nuevo);
    res.json({ message: "Eliminado" });
  } catch {
    res.status(500).json({ error: "Error al eliminar gasto" });
  }
};

/* ========= CVU (solo lectura) =========
   - Calcula consumo unitario por insumo: promedio( suma(insumo.cantidad)/suma(cantidad producida) )
   - Precio unitario promedio por insumo desde Compras (totalValor/cantidad)
   - Devuelve detalle por insumo y total */
export const getCVU = (req, res) => {
  try {
    const producciones = safeRead(PRODUCCIONES_FILE, []);
    const compras = safeRead(COMPRAS_FILE, []);

    // precio unitario prom por insumo+unidad (desde compras)
    const precioProm = new Map(); // key: "insumo||unidad" -> {pu}
    const comprasAgg = new Map();
    for (const c of compras) {
      if ((c.tipo || "").toLowerCase() !== "insumo") continue;
      const nombre = (c.descripcion ?? c.insumo ?? "")
        .toString()
        .trim()
        .toLowerCase();
      const unidad = (c.unidad ?? "").toString();
      if (!nombre || !unidad) continue;
      const key = `${nombre}||${unidad}`;
      const q = +c.cantidad || 0;
      const pu = +c.precio_unitario || 0;
      const tot = q * pu;
      const cur = comprasAgg.get(key) || { q: 0, v: 0 };
      comprasAgg.set(key, { q: cur.q + q, v: cur.v + tot });
    }
    for (const [key, { q, v }] of comprasAgg) {
      precioProm.set(key, q > 0 ? v / q : 0);
    }

    // consumo unitario por insumo = sum(cant insumo)/sum(cantidad producida)
    const totalProducido = producciones.reduce(
      (a, p) => a + (+p.cantidad || 0),
      0
    );
    const insumoAgg = new Map(); // key: "insumo||unidad" -> cantidad total insumo
    for (const p of producciones) {
      const lotQty = +p.cantidad || 0;
      if (!Array.isArray(p.insumos)) continue;
      for (const i of p.insumos) {
        const nombre = (i.insumo || "").toString().trim().toLowerCase();
        const unidad = (i.unidad || "").toString();
        if (!nombre || !unidad) continue;
        const key = `${nombre}||${unidad}`;
        const q = +i.cantidad || 0;
        insumoAgg.set(key, (insumoAgg.get(key) || 0) + q);
      }
    }

    const detalle = [];
    if (totalProducido > 0) {
      for (const [key, cantTotal] of insumoAgg) {
        const [nombre, unidad] = key.split("||");
        const cantUnit = cantTotal / totalProducido; // por paquete
        const pu = precioProm.get(key) || 0;
        const total = cantUnit * pu;
        detalle.push({
          insumo: nombre,
          unidad,
          cantidad_unidad: +cantUnit.toFixed(6),
          precio_unitario: +pu.toFixed(4),
          total: +total.toFixed(4),
        });
      }
    }

    // ordenar por mayor contribución
    detalle.sort((a, b) => b.total - a.total);

    const total = detalle.reduce((a, x) => a + x.total, 0);
    res.json({ detalle, total: +total.toFixed(4) });
  } catch (e) {
    res.status(500).json({ error: "No se pudo calcular el CVU" });
  }
};
 