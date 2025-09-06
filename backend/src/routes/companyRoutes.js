// src/routes/companyRoutes.js
import express from "express";
import {
  registerCompany,
  companyExists,
} from "../controllers/companyController.js";

const router = express.Router();

/**
 * ⚠️ IMPORTANTE (multi-tenant):
 * Estos endpoints NO usan tenantMiddleware porque todavía no existe el tenant.
 * - /exists: consulta si una empresa ya está registrada (solo necesita el nombre).
 * - /register: crea el tenant (carpetas + archivos base) y el primer usuario admin.
 */

// ¿Existe la empresa? -> ?empresa=tequegaucho
router.get("/exists", companyExists);

// Registrar nueva empresa + primer usuario admin
router.post("/register", registerCompany);

export default router;
