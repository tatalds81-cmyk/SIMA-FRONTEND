import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import TablaAsistencia from "./asistencia/components/TablaAsistencia";
import { ESTADOS } from "./asistencia/asistencia.constants";
import {
  listarSesionesGrupo,
  obtenerAsistenciasSesion,
  obtenerCatalogosHorarioGrupo
} from "./asistencia/asistencia.service";
import {
  formatearFecha,
  obtenerIdSesion,
  prepararAsistenciaSesion
} from "./asistencia/asistencia.utils";
import "../coordinador/coordinador.css";
import "../fichas/fichas.css";
import "./instructor.css";

const FILTROS_INICIALES = {
  idGrupoTrimestre: "",
  idCompetencia: "",
  fechaDesde: "",
  fechaHasta: "",
  estado: "",
};

const ESTADOS_SESION = [
  { value: "", label: "Todos los estados" },
  { value: "PROGRAMADA", label: "Programada" },
  { value: "ABIERTA", label: "Abierta" },
  { value: "CERRADA", label: "Cerrada" },
  { value: "CANCELADA", label: "Cancelada" },
];

const DIAS_HABILES = ["Lun", "Mar", "Mie", "Jue", "Vie"];
const MESES_CALENDARIO = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function obtenerCodigo(grupo) {
  return (
    grupo?.numero_ficha ||
    grupo?.numero_grupo ||
    grupo?.codigo ||
    grupo?.ficha ||
    grupo?.id_grupo ||
    grupo?.id ||
    "Sin ficha"
  );
}

function obtenerPrograma(grupo) {
  return (
    grupo?.programa_formacion?.nombre_programa ||
    grupo?.programa?.nombre_programa ||
    grupo?.nombre_programa ||
    grupo?.programa ||
    "Programa de formacion"
  );
}

function obtenerIdGrupo(grupo) {
  return grupo?.id_grupo || grupo?.id || grupo?.codigo || grupo?.numero_ficha || "";
}

