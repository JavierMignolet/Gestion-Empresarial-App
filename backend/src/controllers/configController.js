// src/controllers/configController.js
import bcrypt from "bcryptjs";
import { readJSON, writeJSON } from "../utils/fileHandler.js";

// ===== Objetivos =====
export const getObjetivos = (req, res) => {
  const o = readJSON("./src/data/config/objetivos.json");
  return res.json(o || {});
};

export const updateObjetivos = (req, res) => {
  const prev = readJSON("./src/data/config/objetivos.json") || {};
  const next = {
    ...prev,
    ...req.body,
    actualizadoPor: req.user?.username || "admin",
    updatedAt: new Date().toISOString(),
  };
  writeJSON("./src/data/config/objetivos.json", next);
  return res.json(next);
};

export const deleteObjetivo = (req, res) => {
  const tipo = req.params.tipo; // mensual|semestral|anual
  const prev = readJSON("./src/data/config/objetivos.json") || {};
  const map = {
    mensual: "objetivo_mensual_unidades",
    semestral: "objetivo_semestral_unidades",
    anual: "objetivo_anual_unidades",
  };
  if (map[tipo]) prev[map[tipo]] = 0;
  writeJSON("./src/data/config/objetivos.json", prev);
  return res.json(prev);
};

// ===== Cuentas =====
const cuentasPath = "./src/data/config/cuentas.json";

export const listCuentas = (req, res) => {
  const cuentas = readJSON(cuentasPath);
  // nunca devolvemos hash de password
  return res.json((cuentas || []).map(({ password, ...rest }) => rest));
};

export const addCuenta = async (req, res) => {
  const { username, password, role = "vendedor" } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ message: "Faltan username o password" });

  const cuentas = readJSON(cuentasPath);
  if (
    cuentas.find(
      (u) => String(u.username).toLowerCase() === String(username).toLowerCase()
    )
  ) {
    return res.status(409).json({ message: "El usuario ya existe" });
  }
  const id = cuentas.length ? Math.max(...cuentas.map((u) => u.id)) + 1 : 1;
  const hash = await bcrypt.hash(String(password), 10);
  const nuevo = { id, username, password: hash, role };

  cuentas.push(nuevo);
  writeJSON(cuentasPath, cuentas);
  const { password: _omit, ...safe } = nuevo;
  return res.status(201).json(safe);
};

export const updateCuenta = async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body || {};
  const cuentas = readJSON(cuentasPath);
  const idx = cuentas.findIndex((u) => String(u.id) === String(id));
  if (idx === -1)
    return res.status(404).json({ message: "No existe la cuenta" });

  if (username) cuentas[idx].username = username;
  if (role) cuentas[idx].role = role;
  if (password) {
    const hash = await bcrypt.hash(String(password), 10);
    cuentas[idx].password = hash;
  }
  writeJSON(cuentasPath, cuentas);
  const { password: _omit, ...safe } = cuentas[idx];
  return res.json(safe);
};

export const deleteCuenta = (req, res) => {
  const { id } = req.params;
  const cuentas = readJSON(cuentasPath);

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
