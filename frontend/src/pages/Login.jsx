// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    empresa: "", // <- necesario para multi-tenant
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // usa el login del AuthContext (guarda token + empresa en localStorage.session)
      await login({
        empresa: formData.empresa.trim(),
        username: formData.username.trim(),
        password: formData.password,
      });
      navigate("/dashboard");
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 401
          ? "Credenciales inválidas."
          : status === 403
          ? "Acceso denegado para esta empresa."
          : "Error al iniciar sesión.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 100 }}>
      <h3 className="mb-4 text-center">Iniciar sesión</h3>

      <form onSubmit={handleSubmit} autoComplete="on">
        <div className="mb-3">
          <label className="form-label">Empresa</label>
          <input
            type="text"
            name="empresa"
            className="form-control"
            value={formData.empresa}
            onChange={handleChange}
            placeholder="ej: teque-gaucho"
            autoComplete="organization"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Usuario</label>
          <input
            type="text"
            name="username"
            className="form-control"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <div className="input-group">
            <input
              type={showPass ? "text" : "password"}
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPass((s) => !s)}
              title={showPass ? "Ocultar" : "Mostrar"}
            >
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
