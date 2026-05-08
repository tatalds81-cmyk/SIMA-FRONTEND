import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard";
import PanelCoordinador from "./pages/coordinador/PanelCoordinador";
import RegistroAprendices from "./pages/coordinador/RegistroAprendices";
import PanelInstructor from "./pages/instructor/PanelInstructor";
import InstructorSeccion from "./pages/instructor/InstructorSeccion";
import Fichas from "./pages/fichas/Fichas";
import GrupoDetalle from "./pages/fichas/GrupoDetalle";
import Perfil from "./pages/perfil/Perfil";
import Usuario from "./pages/usuarios/Usuario";
import ConsultarAlertas from "./pages/alertas/ConsultarAlertas";
import DetalleAlerta from "./pages/alertas/DetalleAlerta";
import NotificacionesPage from "./pages/notificaciones/NotificacionesPage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("access"));
  const [rol, setRol] = useState((localStorage.getItem("rol") || "").toLowerCase());

  function manejarLogin() {
    setToken(localStorage.getItem("access"));
    setRol((localStorage.getItem("rol") || "").toLowerCase());
  }

  // Función para cerrar sesión
  function manejarLogout() {
    localStorage.clear();
    sessionStorage.clear();
    setToken(null);
    setRol("");
  }

  const esInstructor = rol === "instructor";
  const rutaInicio = esInstructor ? "/instructor/dashboard" : "/dashboard";

  return (
    <BrowserRouter>
      <Routes>
        {token ? (
          <>
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

            <Route
              path="/instructor/grupos"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <InstructorSeccion
                    titulo="Mis grupos"
                    descripcion="Consulta los grupos asignados, su jornada y accesos directos al detalle."
                  />
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
                  <InstructorSeccion
                    titulo="Observaciones"
                    descripcion="Espacio para seguimiento de novedades, anotaciones y casos prioritarios."
                  />
                </Dashboard>
              }
            />

            <Route
              path="/instructor/calendario"
              element={
                <Dashboard onLogout={manejarLogout}>
                  <InstructorSeccion
                    titulo="Calendario"
                    descripcion="Visualiza tus sesiones, horarios y proximas actividades del instructor."
                  />
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

            <Route
              path="/aprendices"
              element={
                esInstructor ? (
                  <Navigate to="/instructor/grupos" replace />
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
                  <ConsultarAlertas />
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

            <Route path="*" element={<Navigate to={rutaInicio} replace />} />
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
