// src/controllers/authController.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";

import { readJSON, writeJSON } from "../utils/fileHandler.js";
import { empresaToSlug, getCurrentTenant } from "../utils/tenant.js";

dotenv.config();

function loadCuentas() {
  // fileHandler aplica getTenantPath(), así que basta con rutas relativas a /src/data
  return readJSON("config/cuentas.json") || [];
}
function saveCuentas(arr) {
  return writeJSON("config/cuentas.json", arr || []);
}
function loadResetTokens() {
  return readJSON("config/reset_tokens.json") || [];
}
function saveResetTokens(arr) {
  return writeJSON("config/reset_tokens.json", arr || []);
}

export const login = async (req, res) => {
  try {
    const { empresa, username, password } = req.body || {};
    if (!empresa || !username || !password) {
      return res.status(400).json({ message: "Faltan datos de acceso" });
    }

    // Si por alguna razón el middleware no seteó el tenant, resolvemos aquí:
    const slug = req.tenantSlug || getCurrentTenant() || empresaToSlug(empresa);
    if (!slug) return res.status(400).json({ message: "Empresa inválida" });

    const cuentas = loadCuentas();
    const user = (cuentas || []).find(
      (u) =>
        String(u.username).trim().toLowerCase() ===
        String(username).trim().toLowerCase()
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

export const forgotPassword = async (req, res) => {
  try {
    const { empresa, username } = req.body || {};
    // Empresa puede venir por body, header x-company o por JWT (tenantMiddleware global)
    const slug =
      req.tenantSlug ||
      getCurrentTenant() ||
      (empresa && empresaToSlug(empresa));
    // Respondemos siempre genérico por seguridad
    const generic = {
      ok: true,
      message:
        "Si los datos existen, te enviaremos instrucciones para restablecer tu contraseña.",
    };

    if (!slug || !username) return res.json(generic);

    const cuentas = loadCuentas();
    const user = (cuentas || []).find(
      (u) =>
        String(u.username).trim().toLowerCase() ===
        String(username).trim().toLowerCase()
    );

    if (!user) {
      // Usuario no existe → respuesta genérica
      return res.json(generic);
    }

    // Elegimos canal “preferido” disponible (email > teléfono)
    const via = user.email ? "email" : user.telefono ? "telefono" : null;
    if (!via) {
      // No hay canal de contacto guardado
      return res.json(generic);
    }

    // Generar token y guardarlo hasheado
    const tokenPlain = crypto.randomBytes(24).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(tokenPlain)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

    let tokens = loadResetTokens();
    // Limpiar expirados
    const now = Date.now();
    tokens = tokens.filter((t) => new Date(t.expiresAt).getTime() > now);

    tokens.push({
      id: Date.now(),
      username: String(user.username),
      tokenHash,
      expiresAt,
      via, // informativo
    });

    saveResetTokens(tokens);

    // Aquí podrías enviar email/SMS. Por ahora log para desarrollo:
    console.log(
      `🔐 Reset token (${via}) para usuario "${user.username}" (tenant ${slug}): ${tokenPlain} (expira ${expiresAt})`
    );

    // En desarrollo, devolvemos el token para facilitar pruebas
    const isProd = (process.env.NODE_ENV || "").toLowerCase() === "production";
    return res.json(
      isProd ? generic : { ...generic, debugToken: tokenPlain, expiresAt }
    );
  } catch (err) {
    console.error("❌ forgotPassword error:", err);
    // Nunca revelamos detalles
    return res.json({
      ok: true,
      message:
        "Si los datos existen, te enviaremos instrucciones para restablecer tu contraseña.",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { empresa, username, token, newPassword } = req.body || {};

    const slug =
      req.tenantSlug ||
      getCurrentTenant() ||
      (empresa && empresaToSlug(empresa));
    if (!slug || !username || !token || !newPassword) {
      return res.status(400).json({ message: "Datos incompletos" });
    }
    if (String(newPassword).trim().length < 6) {
      return res
        .status(400)
        .json({ message: "La nueva contraseña es muy corta" });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(String(token))
      .digest("hex");

    let tokens = loadResetTokens();
    const now = Date.now();
    // Buscar token válido para ese usuario
    const idx = tokens.findIndex(
      (t) =>
        String(t.username).trim().toLowerCase() ===
          String(username).trim().toLowerCase() &&
        t.tokenHash === tokenHash &&
        new Date(t.expiresAt).getTime() > now
    );
    if (idx === -1) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    // Actualizar password
    const cuentas = loadCuentas();
    const uidx = cuentas.findIndex(
      (u) =>
        String(u.username).trim().toLowerCase() ===
        String(username).trim().toLowerCase()
    );
    if (uidx === -1) {
      // Si el usuario desapareció, invalidamos token y respondemos genérico
      tokens.splice(idx, 1);
      saveResetTokens(tokens);
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    const hashed = await bcrypt.hash(String(newPassword), 10);
    cuentas[uidx].password = hashed;
    cuentas[uidx].updatedAt = new Date().toISOString();
    saveCuentas(cuentas);

    // Invalidar token usado
    tokens.splice(idx, 1);
    saveResetTokens(tokens);

    return res.json({ ok: true, message: "Contraseña actualizada" });
  } catch (err) {
    console.error("❌ resetPassword error:", err);
    return res
      .status(500)
      .json({ message: "No se pudo restablecer la contraseña" });
  }
};
