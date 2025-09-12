import bcrypt from "bcryptjs";
import { readJSON, writeJSON } from "../utils/fileHandler.js";

/**
 * =====================
 * OBJETIVOS DE VENTAS
 * =====================
 * Guardamos en "/objetivos_ventas.json" (tenant-aware).
 * Mantenemos fallbacks por si había datos previos en otras rutas.
 */
export const getObjetivos = (req, res) => {
  // Principal (tenant-aware) + fallbacks compatibles
  const o =
    readJSON("/objetivos_ventas.json") ||
    readJSON("/config/objetivos.json") ||
    readJSON("./src/data/config/objetivos.json") ||
    {};

  return res.json({
    objetivo_mensual_unidades: Number(o.objetivo_mensual_unidades) || 0,
    objetivo_semestral_unidades: Number(o.objetivo_semestral_unidades) || 0,
    objetivo_anual_unidades: Number(o.objetivo_anual_unidades) || 0,
    actualizadoPor: o.actualizadoPor || null,
    updatedAt: o.updatedAt || null,
  });
};

export const updateObjetivos = (req, res) => {
  const prev =
    readJSON("/objetivos_ventas.json") ||
    readJSON("/config/objetivos.json") ||
    readJSON("./src/data/config/objetivos.json") ||
    {};

  const next = {
    ...prev,
    objetivo_mensual_unidades: Number(req.body?.objetivo_mensual_unidades) || 0,
    objetivo_semestral_unidades:
      Number(req.body?.objetivo_semestral_unidades) || 0,
    objetivo_anual_unidades: Number(req.body?.objetivo_anual_unidades) || 0,
    actualizadoPor: req.user?.username || "admin",
    updatedAt: new Date().toISOString(),
  };

  // ⬅️ Guardamos donde Reportes ya lee (tenant-aware)
  writeJSON("/objetivos_ventas.json", next);
  return res.json(next);
};

export const deleteObjetivo = (req, res) => {
  const tipo = String(req.params?.tipo || "").toLowerCase(); // mensual|semestral|anual
  const prev =
    readJSON("/objetivos_ventas.json") ||
    readJSON("/config/objetivos.json") ||
    readJSON("./src/data/config/objetivos.json") ||
    {};

  const map = {
    mensual: "objetivo_mensual_unidades",
    semestral: "objetivo_semestral_unidades",
    anual: "objetivo_anual_unidades",
  };
  if (map[tipo]) prev[map[tipo]] = 0;

  prev.actualizadoPor = req.user?.username || "admin";
  prev.updatedAt = new Date().toISOString();

  writeJSON("/objetivos_ventas.json", prev);
  return res.json(prev);
};

/**
 * =====================
 * CUENTAS / USUARIOS
 * =====================
 * (sin cambios de lógica para no romper lo existente)
 */
const cuentasPath = "./src/data/config/cuentas.json";

export const listCuentas = (_req, res) => {
  const cuentas = readJSON(cuentasPath) || [];
  // nunca devolvemos hash de password
  return res.json(cuentas.map(({ password, ...rest }) => rest));
};

export const addCuenta = async (req, res) => {
  const {
    username,
    password,
    role = "vendedor",
    email = "",
    telefono = "",
  } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ message: "Faltan username o password" });

  const cuentas = readJSON(cuentasPath) || [];
  if (
    cuentas.find(
      (u) => String(u.username).toLowerCase() === String(username).toLowerCase()
    )
  ) {
    return res.status(409).json({ message: "El usuario ya existe" });
  }
  const id = cuentas.length ? Math.max(...cuentas.map((u) => u.id)) + 1 : 1;
  const hash = await bcrypt.hash(String(password), 10);
  const nuevo = { id, username, password: hash, role, email, telefono };

  cuentas.push(nuevo);
  writeJSON(cuentasPath, cuentas);
  const { password: _omit, ...safe } = nuevo;
  return res.status(201).json(safe);
};

export const updateCuenta = async (req, res) => {
  const { id } = req.params;
  const { username, newPassword, role, email, telefono } = req.body || {};
  const cuentas = readJSON(cuentasPath) || [];
  const idx = cuentas.findIndex((u) => String(u.id) === String(id));
  if (idx === -1)
    return res.status(404).json({ message: "No existe la cuenta" });

  if (username) cuentas[idx].username = username;
  if (role) cuentas[idx].role = role;
  if (email !== undefined) cuentas[idx].email = email;
  if (telefono !== undefined) cuentas[idx].telefono = telefono;
  if (newPassword) {
    const hash = await bcrypt.hash(String(newPassword), 10);
    cuentas[idx].password = hash;
  }
  writeJSON(cuentasPath, cuentas);
  const { password: _omit, ...safe } = cuentas[idx];
  return res.json(safe);
};

export const deleteCuenta = (req, res) => {
  const { id } = req.params;
  const cuentas = readJSON(cuentasPath) || [];

  // Evitar borrar el último admin
  const admins = cuentas.filter((u) => u.role === "admin");
  const target = cuentas.find((u) => String(u.id) === String(id));
  if (!target) return res.status(404).json({ message: "No existe la cuenta" });
  if (target.role === "admin" && admins.length <= 1) {
    return res
      .status(400)
      .json({ message: "No se puede eliminar el único admin" });
  }

  const next = cuentas.filter((u) => String(u.id) !== String(id));
  writeJSON(cuentasPath, next);
  return res.json({ ok: true });
};
