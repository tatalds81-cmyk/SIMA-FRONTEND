// Importamos useState para manejar el estado de la sesión
import { useState } from "react";

// Importamos BrowserRouter, Routes, Route y Navigate para manejar las rutas
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Importamos la página de Login
import Login from "./pages/Auth/Login";

// Importamos el Dashboard general del proyecto
// Este Dashboard contiene el Navbar y Sidebar principal
import Dashboard from "./pages/Dashboard";


import PanelCoordinador from "./pages/coordinador/PanelCoordinador";

import RegistroAprendices from "./pages/coordinador/RegistroAprendices";

function App() {
  // Inicializamos el token buscando en localStorage.
  // Si existe token, el usuario puede entrar al dashboard.
  // Si no existe, el sistema muestra el login.
  const [token, setToken] = useState(localStorage.getItem("access"));

  // Esta función se ejecuta cuando el login es correcto.
  // Actualiza el estado para permitir el acceso al dashboard.
  function manejarLogin() {
    setToken(localStorage.getItem("access"));
  }

  // Función para cerrar sesión
  function manejarLogout() {
    localStorage.removeItem("access");
    localStorage.removeItem("username");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
    setToken(null);
  }

  return (
    <BrowserRouter>
      <Routes>
        {token ? (
          <>
            <Route
              path="/dashboard"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <PanelCoordinador />
                </Dashboard>
              }
            />
            <Route 
              path="/aprendices" 
              element={
                <Dashboard onLogout={manejarLogout}>
                  <RegistroAprendices />
                </Dashboard>
              } 
            />

            <Route 
              path="/alertas" 
              element={
                <Dashboard onLogout={manejarLogout}>
                  <div>Contenido de Alertas</div>
                </Dashboard>
              } 
            />
            <Route 
              path="/configuracion" 
              element={
                <Dashboard onLogout={manejarLogout}>
                  <div>Contenido de Configuración</div>
                </Dashboard>
              } 
            />

            {/* Si el usuario intenta ir a otra ruta, lo mandamos al dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          <>
            {/* Si no hay token, siempre mostramos el Login */}
            <Route path="/" element={<Login onLogin={manejarLogin} />} />

            {/* Cualquier otra ruta sin sesión vuelve al login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
