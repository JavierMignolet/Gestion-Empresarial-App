// src/routes/comprasRoutes.js
import express from "express";
import {
  getCompras,
  addCompra,
  updateCompra,
  deleteCompra,
} from "../controllers/comprasController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

/**
 * Orden recomendado de middlewares (multi-tenant):
 * 1) verifyToken  -> autentica y expone req.user (incluye empresa del token)
 * 2) tenantMiddleware -> resuelve req.tenantSlug desde header o req.user.empresa
 */
router.use(verifyToken);
router.use(tenantMiddleware);

// CRUD de compras (scoped al tenant actual)
router.get("/", getCompras);
router.post("/", addCompra);
router.put("/:id", updateCompra);
router.delete("/:id", deleteCompra);

export default router;
