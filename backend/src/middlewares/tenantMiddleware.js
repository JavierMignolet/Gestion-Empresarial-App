// src/middlewares/tenantMiddleware.js
import jwt from "jsonwebtoken";
import {
  empresaToSlug,
  runWithTenant,
  setCurrentTenant,
} from "../utils/tenant.js";

export function tenantMiddleware(req, _res, next) {
  let slug = null;

  // 1) Header x-company
  const hdr = req.headers["x-company"];
  if (hdr) slug = empresaToSlug(hdr);

  // 2) Body / Query
  if (!slug && req.body?.empresa) slug = empresaToSlug(req.body.empresa);
  if (!slug && req.query?.empresa) slug = empresaToSlug(req.query.empresa);

  // 3) JWT (Authorization)
  if (!slug && req.headers?.authorization) {
    const token = String(req.headers.authorization || "").split(" ")[1];
    if (token) {
      try {
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET || "devsecret"
        );
        if (payload?.empresa) slug = empresaToSlug(payload.empresa);
      } catch {
        // Como fallback, decodificar sin verificar firma (no tirar error)
        try {
          const decoded = jwt.decode(token);
          if (decoded?.empresa) slug = empresaToSlug(decoded.empresa);
        } catch {
          /* ignore */
        }
      }
    }
  }

  req.tenantSlug = slug || null;

  // Guardar en ALS + fallback para cualquier util que no corra en el contexto
  runWithTenant(req.tenantSlug, () => {
    setCurrentTenant(req.tenantSlug);
    next();
  });
}
