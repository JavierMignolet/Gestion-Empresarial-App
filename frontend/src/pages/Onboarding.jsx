// src/pages/Onboarding.jsx
import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";
const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:4000";

export default function Onboarding() {
  const { login } = useAuth();

  const [tab, setTab] = useState("login"); // "login" | "register"

  // LOGIN
  const [empresaL, setEmpresaL] = useState("");
  const [usuarioL, setUsuarioL] = useState("");
  const [passL, setPassL] = useState("");
  const [showPassL, setShowPassL] = useState(false);
  const [loadingL, setLoadingL] = useState(false);
  const [msgL, setMsgL] = useState("");

  // REGISTER
  const [empresaR, setEmpresaR] = useState("");
  const [usuarioR, setUsuarioR] = useState("");
  const [passR, setPassR] = useState("");
  const [tipoR, setTipoR] = useState("admin");
  const [emailR, setEmailR] = useState("");
  const [telR, setTelR] = useState("");
  const [showPassR, setShowPassR] = useState(false);
  const [loadingR, setLoadingR] = useState(false);
  const [msgR, setMsgR] = useState("");

  // FORGOT MODAL
  const [showForgot, setShowForgot] = useState(false);
  const [empresaF, setEmpresaF] = useState("");
  const [usuarioF, setUsuarioF] = useState("");
  const [loadingF, setLoadingF] = useState(false);
  const [msgF, setMsgF] = useState("");

  const doLogin = async (e) => {
    e.preventDefault();
    setMsgL("");
    if (!empresaL || !usuarioL || !passL) {
      setMsgL("Completá empresa, usuario y contraseña.");
      return;
    }
    try {
      setLoadingL(true);
      await login({ empresa: empresaL, username: usuarioL, password: passL });
      window.location.href = "/"; // o navigate("/")
    } catch (err) {
      console.error(err);
      setMsgL(err?.response?.data?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoadingL(false);
    }
  };

  const doRegister = async (e) => {
    e.preventDefault();
    setMsgR("");
    if (!empresaR || !usuarioR || !passR) {
      setMsgR("Completá empresa, usuario y contraseña.");
      return;
    }
    try {
      setLoadingR(true);

      const res = await axios.post(
        `${API_BASE}/api/company/register`,
        {
          empresa: empresaR,
          usuario: usuarioR,
          password: passR,
          tipo: tipoR,
          email: emailR || undefined,
          telefono: telR || undefined,
        },
        { headers: { "x-company": empresaR } }
      );

      setMsgR("✅ Empresa creada. Ahora podés iniciar sesión.");
      // autocompletar login
      setEmpresaL(empresaR);
      setUsuarioL(usuarioR);
      setPassL(passR);
      setTab("login");
    } catch (err) {
      console.error(err);
      setMsgR(
        err?.response?.data?.message || "No se pudo registrar la empresa."
      );
    } finally {
      setLoadingR(false);
    }
  };

  const doForgot = async (e) => {
    e.preventDefault();
    setMsgF("");
    try {
      setLoadingF(true);
      await axios.post(`${API_BASE}/api/auth/forgot`, {
        empresa: empresaF,
        username: usuarioF,
      });
      setMsgF(
        "Si los datos son correctos, enviamos un enlace para restablecer la contraseña."
      );
    } catch (err) {
      console.error("forgot", err);
      // respuesta genérica (el backend también devuelve genérico)
      setMsgF(
        "Si los datos son correctos, enviamos un enlace para restablecer la contraseña."
      );
    } finally {
      setLoadingF(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 880 }}>
      <h2 className="my-4">Bienvenido</h2>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
          >
            Ingresar
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}
          >
            Agregar empresa
          </button>
        </li>
      </ul>

      {tab === "login" ? (
        <form className="card p-3" onSubmit={doLogin}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Empresa</label>
              <input
                className="form-control"
                value={empresaL}
                onChange={(e) => setEmpresaL(e.target.value)}
                placeholder="ej: tequegaucho"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Usuario</label>
              <input
                className="form-control"
                value={usuarioL}
                onChange={(e) => setUsuarioL(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Contraseña</label>
              <div className="input-group">
                <input
                  className="form-control"
                  type={showPassL ? "text" : "password"}
                  value={passL}
                  onChange={(e) => setPassL(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassL((s) => !s)}
                  title={showPassL ? "Ocultar" : "Mostrar"}
                >
                  {showPassL ? "🙈" : "👁️"}
                </button>
              </div>
              <div className="form-text">
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={() => {
                    setEmpresaF(empresaL);
                    setUsuarioF(usuarioL);
                    setShowForgot(true);
                    setMsgF("");
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
            <div className="col-12 d-flex gap-2 align-items-center">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loadingL}
              >
                {loadingL ? "Ingresando..." : "Ingresar"}
              </button>
              {msgL && <span className="text-danger">{msgL}</span>}
            </div>
          </div>
        </form>
      ) : (
        <form className="card p-3" onSubmit={doRegister}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Nombre empresa</label>
              <input
                className="form-control"
                value={empresaR}
                onChange={(e) => setEmpresaR(e.target.value)}
                placeholder="ej: TequeGaucho"
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={tipoR}
                onChange={(e) => setTipoR(e.target.value)}
              >
                <option value="admin">Administrador</option>
                <option value="vendedor">Vendedor</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Usuario</label>
              <input
                className="form-control"
                value={usuarioR}
                onChange={(e) => setUsuarioR(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Contraseña</label>
              <div className="input-group">
                <input
                  className="form-control"
                  type={showPassR ? "text" : "password"}
                  value={passR}
                  onChange={(e) => setPassR(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassR((s) => !s)}
                  title={showPassR ? "Ocultar" : "Mostrar"}
                >
                  {showPassR ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="col-md-4">
              <label className="form-label">Email (recomendado)</label>
              <input
                type="email"
                className="form-control"
                value={emailR}
                onChange={(e) => setEmailR(e.target.value)}
                placeholder="para recuperar contraseña"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Teléfono (opcional)</label>
              <input
                className="form-control"
                value={telR}
                onChange={(e) => setTelR(e.target.value)}
                placeholder="+54911...."
              />
            </div>

            <div className="col-12 d-flex gap-2 align-items-center">
              <button
                className="btn btn-success"
                type="submit"
                disabled={loadingR}
              >
                {loadingR ? "Creando..." : "Guardar y habilitar acceso"}
              </button>
              {msgR && <span className="text-danger">{msgR}</span>}
            </div>
          </div>
          <small className="text-muted mt-2 d-block">
            Una vez creada podrás iniciar sesión desde cualquier dispositivo con
            Empresa, Usuario y Contraseña.
          </small>
        </form>
      )}

      {/* MODAL: Olvidé mi contraseña */}
      {showForgot && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <form
              className="modal-content"
              onSubmit={doForgot}
              autoComplete="off"
            >
              <div className="modal-header">
                <h5 className="modal-title">Restablecer contraseña</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowForgot(false)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Empresa</label>
                  <input
                    className="form-control"
                    value={empresaF}
                    onChange={(e) => setEmpresaF(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Usuario</label>
                  <input
                    className="form-control"
                    value={usuarioF}
                    onChange={(e) => setUsuarioF(e.target.value)}
                    required
                  />
                </div>
                {msgF && <div className="alert alert-info">{msgF}</div>}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForgot(false)}
                >
                  Cancelar
                </button>
                <button className="btn btn-primary" disabled={loadingF}>
                  {loadingF ? "Enviando..." : "Enviar enlace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
