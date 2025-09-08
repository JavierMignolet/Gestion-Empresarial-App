// src/controllers/companyController.js
import bcrypt from "bcryptjs";
import { readJSON, writeJSON } from "../utils/fileHandler.js";
import { empresaToSlug } from "../utils/tenant.js";

/** Lee JSON o devuelve defaultValue si no existe */
function readOr(path, defaultValue) {
  const v = readJSON(path);
  return typeof v === "undefined" || v === null ? defaultValue : v;
}

/**
 * GET /api/company/exists?empresa=Acme
 * Devuelve si la empresa (tenant) ya tiene cuentas creadas.
 * Usa archivo del tenant: /config/cuentas.json
 */
export const companyExists = async (req, res) => {
  try {
    const empresa = req.query.empresa || req.headers["x-company"];
    if (!empresa) {
      return res.status(400).json({ message: "Falta 'empresa'." });
    }
    const slug = empresaToSlug(empresa);
    if (!slug) return res.status(400).json({ message: "Empresa inválida." });

    const cuentas = readJSON("/config/cuentas.json");
    const exists = Array.isArray(cuentas) && cuentas.length > 0;

    return res.json({ exists, empresa: slug });
  } catch (err) {
    console.error("❌ company/exists:", err);
    return res.status(500).json({ message: "Error verificando empresa." });
  }
};

/**
 * POST /api/company/register
 * Body: { empresa, usuario, password, tipo=admin, email?, telefono? }
 * Crea estructura del tenant y primer usuario.
 */
export const registerCompany = async (req, res) => {
  try {
    const {
      empresa,
      usuario,
      password,
      tipo = "admin",
      email = "",
      telefono = "",
    } = req.body || {};

    if (!empresa || !usuario || !password) {
      return res
        .status(400)
        .json({ message: "Completá empresa, usuario y contraseña." });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres." });
    }

    const slug = empresaToSlug(empresa);
    if (!slug) return res.status(400).json({ message: "Empresa inválida." });

    // Si ya hay cuentas en el tenant → empresa ya registrada
    const cuentasPath = "/config/cuentas.json";
    const cuentasActuales = readOr(cuentasPath, []);
    if (Array.isArray(cuentasActuales) && cuentasActuales.length > 0) {
      return res
        .status(409)
        .json({ message: "La empresa ya está registrada." });
    }

    // Semillas tenant-aware (todas rutas LÓGICAS con “/”)
    const seeds = [
      [
        "/config/empresa.json",
        { nombre: empresa, slug, createdAt: new Date().toISOString() },
      ],
      ["/config/cuentas.json", []],
      ["/clientes.json", []],
      ["/productos.json", []],
      ["/insumos.json", []],
      ["/produccion.json", []],
      ["/ventas.json", []],
      ["/pedidos.json", []],
      ["/compras.json", []],
      ["/pagos.json", []],
      ["/gastos.json", []],
      ["/capital.json", []],
    ];

    // Crear archivos si no existen
    for (const [path, value] of seeds) {
      const current = readJSON(path);
      if (typeof current === "undefined" || current === null) {
        writeJSON(path, value);
      }
    }

    // Crear primer usuario
    const hashed = await bcrypt.hash(String(password), 10);
    const now = new Date().toISOString();
    const firstUser = {
      id: Date.now(),
      username: String(usuario).trim(),
      role: tipo || "admin",
      password: hashed,
      email: String(email || "").trim(),
      telefono: String(telefono || "").trim(),
      createdAt: now,
      updatedAt: now,
    };

    const nuevasCuentas = readOr(cuentasPath, []);
    if (
      nuevasCuentas.some(
        (u) =>
          (u.username || "").toLowerCase() === firstUser.username.toLowerCase()
      )
    ) {
      return res.status(409).json({ message: "Ese usuario ya existe." });
    }

    nuevasCuentas.push(firstUser);
    writeJSON(cuentasPath, nuevasCuentas);

    return res.status(201).json({
      ok: true,
      empresa: slug,
      usuario: {
        id: firstUser.id,
        username: firstUser.username,
        role: firstUser.role,
        email: firstUser.email,
        telefono: firstUser.telefono,
        createdAt: firstUser.createdAt,
      },
      message: "Empresa creada y usuario inicial habilitado.",
    });
  } catch (err) {
    console.error("❌ company/register:", err);
    return res
      .status(500)
      .json({ message: "No se pudo registrar la empresa." });
  }
};
