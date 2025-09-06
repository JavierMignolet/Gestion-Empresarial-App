//reportesController.js
import fs from "fs";
import path from "path";
import { readJSON, writeJSON } from "../utils/fileHandler.js";

/* === Archivos fuente === */
const VENTAS_FILE = "./src/data/ventas.json";
const COMPRAS_FILE = "./src/data/compras.json";
const PRODUCCIONES_FILE = "./src/data/producciones.json";
const PEDIDOS_FILE = "./src/data/pedidos.json";
const OBJETIVOS_FILE = "./src/data/objetivos_ventas.json"; // { objetivo_mensual_unidades, objetivo_semestral_unidades, objetivo_anual_unidades }
const FINANZAS_FILE = "./src/data/finanzas.json"; // opcional
const VENTAS_MENSUALES_FILE = "./src/data/ventas_mensuales.json"; // [{year, month, unidades}]

/* === Helpers === */
const toDate = (s) => (s ? new Date(s) : null);
const inRange = (d, from, to) => {
  const t = toDate(d);
  if (!t) return false;
  if (from && t < from) return false;
  if (to && t > to) return false;
  return true;
};
const safeRead = (filePath, fallback = []) => {
  try {
    const data = readJSON(filePath);
    return data ?? fallback;
  } catch {
    return fallback;
  }
};
const safeReadObj = (filePath, fallback = {}) => {
  try {
    const data = readJSON(filePath);
    return data ?? fallback;
  } catch {
    return fallback;
  }
};
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

/* ==== VENTAS: agregados ===== */
const cantidadDeVenta = (v) => {
  if (Array.isArray(v.productos)) {
    return sum((v.productos || []).map((p) => Number(p.cantidad) || 0));
  }
  return Number(v.cantidad) || 0;
};

function aggregateMonthlyFromVentas(ventas) {
  // Devuelve [{year, month, unidades}]
  const map = new Map(); // key = `${y}-${m}`
  for (const v of ventas) {
    const d = toDate(v.fecha || v.createdAt);
    if (!d) continue;
    const y = d.getFullYear();
    const m = d.getMonth() + 1; // 1..12
    const key = `${y}-${m}`;
    const cant = cantidadDeVenta(v);
    map.set(key, (map.get(key) || 0) + cant);
  }
  const arr = [];
  for (const [key, unidades] of map.entries()) {
    const [y, m] = key.split("-").map((n) => Number(n));
    arr.push({ year: y, month: m, unidades });
  }
  arr.sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );
  return arr;
}

function ensureVentasMensualesPersistidas(ventas) {
  // Recalcula completo desde ventas.json y lo guarda en ./src/data/ventas_mensuales.json (idempotente)
  const mensual = aggregateMonthlyFromVentas(ventas);
  const dir = path.dirname(VENTAS_MENSUALES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  writeJSON(VENTAS_MENSUALES_FILE, mensual);
  return mensual;
}

function ventasRealesHorizontes(ventas) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const sixMonthsAgo = new Date(y, m - 5, 1);
  const jan1 = new Date(y, 0, 1);

  const enMes = ventas.filter((v) => {
    const d = toDate(v.fecha || v.createdAt);
    return d && d.getFullYear() === y && d.getMonth() === m;
  });
  const enSemestre = ventas.filter((v) => {
    const d = toDate(v.fecha || v.createdAt);
    return d && d >= sixMonthsAgo && d <= now;
  });
  const enAnio = ventas.filter((v) => {
    const d = toDate(v.fecha || v.createdAt);
    return d && d >= jan1 && d <= now;
  });

  return {
    mensual: sum(enMes.map(cantidadDeVenta)),
    semestral: sum(enSemestre.map(cantidadDeVenta)),
    anual: sum(enAnio.map(cantidadDeVenta)),
    total: sum(ventas.map(cantidadDeVenta)),
  };
}

/* === Insumos/Costos helpers (igual que antes) === */
function resumenInsumosDesdeCompras(compras) {
  const map = {};
  compras
    .filter((c) => (c.tipo || "").toLowerCase() === "insumo")
    .forEach((c) => {
      const key = (c.descripcion || "").trim().toLowerCase();
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          insumo: c.descripcion,
          unidad: c.unidad,
          cantidad_total_comprada: 0,
          total_precio: 0,
          total_unidades: 0,
        };
      }
      const cant = Number(c.cantidad) || 0;
      const pu = Number(c.precio_unitario) || 0;
      map[key].cantidad_total_comprada += cant;
      map[key].total_precio += pu * cant;
      map[key].total_unidades += cant;
    });

  return Object.values(map).map((i) => ({
    insumo: i.insumo,
    unidad: i.unidad,
    cantidad_total_comprada: i.cantidad_total_comprada,
    precio_unitario_promedio:
      i.total_unidades > 0 ? i.total_precio / i.total_unidades : 0,
  }));
}

