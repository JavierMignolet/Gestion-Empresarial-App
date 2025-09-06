// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { tenantMiddleware } from "./middlewares/tenantMiddleware.js";

// Rutas públicas
import companyRoutes from "./routes/companyRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// Rutas protegidas (cada router ya aplica verifyToken y, en su mayoría, tenantMiddleware)
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

// 👇 Este es el router multi-tenant de configuración (cuentas, etc.)
import configRouter from "./routes/config/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

/**
 * 🔐 Tenant scoping global:
 * - Lee empresa desde header x-company o body/query y setea req.tenantSlug
 * - Útil para /auth/forgot y /auth/reset también
 *   (si preferís solo por router, podés quitar este app.use y agregar tenantMiddleware
 *    explícito en cada ruta pública que lo necesite, p.ej. POST /auth/reset)
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
// (cada uno trae verifyToken adentro y la mayoría usa tenantMiddleware interno también)
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

// Configuración (usuarios/cuentas, etc.) – versión multi-tenant
app.use("/api/config", configRouter);

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
