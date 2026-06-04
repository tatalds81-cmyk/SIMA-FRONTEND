import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquareWarning,
  PencilLine,
  TrendingUp,
  UserRoundCheck,
  UsersRound
} from "lucide-react";
import "../coordinador/coordinador.css";
import "./instructor.css";
import SesionActivaModal from "./asistencia/components/SesionActivaModal";

const obtenerNumero = (valor) => {
  if (typeof valor === "number") return valor;
  if (typeof valor === "string") return Number.parseFloat(valor.replace("%", "")) || 0;
  return 0;
};

const calcularProgreso = (valor, maximo) => {
  const numero = obtenerNumero(valor);
  if (!numero || !maximo) return 0;
  return Math.min(100, Math.max(0, Math.round((numero / maximo) * 100)));
};

const coloresBarras = ["verde", "azul", "morado"];
const coloresRiesgo = ["#ef4444", "#f59e0b", "#facc15"];

const nombresRiesgo = {
  INASISTENCIA: "Inasistencia",
  ASISTENCIAL: "Asistencial",
  OBSERVACIONES_RECURRENTES: "Observaciones recurrentes",
  CONVIVENCIAL: "Convivencial",
  MANUAL: "Manual"
};

const inicioMesActual = (fechaBase = new Date()) => {
  const fecha = new Date(fechaBase);
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString().slice(0, 10);
};

const finMesActual = (fechaBase = new Date()) => {
  const fecha = new Date(fechaBase);
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toISOString().slice(0, 10);
};

const inicioSemanaActual = (fechaBase = new Date()) => {
  const fecha = new Date(fechaBase);
  const dia = fecha.getDay() || 7;
  fecha.setDate(fecha.getDate() - dia + 1);
  return fecha.toISOString().slice(0, 10);
};

const finSemanaActual = (fechaBase = new Date()) => {
  const fecha = new Date(`${inicioSemanaActual(fechaBase)}T12:00:00`);
  fecha.setDate(fecha.getDate() + 4);
  return fecha.toISOString().slice(0, 10);
};

