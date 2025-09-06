// src/routes/productosRoutes.js
import express from "express";
import {
  getProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../controllers/productoController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

/**
 * Orden estándar:
 * 1) verifyToken -> autentica y setea req.user
 * 2) tenantMiddleware -> resuelve req.tenantSlug para aislar datos por empresa
 */
router.use(verifyToken);
router.use(tenantMiddleware);

// Listar productos (cualquier usuario autenticado)
router.get("/", getProductos);

// Crear producto (solo admin)
router.post("/", isAdmin, crearProducto);

// Actualizar producto (solo admin)
router.put("/:id", isAdmin, actualizarProducto);

// Eliminar producto (solo admin)
router.delete("/:id", isAdmin, eliminarProducto);

export default router;
