// src/routes/config/cuentasRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import { tenantMiddleware } from "../../middlewares/tenantMiddleware.js";
import { verifyToken, isAdmin } from "../../middlewares/authMiddleware.js";
import { readJSON, writeJSON } from "../../utils/fileHandler.js";
import { getCurrentTenant, empresaToSlug } from "../../utils/tenant.js";

const router = express.Router();

/** Obtiene el path del archivo de cuentas para el tenant actual */
function cuentasPath(req) {
  // Preferí lo que dejó el tenantMiddleware
  let slug = req.tenantSlug || getCurrentTenant();

  // Fallback: si vino por header
  if (!slug) {
    const hdr = req.headers["x-company"];
    if (hdr) slug = empresaToSlug(String(hdr));
  }

  // Si no hay tenant, cae al global (no recomendado, pero evita crash)
  return slug
    ? `./src/data/tenants/${slug}/config/cuentas.json`
    : `./src/data/config/cuentas.json`;
}

/** Util: carga y persiste cuentas del tenant actual */
function loadCuentas(req) {
  const arr = readJSON(cuentasPath(req));
  return Array.isArray(arr) ? arr : [];
}

function saveCuentas(req, cuentas) {
  return writeJSON(cuentasPath(req), cuentas || []);
}

/**
 * GET /api/config/cuentas
 * Lista usuarios (sin exponer password) — solo admin
 */
router.get("/", tenantMiddleware, verifyToken, isAdmin, async (req, res) => {
  try {
    const cuentas = loadCuentas(req).map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      email: u.email || "",
      telefono: u.telefono || "",
      createdAt: u.createdAt || null,
      updatedAt: u.updatedAt || null,
    }));
    res.json(cuentas);
  } catch (err) {
    console.error("❌ GET cuentas:", err);
    res.status(500).json({ message: "No se pudieron listar cuentas" });
  }
});

/**
 * POST /api/config/cuentas
 * Body: { username, role, password, email?, telefono? } — solo admin
 */
router.post("/", tenantMiddleware, verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      username,
      role = "vendedor",
      password,
      email,
      telefono,
    } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: "Faltan username o password" });
    }
    if (String(password).trim().length < 6) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    const cuentas = loadCuentas(req);

    // username único (case-insensitive)
    const exists = cuentas.some(
      (u) =>
        String(u.username).toLowerCase().trim() ===
        String(username).toLowerCase().trim()
    );
    if (exists) {
      return res.status(409).json({ message: "El usuario ya existe" });
    }

    const id = Date.now(); // id simple
    const hashed = await bcrypt.hash(String(password), 10);

    const now = new Date().toISOString();
    const nuevo = {
      id,
      username: String(username).trim(),
      role,
      password: hashed,
      email: email || "",
      telefono: telefono || "",
      createdAt: now,
      updatedAt: now,
    };

    cuentas.push(nuevo);
    saveCuentas(req, cuentas);

    res.status(201).json({
      id: nuevo.id,
      username: nuevo.username,
      role: nuevo.role,
      email: nuevo.email,
      telefono: nuevo.telefono,
      createdAt: nuevo.createdAt,
      updatedAt: nuevo.updatedAt,
    });
  } catch (err) {
    console.error("❌ POST cuenta:", err);
    res.status(500).json({ message: "No se pudo crear la cuenta" });
  }
});

/**
 * PUT /api/config/cuentas/:id
 * Body: { username?, role?, email?, telefono?, newPassword? } — solo admin
 */
router.put("/:id", tenantMiddleware, verifyToken, isAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username, role, email, telefono, newPassword } = req.body || {};

    const cuentas = loadCuentas(req);
    const idx = cuentas.findIndex((u) => Number(u.id) === id);
    if (idx === -1)
      return res.status(404).json({ message: "Usuario no encontrado" });

    // username: validar unicidad si cambió
    if (
      username &&
      String(username).trim().toLowerCase() !==
        String(cuentas[idx].username).trim().toLowerCase()
    ) {
      const taken = cuentas.some(
        (u, i) =>
          i !== idx &&
          String(u.username).trim().toLowerCase() ===
            String(username).trim().toLowerCase()
      );
      if (taken)
        return res.status(409).json({ message: "El usuario ya existe" });
      cuentas[idx].username = String(username).trim();
    }

    if (role) cuentas[idx].role = role;
    if (typeof email !== "undefined") cuentas[idx].email = email || "";
    if (typeof telefono !== "undefined") cuentas[idx].telefono = telefono || "";

    if (newPassword && String(newPassword).trim().length > 0) {
      if (String(newPassword).trim().length < 6) {
        return res
          .status(400)
          .json({
            message: "La nueva contraseña debe tener al menos 6 caracteres",
          });
      }
      cuentas[idx].password = await bcrypt.hash(String(newPassword), 10);
    }

    cuentas[idx].updatedAt = new Date().toISOString();

    saveCuentas(req, cuentas);

    const u = cuentas[idx];
    res.json({
      id: u.id,
      username: u.username,
      role: u.role,
      email: u.email,
      telefono: u.telefono,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    });
  } catch (err) {
    console.error("❌ PUT cuenta:", err);
    res.status(500).json({ message: "No se pudo actualizar" });
  }
});

/** DELETE /api/config/cuentas/:id — solo admin */
router.delete(
  "/:id",
  tenantMiddleware,
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const cuentas = loadCuentas(req);
      const idx = cuentas.findIndex((u) => Number(u.id) === id);
      if (idx === -1)
        return res.status(404).json({ message: "Usuario no encontrado" });

      const borrado = cuentas.splice(idx, 1)[0];
      saveCuentas(req, cuentas);

      res.json({ ok: true, id: borrado.id });
    } catch (err) {
      console.error("❌ DELETE cuenta:", err);
      res.status(500).json({ message: "No se pudo eliminar" });
    }
  }
);

export default router;
