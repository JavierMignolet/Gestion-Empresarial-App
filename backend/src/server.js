// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { tenantMiddleware } from "./middlewares/tenantMiddleware.js";

// Rutas públicas
import companyRoutes from "./routes/companyRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// Rutas protegidas
import clienteRoutes from "./routes/clienteRoutes.js";
import productoRoutes from "./routes/productoRoutes.js";
import insumoRoutes from "./routes/insumoRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import produccionRoutes from "./routes/produccionRoutes.js";
import comprasRoutes from "./routes/comprasRoutes.js";
import ventasRoutes from "./routes/ventasRoutes.js";
import pagosRoutes from "./routes/pagosRoutes.js";
import gastosRoutes from "./routes/gastosRoutes.js";
import capitalRoutes from "./routes/capitalRoutes.js";
import pedidosRoutes from "./routes/pedidosRoutes.js";
import reportesRoutes from "./routes/reportesRoutes.js";

// Config multi-tenant (cuentas + objetivos)
import configRouter from "./routes/config/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

/* =========================
   CORS (cerrado por dominio)
   =========================
   Configurá en .env:
   - ALLOWED_ORIGINS=https://tu-frontend.vercel.app,http://localhost:5173
   (opcional) ALLOWED_ORIGINS_REGEX=^https:\/\/.*\.vercel\.app$
*/
const explicitAllowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// defaults útiles en dev
const defaults = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_ORIGIN?.trim(),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

const ALLOWED = new Set([...defaults, ...explicitAllowed]);
const ALLOWED_REGEX = process.env.ALLOWED_ORIGINS_REGEX
  ? new RegExp(process.env.ALLOWED_ORIGINS_REGEX)
  : null;

const corsOrigin = (origin, cb) => {
  if (!origin) return cb(null, true); // server-to-server / Postman
  if (ALLOWED.has(origin)) return cb(null, true);
  if (ALLOWED_REGEX && ALLOWED_REGEX.test(origin)) return cb(null, true);
  return cb(new Error(`Not allowed by CORS: ${origin}`));
};

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-company"],
    credentials: false,
  })
);

app.use(express.json());

/**
 * 🔐 Tenant scoping global:
 * Lee empresa desde header x-company o body/query y setea req.tenantSlug.
 */
app.use(tenantMiddleware);

// Healthcheck
app.get("/", (_req, res) => {
  res.send("✅ API de Tequeños funcionando");
});

// ===== Rutas públicas =====
app.use("/api/company", companyRoutes);
app.use("/api/auth", authRoutes);

// ===== Rutas protegidas =====
app.use("/api/clientes", clienteRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/insumos", insumoRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/produccion", produccionRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/capital", capitalRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/reportes", reportesRoutes);

// ✅ ÚNICO router para /api/config (cuentas + objetivos)
app.use("/api/config", configRouter);

// (opcional) manejador de errores
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Error interno" });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
