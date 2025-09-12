// routes/config/index.js
import { Router } from "express";
import { auth as ensureAuth } from "../../middleware/authMiddleware.js"; // <-- ajusta la ruta a tu middleware real
import db from "../../db.js"; // <-- ajusta a tu capa de datos real (o usa tus helpers)

const router = Router();

/* 
  ... aquí van tus rutas existentes de "cuentas" / "usuarios", 
  ej.: router.get("/cuentas", auth, ...), router.post("/cuentas", auth, ...), etc.
*/

// ======= OBJETIVOS DE VENTAS =======
router.get("/objetivos", auth, async (req, res, next) => {
  try {
    // según tu multi-tenant: preferí req.tenantSlug si lo seteás en tenantMiddleware
    const empresa = req.tenantSlug || req.user?.empresa;

    // Reemplaza por tu acceso a DB real:
    // Debe retornar { objetivo_mensual_unidades, objetivo_semestral_unidades, objetivo_anual_unidades } o null
    const row = await db.getObjetivos?.(empresa);

    res.json({
      objetivo_mensual_unidades: row?.objetivo_mensual_unidades ?? 0,
      objetivo_semestral_unidades: row?.objetivo_semestral_unidades ?? 0,
      objetivo_anual_unidades: row?.objetivo_anual_unidades ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

router.put("/objetivos", auth, async (req, res, next) => {
  try {
    const empresa = req.tenantSlug || req.user?.empresa;

    const m = Number(req.body.objetivo_mensual_unidades) || 0;
    const s = Number(req.body.objetivo_semestral_unidades) || 0;
    const a = Number(req.body.objetivo_anual_unidades) || 0;

    // Reemplaza por tu acceso a DB real (upsert por empresa):
    await db.upsertObjetivos?.(empresa, {
      objetivo_mensual_unidades: m,
      objetivo_semestral_unidades: s,
      objetivo_anual_unidades: a,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
