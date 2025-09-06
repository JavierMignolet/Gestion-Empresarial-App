// src/routes/stockRoutes.js
import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";
import {
  getStockProduccion,
  getStockInsumos,
} from "../controllers/stockController.js";

const router = express.Router();

/**
 * Orden recomendado:
 * 1) verifyToken -> autentica y setea req.user
 * 2) tenantMiddleware -> resuelve req.tenantSlug según empresa (header/body)
 */
router.use(verifyToken);
router.use(tenantMiddleware);

router.get("/produccion", getStockProduccion);
router.get("/insumos", getStockInsumos);

export default router;
