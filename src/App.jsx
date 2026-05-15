import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard";
import PanelCoordinador from "./pages/coordinador/PanelCoordinador";
import RegistroAprendices from "./pages/instructor/RegistroAprendices";
import PanelInstructor from "./pages/instructor/PanelInstructor";
import InstructorSeccion from "./pages/instructor/InstructorSeccion";
import MisGrupos from "./pages/instructor/MisGrupos";
import Fichas from "./pages/fichas/Fichas";
import GrupoDetalle from "./pages/fichas/GrupoDetalle";
import Perfil from "./pages/perfil/Perfil";
import Usuario from "./pages/usuarios/Usuario";
import Observaciones from "./pages/observador/Observaciones";
import ConsultarAlertas from "./pages/alertas/ConsultarAlertas";
import AlertasCoordinador from "./pages/alertas/AlertasCoordinador";
import DetalleAlerta from "./pages/alertas/DetalleAlerta";
import NotificacionesPage from "./pages/notificaciones/NotificacionesPage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("access"));
  const [rol, setRol] = useState(
    (localStorage.getItem("rol") || "").toLowerCase()
  );

  function manejarLogin() {
    setToken(localStorage.getItem("access"));
    setRol((localStorage.getItem("rol") || "").toLowerCase());
  }

  function manejarLogout() {
    localStorage.clear();
    sessionStorage.clear();
    setToken(null);
    setRol("");
  }

  const esInstructor = rol === "instructor";
  const rutaInicio = esInstructor
    ? "/instructor/grupos"
    : "/dashboard";

  return (
    <BrowserRouter>
      <Routes>
        {token ? (
          <>
            <Route
              path="/"
              element={<Navigate to="/login" replace />}
            />

            <Route
              path="/login"
              element={<Login onLogin={manejarLogin} />}
            />

            <Route
              path="/dashboard"
              element={
                esInstructor ? (
                  <Navigate to="/instructor/dashboard" replace />
                ) : (
                  <Dashboard onLogout={manejarLogout}>
                    <PanelCoordinador />
                  </Dashboard>
                )
              }
            />

            <Route
              path="/instructor/dashboard"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <PanelInstructor />
                </Dashboard>
              }
            />

            {/* APRENDICES INSTRUCTOR */}
            <Route
              path="/instructor/aprendices"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <RegistroAprendices />
                </Dashboard>
              }
            />

            <Route
              path="/instructor/grupos"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <MisGrupos />
                </Dashboard>
              }
            />

            <Route
              path="/instructor/grupos/:id"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <GrupoDetalle />
                </Dashboard>
              }
            />

            <Route
              path="/instructor/asistencia"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <InstructorSeccion
                    titulo="Asistencia"
                    descripcion="Aqui puedes registrar y revisar asistencia por grupo, fecha o sesion."
                  />
                </Dashboard>
              }
            />

            <Route
              path="/instructor/observaciones"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <Observaciones />
                </Dashboard>
              }
            />

            <Route
              path="/instructor/reportes"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <InstructorSeccion
                    titulo="Reportes"
                    descripcion="Consulta reportes de asistencia, observaciones y consolidado de tus grupos."
                  />
                </Dashboard>
              }
            />

            <Route
              path="/instructor/eventos"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <InstructorSeccion
                    titulo="Eventos de acceso"
                    descripcion="Revisa actividad reciente del instructor y eventos importantes del sistema."
                  />
                </Dashboard>
              }
            />

            {/* APRENDICES COORDINADOR */}
            <Route
              path="/aprendices"
              element={
                esInstructor ? (
                  <Navigate to="/instructor/aprendices" replace />
                ) : (
                  <Dashboard onLogout={manejarLogout}>
                    <RegistroAprendices />
                  </Dashboard>
                )
              }
            />

            <Route
              path="/usuarios"
              element={
                esInstructor ? (
                  <Navigate to="/instructor/dashboard" replace />
                ) : (
                  <Dashboard onLogout={manejarLogout}>
                    <Usuario />
                  </Dashboard>
                )
              }
            />

            <Route
              path="/fichas"
              element={
                esInstructor ? (
                  <Navigate to="/instructor/grupos" replace />
                ) : (
                  <Dashboard onLogout={manejarLogout}>
                    <Fichas />
                  </Dashboard>
                )
              }
            />

            <Route
              path="/fichas/:id"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <GrupoDetalle />
                </Dashboard>
              }
            />

            <Route
              path="/perfil"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <Perfil />
                </Dashboard>
              }
            />

            <Route
              path="/alertas"
              element={<Navigate to="/alertas/consultar" replace />}
            />

            <Route
              path="/alertas/consultar"
              element={
                <Dashboard onLogout={manejarLogout}>
                  {rol === 'coordinador' ? <AlertasCoordinador /> : <ConsultarAlertas />}
                </Dashboard>
              }
            />

            <Route
              path="/alertas/:id"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <DetalleAlerta />
                </Dashboard>
              }
            />

            <Route
              path="/notificaciones"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <NotificacionesPage />
                </Dashboard>
              }
            />

            <Route
              path="/configuracion"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <div>Configuracion</div>
                </Dashboard>
              }
            />

            <Route
              path="*"
              element={<Navigate to={rutaInicio} replace />}
            />
          </>
        ) : (
          <>
            <Route
              path="/"
              element={<Navigate to="/login" replace />}
            />

            <Route
              path="/login"
              element={<Login onLogin={manejarLogin} />}
            />

            <Route
              path="*"
              element={<Navigate to="/login" replace />}
            />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
