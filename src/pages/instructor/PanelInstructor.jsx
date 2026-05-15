import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquareWarning,
  PencilLine,
  TrendingUp,
  UserRoundCheck,
  UsersRound
} from "lucide-react";
import "../coordinador/coordinador.css";
import "./instructor.css";

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
  ASISTENCIAL: "Asistencial",
  OBSERVACIONES_RECURRENTES: "Observaciones recurrentes",
  CONVIVENCIAL: "Convivencial"
};

const inicioMesActual = () => {
  const fecha = new Date();
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString().slice(0, 10);
};

const finMesActual = () => {
  const fecha = new Date();
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toISOString().slice(0, 10);
};

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

const obtenerPrograma = (grupo) => grupo.programa_formacion?.nombre_programa || grupo.programa || "Sin programa";
const obtenerCodigo = (grupo) => grupo.numero_ficha || grupo.numero_grupo || grupo.codigo || "Sin ficha";
const obtenerRol = (grupo) => {
  const idInstructor = localStorage.getItem("id_instructor");
  if (idInstructor && String(grupo.id_instructor_lider) === String(idInstructor)) return "Lider";
  return grupo.id_instructor_lider ? "Asignado" : "Instructor";
};

export default function PanelInstructor() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [totalAprendices, setTotalAprendices] = useState(0);
  const [totalObservacionesMes, setTotalObservacionesMes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarDashboard() {
      try {
        setCargando(true);
        const gruposData = await fetchJson("/api/groups?limit=100");
        const gruposInstructor = extraerGrupos(gruposData);

        const [alertasResultado, aprendicesResultados, observacionesResultados] = await Promise.all([
          fetchJson("/api/alerts").catch(() => []),
          Promise.allSettled(
            gruposInstructor.map((grupo) =>
              fetchJson(`/api/apprentices/grupo/${grupo.id_grupo}?limit=1`)
            )
          ),
          Promise.allSettled(
            gruposInstructor.map((grupo) =>
              fetchJson(
                `/api/observations/group/${grupo.id_grupo}?limit=1&fecha_desde=${inicioMesActual()}&fecha_hasta=${finMesActual()}`
              )
            )
          )
        ]);

        if (!activo) return;

        setGrupos(gruposInstructor);
        setAlertas(Array.isArray(alertasResultado) ? alertasResultado : []);
        setTotalAprendices(
          aprendicesResultados.reduce((total, result) => (
            result.status === "fulfilled" ? total + (Number(result.value?.total) || 0) : total
          ), 0)
        );
        setTotalObservacionesMes(
          observacionesResultados.reduce((total, result) => (
            result.status === "fulfilled" ? total + (Number(result.value?.total) || 0) : total
          ), 0)
        );
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
  }, []);

  const alertasActivas = useMemo(
    () => alertas.filter((alerta) => ["ACTIVA", "EN_SEGUIMIENTO"].includes(alerta.estado)),
    [alertas]
  );

  const riesgos = useMemo(() => {
    const conteo = alertasActivas.reduce((acc, alerta) => {
      const tipo = alerta.tipo_alerta || "CONVIVENCIAL";
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
    grupos.slice(0, 3).map((grupo, index) => ({
      grupo: obtenerCodigo(grupo),
      programa: obtenerPrograma(grupo),
      porcentaje: 0,
      color: coloresBarras[index % coloresBarras.length]
    }))
  ), [grupos]);

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
      valor: "N/D",
      detalle: "Pendiente endpoint de asistencias",
      meta: "No disponible con las rutas actuales",
      icono: CheckCircle2,
      tono: "verde"
    },
    {
      titulo: "Aprendices en riesgo",
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
      detalle: "Este mes",
      meta: "Calculado por grupo asignado",
      icono: PencilLine,
      tono: "cyan"
    }
  ]), [alertasActivas.length, grupos.length, totalObservacionesMes]);

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

  if (cargando) {
    return (
      <div className="coordinador-panel instructor-panel-v2">
        <div className="grupos-alert info">Cargando dashboard del instructor...</div>
      </div>
    );
  }

  return (
    <div className="coordinador-panel instructor-panel-v2">
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
            <button className="coordinador-select-btn" type="button">Este mes</button>
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
                  <span>Sin endpoint</span>
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
            <h2>Aprendices en riesgo por causa</h2>
            <button className="coordinador-select-btn" type="button">Este mes</button>
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
            <h2>Calendario de sesiones</h2>
            <div className="instructor-calendar-controls">
              <button type="button" className="instructor-icon-btn"><ChevronLeft size={16} /></button>
              <button type="button" className="instructor-icon-btn"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="instructor-calendar-grid">
            {["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"].map((dia) => (
              <div key={dia} className="instructor-calendar-day">
                <div className="instructor-calendar-head">
                  <strong>{dia}</strong>
                </div>
                <p>Pendiente endpoint de sesiones/horarios</p>
              </div>
            ))}
          </div>

          <div className="instructor-calendar-legend">
            <span><i className="activa"></i> Sesion activa</span>
            <span><i className="proxima"></i> Proxima sesion</span>
            <span><i className="sin"></i> Sin sesion</span>
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
            Novedades del sistema
          </h2>
          <div className="coordinador-novedades-list">
            <div className="coordinador-novedad-item">
              <PencilLine size={22} />
              <div>
                <strong>Nueva funcionalidad</strong>
                <p>Ahora puedes registrar observaciones directamente desde el detalle del grupo.</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
