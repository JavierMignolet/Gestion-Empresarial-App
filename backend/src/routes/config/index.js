import { Router } from "express";
import { verifyToken, isAdmin } from "../../middlewares/authMiddleware.js";
import {
  // Cuentas/usuarios
  listCuentas,
  addCuenta,
  updateCuenta,
  deleteCuenta,
  // Objetivos
  getObjetivos,
  updateObjetivos,
  deleteObjetivo,
} from "../../controllers/configController.js";

const router = Router();

/**
 * 🔐 Todas estas rutas requieren token válido.
 * Para crear/actualizar/borrar se exige rol admin.
 */
router.use(verifyToken);

/* ===========================
   CUENTAS / USUARIOS
   =========================== */
router.get("/cuentas", listCuentas);
router.post("/cuentas", isAdmin, addCuenta);
router.put("/cuentas/:id", isAdmin, updateCuenta);
router.delete("/cuentas/:id", isAdmin, deleteCuenta);

/* ===========================
   OBJETIVOS DE VENTAS (UNIDADES)
   GET  /api/config/objetivos
   PUT  /api/config/objetivos
   DEL  /api/config/objetivos/:tipo  (mensual|semestral|anual)
   =========================== */
router.get("/objetivos", getObjetivos);
router.put("/objetivos", isAdmin, updateObjetivos);
router.delete("/objetivos/:tipo", isAdmin, deleteObjetivo);

export default router;
