// src/controllers/insumoController.js
import { readJSON } from "../utils/fileHandler.js";

const COMPRAS_FILE = "/compras.json";

// ✅ Obtener resumen de insumos desde las compras
export const getResumenInsumos = (_req, res) => {
  try {
    const compras = readJSON(COMPRAS_FILE);
    const arr = Array.isArray(compras) ? compras : [];

    const insumos = arr
      .filter((c) => (c.tipo || "").toLowerCase() === "insumo")
      .reduce((acc, compra) => {
        const key = String(compra.descripcion || "").toLowerCase();
        if (!key) return acc;
        if (!acc[key]) {
          acc[key] = {
            insumo: compra.descripcion,
            unidad: compra.unidad,
            cantidad_total: 0,
            total_precio: 0,
            total_unidades: 0,
          };
        }
        const q = Number(compra.cantidad) || 0;
        const pu = Number(compra.precio_unitario) || 0;
        acc[key].cantidad_total += q;
        acc[key].total_precio += pu * q;
        acc[key].total_unidades += q;
        return acc;
      }, {});

    const resumen = Object.values(insumos).map((i) => ({
      insumo: i.insumo,
      unidad: i.unidad,
      cantidad_total: i.cantidad_total,
      precio_unitario:
        i.total_unidades > 0
          ? (i.total_precio / i.total_unidades).toFixed(2)
          : "0.00",
    }));

    res.json(resumen);
  } catch (error) {
    console.error("❌ Error al generar resumen de insumos:", error);
    res.status(500).json({ message: "Error al obtener resumen de insumos" });
  }
};
