// src/routes/pagosRoutes.js
import express from "express";
import {
  getPagos,
  registrarPago,
  actualizarPago,
  eliminarPago,
} from "../controllers/pagosController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

/**
 * Orden recomendado:
 * 1) verifyToken       -> autentica y setea req.user
 * 2) tenantMiddleware  -> resuelve req.tenantSlug (por header/body o req.user.empresa)
 *    así cada empresa lee/escribe su propio archivo JSON.
 */
router.use(verifyToken);
router.use(tenantMiddleware);

// Listar pagos
router.get("/", getPagos);

// Crear pago
router.post("/", registrarPago);

// Actualizar pago
router.put("/:id", actualizarPago);

// Eliminar pago
router.delete("/:id", eliminarPago);

export default router;
