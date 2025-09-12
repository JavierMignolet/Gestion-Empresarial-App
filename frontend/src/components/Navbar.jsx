//Navbar.jsx
// src/components/Navbar.jsx
import { useAuth } from "../context/AuthContext";

function formatEmpresa(slugOrName = "") {
  // Convierte "mi-empresa_ok" -> "Mi Empresa Ok"
  const s = String(slugOrName).replace(/[-_]+/g, " ").trim();
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function Navbar() {
  const { empresa } = useAuth(); // viene del AuthProvider
  const title = empresa
    ? `Gestión de ${formatEmpresa(empresa)}`
    : "Gestión Empresarial";

  return (
    <nav className="navbar navbar-light bg-light px-4">
      <ul className="navbar-nav ms-auto"><span className="navbar-brand mb-0 h1">{title}</span></ul>
    </nav>
  );
}

export default Navbar;
