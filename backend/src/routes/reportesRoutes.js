import express from "express";
import {
  getReportes,
  getResumenDashboard,
} from "../controllers/reportesController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

/**
 * Orden recomendado:
 * 1) verifyToken -> autentica y setea req.user
 * 2) tenantMiddleware -> resuelve req.tenantSlug para aislar datos por empresa
 */
router.use(verifyToken);
router.use(tenantMiddleware);

// KPI para el Dashboard
// GET /api/reportes/resumen
router.get("/resumen", getResumenDashboard);

// Reporte completo
// GET /api/reportes?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/", getReportes);

export default router;
