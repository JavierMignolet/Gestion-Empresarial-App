// src/routes/pedidosRoutes.js
import express from "express";
import {
  getPedidos,
  createPedido,
  actualizarPedido,
  eliminarPedido,
} from "../controllers/pedidosController.js";
import { verifyToken /*, isAdmin*/ } from "../middlewares/authMiddleware.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

/**
 * Orden recomendado:
 * 1) verifyToken       -> autentica y setea req.user
 * 2) tenantMiddleware  -> resuelve req.tenantSlug (header/body o req.user.empresa)
 *    para que cada empresa use sus propios archivos JSON.
 */
router.use(verifyToken);
router.use(tenantMiddleware);

// Listar pedidos
router.get("/", getPedidos);

// Crear pedido
router.post("/", createPedido);

// Actualizar pedido
router.put("/:id", actualizarPedido);

// Eliminar pedido
router.delete("/:id", eliminarPedido);

export default router;
