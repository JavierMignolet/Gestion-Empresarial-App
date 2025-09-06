// src/utils/tenant.js
import { AsyncLocalStorage } from "node:async_hooks";

const als = new AsyncLocalStorage();
let fallbackTenant = null;

export function runWithTenant(slug, fn) {
  als.run({ tenant: slug || null }, fn);
}

export function setCurrentTenant(slug) {
  // fallback por si algo queda fuera del ALS
  fallbackTenant = slug || null;
}

export function getCurrentTenant() {
  return als.getStore()?.tenant ?? fallbackTenant ?? null;
}

export function empresaToSlug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Recibe:
 *  - una ruta relativa como "config/cuentas.json" o "ventas/ventas.json"
 *  - o una absoluta relativa al repo como "./src/data/config/ventas.json"
 * Devuelve la ruta correcta con el tenant si existe.
 */
export function getTenantPath(relOrAbs) {
  const raw = String(relOrAbs || "").replace(/\\/g, "/");

  // Si ya apunta a .../tenants/... la dejamos como está
  if (raw.includes("/tenants/")) {
    return raw.startsWith("./") ? raw : `./${raw}`;
  }

  // Quitar prefijo "./src/data/" si vino completo
  const sub = raw.replace(/^\.?\/?src\/data\/?/, "");

  const slug = getCurrentTenant();
  const base = slug ? `./src/data/tenants/${slug}` : `./src/data`;

  return `${base}/${sub}`;
}
