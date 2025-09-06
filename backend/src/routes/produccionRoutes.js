// src/routes/produccionRoutes.js
import express from "express";
import {
  getProducciones,
  agregarProduccion,
  getProduccionPorId,
  actualizarProduccion,
  eliminarProduccion,
} from "../controllers/produccionController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

/**
 * Orden recomendado en todos los routers:
 * 1) verifyToken       -> autentica y setea req.user
 * 2) tenantMiddleware  -> resuelve req.tenantSlug (header/body o req.user.empresa)
 *    para que cada empresa use su propio storage (carpeta tenant).
 */
router.use(verifyToken);
router.use(tenantMiddleware);

// Obtener todas las producciones
router.get("/", getProducciones);

// Obtener una producción por ID
router.get("/:id", getProduccionPorId);

// Agregar una nueva producción (solo admin)
router.post("/", isAdmin, agregarProduccion);

// Actualizar una producción (solo admin)
router.put("/:id", isAdmin, actualizarProduccion);

// Eliminar una producción (solo admin)
router.delete("/:id", isAdmin, eliminarProduccion);

export default router;
