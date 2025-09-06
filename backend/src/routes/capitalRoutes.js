// src/routes/capitalRoutes.js
import express from "express";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";
import {
  // capital “histórico” (si querés mantenerlo)
  getCapital,
  registrarMovimientoCapital,
  actualizarMovimientoCapital,
  eliminarMovimientoCapital,

  // Inversión
  listInversion,
  addInversion,
  updateInversion,
  deleteInversion,

  // Costos fijos
  listCostosFijos,
  addCostoFijo,
  updateCostoFijo,
  deleteCostoFijo,

  // Gastos (vinculado a gastos.json)
  listGastos,
  addGasto,
  updateGasto,
  deleteGasto,

  // CVU (solo lectura)
  getCVU,
} from "../controllers/capitalController.js";

const router = express.Router();

// ✅ Asegura multi-tenant para TODOS los endpoints de capital
router.use(tenantMiddleware);

// === (opcional) endpoints históricos
router.get("/", verifyToken, getCapital);
router.post("/", verifyToken, registrarMovimientoCapital);
router.put("/:id", verifyToken, actualizarMovimientoCapital);
router.delete("/:id", verifyToken, eliminarMovimientoCapital);

// === Capital de inversión
router.get("/inversion", verifyToken, listInversion);
router.post("/inversion", verifyToken, isAdmin, addInversion);
router.put("/inversion/:id", verifyToken, isAdmin, updateInversion);
router.delete("/inversion/:id", verifyToken, isAdmin, deleteInversion);

// === Costos fijos
router.get("/costos-fijos", verifyToken, listCostosFijos);
router.post("/costos-fijos", verifyToken, isAdmin, addCostoFijo);
router.put("/costos-fijos/:id", verifyToken, isAdmin, updateCostoFijo);
router.delete("/costos-fijos/:id", verifyToken, isAdmin, deleteCostoFijo);

// === Gastos (mismo archivo que tu módulo Gastos)
router.get("/gastos", verifyToken, listGastos);
router.post("/gastos", verifyToken, isAdmin, addGasto);
router.put("/gastos/:id", verifyToken, isAdmin, updateGasto);
router.delete("/gastos/:id", verifyToken, isAdmin, deleteGasto);

// === CVU (solo lectura)
router.get("/cvu", verifyToken, getCVU);

export default router;
