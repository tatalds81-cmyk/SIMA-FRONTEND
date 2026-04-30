import { useNavigate } from "react-router-dom";
import "./sidebar.css"; // Importamos los estilos para el sidebar

/**
 * Componente Sidebar unificado para el sistema SIMA.
 * 
 * @param {string} activeItem - El nombre del elemento activo para resaltarlo en el menú.
 */
function Sidebar({ activeItem = "inicio" }) {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <aside className="sima-sidebar-main">
      <div className="sima-sidebar-logo">
        SIMA
      </div>

      <nav className="sima-sidebar-nav">
        <button 
          className={`sima-nav-link ${activeItem === "inicio" ? "active" : ""}`}
          onClick={() => handleNavigation("/dashboard")}
        >
          Inicio
        </button>
        <button 
          className={`sima-nav-link ${activeItem === "usuarios" ? "active" : ""}`}
          onClick={() => handleNavigation("/usuarios")}
        >
         Gestión de Usuarios
        </button>
        <button 
          className={`sima-nav-link ${activeItem === "fichas" ? "active" : ""}`}
          onClick={() => handleNavigation("/fichas")}
        >
          Gestión de Grupos
        </button>
        <button 
          className={`sima-nav-link ${activeItem === "alertas" ? "active" : ""}`}
          onClick={() => handleNavigation("/alertas")}
        >
          Aprendices
        </button>
        <button 
          className={`sima-nav-link ${activeItem === "alertas" ? "active" : ""}`}
          onClick={() => handleNavigation("/aprendices")}
        >
          Alertas
        </button>
        <button 
          className={`sima-nav-link ${activeItem === "configuracion" ? "active" : ""}`}
          onClick={() => handleNavigation("/configuracion")}
        >
          Configuración
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;