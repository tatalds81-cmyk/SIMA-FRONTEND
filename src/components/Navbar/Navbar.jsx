import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css"; // Importamos los estilos del Navbar

/**
 * Componente Navbar unificado (Diseño Horizontal y Colorido).
 */
function Navbar({ searchValue, onSearchChange, onSearchSubmit, placeholder = "Buscar..." }) {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Fecha actual formateada para la zona superior
  const fechaActual = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const fechaFormateada = fechaActual.charAt(0).toUpperCase() + fechaActual.slice(1);

  // Obtenemos info del usuario desde localStorage
  const nombreUsuario = localStorage.getItem("username") || "Usuario";
  const rolUsuario = localStorage.getItem("rol") || "Usuario";
  const inicialUsuario = nombreUsuario.charAt(0).toUpperCase();

  const manejarCerrarSesion = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Cerrar menú cuando se hace click fuera
  const handleClickOutside = (e) => {
    if (!e.target.closest('.sima-navbar-profile-menu') && !e.target.closest('.sima-navbar-avatar')) {
      setIsProfileOpen(false);
    }
  };

  // Agregar event listener para cerrar menú
  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const alPresionarTecla = (e) => {
    if (e.key === "Enter" && onSearchSubmit) {
      onSearchSubmit(e);
    }
  };

  return (
    <header className="sima-navbar-main">
      {/* Franja Superior: Logo, Buscador y Perfil */}
      <div className="sima-navbar-top">
 
        
        <div className="sima-navbar-search">
          <input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={alPresionarTecla}
          />
          {onSearchSubmit && (
            <button className="sima-navbar-search-btn" onClick={onSearchSubmit}>
              Buscar
            </button>
          )}
        </div>

        <div className="sima-navbar-user-section">
          <div className="sima-navbar-info">
            <span className="sima-navbar-date">{fechaFormateada}</span>
            <span className="sima-navbar-username">{nombreUsuario}</span>
          </div>
          <div className="sima-navbar-bell" title="Notificaciones">
            🔔
            <span className="sima-navbar-badge">1</span>
          </div>
          <div className="sima-navbar-avatar" onClick={toggleProfileMenu}>
            {inicialUsuario}
          </div>
          
          {/* Menú desplegable del perfil donde solo funciona el de cerrar sesión */}
          {isProfileOpen && (
            <div className="sima-navbar-profile-menu">
              <div className="sima-profile-header">
                <div className="sima-profile-avatar">{inicialUsuario}</div>
                <div className="sima-profile-info">
                  <div className="sima-profile-name">{nombreUsuario}</div>
                  <div className="sima-profile-role">{rolUsuario}</div>
                </div>
              </div>
              <div className="sima-profile-menu-divider"></div>
              <button className="sima-profile-menu-item" onClick={() => navigate("/perfil")}>
                <span className="sima-menu-icon"></span>
                Mi Perfil
              </button>
              <button className="sima-profile-menu-item" onClick={() => navigate("/configuracion")}>
                <span className="sima-menu-icon"></span>
                Configuración
              </button>
              <div className="sima-profile-menu-divider"></div>
              <button className="sima-profile-menu-item sima-logout-btn" onClick={manejarCerrarSesion}>
                <span className="sima-menu-icon"></span>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}

export default Navbar;