const formatearFechaCorta = (fechaISO) => {
  if (!fechaISO) return "";
  const fecha = new Date(`${fechaISO}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
};

const normalizarHora = (valor) => String(valor || "").slice(0, 5) || "--:--";

const getHeaders = () => {
  const token = localStorage.getItem("access") || localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token && token !== "undefined") headers.Authorization = `Bearer ${token}`;
  return headers;
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || "No fue posible cargar la informacion");
  return data?.data ?? data;
}

const extraerGrupos = (data) => {
  const grupos = data?.grupos || data?.fichas || data?.results || data;
  return Array.isArray(grupos) ? grupos : [];
};

const extraerAlertas = (data) => {
  const alertas = data?.alerts || data?.alertas || data?.data || data?.results || data;
  return Array.isArray(alertas) ? alertas : [];
};

const extraerSesiones = (data) => {
  const sesiones = data?.sesiones || data?.data?.sesiones || data?.results || data;
  return Array.isArray(sesiones) ? sesiones : [];
};

const extraerAsistencias = (data) => {
  const asistencias = data?.asistencias || data?.data?.asistencias || data?.results || data;
  return Array.isArray(asistencias) ? asistencias : [];
};

const extraerObservaciones = (data) => {
  const observaciones = data?.observaciones || data?.data?.observaciones || data?.results || data;
  return Array.isArray(observaciones) ? observaciones : [];
};

const obtenerPrograma = (grupo) => grupo.programa_formacion?.nombre_programa || grupo.programa || "Sin programa";
const obtenerCodigo = (grupo) => grupo.numero_ficha || grupo.numero_grupo || grupo.codigo || "Sin ficha";
const obtenerIdSesion = (sesion) => sesion.id_sesion_formacion || sesion.id;
const obtenerIdGrupoSesion = (sesion) => sesion.id_grupo || sesion.grupo?.id_grupo;
const obtenerFichaSesion = (sesion) => sesion.grupo?.numero_ficha || sesion.numero_ficha || sesion.id_grupo || "Sin ficha";
const obtenerCompetenciaSesion = (sesion) =>
  sesion.competencia?.nombre_competencia ||
  sesion.competencia?.nombre ||
  sesion.nombre_competencia ||
  sesion.bloque_jornada?.nombre_bloque ||
  "Sesion de formacion";
const obtenerAmbienteSesion = (sesion) =>
  sesion.ambiente?.nombre_ambiente ||
  sesion.ambiente?.nombre ||
  sesion.nombre_ambiente ||
  "Ambiente asignado";
const obtenerPersona = (item) => item?.aprendiz?.usuario?.persona || item?.usuario?.persona || item?.persona || {};
const obtenerNombreAprendiz = (item) => {
  const persona = obtenerPersona(item);
  const nombre = `${persona.nombres || ""} ${persona.apellidos || ""}`.trim();
  return nombre || item?.aprendizNombre || item?.nombre || "Aprendiz";
};
const obtenerFicha = (item) => item?.grupo?.numero_ficha || item?.grupoCodigo || item?.id_grupo || "Sin ficha";
const obtenerRol = (grupo) => {
  const idInstructor = localStorage.getItem("id_instructor");
  if (idInstructor && String(grupo.id_instructor_lider) === String(idInstructor)) return "Lider";
  return grupo.id_instructor_lider ? "Asignado" : "Instructor";
};

const combinarGrupos = (...listas) => {
  const grupos = new Map();
  listas.flat().forEach((grupo) => {
    if (!grupo?.id_grupo) return;
    grupos.set(String(grupo.id_grupo), grupo);
  });
  return [...grupos.values()];
};

const estadoCuentaComoAsistencia = (estado) => (
  ["PRESENTE", "TARDE", "JUSTIFICADO", "JUSTIFICADA"].includes(String(estado || "").toUpperCase())
);

const claseEstadoSesion = (estado) => {
  const valor = String(estado || "").toUpperCase();
  if (valor === "ABIERTA") return "activa";
  if (valor === "PROGRAMADA") return "proxima";
  if (valor === "CERRADA") return "cerrada";
  if (valor === "CANCELADA") return "cancelada";
  return "sin";
};

export default function PanelInstructor() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [observacionesRecientes, setObservacionesRecientes] = useState([]);
  const [sesionesSemana, setSesionesSemana] = useState([]);
  const [asistenciaPromedioMes, setAsistenciaPromedioMes] = useState(null);
  const [asistenciaPorGrupo, setAsistenciaPorGrupo] = useState({});
  const [totalAprendices, setTotalAprendices] = useState(0);
  const [totalObservacionesMes, setTotalObservacionesMes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [semanaReferencia] = useState(() => new Date().toISOString().slice(0, 10));

  const inicioSemana = useMemo(() => inicioSemanaActual(semanaReferencia), [semanaReferencia]);
  const finSemana = useMemo(() => finSemanaActual(semanaReferencia), [semanaReferencia]);

  useEffect(() => {
    let activo = true;

    async function cargarDashboard() {
      try {
        setCargando(true);
        const [
          resumen,
          alertasResultado,
          sesionesMesResultado,
          sesionesSemanaResultado
        ] = await Promise.all([
          fetchJson("/api/dashboard/instructor/resumen"),
          fetchJson("/api/alerts?estado=ABIERTA&limit=50").catch(() => ({ alertas: [] })),
          fetchJson(`/api/educational-sessions?fecha_desde=${inicioMesActual()}&fecha_hasta=${finMesActual()}&solo_responsable=true&limit=100`).catch(() => ({ sesiones: [] })),
          fetchJson(`/api/educational-sessions?fecha_desde=${inicioSemana}&fecha_hasta=${finSemana}&solo_responsable=true&limit=100`).catch(() => ({ sesiones: [] }))
        ]);

        if (!activo) return;

        const gruposInstructor = combinarGrupos(
          extraerGrupos(resumen?.grupos_liderados),
          extraerGrupos(resumen?.grupos_asignados)
        );
        const sesionesMes = extraerSesiones(sesionesMesResultado);
        const sesionesSemanaData = extraerSesiones(sesionesSemanaResultado);
        const [asistenciasPorSesion, observacionesPorGrupo] = await Promise.all([
          Promise.allSettled(
            sesionesMes.map((sesion) =>
              fetchJson(`/api/educational-sessions/${obtenerIdSesion(sesion)}/attendances`)
                .then((data) => ({ sesion, asistencias: extraerAsistencias(data) }))
            )
          ),
          Promise.allSettled(
            gruposInstructor.map((grupo) =>
              fetchJson(`/api/observations/group/${grupo.id_grupo}?estado=ABIERTA&limit=5`)
                .then((data) => extraerObservaciones(data))
            )
          )
        ]);

        if (!activo) return;

        const acumuladoAsistencia = asistenciasPorSesion.reduce((acc, result) => {
          if (result.status !== "fulfilled") return acc;
          const { sesion, asistencias } = result.value;
          const idGrupo = obtenerIdGrupoSesion(sesion);
          asistencias.forEach((asistencia) => {
            const estado = asistencia.estado_ep05 || asistencia.estado_asistencia || asistencia.estado;
            acc.total += 1;
            if (estadoCuentaComoAsistencia(estado)) acc.asisten += 1;

            if (idGrupo) {
              const clave = String(idGrupo);
              acc.porGrupo[clave] ||= { total: 0, asisten: 0 };
              acc.porGrupo[clave].total += 1;
              if (estadoCuentaComoAsistencia(estado)) acc.porGrupo[clave].asisten += 1;
            }
          });
          return acc;
        }, { total: 0, asisten: 0, porGrupo: {} });

        setGrupos(gruposInstructor);
        setAlertas(extraerAlertas(alertasResultado));
        setObservacionesRecientes(
          observacionesPorGrupo
            .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
            .sort((a, b) => new Date(b.fecha_observacion || 0) - new Date(a.fecha_observacion || 0))
            .slice(0, 5)
        );
        setSesionesSemana(sesionesSemanaData);
        setTotalAprendices(Number(resumen?.kpis?.total_aprendices_activos) || 0);
        setTotalObservacionesMes(Number(resumen?.kpis?.total_observaciones_abiertas) || 0);
        setAsistenciaPromedioMes(
          acumuladoAsistencia.total
            ? Math.round((acumuladoAsistencia.asisten / acumuladoAsistencia.total) * 100)
            : null
        );
        setAsistenciaPorGrupo(acumuladoAsistencia.porGrupo);
        setError("");
      } catch (err) {
        console.error("Error cargando dashboard del instructor:", err);
        if (activo) setError(err.message || "No fue posible cargar el dashboard del instructor");
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarDashboard();
    return () => {
      activo = false;
    };
  }, [finSemana, inicioSemana]);

  const alertasActivas = useMemo(
    () => alertas.filter((alerta) => String(alerta.estado || "").toUpperCase() === "ABIERTA"),
    [alertas]
  );

  const riesgos = useMemo(() => {
    const conteo = alertasActivas.reduce((acc, alerta) => {
      const tipo = alerta.tipo_alerta || alerta.tipoAlerta || "MANUAL";
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
    const total = Math.max(alertasActivas.length, 1);

    return Object.entries(conteo).map(([tipo, valor], index) => ({
      nombre: nombresRiesgo[tipo] || tipo,
      valor,
      porcentaje: Math.round((valor / total) * 100),
      color: coloresRiesgo[index % coloresRiesgo.length]
    }));
  }, [alertasActivas]);

  const barras = useMemo(() => (
    grupos.slice(0, 3).map((grupo, index) => {
      const asistenciaGrupo = asistenciaPorGrupo[String(grupo.id_grupo)] || { total: 0, asisten: 0 };
      const porcentaje = asistenciaGrupo.total
        ? Math.round((asistenciaGrupo.asisten / asistenciaGrupo.total) * 100)
        : 0;

      return {
        grupo: obtenerCodigo(grupo),
        programa: obtenerPrograma(grupo),
        porcentaje,
        tieneDatos: asistenciaGrupo.total > 0,
        color: coloresBarras[index % coloresBarras.length]
      };
    })
  ), [asistenciaPorGrupo, grupos]);

  const resumenCards = useMemo(() => ([
    {
      titulo: "Mis grupos asignados",
      valor: grupos.length,
      detalle: "Grupos visibles para el instructor",
      meta: null,
      icono: UsersRound,
      tono: "amarillo"
    },
    {
      titulo: "Asistencia promedio (este mes)",
      valor: asistenciaPromedioMes === null ? "N/D" : `${asistenciaPromedioMes}%`,
      detalle: "Calculada desde sesiones del mes",
      meta: asistenciaPromedioMes === null ? "Sin sesiones con asistencia este mes" : "Sesiones del mes",
      icono: CheckCircle2,
      tono: "verde"
    },
    {
      titulo: "Alertas activas",
      valor: alertasActivas.length,
      detalle: "Con alertas activas o en seguimiento",
      meta: null,
      icono: AlertTriangle,
      tono: "rojo",
      alerta: alertasActivas.length > 0
    },
    {
      titulo: "Observaciones registradas",
      valor: totalObservacionesMes,
      detalle: "Abiertas",
      meta: "Resumen del backend",
      icono: PencilLine,
      tono: "cyan"
    }
  ]), [alertasActivas.length, asistenciaPromedioMes, grupos.length, totalObservacionesMes]);

  const maximoResumen = Math.max(
    ...resumenCards
      .filter((card) => !card.valor?.toString().includes("%"))
      .map((card) => obtenerNumero(card.valor)),
    1
  );
  const cardsConProgreso = resumenCards.map((card) => ({
    ...card,
    progreso: calcularProgreso(card.valor, card.valor?.toString().includes("%") ? 100 : maximoResumen)
  }));

  const calendarioSemana = useMemo(() => {
    const dias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
    const inicio = new Date(`${inicioSemana}T12:00:00`);

    return dias.map((dia, index) => {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + index);
      const fechaISO = fecha.toISOString().slice(0, 10);
      const sesionesDia = sesionesSemana
        .filter((sesion) => sesion.fecha_clase === fechaISO)
        .sort((a, b) =>
          String(a.hora_inicio_programada || "").localeCompare(String(b.hora_inicio_programada || ""))
        );

      return {
        dia,
        fecha: fechaISO,
        sesiones: sesionesDia
      };
    });
  }, [inicioSemana, sesionesSemana]);

  const totalSesionesSemana = useMemo(
    () => calendarioSemana.reduce((total, item) => total + item.sesiones.length, 0),
    [calendarioSemana]
  );

  if (cargando) {
    return (
      <div className="coordinador-panel instructor-panel-v2">
        <SesionActivaModal />
        <div className="grupos-alert info">Cargando dashboard del instructor...</div>
      </div>
    );
  }

  return (
    <div className="coordinador-panel instructor-panel-v2">
      <SesionActivaModal />

      {error && <div className="grupos-alert danger">{error}</div>}

      <section className="dashboard-welcome">
        <section className="dashboard-role-welcome">
          <h1>Bienvenido instructor</h1>
        </section>
      </section>

      <section className="instructor-kpi-grid" aria-label="Resumen del instructor">
        {cardsConProgreso.map((card) => {
          const Icon = card.icono;

          return (
            <article className={`coordinador-kpi-card instructor-kpi-card tono-${card.tono}`} key={card.titulo}>
              <div className="coordinador-kpi-top">
                <span className="coordinador-kpi-icon">
                  <Icon size={29} strokeWidth={2.1} />
                </span>
                <span
                  className="coordinador-kpi-ring"
                  style={{ "--kpi-progress": `${card.progreso}%` }}
                  role="img"
                  aria-label={`${card.progreso}% de avance`}
                ></span>
              </div>
              <h2>{card.titulo}</h2>
              <strong>{card.valor}</strong>
              <p className={card.alerta ? "negativo" : ""}>{card.alerta ? "Atencion requerida" : "Dato actualizado"}</p>
              <small>{card.meta || card.detalle}</small>
            </article>
          );
        })}
      </section>

      <section className="instructor-main-grid">
        <article className="coordinador-card instructor-chart-card">
          <div className="coordinador-card-header">
            <h2>Asistencia promedio por grupo (este mes)</h2>
          </div>

          <div className="instructor-group-chart">
            <div className="instructor-chart-scale">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            <div className="instructor-bars-wrap">
              {barras.map((item) => (
                <div className="instructor-group-bar-item" key={item.grupo}>
                  <span>{item.tieneDatos ? `${item.porcentaje}%` : "Sin datos"}</span>
                  <div className="instructor-group-bar-track">
                    <span
                      className={`instructor-group-bar-fill ${item.color}`}
                      style={{ height: `${item.porcentaje}%` }}
                    ></span>
                  </div>
                  <strong>Grupo {item.grupo}</strong>
                  <small>{item.programa}</small>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="coordinador-card instructor-risk-card">
          <div className="coordinador-card-header">
            <h2>Alertas activas por causa</h2>
          </div>

          <div className="instructor-risk-layout">
            <div
              className="instructor-risk-donut"
              style={{
                background: riesgos.length
                  ? `conic-gradient(${riesgos
                    .reduce((segmentos, item) => {
                      const inicio = segmentos.total;
                      const fin = inicio + item.porcentaje;
                      segmentos.partes.push(`${item.color} ${inicio}% ${fin}%`);
                      segmentos.total = fin;
                      return segmentos;
                    }, { total: 0, partes: [] }).partes.join(", ")})`
                  : "#e5e7eb"
              }}
            >
              <div className="instructor-risk-donut-inner">
                <strong>{alertasActivas.length}</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="instructor-risk-list">
              {riesgos.length ? riesgos.map((item) => (
                <div className="instructor-risk-item" key={item.nombre}>
                  <span className="dot" style={{ background: item.color }}></span>
                  <p>{item.nombre}</p>
                  <strong>{item.valor} ({item.porcentaje}%)</strong>
                </div>
              )) : (
                <div className="instructor-risk-item">
                  <span className="dot" style={{ background: "#94a3b8" }}></span>
                  <p>Sin alertas activas</p>
                  <strong>0</strong>
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="instructor-bottom-grid">
        <article className="coordinador-card instructor-table-card">
          <div className="coordinador-card-header">
            <h2>Mis grupos asignados</h2>
          </div>

          <table className="instructor-groups-table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Programa</th>
                <th>Jornada</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grupos.slice(0, 5).map((item) => (
                <tr key={item.id_grupo || obtenerCodigo(item)}>
                  <td>{obtenerCodigo(item)}</td>
                  <td>{obtenerPrograma(item)}</td>
                  <td>{item.jornada || "Sin jornada"}</td>
                  <td>{obtenerRol(item)}</td>
                  <td>
                    <div className="instructor-table-actions">
                      <button type="button" aria-label="Ver grupo" onClick={() => navigate(`/fichas/${item.id_grupo}`)}>
                        <Eye size={15} />
                      </button>
                      <button type="button" aria-label="Ver observaciones" onClick={() => navigate("/instructor/observaciones")}>
                        <MessageSquareWarning size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!grupos.length && (
                <tr>
                  <td colSpan="5">No tienes grupos asignados.</td>
                </tr>
              )}
            </tbody>
          </table>

          <button className="coordinador-link-btn" type="button" onClick={() => navigate("/instructor/grupos")}>
            Ver todos mis grupos <ArrowRight size={17} />
          </button>
        </article>

        <article className="coordinador-card instructor-calendar-card">
          <div className="coordinador-card-header">
            <div>
              <h2>Horario semanal</h2>
              <p>{formatearFechaCorta(inicioSemana)} - {formatearFechaCorta(finSemana)} · {totalSesionesSemana} sesiones</p>
            </div>
          </div>

          <div className="instructor-calendar-grid">
            {calendarioSemana.map((item) => (
              <div key={item.dia} className={`instructor-calendar-day ${item.sesiones.some((sesion) => claseEstadoSesion(sesion.estado) === "activa") ? "activa" : ""}`}>
                <div className="instructor-calendar-head">
                  <strong>{item.dia}</strong>
                  <span>{formatearFechaCorta(item.fecha)}</span>
                </div>
                {item.sesiones.length ? item.sesiones.map((sesion) => (
                  <div
                    className={`instructor-calendar-session ${claseEstadoSesion(sesion.estado)}`}
                    key={obtenerIdSesion(sesion)}
                  >
                    <span className="instructor-calendar-time">
                      <Clock size={13} />
                      {normalizarHora(sesion.hora_inicio_programada)} - {normalizarHora(sesion.hora_fin_programada)}
                    </span>
                    <strong>{obtenerCompetenciaSesion(sesion)}</strong>
                    <small>Ficha {obtenerFichaSesion(sesion)} · {obtenerAmbienteSesion(sesion)}</small>
                    <em>{sesion.estado || "PROGRAMADA"}</em>
                  </div>
                )) : (
                  <div className="instructor-calendar-empty">
                    <CalendarClock size={18} />
                    <p>Sin sesiones programadas</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="instructor-calendar-legend">
            <span><i className="activa"></i> Sesion activa</span>
            <span><i className="proxima"></i> Proxima sesion</span>
            <span><i className="cerrada"></i> Cerrada</span>
            <span><i className="cancelada"></i> Cancelada</span>
          </div>
        </article>
      </section>

      <section className="instructor-mini-grid">
        <article className="coordinador-card instructor-mini-card">
          <h2>Indicadores rapidos</h2>
          <div className="instructor-mini-list">
            <div><UsersRound size={18} /><span>{totalAprendices} aprendices activos</span></div>
            <div><UserRoundCheck size={18} /><span>{Math.max(0, totalAprendices - alertasActivas.length)} sin alertas activas</span></div>
            <div><TrendingUp size={18} /><span>{grupos.length} grupos asignados</span></div>
          </div>
        </article>

        <article className="coordinador-novedades instructor-mini-news">
          <h2>
            <PencilLine size={20} />
            Alertas y observaciones
          </h2>
          <div className="coordinador-novedades-list">
            {alertasActivas.slice(0, 3).map((alerta) => (
              <div className="coordinador-novedad-item" key={`alerta-${alerta.id_alerta || alerta.id}`}>
                <AlertTriangle size={22} />
                <div>
                  <strong>{nombresRiesgo[alerta.tipo_alerta] || alerta.tipo_alerta || "Alerta abierta"}</strong>
                  <p>
                    {obtenerNombreAprendiz(alerta)} · Ficha {obtenerFicha(alerta)} · {alerta.severidad || "Sin severidad"}
                  </p>
                </div>
              </div>
            ))}

            {observacionesRecientes.slice(0, 3).map((observacion) => (
              <div className="coordinador-novedad-item" key={`observacion-${observacion.id_observacion || observacion.id}`}>
                <PencilLine size={22} />
                <div>
                  <strong>{observacion.tipo_observacion || "Observacion abierta"}</strong>
                  <p>
                    {obtenerNombreAprendiz(observacion)} · Ficha {obtenerFicha(observacion)} · {observacion.severidad || "Sin severidad"}
                  </p>
                </div>
              </div>
            ))}

            {!alertasActivas.length && !observacionesRecientes.length && (
              <div className="coordinador-novedad-item">
                <CheckCircle2 size={22} />
                <div>
                  <strong>Sin pendientes abiertos</strong>
                  <p>No hay alertas ni observaciones abiertas para tus grupos.</p>
                </div>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
