//src/controllers/insumosController.js
import { readJSON } from "../utils/fileHandler.js";

const COMPRAS_FILE = "./src/data/compras.json";

// ✅ Obtener resumen de insumos desde las compras
export const getResumenInsumos = (req, res) => {
  try {
    const compras = readJSON(COMPRAS_FILE);

    const insumos = compras
      .filter((c) => c.tipo === "insumo")
      .reduce((acc, compra) => {
        const key = compra.descripcion.toLowerCase();
        if (!acc[key]) {
          acc[key] = {
            insumo: compra.descripcion,
            unidad: compra.unidad,
            cantidad_total: 0,
            total_precio: 0,
            total_unidades: 0,
          };
        }
        acc[key].cantidad_total += compra.cantidad;
        acc[key].total_precio += compra.precio_unitario * compra.cantidad;
        acc[key].total_unidades += compra.cantidad;

        return acc;
      }, {});

    const resumen = Object.values(insumos).map((i) => ({
      insumo: i.insumo,
      unidad: i.unidad,
      cantidad_total: i.cantidad_total,
      precio_unitario: (i.total_precio / i.total_unidades).toFixed(2),
    }));

    res.json(resumen);
  } catch (error) {
    console.error("❌ Error al generar resumen de insumos:", error);
    res.status(500).json({ message: "Error al obtener resumen de insumos" });
  }
};
