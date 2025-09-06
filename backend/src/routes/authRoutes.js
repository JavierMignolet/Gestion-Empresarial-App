// src/routes/authRoutes.js
import express from "express";
import {
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

// Aplica tenantMiddleware a todo /api/auth/* (si viene empresa por body/query/header la setea)
router.use(tenantMiddleware);

// Inicia sesión
router.post("/login", login);

// Genera y envía token de reseteo (email/SMS) — respuesta siempre genérica
router.post("/forgot", forgotPassword);

// Cambia la contraseña con el token recibido
router.post("/reset", resetPassword);

export default router;
