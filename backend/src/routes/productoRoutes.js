import express from "express";
import {
  getProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../controllers/productoController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getProductos);
router.post("/", verifyToken, isAdmin, crearProducto);
router.put("/:id", verifyToken, isAdmin, actualizarProducto);
router.delete("/:id", verifyToken, isAdmin, eliminarProducto);

export default router;
