// src/routes/clienteRoutes.js
import express from "express";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";
import {
  getClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from "../controllers/clienteController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ Multi-tenant para todos los endpoints de clientes
router.use(tenantMiddleware);

router.get("/", verifyToken, getClientes);
router.post("/", verifyToken, isAdmin, crearCliente);
router.put("/:id", verifyToken, isAdmin, actualizarCliente);
router.delete("/:id", verifyToken, isAdmin, eliminarCliente);

export default router;
