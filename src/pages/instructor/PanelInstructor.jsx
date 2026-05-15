import { useEffect, useMemo, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { obtenerAlertas } from "../../services/alertasService";
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

const coloresSeveridad = {
  CRITICA: "#b91c1c",
  GRAVE: "#ef4444",
  MODERADA: "#f59e0b",
  LEVE: "#facc15"
};

const severidades = ["CRITICA", "GRAVE", "MODERADA", "LEVE"];

function estadoAlerta(alerta) {
  return String(alerta.estado || "").toUpperCase();
}

function tipoAlerta(alerta) {
  return String(alerta.tipoAlerta || alerta.tipo_alerta || "ALERTA").replaceAll("_", " ");
}

export default function PanelInstructor() {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarAlertasInstructor() {
      setCargando(true);
      const { data, error: errorServicio } = await obtenerAlertas({ limite: 1000 });

      if (!activo) return;

      if (errorServicio) {
        setAlertas([]);
        setError(errorServicio);
      } else {
        setAlertas(data?.data || []);
        setError("");
      }

      setCargando(false);
    }

    cargarAlertasInstructor();
    return () => {
      activo = false;
    };
  }, []);

  const alertasActivas = useMemo(
    () => alertas.filter((alerta) => estadoAlerta(alerta) !== "CERRADA"),
    [alertas]
  );

  const aprendicesEnRiesgo = useMemo(() => {
    const ids = new Set();
    alertasActivas.forEach((alerta) => {
      ids.add(alerta.id_aprendiz || alerta.aprendizDocumento || alerta.aprendizNombre || alerta.id);
    });
    return ids.size;
  }, [alertasActivas]);

  const riesgos = useMemo(() => {
    const total = Math.max(alertasActivas.length, 1);
    return severidades.map((severidad) => {
      const valor = alertasActivas.filter((alerta) => String(alerta.severidad || "").toUpperCase() === severidad).length;
      return {
        nombre: severidad,
        valor,
        porcentaje: Math.round((valor / total) * 100),
        color: coloresSeveridad[severidad]
      };
    }).filter((item) => item.valor > 0);
  }, [alertasActivas]);

  const gruposConAlertas = useMemo(() => {
    const gruposMap = new Map();
    alertasActivas.forEach((alerta) => {
      const grupo = alerta.grupoCodigo || alerta.idGrupo || "Sin grupo";
      const actual = gruposMap.get(grupo) || {
        grupo,
        programa: tipoAlerta(alerta),
        jornada: alerta.severidad || "Sin severidad",
        rol: 0,
        idGrupo: alerta.idGrupo
      };
      actual.rol += 1;
      gruposMap.set(grupo, actual);
    });
    return Array.from(gruposMap.values()).slice(0, 5);
  }, [alertasActivas]);

  const alertasRecientes = useMemo(() => alertasActivas.slice(0, 4), [alertasActivas]);

  const resumenCards = useMemo(() => ([
    {
      titulo: "Alertas activas",
      valor: alertasActivas.length,
      detalle: "Consumidas desde /api/alerts",
      meta: null,
      icono: AlertTriangle,
      tono: "rojo",
      alerta: true
    },
    {
      titulo: "Aprendices en riesgo",
      valor: aprendicesEnRiesgo,
      detalle: "Con alertas abiertas",
      meta: null,
      icono: UsersRound,
      tono: "amarillo",
      alerta: aprendicesEnRiesgo > 0
    },
    {
      titulo: "En seguimiento",
      valor: alertas.filter((alerta) => estadoAlerta(alerta) === "EN_SEGUIMIENTO").length,
      detalle: "Alertas en proceso",
      meta: null,
      icono: CheckCircle2,
      tono: "verde"
    },
    {
      titulo: "Graves o criticas",
      valor: alertasActivas.filter((alerta) => ["GRAVE", "CRITICA"].includes(String(alerta.severidad || "").toUpperCase())).length,
      detalle: "Prioridad alta",
      meta: null,
      icono: PencilLine,
      tono: "cyan"
    }
  ]), [alertas, alertasActivas, aprendicesEnRiesgo]);

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

  return (
    <div className="coordinador-panel instructor-panel-v2">
      {cargando && <div className="grupos-alert info">Cargando alertas del instructor...</div>}
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
            <h2>Alertas activas por grupo</h2>
            <button className="coordinador-select-btn" type="button">/api/alerts</button>
          </div>

          <div className="instructor-group-chart">
            <div className="instructor-chart-scale">
              <span>{Math.max(...gruposConAlertas.map((item) => item.rol), 1)}</span>
              <span></span>
              <span></span>
              <span></span>
              <span>0%</span>
            </div>

            <div className="instructor-bars-wrap">
              {(gruposConAlertas.length ? gruposConAlertas : [{ grupo: "Sin alertas", programa: "Sin datos", rol: 0 }]).map((item) => (
                <div className="instructor-group-bar-item" key={item.grupo}>
                  <span>{item.rol}</span>
                  <div className="instructor-group-bar-track">
                    <span
                      className="instructor-group-bar-fill azul"
                      style={{ height: `${calcularProgreso(item.rol, Math.max(...gruposConAlertas.map((grupo) => grupo.rol), 1))}%` }}
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
            <h2>Alertas por severidad</h2>
            <button className="coordinador-select-btn" type="button">Activas</button>
          </div>

          <div className="instructor-risk-layout">
            <div
              className="instructor-risk-donut"
              style={{
                background: riesgos.length
                  ? `conic-gradient(${riesgos.map((item, index) => {
                      const inicio = riesgos.slice(0, index).reduce((sum, actual) => sum + actual.porcentaje, 0);
                      return `${item.color} ${inicio}% ${inicio + item.porcentaje}%`;
                    }).join(", ")})`
                  : "conic-gradient(#e5e7eb 0% 100%)"
              }}
            >
              <div className="instructor-risk-donut-inner">
                <strong>{alertasActivas.length}</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="instructor-risk-list">
              {(riesgos.length ? riesgos : [{ nombre: "Sin alertas", valor: 0, porcentaje: 0, color: "#94a3b8" }]).map((item) => (
                <div className="instructor-risk-item" key={item.nombre}>
                  <span className="dot" style={{ background: item.color }}></span>
                  <p>{item.nombre}</p>
                  <strong>{item.valor} ({item.porcentaje}%)</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="instructor-bottom-grid">
        <article className="coordinador-card instructor-table-card">
          <div className="coordinador-card-header">
            <h2>Grupos con alertas</h2>
          </div>

          <table className="instructor-groups-table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Tipo principal</th>
                <th>Severidad</th>
                <th>Alertas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(gruposConAlertas.length ? gruposConAlertas : [{ grupo: "Sin alertas", programa: "Sin datos", jornada: "-", rol: 0 }]).map((item) => (
                <tr key={item.grupo}>
                  <td>{item.grupo}</td>
                  <td>{item.programa}</td>
                  <td>{item.jornada}</td>
                  <td>{item.rol}</td>
                  <td>
                    <div className="instructor-table-actions">
                      <button type="button" aria-label="Ver grupo" onClick={() => navigate("/instructor/grupos")}>
                        <Eye size={15} />
                      </button>
                      <button type="button" aria-label="Ver alertas" onClick={() => navigate("/alertas/consultar")}>
                        <MessageSquareWarning size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="coordinador-link-btn" type="button" onClick={() => navigate("/alertas/consultar")}>
            Ver todas las alertas <ArrowRight size={17} />
          </button>
        </article>

        <article className="coordinador-card instructor-calendar-card">
          <div className="coordinador-card-header">
            <h2>Alertas recientes</h2>
            <div className="instructor-calendar-controls">
              <button type="button" className="instructor-icon-btn"><ChevronLeft size={16} /></button>
              <button type="button" className="instructor-icon-btn"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="instructor-calendar-grid">
            {(alertasRecientes.length ? alertasRecientes : [{ id: "sin-alertas", aprendizNombre: "Sin alertas recientes", descripcion: "No hay alertas pendientes.", estado: "sin" }]).map((item) => (
              <div
                key={item.id || item.id_alerta}
                className={`instructor-calendar-day ${estadoAlerta(item) === "ACTIVA" ? "activa" : ""}`}
              >
                <div className="instructor-calendar-head">
                  <strong>{item.aprendizNombre || "Aprendiz"}</strong>
                  {item.severidad ? <span>{item.severidad}</span> : null}
                </div>
                <p>{item.grupoCodigo || "Sin grupo"}</p>
                <p>{tipoAlerta(item)}</p>
              </div>
            ))}
          </div>

          <div className="instructor-calendar-legend">
            <span><i className="activa"></i> Activa</span>
            <span><i className="proxima"></i> En seguimiento</span>
            <span><i className="sin"></i> Cerrada</span>
          </div>
        </article>
      </section>

      <section className="instructor-mini-grid">
        <article className="coordinador-card instructor-mini-card">
          <h2>Indicadores rapidos</h2>
          <div className="instructor-mini-list">
            <div><UsersRound size={18} /><span>{aprendicesEnRiesgo} aprendices con alerta</span></div>
            <div><UserRoundCheck size={18} /><span>{alertas.filter((alerta) => estadoAlerta(alerta) === "CERRADA").length} alertas cerradas</span></div>
            <div><TrendingUp size={18} /><span>{alertasActivas.length} alertas activas</span></div>
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
                <strong>Seguimiento de alertas</strong>
                <p>El panel esta consumiendo el endpoint real de alertas.</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
