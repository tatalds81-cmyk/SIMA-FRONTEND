import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
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

const resumenCards = [
  {
    titulo: "Mis grupos asignados",
    valor: 3,
    detalle: "Grupos activos",
    meta: null,
    icono: UsersRound,
    tono: "amarillo"
  },
  {
    titulo: "Asistencia promedio (este mes)",
    valor: "86.5%",
    detalle: "Del mes actual",
    meta: "+ 5.2% vs mes anterior",
    icono: CheckCircle2,
    tono: "verde"
  },
  {
    titulo: "Aprendices en riesgo",
    valor: 6,
    detalle: "Con alertas activas",
    meta: null,
    icono: AlertTriangle,
    tono: "rojo",
    alerta: true
  },
  {
    titulo: "Observaciones registradas",
    valor: 18,
    detalle: "Este mes",
    meta: "+ 12% vs mes anterior",
    icono: PencilLine,
    tono: "cyan"
  }
];

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

const barras = [
  { grupo: "2456", programa: "ADSO", porcentaje: 90.2, color: "verde" },
  { grupo: "2457", programa: "Sistemas", porcentaje: 85.1, color: "azul" },
  { grupo: "2458", programa: "Medios Digitales", porcentaje: 78.3, color: "morado" }
];

const riesgos = [
  { nombre: "Inasistencia recurrente", valor: 3, porcentaje: 50, color: "#ef4444" },
  { nombre: "Observaciones negativas", valor: 2, porcentaje: 33, color: "#f59e0b" },
  { nombre: "Bajo rendimiento", valor: 1, porcentaje: 17, color: "#facc15" }
];

const grupos = [
  { grupo: "2456", programa: "Analisis y Desarrollo de Software", jornada: "Manana", rol: "Lider" },
  { grupo: "2457", programa: "Sistemas Integrados de Gestion", jornada: "Tarde", rol: "Instructor" },
  { grupo: "2458", programa: "Diseno para Medios Digitales", jornada: "Noche", rol: "Instructor" }
];

const agenda = [
  {
    dia: "Lunes 17",
    sesiones: ["Grupo 2456 07:00 - 11:00 a.m.", "Grupo 2457 02:00 - 06:00 p.m."],
    estado: "sin"
  },
  {
    dia: "Martes 18",
    sesiones: ["Grupo 2456 07:00 - 11:00 a.m.", "Grupo 2458 06:00 - 10:00 p.m."],
    estado: "activa"
  },
  {
    dia: "Miercoles 19",
    sesiones: ["Grupo 2456 07:00 - 11:00 a.m.", "Grupo 2457 02:00 - 06:00 p.m."],
    estado: "sin"
  },
  {
    dia: "Jueves 20",
    sesiones: ["Grupo 2456 07:00 - 11:00 a.m.", "Grupo 2458 06:00 - 10:00 p.m."],
    estado: "sin"
  },
  {
    dia: "Viernes 21",
    sesiones: ["Grupo 2457 02:00 - 06:00 p.m."],
    estado: "proxima"
  }
];

export default function PanelInstructor() {
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
      <section className="dashboard-welcome">
        <h1>Bienvenido instructor</h1>
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
                  <span>{item.porcentaje}%</span>
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
                background:
                  "conic-gradient(#ef4444 0% 50%, #f59e0b 50% 83%, #facc15 83% 100%)"
              }}
            >
              <div className="instructor-risk-donut-inner">
                <strong>6</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="instructor-risk-list">
              {riesgos.map((item) => (
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
              {grupos.map((item) => (
                <tr key={item.grupo}>
                  <td>{item.grupo}</td>
                  <td>{item.programa}</td>
                  <td>{item.jornada}</td>
                  <td>{item.rol}</td>
                  <td>
                    <div className="instructor-table-actions">
                      <button type="button" aria-label="Ver grupo">
                        <Eye size={15} />
                      </button>
                      <button type="button" aria-label="Ver observaciones">
                        <MessageSquareWarning size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="coordinador-link-btn" type="button">
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
            {agenda.map((item) => (
              <div
                key={item.dia}
                className={`instructor-calendar-day ${item.estado === "activa" ? "activa" : ""}`}
              >
                <div className="instructor-calendar-head">
                  <strong>{item.dia}</strong>
                  {item.estado === "activa" ? <span>Hoy</span> : null}
                </div>
                {item.sesiones.map((sesion) => (
                  <p key={sesion}>{sesion}</p>
                ))}
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
            <div><UsersRound size={18} /><span>96 aprendices activos</span></div>
            <div><UserRoundCheck size={18} /><span>89 con asistencia al dia</span></div>
            <div><TrendingUp size={18} /><span>3 grupos por encima de la meta</span></div>
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
