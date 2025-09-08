// src/utils/tenant.js
import { AsyncLocalStorage } from "node:async_hooks";
import path from "path";
import fs from "fs";

/** Normaliza nombre de empresa a slug: sin acentos, minúsculas, alfanumérico */
export function empresaToSlug(name) {
  if (!name) return null;
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ALS para propagar tenant en el request
export const tenantALS = new AsyncLocalStorage();

// Fallback por si algo corre fuera del ALS
let _currentTenant = null;

export function runWithTenant(slug, fn) {
  return tenantALS.run({ slug: slug || null }, fn);
}

export function getCurrentTenant() {
  const store = tenantALS.getStore();
  return (store && store.slug) || _currentTenant || null;
}

export function setCurrentTenant(slug) {
  _currentTenant = slug || null;
}

/**
 * Devuelve un path físico dentro del tenant actual (si existe),
 * p. ej. getTenantPath('/config/cuentas.json') -> ./src/data/tenants/<slug>/config/cuentas.json
 * Si no hay tenant, cae a ./src/data/<relPath>.
 */
export function getTenantPath(relPath, slugOverride = null) {
  const slug = slugOverride || getCurrentTenant();
  const clean = String(relPath || "").replace(/^\.?\/?src\/data\/?/i, "");
  const withoutLeading = clean.startsWith("/") ? clean.slice(1) : clean;

  const baseDir = slug
    ? path.join("./src/data/tenants", slug)
    : path.join("./src/data");

  const full = path.join(baseDir, withoutLeading);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return full;
}
