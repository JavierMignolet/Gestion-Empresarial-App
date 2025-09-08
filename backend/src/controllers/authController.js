// src/controllers/authController.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";
import { readJSON, writeJSON } from "../utils/fileHandler.js";
import { empresaToSlug, getCurrentTenant } from "../utils/tenant.js";

dotenv.config();

const CUENTAS_FILE = "/config/cuentas.json";
const RESETS_FILE = "/config/resetTokens.json";

const readOr = (path, def) => {
  const v = readJSON(path);
  return typeof v === "undefined" || v === null ? def : v;
};

// =============== LOGIN ===============
export const login = async (req, res) => {
  try {
    const { empresa, username, password } = req.body || {};
    if (!empresa || !username || !password) {
      return res.status(400).json({ message: "Faltan datos de acceso" });
    }

    // Defensa por si no corrió el middleware (globalmente sí corre)
    const slug = getCurrentTenant() || empresaToSlug(empresa);
    if (!slug) return res.status(400).json({ message: "Empresa inválida" });

    // ✅ Cuentas del TENANT
    const cuentas = readOr(CUENTAS_FILE, []);
    const user = cuentas.find(
      (u) => String(u.username).toLowerCase() === String(username).toLowerCase()
    );
    if (!user)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const passOk = await bcrypt.compare(
      String(password),
      String(user.password || "")
    );
    if (!passOk)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, empresa: slug },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      username: user.username,
      role: user.role,
      empresa: slug,
    });
  } catch (err) {
    console.error("❌ login error:", err);
    return res.status(500).json({ message: "Error en login" });
  }
};

// =============== FORGOT PASSWORD ===============
/**
 * POST /api/auth/forgot
 * Body: { empresa, username }
 * Genera un token de reseteo y lo guarda en /config/resetTokens.json (tenant).
 * Respuesta SIEMPRE genérica.
 */
export const forgotPassword = async (req, res) => {
  try {
    const empresa = req.body?.empresa || req.headers["x-company"] || "";
    const username = req.body?.username;

    if (!username) {
      return res
        .status(400)
        .json({ message: "Debe indicar el usuario a recuperar." });
    }

    const slug = getCurrentTenant() || empresaToSlug(empresa);
    // Aún si no hay slug devolvemos genérico para no filtrar info
    const cuentas = readOr(CUENTAS_FILE, []);
    const user = cuentas.find(
      (u) => String(u.username).toLowerCase() === String(username).toLowerCase()
    );

    if (user) {
      // Generar token y persistir (30 min)
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 1000 * 60 * 30;

      const resets = readOr(RESETS_FILE, []).filter(
        (r) => Number(r.expiresAt) > Date.now()
      );
      resets.push({
        token,
        username: user.username,
        createdAt: new Date().toISOString(),
        expiresAt,
      });
      writeJSON(RESETS_FILE, resets);

      // Para desarrollo: mostrás el token en consola (simula "enviado")
      console.log(
        `🔐 [${slug || "no-tenant"}] Reset token para ${
          user.username
        }: ${token}`
      );
    }

    // Respuesta genérica
    return res.json({
      ok: true,
      message:
        "Si los datos son correctos, te enviaremos un enlace para restablecer.",
    });
  } catch (err) {
    console.error("❌ forgotPassword:", err);
    return res.json({
      ok: true,
      message:
        "Si los datos son correctos, te enviaremos un enlace para restablecer.",
    });
  }
};

// =============== RESET PASSWORD ===============
/**
 * POST /api/auth/reset
 * Body: { token, newPassword }
 * Cambia la contraseña del usuario asociado al token válido (tenant actual).
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Faltan token o nueva contraseña." });
    }
    if (String(newPassword).trim().length < 6) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres." });
    }

    const resets = readOr(RESETS_FILE, []);
    const idx = resets.findIndex(
      (r) => r.token === token && Number(r.expiresAt) > Date.now()
    );
    if (idx === -1) {
      return res.status(400).json({ message: "Token inválido o expirado." });
    }

    const username = resets[idx].username;
    const cuentas = readOr(CUENTAS_FILE, []);
    const uidx = cuentas.findIndex(
      (u) => String(u.username).toLowerCase() === String(username).toLowerCase()
    );
    if (uidx === -1) {
      // Limpio token usado/roto igualmente
      const left = resets.filter((r) => r.token !== token);
      writeJSON(RESETS_FILE, left);
      return res.status(400).json({ message: "Token inválido o expirado." });
    }

    const hashed = await bcrypt.hash(String(newPassword), 10);
    cuentas[uidx].password = hashed;
    cuentas[uidx].updatedAt = new Date().toISOString();
    writeJSON(CUENTAS_FILE, cuentas);

    // Remover token (y opcionalmente todos los tokens del usuario)
    const remaining = resets.filter(
      (r) =>
        !(
          r.token === token ||
          r.username?.toLowerCase() === username.toLowerCase()
        )
    );
    writeJSON(RESETS_FILE, remaining);

    return res.json({
      ok: true,
      message: "Contraseña actualizada. Ya podés iniciar sesión.",
    });
  } catch (err) {
    console.error("❌ resetPassword:", err);
    return res.status(500).json({ message: "No se pudo restablecer." });
  }
};