function consumoInsumosDesdeProducciones(producciones) {
  const map = {};
  producciones.forEach((p) => {
    (p.insumos || []).forEach((i) => {
      const key = (i.insumo || "").trim().toLowerCase();
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          insumo: i.insumo,
          unidad: i.unidad,
          cantidad_consumida: 0,
        };
      }
      map[key].cantidad_consumida += Number(i.cantidad) || 0;
    });
  });
  return Object.values(map);
}

function saldoInsumos(comprasResumen, consumos) {
  const map = {};
  comprasResumen.forEach((c) => {
    const key = c.insumo.trim().toLowerCase();
    map[key] = {
      insumo: c.insumo,
      unidad: c.unidad,
      precio_unitario_promedio: c.precio_unitario_promedio,
      cantidad: c.cantidad_total_comprada,
    };
  });
  consumos.forEach((u) => {
    const key = u.insumo.trim().toLowerCase();
    if (!map[key]) {
      map[key] = {
        insumo: u.insumo,
        unidad: u.unidad,
        precio_unitario_promedio: 0,
        cantidad: 0,
      };
    }
    map[key].cantidad -= u.cantidad_consumida;
  });
  return Object.values(map).map((x) => ({
    ...x,
    cantidad: Number(x.cantidad) || 0,
  }));
}

function consumoPromedioQuincenal(producciones, from, to) {
  const rangoProds = producciones.filter((p) =>
    from || to ? inRange(p.fecha, from, to) : true
  );

  const consumo = consumoInsumosDesdeProducciones(rangoProds);
  const days = (() => {
    if (from && to) {
      const diff = Math.max(
        1,
        Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1
      );
      return Math.min(14, diff);
    }
    return 14;
  })();

  return consumo.map((c) => ({
    insumo: c.insumo,
    unidad: c.unidad,
    consumo_quincenal: ((Number(c.cantidad_consumida) || 0) / days) * 14,
  }));
}

function alertasInsumos(saldos, consumoQ) {
  const mapQ = {};
  consumoQ.forEach((c) => (mapQ[c.insumo.toLowerCase()] = c.consumo_quincenal));
  const amarillos = [];
  const rojos = [];

  saldos.forEach((s) => {
    const q = mapQ[s.insumo.toLowerCase()] || 0;
    if (q <= 0) return;
    const semanas = (s.cantidad / q) * 2;
    const item = {
      insumo: s.insumo,
      cantidad: Number(s.cantidad) || 0,
      unidad: s.unidad,
      cobertura_semanas: Number(semanas.toFixed(2)),
      cobertura_dias: Number((semanas * 7).toFixed(0)),
      estado: semanas <= 1 ? "rojo" : semanas <= 2 ? "amarillo" : "ok",
    };
    if (item.estado === "rojo") rojos.push(item);
    else if (item.estado === "amarillo") amarillos.push(item);
  });

  rojos.sort((a, b) => a.cobertura_semanas - b.cobertura_semanas);
  amarillos.sort((a, b) => a.cobertura_semanas - b.cobertura_semanas);

  return { rojos, amarillos };
}

