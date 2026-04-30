import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Vistas
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard";
import PanelCoordinador from "./pages/coordinador/PanelCoordinador";
import Usuario from "./pages/usuarios/Usuario";
import RegistroAprendices from "./pages/coordinador/RegistroAprendices";
import Fichas from "./pages/fichas/Fichas";
import GrupoDetalle from "./pages/fichas/GrupoDetalle";

function App() {
  const [token, setToken] = useState(localStorage.getItem("access"));

  function manejarLogin() {
    setToken(localStorage.getItem("access"));
  }

  return (
    <BrowserRouter>
      <Routes>
        {token ? (
          <>
            {/* Dashboard principal */}
            <Route
              path="/dashboard"
              element={
                <Dashboard>
                  <PanelCoordinador />
                </Dashboard>
              }
            />
            <Route 
              path="/aprendices" 
              element={
                <Dashboard>
                  <RegistroAprendices />
                </Dashboard>
              } 
            />

            {/* Gestión de usuarios */}
            <Route
              path="/usuarios"
              element={
                <Dashboard>
                  <Usuario />
                </Dashboard>
              }
            />

            {/* Otras rutas */}
            <Route
              path="/fichas"
              element={
                <Dashboard>
                  <Fichas />
                </Dashboard>
              }
            />

            <Route
              path="/fichas/:id"
              element={
                <Dashboard>
                  <GrupoDetalle />
                </Dashboard>
              }
            />

            <Route
              path="/alertas"
              element={
                <Dashboard>
                  <div>Alertas</div>
                </Dashboard>
              }
            />

            <Route
              path="/configuracion"
              element={
                <Dashboard>
                  <div>Configuración</div>
                </Dashboard>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Login onLogin={manejarLogin} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;