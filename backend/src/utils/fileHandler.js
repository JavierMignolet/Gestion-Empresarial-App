// src/utils/fileHandler.js
import fs from "fs";
import path from "path";
import { getTenantPath } from "./tenant.js";

/** Crea el directorio si no existe (modo recursivo) */
export function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    console.error("ensureDir error:", dirPath, err);
  }
}

/**
 * Resuelve rutas:
 * - Si comienza con "/" → tratar como **ruta lógica tenant-aware** (NO absoluta).
 * - Si comienza con "./" o "../" o "src/data/..." → respetar como está (ruta física).
 * - En cualquier otro caso → tratar como lógica tenant-aware.
 */
function resolvePath(p) {
  if (!p) return null;

  // 👇 IMPORTANTE: en Windows, "/x.json" NO debe ir a "C:\x.json"; lo tratamos como lógico.
  if (p.startsWith("/")) {
    return getTenantPath(p);
  }

  const isRawRelative =
    p.startsWith("./") ||
    p.startsWith("../") ||
    /^\.?[/\\]?src[/\\]data[/\\]/i.test(p);

  if (isRawRelative) {
    return p; // ya viene físico
  }

  // Por defecto, tratar como lógico tenant-aware
  return getTenantPath(`/${p}`);
}

/** Lee un JSON y devuelve el objeto (o null si no existe / vacío / inválido) */
export function readJSON(p) {
  try {
    const filePath = resolvePath(p);
    if (!filePath || !fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw || !raw.trim()) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("readJSON error:", p, err);
    return null;
  }
}

/** Escribe un JSON (crea la carpeta padre si hace falta) */
export function writeJSON(p, data) {
  try {
    const filePath = resolvePath(p);
    const dir = path.dirname(filePath);
    ensureDir(dir);
    fs.writeFileSync(filePath, JSON.stringify(data ?? [], null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("writeJSON error:", p, err);
    return false;
  }
}
