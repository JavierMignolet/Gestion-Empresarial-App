// src/routes/config/index.js
import express from "express";
import { tenantMiddleware } from "../../middlewares/tenantMiddleware.js";
import cuentasRoutes from "./cuentasRoutes.js";

const router = express.Router();

// Asegura el tenant para TODO /api/config/*
router.use(tenantMiddleware);

// /api/config/cuentas
router.use("/cuentas", cuentasRoutes);

export default router;
