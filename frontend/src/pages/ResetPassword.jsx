// src/pages/ResetPassword.jsx
import React, { useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams, Link } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:4000";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);

  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!token) return setMsg("Token faltante.");
    if (!pass1 || pass1.length < 6)
      return setMsg("La contraseña debe tener al menos 6 caracteres.");
    if (pass1 !== pass2) return setMsg("Las contraseñas no coinciden.");
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/auth/reset`, {
        token,
        newPassword: pass1,
      });
      setOk(true);
      setMsg("✅ Contraseña actualizada. Ahora podés iniciar sesión.");
    } catch (err) {
      console.error("reset error", err);
      setMsg(err?.response?.data?.message || "No se pudo restablecer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h2 className="my-4">Restablecer contraseña</h2>

      {!token && (
        <div className="alert alert-danger">Token inválido o faltante.</div>
      )}

      <form className="card p-3" onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">Nueva contraseña</label>
          <div className="input-group">
            <input
              type={show ? "text" : "password"}
              className="form-control"
              value={pass1}
              onChange={(e) => setPass1(e.target.value)}
              disabled={!token || ok}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShow((s) => !s)}
              title={show ? "Ocultar" : "Mostrar"}
              disabled={!token || ok}
            >
              {show ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Repetir contraseña</label>
          <input
            type={show ? "text" : "password"}
            className="form-control"
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
            disabled={!token || ok}
          />
        </div>

        {msg && (
          <div className={`alert ${ok ? "alert-success" : "alert-info"}`}>
            {msg}
          </div>
        )}

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            disabled={!token || ok || loading}
          >
            {loading ? "Guardando..." : "Guardar contraseña"}
          </button>
          <Link className="btn btn-outline-secondary" to="/login">
            Volver a iniciar sesión
          </Link>
        </div>
      </form>
    </div>
  );
}
