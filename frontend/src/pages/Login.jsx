import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    empresa: "", // ⬅️ agrega empresa
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // usa el login del AuthContext (que guarda session y slug)
      await login({
        empresa: formData.empresa,
        username: formData.username,
        password: formData.password,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 100 }}>
      <h3 className="mb-4 text-center">Iniciar sesión</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Empresa</label>
          <input
            type="text"
            name="empresa"
            className="form-control"
            value={formData.empresa}
            onChange={handleChange}
            placeholder="ej: teque-gaucho"
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
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <button type="submit" className="btn btn-primary w-100">
          Ingresar
        </button>
      </form>
    </div>
  );
}

export default Login;
