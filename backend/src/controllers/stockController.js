//src/controllers/stockController.js
import { readJSON } from "../utils/fileHandler.js";

const PRODUCCIONES_FILE = "./src/data/producciones.json";
const COMPRAS_FILE = "./src/data/compras.json";
const VENTAS_FILE = "./src/data/ventas.json";

/* Utilidades */
const parseDate = (s) => new Date(s || Date.now()).getTime();

const toNumber = (v, def = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
};

/**
 * Extrae ventas por producto de forma robusta (soporta dos formatos):
 * - { producto / nombre / producto_nombre, cantidad }
 * - { productos: [{id?, nombre?, cantidad}] }
 * Retorna un mapa: { "<claveProducto>": cantidadVendidaTotal }
 * La clave por defecto será el nombre del producto (string) si existe; si no, intenta id.
 */
function mapVentasPorProducto(ventas) {
  const map = new Map();

  for (const v of ventas) {
    // 1) Formato con array de productos
    if (Array.isArray(v.productos)) {
      for (const p of v.productos) {
        const key = (
          p.nombre ??
          p.producto ??
          p.producto_nombre ??
          p.id
        )?.toString();
        const cant = toNumber(p.cantidad);
        if (key) map.set(key, (map.get(key) || 0) + cant);
      }
      continue;
    }
    // 2) Formato simple con campos sueltos
    const key = (
      v.producto ??
      v.nombre ??
      v.producto_nombre ??
      v.producto_id
    )?.toString();
    const cant = toNumber(v.cantidad);
    if (key) map.set(key, (map.get(key) || 0) + cant);
  }

  return map;
}

/**
 * Aplica ventas (FIFO) sobre los lotes de un producto.
 * Modifica y retorna los lotes con campo 'remanente'.
 */
function aplicarFIFO(lotes, cantidadAVender) {
  let restante = cantidadAVender;
  for (const lote of lotes) {
    if (restante <= 0) break;
    const disponible = lote.remanente;
    const quita = Math.min(disponible, restante);
    lote.remanente = +(disponible - quita).toFixed(4);
    restante -= quita;
  }
  return lotes;
}

/* GET /api/stock/produccion  -> Lotes con remanente (aplicando ventas FIFO) */
export const getStockProduccion = (req, res) => {
  try {
    const producciones = readJSON(PRODUCCIONES_FILE);
    const ventas = readJSON(VENTAS_FILE);

    // 1) Construir lotes por producto (ordenados por fecha asc)
    const lotesPorProducto = new Map();
    for (const p of producciones) {
      const key = (p.producto ?? p.nombre)?.toString();
      if (!key) continue;
      const lote = {
        id: p.id,
        fecha: p.fecha,
        lote: p.lote,
        producto: key,
        cantidad: toNumber(p.cantidad),
        remanente: toNumber(p.stock ?? p.cantidad), // si guardaste "stock" en producción
      };
      if (!lotesPorProducto.has(key)) lotesPorProducto.set(key, []);
      lotesPorProducto.get(key).push(lote);
    }
    // ordenar por fecha ascendente (FIFO antiguo primero)
    for (const [, arr] of lotesPorProducto) {
      arr.sort((a, b) => parseDate(a.fecha) - parseDate(b.fecha));
    }

    // 2) Total de ventas por producto
    const ventasPorProducto = mapVentasPorProducto(ventas);

    // 3) Aplicar FIFO de ventas a los lotes de cada producto
    for (const [key, lotes] of lotesPorProducto) {
      const vendidas = ventasPorProducto.get(key) || 0;
      aplicarFIFO(lotes, vendidas);
    }

    // 4) Aplanar respuesta
    const lotes = [];
    for (const [, arr] of lotesPorProducto) lotes.push(...arr);

    // 5) Agregar estado para UI
    const resp = lotes.map((l) => ({
      ...l,
      estado:
        l.remanente <= 0
          ? "agotado"
          : l.remanente < l.cantidad
          ? "parcial"
          : "ok",
    }));

    res.json(resp);
  } catch (err) {
    console.error("❌ Error getStockProduccion:", err);
    res.status(500).json({ message: "Error al obtener stock de producción" });
  }
};

