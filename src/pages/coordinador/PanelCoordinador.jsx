import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  UserCheck,
  Layers,
  BellRing,
  UserPlus,
  UsersRound,
  PlusCircle
} from "lucide-react";

import CardResumen from "./CardResumen";
import GraficoLineaMultiEje from "./GraficoLineaMultiEje";
import GraficoBarrasApiladas from "./GraficoBarrasApiladas";
import GraficoFichasRiesgo from "./GraficoFichasRiesgo";
import "./coordinador.css";

export default function PanelCoordinador() {
  const navigate = useNavigate();

  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");

  useEffect(() => {
    cargarDashboard();
  }, []);

  function cargarDashboard() {
    try {
      setCargando(true);
      setError("");

      setResumen({
        aprendices_activos: 1,
        total_fichas: 0,
        alertas_activas: 1
      });
    } catch (err) {
      console.log("Error dashboard:", err);
      setError("Error al cargar el dashboard del coordinador");
    } finally {
      setCargando(false);
    }
  }

  function irCrearUsuario() {
    navigate("/usuarios");
  }

  function irCrearGrupo() {
    navigate("/fichas");
  }

  function mostrarMensajeAprendiz() {
    alert(
      "La funcionalidad de registrar aprendiz será integrada con el módulo correspondiente del sistema."
    );
  }

  const asistenciaSemanal = [
    { nombre: "Lun", valor: 80 },
    { nombre: "Mar", valor: 75 },
    { nombre: "Mié", valor: 90 },
    { nombre: "Jue", valor: 85 },
    { nombre: "Vie", valor: 70 }
  ];

  const alertasSeveridad = [
    { nombre: "Leves", valor: 5 },
    { nombre: "Moderadas", valor: 3 },
    { nombre: "Graves", valor: 2 },
    { nombre: "Críticas", valor: 1 }
  ];

  const aprendicesRiesgo = [
    {
      nombre: "Juan Pérez",
      inasistencias: 5,
      observaciones: 2,
      alertas: 1,
      riesgo: "Alto"
    },
    {
      nombre: "María Gómez",
      inasistencias: 4,
      observaciones: 1,
      alertas: 1,
      riesgo: "Medio"
    },
    {
      nombre: "Ana Martínez",
      inasistencias: 3,
      observaciones: 2,
      alertas: 0,
      riesgo: "Medio"
    }
  ];

  const tarjetasResumen = [
    {
      titulo: "Aprendices activos",
      valor: resumen?.aprendices_activos ?? 1,
      descripcion: "Aprendices con estado activo en formación",
      icono: <GraduationCap size={34} strokeWidth={2.5} />,
      color: "verde"
    },
    {
      titulo: "Instructores activos",
      valor: 0,
      descripcion: "Instructores activos registrados en el sistema",
      icono: <UserCheck size={34} strokeWidth={2.5} />,
      color: "verde"
    },
    {
      titulo: "Fichas activas",
      valor: resumen?.total_fichas ?? 0,
      descripcion: "Grupos o fichas activas registradas en SIMA",
      icono: <Layers size={34} strokeWidth={2.5} />,
      color: "azul"
    },
    {
      titulo: "Alertas activas",
      valor: resumen?.alertas_activas ?? 1,
      descripcion: "Alertas académicas o de seguimiento activas",
      icono: <BellRing size={34} strokeWidth={2.5} />,
      color: "verde"
    }
  ];

  const tarjetasFiltradas = tarjetasResumen.filter((tarjeta) =>
    tarjeta.titulo.toLowerCase().includes(terminoBusqueda.toLowerCase())
  );

  return (
    <div className="coordinador-panel">
      <div className="coordinador-seccion-titulo">Dashboard Coordinador</div>

      {cargando && (
        <div className="coordinador-alerta-info">
          Cargando información...
        </div>
      )}

      {error && <div className="coordinador-alerta-error">{error}</div>}

      {(resumen || error) && !cargando && (
        <>
          {terminoBusqueda !== "" && tarjetasFiltradas.length === 0 && (
            <div className="coordinador-alerta-info">
              No se encontraron resultados para:{" "}
              <strong>{terminoBusqueda}</strong>
            </div>
          )}

          <div className="coordinador-grid-resumen">
            {(terminoBusqueda === "" ? tarjetasResumen : tarjetasFiltradas).map(
              (tarjeta, index) => (
                <CardResumen
                  key={index}
                  titulo={tarjeta.titulo}
                  valor={tarjeta.valor}
                  descripcion={tarjeta.descripcion}
                  icono={tarjeta.icono}
                  color={tarjeta.color}
                />
              )
            )}
          </div>

          <div className="coordinador-panel-graficas">
            <div className="coordinador-card-grande">
              <div className="coordinador-card-header">
                <h2>Asistencia semanal</h2>
              </div>

              <GraficoLineaMultiEje
                etiquetas={asistenciaSemanal.map((item) => item.nombre)}
              />
            </div>

            <div className="coordinador-card-grande">
              <div className="coordinador-card-header">
                <h2>Alertas por severidad</h2>
              </div>

              <GraficoBarrasApiladas
                etiquetas={alertasSeveridad.map((item) => item.nombre)}
              />
            </div>
          </div>

          <div className="coordinador-card-grande coordinador-card-grafico-riesgo">
            <div className="coordinador-card-header">
              <h2>Fichas con mayor riesgo</h2>
            </div>

            <GraficoFichasRiesgo />
          </div>

          <div className="coordinador-riesgo-wrapper">
            <div className="coordinador-card-grande coordinador-card-riesgo">
              <h2>Top aprendices en riesgo</h2>

              <table className="coordinador-tabla">
                <thead>
                  <tr>
                    <th>Aprendiz</th>
                    <th>Inasistencias</th>
                    <th>Observaciones</th>
                    <th>Alertas</th>
                    <th>Riesgo</th>
                  </tr>
                </thead>

                <tbody>
                  {aprendicesRiesgo.map((aprendiz, index) => (
                    <tr key={index}>
                      <td>{aprendiz.nombre}</td>
                      <td>{aprendiz.inasistencias}</td>
                      <td>{aprendiz.observaciones}</td>
                      <td>{aprendiz.alertas}</td>
                      <td>
                        <span
                          className={`estado ${
                            aprendiz.riesgo === "Alto"
                              ? "denegado"
                              : "pendiente"
                          }`}
                        >
                          {aprendiz.riesgo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="coordinador-acciones-rapidas">
            <button className="btn-accion verde" onClick={irCrearUsuario}>
              <UserPlus size={22} strokeWidth={2.5} />
              <span>Crear Usuario</span>
            </button>

            <button className="btn-accion verde" onClick={irCrearGrupo}>
              <UsersRound size={22} strokeWidth={2.5} />
              <span>Crear Grupo</span>
            </button>

            <button className="btn-accion azul" onClick={mostrarMensajeAprendiz}>
              <PlusCircle size={22} strokeWidth={2.5} />
              <span>Registrar Aprendiz</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}