// src/routes/gastosRoutes.js
import express from "express";
import {
  getGastos,
  registrarGasto,
  actualizarGasto,
  eliminarGasto,
} from "../controllers/gastosController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

/**
 * Orden recomendado:
 * 1) verifyToken       -> autentica y expone req.user
 * 2) tenantMiddleware  -> resuelve req.tenantSlug (desde header o req.user.empresa)
 */
router.use(verifyToken);
router.use(tenantMiddleware);

// Rutas
router.get("/", getGastos);
router.post("/", registrarGasto);
router.put("/:id", actualizarGasto); // editar
router.delete("/:id", eliminarGasto); // eliminar

export default router;