/* GET /api/stock/insumos -> Stock por insumo con alertas */
export const getStockInsumos = (req, res) => {
  try {
    const compras = readJSON(COMPRAS_FILE);
    const producciones = readJSON(PRODUCCIONES_FILE);

    // 1) Compras de tipo 'insumo': acumular por (insumo/descripcion, unidad)
    const comprasInsumos = new Map();
    for (const c of compras) {
      if (c.tipo !== "insumo") continue;
      const nombre = (c.descripcion ?? c.insumo ?? "")
        .toString()
        .trim()
        .toLowerCase();
      const unidad = (c.unidad ?? "").toString();
      if (!nombre || !unidad) continue;
      const key = `${nombre}||${unidad}`;
      const cant = toNumber(c.cantidad);
      const precioU = toNumber(c.precio_unitario);
      const totalCompra = cant * precioU;

      if (!comprasInsumos.has(key))
        comprasInsumos.set(key, { nombre, unidad, cantidad: 0, totalValor: 0 });
      const k = comprasInsumos.get(key);
      k.cantidad += cant;
      k.totalValor += totalCompra;
    }

    // 2) Consumo desde producciones: acumular insumos usados
    const consumoInsumos = new Map();
    const ahora = Date.now();
    const catorceDiasMs = 14 * 24 * 60 * 60 * 1000;

    // Para cálculo de promedio 14 días:
    const consumoUlt14 = new Map();

    for (const p of producciones) {
      const fechaMs = parseDate(p.fecha);
      const enUlt14 = ahora - fechaMs <= catorceDiasMs;

      if (!Array.isArray(p.insumos)) continue;
      for (const i of p.insumos) {
        const nombre = (i.insumo ?? "").toString().trim().toLowerCase();
        const unidad = (i.unidad ?? "").toString();
        if (!nombre || !unidad) continue;
        const key = `${nombre}||${unidad}`;
        const cant = toNumber(i.cantidad);

        consumoInsumos.set(key, (consumoInsumos.get(key) || 0) + cant);
        if (enUlt14) consumoUlt14.set(key, (consumoUlt14.get(key) || 0) + cant);
      }
    }

    // 3) Armar stock por insumo
    const resultado = [];
    // unir claves de compras y consumos
    const claves = new Set([
      ...comprasInsumos.keys(),
      ...consumoInsumos.keys(),
    ]);

    for (const key of claves) {
      const datoCompra = comprasInsumos.get(key) || {
        nombre: key.split("||")[0],
        unidad: key.split("||")[1],
        cantidad: 0,
        totalValor: 0,
      };
      const usado = consumoInsumos.get(key) || 0;

      const stock = +(datoCompra.cantidad - usado).toFixed(4);

      // costo promedio (si se quiere mostrar/precalcular)
      const precioUnitProm =
        datoCompra.cantidad > 0
          ? datoCompra.totalValor / datoCompra.cantidad
          : 0;

      // consumo diario promedio últimos 14 días
      const usado14 = consumoUlt14.get(key) || 0;
      const consumoDiarioProm = usado14 / 14; // unidades/día
      const coberturaDias =
        consumoDiarioProm > 0 ? stock / consumoDiarioProm : Infinity;

      let alerta = "ok";
      if (consumoDiarioProm > 0) {
        if (coberturaDias <= 7) alerta = "rojo";
        else if (coberturaDias <= 14) alerta = "amarillo";
      } else {
        alerta = "sin-datos"; // no hay consumo reciente
      }

      resultado.push({
        insumo: datoCompra.nombre,
        unidad: datoCompra.unidad,
        stock, // compras - consumo
        precio_unitario_promedio: +precioUnitProm.toFixed(2),
        consumo_diario_promedio_14d: +consumoDiarioProm.toFixed(4),
        cobertura_dias: Number.isFinite(coberturaDias)
          ? +coberturaDias.toFixed(1)
          : null,
        alerta,
      });
    }

    // ordenar por insumo
    resultado.sort((a, b) => a.insumo.localeCompare(b.insumo));
    res.json(resultado);
  } catch (err) {
    console.error("❌ Error getStockInsumos:", err);
    res.status(500).json({ message: "Error al obtener stock de insumos" });
  }
};
