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

function App() {
  const [token, setToken] = useState(localStorage.getItem("access"));
  const [rol, setRol] = useState((localStorage.getItem("rol") || "").toLowerCase());

  function manejarLogin() {
    setToken(localStorage.getItem("access"));
    setRol((localStorage.getItem("rol") || "").toLowerCase());
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
                  <Dashboard>
                    <PanelCoordinador />
                  </Dashboard>
                )
              }
            />

            <Route
              path="/instructor/dashboard"
              element={
                <Dashboard>
                  <PanelInstructor />
                </Dashboard>
              }
            />

            <Route
              path="/instructor/grupos"
              element={
                <Dashboard>
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
                <Dashboard>
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
                <Dashboard>
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
                <Dashboard>
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
                <Dashboard>
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
                <Dashboard>
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
                  <Dashboard>
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
                  <Dashboard>
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
                  <Dashboard>
                    <Fichas />
                  </Dashboard>
                )
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
              path="/perfil"
              element={
                <Dashboard>
                  <Perfil />
                </Dashboard>
              }
            />

            <Route
              path="/alertas"
              element={
                esInstructor ? (
                  <Navigate to="/instructor/observaciones" replace />
                ) : (
                  <Dashboard>
                    <div>Alertas</div>
                  </Dashboard>
                )
              }
            />

            <Route
              path="/configuracion"
              element={
                <Dashboard>
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
