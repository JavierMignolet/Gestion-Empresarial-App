// src/controllers/config/cuentasController.js
import bcrypt from "bcryptjs";
import { readJSON, writeJSON } from "../../utils/fileHandler.js";

const CUENTAS_PATH = "./src/data/config/cuentas.json";

function sanitize(u) {
  const { password, ...rest } = u || {};
  return rest;
}

function load() {
  const arr = readJSON(CUENTAS_PATH);
  return Array.isArray(arr) ? arr : [];
}

function save(arr) {
  writeJSON(CUENTAS_PATH, arr || []);
}

export const listCuentas = (req, res) => {
  const cuentas = load().map(sanitize);
  return res.json(cuentas);
};

export const createCuenta = async (req, res) => {
  try {
    const {
      username,
      password,
      role = "vendedor",
      email = "",
      telefono = "",
    } = req.body || {};
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "username y password son obligatorios" });
    }

    const cuentas = load();

    // duplicado username (case-insensitive)
    const exists = cuentas.some(
      (u) =>
        String(u.username).toLowerCase().trim() ===
        String(username).toLowerCase().trim()
    );
    if (exists)
      return res.status(409).json({ message: "El usuario ya existe" });

    const hashed = await bcrypt.hash(String(password), 10);
    const nextId =
      cuentas.length > 0
        ? Math.max(...cuentas.map((u) => Number(u.id) || 0)) + 1
        : 1;

    const nuevo = {
      id: nextId,
      username: String(username).trim(),
      password: hashed,
      role,
      email: email || "",
      telefono: telefono || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cuentas.push(nuevo);
    save(cuentas);

    return res.status(201).json(sanitize(nuevo));
  } catch (err) {
    console.error("❌ createCuenta error:", err);
    return res.status(500).json({ message: "Error al crear la cuenta" });
  }
};

export const updateCuenta = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username, password, role, email, telefono } = req.body || {};

    const cuentas = load();
    const idx = cuentas.findIndex((u) => Number(u.id) === id);
    if (idx === -1)
      return res.status(404).json({ message: "Cuenta no encontrada" });

    // validar duplicado de username si cambia
    if (
      username &&
      String(username).trim().toLowerCase() !==
        String(cuentas[idx].username).trim().toLowerCase()
    ) {
      const dup = cuentas.some(
        (u) =>
          Number(u.id) !== id &&
          String(u.username).trim().toLowerCase() ===
            String(username).trim().toLowerCase()
      );
      if (dup) return res.status(409).json({ message: "El usuario ya existe" });
      cuentas[idx].username = String(username).trim();
    }

    if (role) cuentas[idx].role = role;
    if (typeof email !== "undefined") cuentas[idx].email = email || "";
    if (typeof telefono !== "undefined") cuentas[idx].telefono = telefono || "";

    // si mandan password no vacía, la hasheamos
    if (password && String(password).trim().length > 0) {
      cuentas[idx].password = await bcrypt.hash(String(password), 10);
    }

    cuentas[idx].updatedAt = new Date().toISOString();

    save(cuentas);
    return res.json(sanitize(cuentas[idx]));
  } catch (err) {
    console.error("❌ updateCuenta error:", err);
    return res.status(500).json({ message: "Error al actualizar la cuenta" });
  }
};

export const deleteCuenta = (req, res) => {
  try {
    const id = Number(req.params.id);
    const cuentas = load();
    const idx = cuentas.findIndex((u) => Number(u.id) === id);
    if (idx === -1)
      return res.status(404).json({ message: "Cuenta no encontrada" });

    const removed = cuentas.splice(idx, 1)[0];
    save(cuentas);
    return res.json(sanitize(removed));
  } catch (err) {
    console.error("❌ deleteCuenta error:", err);
    return res.status(500).json({ message: "Error al eliminar la cuenta" });
  }
};
