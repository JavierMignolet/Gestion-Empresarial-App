// src/routes/configRoutes.js
import express from "express";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";
import {
  // Objetivos
  getObjetivos,
  updateObjetivos,
  deleteObjetivo,
} from "../controllers/configController.js";

const router = express.Router();

/**
 * Orden recomendado (multi-tenant):
 * 1) verifyToken       -> autentica y expone req.user (incluye empresa del token)
 * 2) isAdmin           -> sólo admins pueden editar configuración
 * 3) tenantMiddleware  -> resuelve req.tenantSlug (desde header o req.user.empresa)
 */
router.use(verifyToken);
router.use(isAdmin);
router.use(tenantMiddleware);

// ---- Objetivos ----
router.get("/objetivos", getObjetivos);
router.put("/objetivos", updateObjetivos);
router.delete("/objetivos/:tipo", deleteObjetivo); // tipo: mensual|semestral|anual

/**
 * IMPORTANTE:
 * Las rutas de "cuentas" se movieron a:
 *   /api/config/cuentas  (ver src/routes/config/cuentasRoutes.js)
 * Evitamos duplicarlas aquí para no generar conflictos.
 */

export default router;
