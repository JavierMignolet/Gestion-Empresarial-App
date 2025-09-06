// src/routes/insumoRoutes.js
import express from "express";
import { getResumenInsumos } from "../controllers/insumoController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

/**
 * Middleware en orden recomendado:
 * 1) verifyToken       -> autentica y setea req.user
 * 2) tenantMiddleware  -> resuelve req.tenantSlug (por header/body o req.user.empresa)
 */
router.use(verifyToken);
router.use(tenantMiddleware);

// GET /api/insumos
router.get("/", getResumenInsumos);

export default router;
