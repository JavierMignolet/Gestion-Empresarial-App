// src/routes/ventasRoutes.js
import express from "express";
import {
  getVentas,
  addVenta,
  deleteVenta,
  updateVenta,
} from "../controllers/ventasController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

/**
 * Orden recomendado:
 * 1) verifyToken -> autentica y setea req.user
 * 2) tenantMiddleware -> resuelve req.tenantSlug según empresa (header/body)
 */
router.use(verifyToken);
router.use(tenantMiddleware);

router.get("/", getVentas);
router.post("/", addVenta);
router.put("/:id", updateVenta);
router.delete("/:id", deleteVenta);

export default router;