function stockProduccionFIFO(producciones, ventas) {
  const lotes = producciones
    .map((p) => ({
      id: p.id,
      fecha: p.fecha,
      producto: p.producto,
      lote: p.lote,
      cantidad_inicial: Number(p.cantidad) || 0,
      stock: Number(p.stock ?? p.cantidad) || 0,
    }))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha)); // FIFO

  const ventasPorProducto = {};
  (ventas || []).forEach((v) => {
    if (Array.isArray(v.productos)) {
      v.productos.forEach((vp) => {
        const nombre = (
          vp.nombre ||
          vp.producto ||
          vp.producto_id ||
          ""
        ).toString();
        const cant = Number(vp.cantidad) || 0;
        ventasPorProducto[nombre] = (ventasPorProducto[nombre] || 0) + cant;
      });
    } else if (v.producto_id || v.producto) {
      const nombre = (v.producto || v.producto_id || "").toString();
      const cant = Number(v.cantidad) || 0;
      ventasPorProducto[nombre] = (ventasPorProducto[nombre] || 0) + cant;
    }
  });

  for (const [producto, qty] of Object.entries(ventasPorProducto)) {
    let restante = qty;
    for (const lote of lotes) {
      if (lote.producto !== producto) continue;
      if (restante <= 0) break;
      const consumir = Math.min(lote.stock, restante);
      lote.stock -= consumir;
      restante -= consumir;
    }
  }

  return lotes
    .map((l) => ({ ...l, agotado: l.stock <= 0 }))
    .sort((a, b) => String(b.lote).localeCompare(String(a.lote))); // DESC por lote
}

/* === Objetivos (unidades) === */
function readObjetivos() {
  const obj = safeReadObj(OBJETIVOS_FILE, null);
  return {
    objetivo_mensual_unidades: Number(obj?.objetivo_mensual_unidades) || 0,
    objetivo_semestral_unidades: Number(obj?.objetivo_semestral_unidades) || 0,
    objetivo_anual_unidades: Number(obj?.objetivo_anual_unidades) || 0,
    actualizadoPor: obj?.actualizadoPor || null,
    updatedAt: obj?.updatedAt || null,
  };
}

