import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LogoutIcon({ className = "me-2", size = 18 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: "-2px" }}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Sidebar() {
  const { role, token, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  // Aplica / quita margen del contenido en desktop para no superponer
  useEffect(() => {
    const applyBodyClass = () => {
      const isDesktop = window.innerWidth >= 992;
      document.body.classList.toggle("with-sidebar", isDesktop);
      if (isDesktop && open) setOpen(false); // si agranda, cerramos drawer
    };
    applyBodyClass();
    window.addEventListener("resize", applyBodyClass);
    return () => window.removeEventListener("resize", applyBodyClass);
  }, [open]);

  const items = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/ventas", label: "Ventas" },
    { to: "/pedidos", label: "Pedidos" },
    { to: "/productos", label: "Productos" },
    { to: "/produccion", label: "Producción" },
    { to: "/compras", label: "Compras" },
    { to: "/gastos", label: "Gastos" },
    { to: "/clientes", label: "Clientes" },
    { to: "/stock", label: "Stock" },
    { to: "/reportes", label: "Reportes" },
    ...(role === "admin"
      ? [{ to: "/configuracion", label: "Configuración" }]
      : []),
  ];

  const LinkItem = ({ to, children }) => (
    <NavLink
      to={to}
      onClick={close}
      className={({ isActive }) =>
        "nav-link text-start" + (isActive ? " active fw-bold" : "")
      }
    >
      {children}
    </NavLink>
  );

  const handleLogout = async () => {
    if (!window.confirm("¿Cerrar sesión?")) return;
    try {
      await logout?.();
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <>
      {/* Botón móvil */}
      <button
        className="sidebar-toggle btn btn-outline-secondary d-lg-none"
        aria-label="Abrir menú lateral"
        aria-controls="sidebar"
        aria-expanded={open}
        onClick={toggle}
      >
        ☰ Menú
      </button>

      {/* Sidebar */}
      <aside id="sidebar" className={`sidebar ${open ? "open" : ""}`}>
        <div className="menu-title"></div>
        <br></br>
        <br></br>

        <nav className="nav flex-column gap-1">
          {token &&
            items.map((it) => (
              <LinkItem key={it.to} to={it.to}>
                {it.label}
              </LinkItem>
            ))}

          {/* Cerrar sesión: último ítem del menú desplegable */}
          {token && (
            <button
              type="button"
              className="nav-link text-start w-100"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <LogoutIcon />
              <span>Cerrar sesión</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Backdrop móvil */}
      {open && <div className="sidebar-backdrop d-lg-none" onClick={close} />}
    </>
  );
}
