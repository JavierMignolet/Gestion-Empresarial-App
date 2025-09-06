// src/utils/fileHandler.js
import fs from "fs";
import path from "path";
import { getTenantPath } from "./tenant.js";

export function readJSON(relOrAbs) {
  const p = getTenantPath(relOrAbs);
  try {
    if (!fs.existsSync(p)) return [];
    const raw = fs.readFileSync(p, "utf-8");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("readJSON error:", p, e.message);
    return [];
  }
}

export function writeJSON(relOrAbs, data) {
  const p = getTenantPath(relOrAbs);
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data ?? [], null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("writeJSON error:", p, e.message);
    return false;
  }
}
