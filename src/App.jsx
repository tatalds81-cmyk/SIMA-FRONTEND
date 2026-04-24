// Importamos useState para manejar el estado de la sesión
import { useState } from "react";

// Importamos BrowserRouter, Routes, Route y Navigate para manejar las rutas
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Importamos la página de Login
import Login from "./pages/Auth/Login";

// Importamos el Dashboard general del proyecto
// Este Dashboard contiene el Navbar y Sidebar de la compañera
import Dashboard from "./pages/Dashboard";

// Importamos el contenido del dashboard del coordinador
// Esta es la parte desarrollada para el panel principal del coordinador
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

  return (
    <BrowserRouter>
      <Routes>
        {token ? (
          <>
            {/* 
              Ruta principal protegida del dashboard.
              Se mantiene el layout de Dashboard:
              - Navbar superior
              - Sidebar lateral
              Y dentro se carga el PanelCoordinador.
            */}
            <Route
              path="/dashboard"
              element={
                <Dashboard>
                  <PanelCoordinador />
                </Dashboard>
              }
            />
            <Route
              path="/coordinador/registro-aprendices"
              element={
                <Dashboard>
                  <RegistroAprendices />
                </Dashboard>
              }
            />

            {/* 
              Rutas protegidas del sistema.
              Por ahora conservan el Dashboard base del proyecto
              para no afectar el trabajo de otros compañeros.
            */}
            <Route path="/usuarios" element={<Dashboard />} />
            <Route path="/fichas" element={<Dashboard />} />
            <Route path="/alertas" element={<Dashboard />} />
            <Route path="/configuracion" element={<Dashboard />} />

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