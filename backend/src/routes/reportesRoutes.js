// src/routes/reportesRoutes.js
import express from "express";
import { getReportes } from "../controllers/reportesController.js";
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

// GET /api/reportes?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/", getReportes);

export default router;
