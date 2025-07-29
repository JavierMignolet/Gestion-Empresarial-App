import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import authRoutes from "./routes/authRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import productoRoutes from "./routes/productoRoutes.js";

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta base para testear que funciona
app.get("/", (req, res) => {
  res.send("✅ API de Tequeños funcionando");
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
app.use("/api/clientes", clienteRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/productos", productoRoutes);