/* === Reporte principal === */
export const getReportes = (req, res) => {
  try {
    const { from: qsFrom, to: qsTo } = req.query;
    const from = qsFrom ? new Date(qsFrom) : null;
    const to = qsTo ? new Date(qsTo) : null;

    const ventas = safeRead(VENTAS_FILE);
    const compras = safeRead(COMPRAS_FILE);
    const produccionesAll = safeRead(PRODUCCIONES_FILE);
    const pedidosAll = safeRead(PEDIDOS_FILE);
    const gastosAll = safeRead("./src/data/gastos.json");

    /* --- Persistimos/actualizamos historial mensual (AUTO) --- */
    const ventasMensuales = ensureVentasMensualesPersistidas(ventas); // [{year, month, unidades}]

    /* --- Reales actuales (mes/semestre/año) --- */
    const vr = ventasRealesHorizontes(ventas);

    /* --- Filtrar por rango (para otros cálculos) --- */
    const produccionesRango = produccionesAll.filter((p) =>
      inRange(p.fecha, from, to)
    );
    const comprasRango = compras.filter((c) => inRange(c.fecha, from, to));
    const ventasRango = ventas.filter((v) =>
      inRange(v.fecha || v.createdAt, from, to)
    );
    const gastosRango = gastosAll.filter((g) => inRange(g.fecha, from, to));

    /* --- Productivos --- */
    const resumenCompras = resumenInsumosDesdeCompras(compras);
    const consumoQ = consumoPromedioQuincenal(produccionesAll, from, to);
    const saldos = saldoInsumos(
      resumenCompras,
      consumoInsumosDesdeProducciones(produccionesAll)
    );
    const { rojos, amarillos } = alertasInsumos(saldos, consumoQ);

    // Pedidos pendientes
    const pedidosPendientes = [];
    (pedidosAll || []).forEach((p) => {
      if (
        ["entregado", "entregado/cobrado", "cerrado"].includes(
          (p.estado || "").toLowerCase()
        )
      )
        return;
      const base = {
        fecha_pedido: p.fecha || p.fecha_pedido || null,
        cliente: p.cliente?.nombre || p.cliente || p.cliente_id || "-",
        fecha_estimada: p.fecha_entrega || p.fecha_estimada || null,
        senado_pagado: p.sena || p.senado || p.pagado || false,
      };
      if (Array.isArray(p.productos) && p.productos.length) {
        p.productos.forEach((it) =>
          pedidosPendientes.push({
            ...base,
            producto: it.nombre || it.producto || it.producto_id || "-",
            cantidad: Number(it.cantidad) || 0,
          })
        );
      } else {
        pedidosPendientes.push({
          ...base,
          producto: p.producto || p.producto_id || "-",
          cantidad: Number(p.cantidad) || 0,
        });
      }
    });

    const stockActual = stockProduccionFIFO(produccionesAll, ventas);

    const stockSeguridad = consumoQ
      .map((c) => {
        const s = saldos.find(
          (x) => x.insumo.toLowerCase() === c.insumo.toLowerCase()
        );
        const saldo = s ? Number(s.cantidad) || 0 : 0;
        const cobSem =
          c.consumo_quincenal > 0 ? (saldo / c.consumo_quincenal) * 2 : null;
        return {
          insumo: c.insumo,
          unidad: s?.unidad || c.unidad,
          cantidad: saldo,
          cobertura_semanas: cobSem !== null ? Number(cobSem.toFixed(2)) : null,
        };
      })
      .sort(
        (a, b) => (a.cobertura_semanas ?? 999) - (b.cobertura_semanas ?? 999)
      );

    const consumoPromedioGlobalQuincenal = sum(
      consumoQ.map((x) => Number(x.consumo_quincenal) || 0)
    );

    /* --- Económicos (CANTIDADES) --- */
    const objetivos = readObjetivos();

    // Costos
    const costosProd = (function () {
      const precioInsumo = {};
      const ri = resumenCompras;
      ri.forEach(
        (r) =>
          (precioInsumo[r.insumo.toLowerCase()] =
            Number(r.precio_unitario_promedio) || 0)
      );
      const costos = (produccionesRango.length ? produccionesRango : produccionesAll).map(
        (p) => {
          const costo = (p.insumos || []).reduce((acc, i) => {
            const pu = precioInsumo[(i.insumo || "").toLowerCase()] || 0;
            return acc + (Number(i.cantidad) || 0) * pu;
          }, 0);
          const cantidad = Number(p.cantidad) || 0;
          return {
            costo_total: costo,
            cantidad,
            costo_unitario: cantidad > 0 ? costo / cantidad : 0,
          };
        }
      );
      const costoVariableTotal = sum(costos.map((c) => c.costo_total));
      const unidadesProducidas = sum(costos.map((c) => c.cantidad));
      const costoVariableUnitario =
        unidadesProducidas > 0 ? costoVariableTotal / unidadesProducidas : 0;
      return { costoVariableUnitario, costoVariableTotal, unidadesProducidas };
    })();
    const costosFijos = sum(gastosRango.map((g) => Number(g.monto) || 0));

    /* --- Placeholders --- */
    const margenBrutoPct = null;
    const margenNetoPct = null;
    const puntoEquilibrioUnidades = null;
    const coberturaCFPct = null;

    /* === RESPUESTA === */
    res.json({
      rango: { from: qsFrom || null, to: qsTo || null },
      productivos: {
        stock_actual: stockActual,
        insumos_alerta: { rojos, amarillos },
        pedidos_pendientes: pedidosPendientes,
        stock_seguridad: {
          consumo_promedio_quincenal_global: Number(
            consumoPromedioGlobalQuincenal.toFixed(2)
          ),
          items: stockSeguridad,
        },
      },
      economicos: {
        // OBJETIVOS
        objetivos,
        // REALES: mensual / semestral (ult. 6 meses) / anual (año en curso)
        ventas_real: {
          mensual: vr.mensual,
          semestral: vr.semestral,
          anual: vr.anual,
        },
        // Comparativo mensual directo (para mostrar visible)
        comparativo_mensual: {
          real: vr.mensual,
          objetivo: objetivos.objetivo_mensual_unidades || 0,
        },
        // Historial mensual (persistido automáticamente)
        ventas_historial_mensual: ventasMensuales, // [{year, month, unidades}]
        // Otros
        ventas_cant_totales: vr.total,
        costo_fijo_total_rango: Number(costosFijos.toFixed(2)),
        costo_variable_unitario: Number(
          (costosProd.costoVariableUnitario || 0).toFixed(4)
        ),
        margen_bruto_pct: margenBrutoPct,
        margen_neto_pct: margenNetoPct,
        punto_equilibrio_unidades: puntoEquilibrioUnidades,
        cobertura_costos_fijos_pct: coberturaCFPct,
      },
      financieros: {
        // (dejamos como en tu versión previa)
        liquidez_corriente: null,
        capital_trabajo: null,
        endeudamiento_total: null,
        apalancamiento_financiero: null,
        dias_inventario: null,
        rotacion_cxc: null,
        dias_cobro_promedio: null,
        rotacion_cxp: null,
        dias_pago_promedio: null,
      },
    });
  } catch (err) {
    console.error("❌ Error en getReportes:", err);
    res.status(500).json({ message: "Error al generar reportes" });
  }
};