function obtenerGrupoGuardado(idGrupo) {
  try {
    const guardado = sessionStorage.getItem(`sima_grupo_detalle_${idGrupo}`);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

function obtenerCompetenciaCatalogo(item) {
  return item?.competencia || item || {};
}

function obtenerIdCompetenciaCatalogo(item) {
  const competencia = obtenerCompetenciaCatalogo(item);
  return competencia.id_clase_competencia || item?.id_clase_competencia || "";
}

function obtenerNombreCompetenciaCatalogo(item) {
  const competencia = obtenerCompetenciaCatalogo(item);
  return competencia.nombre_competencia || competencia.nombre || "Competencia sin nombre";
}

function obtenerIdCompetenciaSesion(sesion) {
  return sesion?.id_clase_competencia || sesion?.competencia?.id_clase_competencia || "";
}

function obtenerNombreCompetenciaSesion(sesion) {
  return sesion?.competencia?.nombre_competencia || sesion?.competencia?.nombre || "Sin competencia";
}

function obtenerNumeroTrimestreSesion(sesion) {
  return sesion?.grupo_trimestre?.numero_trimestre || sesion?.numero_trimestre || "";
}

function obtenerHorarioSesion(sesion) {
  const inicio = sesion?.hora_inicio_programada || sesion?.bloque_jornada?.hora_inicio || "";
  const fin = sesion?.hora_fin_programada || sesion?.bloque_jornada?.hora_fin || "";
  return inicio && fin ? `${String(inicio).slice(0, 5)} - ${String(fin).slice(0, 5)}` : "Sin horario";
}

function prepararRegistrosHistorial(asistencias) {
  return asistencias.map(prepararAsistenciaSesion).filter((registro) => registro.estado);
}

function calcularResumenAsistencia(registros) {
  return registros.reduce(
    (acumulado, registro) => {
      if (Object.prototype.hasOwnProperty.call(acumulado, registro.estado)) {
        acumulado[registro.estado] += 1;
      }
      return acumulado;
    },
    { presente: 0, ausente: 0, retardado: 0, justificado: 0 }
  );
}

function obtenerEstadoSesion(sesion) {
  return String(sesion?.estado || "SIN_ESTADO").toUpperCase();
}

function obtenerFechaSesion(sesion) {
  return String(sesion?.fecha_clase || "").slice(0, 10);
}

function crearFechaLocal(fechaISO) {
  return new Date(`${fechaISO}T12:00:00`);
}

function formatearFechaISO(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function construirDiasHabilesMes(fechaBase) {
  const anio = fechaBase.getFullYear();
  const mes = fechaBase.getMonth();
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const dias = [];

  for (let dia = 1; dia <= ultimoDia; dia += 1) {
    const fecha = new Date(anio, mes, dia, 12);
    const diaSemana = fecha.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue;

    if (!dias.length) {
      const espacios = diaSemana === 0 ? 6 : diaSemana - 1;
      for (let index = 0; index < espacios; index += 1) {
        dias.push(null);
      }
    }

    dias.push({
      dia,
      fechaISO: formatearFechaISO(fecha),
    });
  }

  return dias;
}

function etiquetaEstadoSesion(estado) {
  const etiquetas = {
    PROGRAMADA: "Programada",
    ABIERTA: "Abierta",
    CERRADA: "Cerrada",
    CANCELADA: "Cancelada",
    SIN_ESTADO: "Sin estado",
  };
  return etiquetas[estado] || estado;
}

export default function HistorialAsistenciaGrupo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const grupo = location.state?.grupo || obtenerGrupoGuardado(id) || { id_grupo: id };
  const idGrupo = obtenerIdGrupo(grupo) || id;
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [opciones, setOpciones] = useState({ trimestres: [], competencias: [] });
  const [sesiones, setSesiones] = useState([]);
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [mesCalendario, setMesCalendario] = useState(() => new Date());
  const [registros, setRegistros] = useState([]);
  const [busquedaAprendiz, setBusquedaAprendiz] = useState("");
  const [cargandoSesiones, setCargandoSesiones] = useState(false);
  const [cargandoAsistencias, setCargandoAsistencias] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const resumen = useMemo(() => calcularResumenAsistencia(registros), [registros]);
  const totalResumen = Object.values(resumen).reduce((total, valor) => total + Number(valor || 0), 0);
  const totalRegistros = Math.max(registros.length, totalResumen, 1);
  const segmentosDonut = useMemo(() => {
    let inicio = 0;
    return Object.entries(resumen).map(([estado, valor]) => {
      const porcentaje = Math.round((valor / totalRegistros) * 100);
      const fin = inicio + porcentaje;
      const segmento = `${ESTADOS[estado]?.color || "#e5e7eb"} ${inicio}% ${fin}%`;
      inicio = fin;
      return segmento;
    });
  }, [resumen, totalRegistros]);
  const porcentajePresentes = Math.round(((resumen.presente || 0) / totalRegistros) * 100);
  const registrosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busquedaAprendiz);
    if (!texto) return registros;
    return registros.filter((registro) => normalizarTexto(registro.nombre).includes(texto));
  }, [busquedaAprendiz, registros]);
  const sesionesPorFecha = useMemo(() => {
    return sesiones.reduce((mapa, sesion) => {
      const fecha = obtenerFechaSesion(sesion);
      if (!fecha) return mapa;
      const lista = mapa.get(fecha) || [];
      lista.push(sesion);
      mapa.set(fecha, lista);
      return mapa;
    }, new Map());
  }, [sesiones]);
  const diasCalendario = useMemo(() => construirDiasHabilesMes(mesCalendario), [mesCalendario]);
  const etiquetaMesCalendario = `${MESES_CALENDARIO[mesCalendario.getMonth()]} ${mesCalendario.getFullYear()}`;

  async function cargarRegistrosSesion(sesion, activo = true) {
    const idSesion = obtenerIdSesion(sesion);
    if (!idSesion) return;

    setSesionSeleccionada(sesion);
    setCargandoAsistencias(true);
    setRegistros([]);
    setBusquedaAprendiz("");
    setMensaje("");

    try {
      const detalle = await obtenerAsistenciasSesion(idSesion);
      if (!activo) return;
      setSesionSeleccionada(detalle.sesion || sesion);
      setRegistros(prepararRegistrosHistorial(detalle.asistencias));
    } catch (error) {
      console.error("Error cargando asistencias de seccion:", error);
      if (activo) setMensaje(error.message || "No fue posible cargar la asistencia de esta seccion.");
    } finally {
      if (activo) setCargandoAsistencias(false);
    }
  }

  async function cargarSesionesHistorial(filtrosConsulta = filtros, activo = true) {
    if (!idGrupo) return;
    setCargandoSesiones(true);
    setMensaje("");
    setSesionSeleccionada(null);
    setRegistros([]);
    setBusquedaAprendiz("");

    try {
      const respuesta = await listarSesionesGrupo({
        idGrupo,
        idGrupoTrimestre: filtrosConsulta.idGrupoTrimestre,
        fechaDesde: filtrosConsulta.fechaDesde,
        fechaHasta: filtrosConsulta.fechaHasta,
        estado: filtrosConsulta.estado,
        soloResponsable: true,
        limit: 100,
      });

      if (!activo) return;
      const sesionesFiltradas = filtrosConsulta.idCompetencia
        ? respuesta.sesiones.filter((sesion) => String(obtenerIdCompetenciaSesion(sesion)) === String(filtrosConsulta.idCompetencia))
        : respuesta.sesiones;
      setSesiones(sesionesFiltradas);
      const primeraFecha = obtenerFechaSesion(sesionesFiltradas[0]);
      setFechaSeleccionada((actual) => {
        if (actual && sesionesFiltradas.some((sesion) => obtenerFechaSesion(sesion) === actual)) return actual;
        return primeraFecha || "";
      });
      if (primeraFecha) setMesCalendario(crearFechaLocal(primeraFecha));
      setMensaje(sesionesFiltradas.length ? "" : "No hay secciones con esos filtros.");
    } catch (error) {
      console.error("Error cargando secciones de asistencia:", error);
      if (activo) {
        setSesiones([]);
        setMensaje(error.message || "No fue posible consultar las secciones de asistencia.");
      }
    } finally {
      if (activo) setCargandoSesiones(false);
    }
  }

  useEffect(() => {
    let activo = true;

    async function cargarCatalogos() {
      try {
        const catalogos = await obtenerCatalogosHorarioGrupo(idGrupo);
        if (!activo) return;
        setOpciones({
          trimestres: catalogos.trimestres,
          competencias: catalogos.competencias,
        });
      } catch (error) {
        console.error("Error cargando catalogos de asistencia:", error);
        if (activo) setOpciones({ trimestres: [], competencias: [] });
      }
    }

    cargarCatalogos();
    const timeout = window.setTimeout(() => cargarSesionesHistorial(FILTROS_INICIALES, activo), 0);

    return () => {
      activo = false;
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idGrupo]);

  function cambiarFiltro(evento) {
    const { name, value } = evento.target;
    setFiltros((actual) => ({ ...actual, [name]: value }));
  }

  async function seleccionarDiaCalendario(fechaISO) {
    setFechaSeleccionada(fechaISO);
    const sesionesDia = sesionesPorFecha.get(fechaISO) || [];
    if (sesionesDia.length) {
      await cargarRegistrosSesion(sesionesDia[0]);
      return;
    }

    setSesionSeleccionada(null);
    setRegistros([]);
    setBusquedaAprendiz("");
    setMensaje("");
  }

  function cambiarMesCalendario(direccion) {
    setMesCalendario((actual) => new Date(actual.getFullYear(), actual.getMonth() + direccion, 1, 12));
  }

  function limpiarFiltrosHistorial() {
    setFiltros(FILTROS_INICIALES);
    cargarSesionesHistorial(FILTROS_INICIALES);
  }

  return (
    <div className="grupos-page mis-grupos-page asistencia-historial-page">
      <header className="grupos-header asistencia-historial-page-header">
        <div>
          <span className="grupos-eyebrow">Asistencia de grupo</span>
          <h1>Historial de asistencia</h1>
          <p>Ficha {obtenerCodigo(grupo)} - {obtenerPrograma(grupo)}</p>
        </div>
        <button type="button" className="ghost asistencia-historial-back" onClick={() => navigate("/instructor/grupos")}>
          <ArrowLeft size={17} />
          Volver a mis grupos
        </button>
      </header>

      <section className="coordinador-card asistencia-historial-panel" aria-label="Historial de asistencia del grupo">
        <div className="asistencia-historial-filters">
          <label>
            <span>Trimestre</span>
            <select name="idGrupoTrimestre" value={filtros.idGrupoTrimestre} onChange={cambiarFiltro}>
              <option value="">Todos</option>
              {opciones.trimestres.map((trimestre) => (
                <option key={trimestre.id_grupo_trimestre} value={trimestre.id_grupo_trimestre}>
                  Trimestre {trimestre.numero_trimestre || trimestre.trimestre || trimestre.id_grupo_trimestre}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Competencia</span>
            <select name="idCompetencia" value={filtros.idCompetencia} onChange={cambiarFiltro}>
              <option value="">Todas</option>
              {opciones.competencias.map((competencia) => {
                const idCompetencia = obtenerIdCompetenciaCatalogo(competencia);
                return (
                  <option key={idCompetencia} value={idCompetencia}>
                    {obtenerNombreCompetenciaCatalogo(competencia)}
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            <span>Desde</span>
            <input type="date" name="fechaDesde" value={filtros.fechaDesde} onChange={cambiarFiltro} />
          </label>

          <label>
            <span>Hasta</span>
            <input type="date" name="fechaHasta" value={filtros.fechaHasta} onChange={cambiarFiltro} />
          </label>

          <label>
            <span>Estado</span>
            <select name="estado" value={filtros.estado} onChange={cambiarFiltro}>
              {ESTADOS_SESION.map((estado) => (
                <option key={estado.value || "todos"} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </label>

          <div className="asistencia-historial-actions">
            <button type="button" className="mcal-btn-cancelar" onClick={limpiarFiltrosHistorial}>
              Limpiar
            </button>
            <button type="button" className="mcal-btn-enviar" onClick={() => cargarSesionesHistorial()} disabled={cargandoSesiones}>
              <RefreshCw size={15} />
              Filtrar
            </button>
          </div>
        </div>

        {mensaje && <div className="grupos-alert info asistencia-historial-message">{mensaje}</div>}

        <div className="asistencia-historial-body">
          <aside className="asistencia-historial-sesiones">
            <div className="asistencia-historial-section-head">
              <div>
                <h3>Calendario</h3>
                <p>Selecciona un dia habil</p>
              </div>
              <span>{sesiones.length}</span>
            </div>

            <div className="asistencia-historial-calendar">
              <div className="asistencia-historial-calendar-head">
                <button type="button" onClick={() => cambiarMesCalendario(-1)} aria-label="Mes anterior">
                  <ChevronLeft size={16} />
                </button>
                <strong>{etiquetaMesCalendario}</strong>
                <button type="button" onClick={() => cambiarMesCalendario(1)} aria-label="Mes siguiente">
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="asistencia-historial-weekdays">
                {DIAS_HABILES.map((dia) => (
                  <span key={dia}>{dia}</span>
                ))}
              </div>

              <div className="asistencia-historial-calendar-grid">
                {diasCalendario.map((dia, index) => {
                  if (!dia) return <span className="asistencia-historial-calendar-gap" key={`gap-${index}`} />;
                  const sesionesDia = sesionesPorFecha.get(dia.fechaISO) || [];
                  const activo = fechaSeleccionada === dia.fechaISO;
                  return (
                    <button
                      type="button"
                      className={`asistencia-historial-day ${activo ? "active" : ""} ${sesionesDia.length ? "has-session" : ""}`}
                      key={dia.fechaISO}
                      onClick={() => seleccionarDiaCalendario(dia.fechaISO)}
                    >
                      <strong>{dia.dia}</strong>
                      {sesionesDia.length ? <span>{sesionesDia.length}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>

          </aside>

          <section className="asistencia-historial-detalle" aria-label="Asistencia del dia seleccionado">
            {sesionSeleccionada ? (
              <>
                <div className="asistencia-historial-section-head">
                  <div>
                    <h3>Asistencia de sesion #{obtenerIdSesion(sesionSeleccionada)}</h3>
                    <p>{formatearFecha(sesionSeleccionada.fecha_clase)} - {obtenerNombreCompetenciaSesion(sesionSeleccionada)}</p>
                  </div>
                </div>

                <div className="asistencia-historial-info-card">
                  <div>
                    <span>Fecha</span>
                    <strong>{formatearFecha(sesionSeleccionada.fecha_clase)}</strong>
                  </div>
                  <div>
                    <span>Estado de sesion</span>
                    <strong className={`asistencia-historial-session-status ${obtenerEstadoSesion(sesionSeleccionada).toLowerCase()}`}>
                      {etiquetaEstadoSesion(obtenerEstadoSesion(sesionSeleccionada))}
                    </strong>
                  </div>
                  <div>
                    <span>Ficha</span>
                    <strong>{obtenerCodigo(grupo)}</strong>
                  </div>
                  <div>
                    <span>Programa</span>
                    <strong>{obtenerPrograma(grupo)}</strong>
                  </div>
                  <div>
                    <span>Competencia</span>
                    <strong>{obtenerNombreCompetenciaSesion(sesionSeleccionada)}</strong>
                  </div>
                  <div>
                    <span>Trimestre</span>
                    <strong>{obtenerNumeroTrimestreSesion(sesionSeleccionada) || "Sin trimestre"}</strong>
                  </div>
                  <div>
                    <span>Horario</span>
                    <strong>{obtenerHorarioSesion(sesionSeleccionada)}</strong>
                  </div>
                </div>

                <div className="asistencia-historial-asistencia-grid">
                <article className="coordinador-card asistencia-list-card asistencia-historial-table-card">
                  <div className="coordinador-card-header">
                    <div>
                      <h2>Asistencia</h2>
                      <p>Aprendices registrados: {registros.length}</p>
                    </div>
                  </div>

                  <div className="asistencia-table-search asistencia-historial-search">
                    <Search size={16} />
                    <input
                      type="search"
                      value={busquedaAprendiz}
                      onChange={(evento) => setBusquedaAprendiz(evento.target.value)}
                      placeholder="Buscar aprendiz"
                      aria-label="Buscar aprendiz en historial de asistencia"
                    />
                    {busquedaAprendiz && (
                      <button type="button" onClick={() => setBusquedaAprendiz("")} aria-label="Limpiar busqueda de aprendices">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <TablaAsistencia
                    aprendices={registrosFiltrados}
                    cargando={cargandoAsistencias}
                    guardando={false}
                    modoManual={false}
                    soloLectura
                    onAbrirDetalle={() => {}}
                    onAbrirManual={() => {}}
                    onCambiarEstado={() => {}}
                  />
                </article>

                <article className="coordinador-card asistencia-summary-card asistencia-historial-summary-card">
                  <div className="coordinador-card-header">
                    <div>
                      <h2>Resumen de asistencia</h2>
                      <p>Aprendices registrados: {registros.length}</p>
                    </div>
                  </div>

                  <div className="asistencia-dashboard-summary">
                    <div className="asistencia-dashboard-top">
                      <div className="asistencia-donut" style={{ background: `conic-gradient(${segmentosDonut.join(", ") || "#e5e7eb 0% 100%"})` }}>
                        <div>
                          <strong>{porcentajePresentes}%</strong>
                          <span>Presentes</span>
                        </div>
                      </div>
                    </div>

                    {Object.entries(ESTADOS).map(([estado, info]) => {
                      const valor = resumen[estado] || 0;
                      const porcentaje = Math.round((valor / totalRegistros) * 100);
                      return (
                        <div className="asistencia-dashboard-row" key={estado}>
                          <div>
                            <span className="asistencia-dot" style={{ background: info.color }}></span>
                            <strong>{info.label}</strong>
                          </div>
                          <b>{valor}</b>
                          <small>{porcentaje}%</small>
                          <i>
                            <em style={{ width: `${porcentaje}%`, background: info.color }}></em>
                          </i>
                        </div>
                      );
                    })}
                  </div>
                </article>
                </div>
              </>
            ) : (
              <div className="asistencia-historial-placeholder">
                Selecciona un dia con secciones para ver la asistencia.
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
