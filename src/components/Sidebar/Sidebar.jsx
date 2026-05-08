import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  LayoutDashboard,
  Users,
  UsersRound,
  MessageSquareWarning

} from "lucide-react";
import "./sidebar.css";
import senaLogo from "../../assets/logoSena.png";

const menuByRole = {
  instructor: [
    { icon: LayoutDashboard, label: "Inicio", path: "/instructor/dashboard", id: "inicio" },
    { icon: UsersRound, label: "Mis grupos", path: "/instructor/grupos", id: "grupos" },
    { icon: Users, label: "Asistencia", path: "/instructor/asistencia", id: "asistencia" },
    { icon: Bell, label: "Alertas", path: "/alertas/consultar", id: "consultar-alertas" },
    { icon: MessageSquareWarning, label: "Observaciones", path: "/instructor/observaciones", id: "observaciones" },
    { icon: CalendarDays, label: "Calendario", path: "/instructor/calendario", id: "calendario" }
  ],
  coordinador: [
    { icon: LayoutDashboard, label: "Inicio", path: "/dashboard", id: "inicio" },
    { icon: Users, label: "Gestion de usuarios", path: "/usuarios", id: "usuarios" },
    { icon: UsersRound, label: "Gestion de grupos", path: "/fichas", id: "grupos" },
    { icon: Users, label: "Aprendices", path: "/aprendices", id: "aprendices" },
    { icon: Bell, label: "Alertas", path: "/alertas/consultar", id: "alertas" }
  ]
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const rol = (localStorage.getItem("rol") || "").toLowerCase();
  const menuItems = menuByRole[rol] || menuByRole.coordinador;

  return (
    <aside className="sima-sidebar-main" aria-label="Navegacion principal">
      <div className="sima-sidebar-shell">
        <nav className="sima-sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className={`sima-nav-link ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="icon-container">
                  <Icon size={26} strokeWidth={2.1} />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sima-sidebar-footer" aria-label="SENA institucional">
        <img className="sima-sidebar-footer-logo" src={senaLogo} alt="Logo SENA" />
      </div>
    </aside>
  );
}
