import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileText,
  Layers,
  Megaphone,
  Settings,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  UsersRound
} from "lucide-react";
import "./coordinador.css";

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

export default function PanelCoordinador() {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarResumen() {
      try {
        const token = localStorage.getItem("access") || localStorage.getItem("token");
        const res = await fetch("/api/dashboard/coordinador/resumen", {
          headers: {
            "Content-Type": "application/json",
            ...(token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || data?.error || "No fue posible cargar el resumen del coordinador");
        }

        if (activo) {
          setResumen(data?.data || null);
          setError("");
        }
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        if (activo) {
          setResumen(null);
          setError(err.message || "No fue posible cargar el dashboard");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarResumen();
    return () => {
      activo = false;
    };
  }, []);

  const kpis = resumen?.kpis || {};
  const areas = resumen?.areas || [];
  const programas = resumen?.programas || [];

  const resumenCards = useMemo(() => {
    const cards = [
      {
        titulo: "Aprendices activos",
        valor: kpis.total_aprendices_activos ?? 0,
        detalle: "Aprendices vinculados a grupos activos",
        icono: UsersRound,
        tono: "amarillo"
      },
      {
        titulo: "Programas activos",
        valor: kpis.total_programas ?? 0,
        detalle: "Programas con grupos en tus areas",
        icono: BookOpen,
        tono: "azul"
      },
      {
        titulo: "Grupos activos",
        valor: kpis.total_grupos_activos ?? 0,
        detalle: "Fichas disponibles para seguimiento",
        icono: Layers,
        tono: "verde"
      },
      {
        titulo: "Observaciones abiertas",
        valor: kpis.total_observaciones_abiertas ?? 0,
        detalle: "Casos que requieren seguimiento",
        icono: ClipboardCheck,
        tono: "cyan"
      },
      {
        titulo: "Alertas activas",
        valor: kpis.total_alertas_activas ?? 0,
        detalle: "Alertas asociadas a aprendices activos",
        icono: AlertTriangle,
        tono: "rojo",
        alerta: true
      }
    ];
    const maximo = Math.max(...cards.map((card) => obtenerNumero(card.valor)), 1);

    return cards.map((card) => ({
      ...card,
      progreso: calcularProgreso(card.valor, maximo)
    }));
  }, [kpis]);

  const areasResumen = useMemo(() => {
    if (!areas.length) return [];
    return areas.slice(0, 4).map((area) => ({
      icono: Building2,
      titulo: area.nombre_area,
      subtitulo: `${area.total_grupos || 0} grupos activos`,
      fecha: `Area #${area.id_area}`
    }));
  }, [areas]);

  const estadoAcademico = useMemo(() => ([
    { etiqueta: "Areas asignadas", valor: kpis.total_areas ?? 0 },
    { etiqueta: "Programas activos", valor: kpis.total_programas ?? 0 },
    { etiqueta: "Alertas activas", valor: kpis.total_alertas_activas ?? 0 },
    { etiqueta: "Inasistencias validas", valor: kpis.total_inasistencias_validas ?? 0 }
  ]), [kpis]);

  const novedades = useMemo(() => {
    if (!programas.length) {
      return [
        { icono: Megaphone, titulo: "Sin programas cargados", texto: "Aun no hay programas activos asociados a tus areas." }
      ];
    }

    return programas.slice(0, 3).map((programa) => ({
      icono: FileText,
      titulo: programa.nombre_programa,
      texto: `${programa.nombre_area} - ${programa.total_grupos || 0} grupos activos.`
    }));
  }, [programas]);

  const asistenciaJornada = [
    { nombre: "Manana", valor: 0, color: "#20b9d7" },
    { nombre: "Tarde", valor: 0, color: "#052d4f" },
    { nombre: "Noche", valor: 0, color: "#71ad00" }
  ];

  const areasListadas = areas.slice(0, 2);
  const alertasRecientes = [
    `${kpis.total_alertas_activas ?? 0} alertas activas en tus areas`,
    `${kpis.total_observaciones_abiertas ?? 0} observaciones abiertas por revisar`
  ];

  if (cargando) {
    return (
      <div className="coordinador-panel">
        <div className="grupos-alert info">Cargando resumen del coordinador...</div>
      </div>
    );
  }

  return (
    <div className="coordinador-panel">
      {error && <div className="grupos-alert danger">{error}</div>}

      <section className="coordinador-kpi-grid" aria-label="Resumen general">
        {resumenCards.map((card) => {
          const Icon = card.icono;

          return (
            <article className={`coordinador-kpi-card tono-${card.tono}`} key={card.titulo}>
              <div className="coordinador-kpi-top">
                <span className="coordinador-kpi-icon">
                  <Icon size={29} strokeWidth={2.1} />
                </span>
                <span
                  className="coordinador-kpi-ring"
                  style={{ "--kpi-progress": `${card.progreso}%` }}
                  role="img"
                  aria-label={`${card.progreso}% del total mas alto del resumen`}
                ></span>
              </div>
              <h2>{card.titulo}</h2>
              <strong>{card.valor}</strong>
              <p className={card.alerta ? "negativo" : ""}>{card.alerta ? "Atencion requerida" : "Dato actualizado"}</p>
              <small>{card.detalle}</small>
            </article>
          );
        })}
      </section>

      <section className="coordinador-main-grid">
        <article className="coordinador-card coordinador-asistencia-card">
          <div className="coordinador-card-header">
            <div>
              <h2>Resumen institucional</h2>
              <strong>{kpis.total_areas ?? 0} areas</strong>
              <p>{kpis.total_grupos_activos ?? 0} grupos activos y {kpis.total_aprendices_activos ?? 0} aprendices vinculados.</p>
            </div>
            <button className="coordinador-select-btn" type="button">Datos reales</button>
          </div>

          <div className="coordinador-line-chart" aria-label="Resumen por areas y programas">
            <div className="chart-scale">
              <span>{kpis.total_aprendices_activos ?? 0}</span>
              <span>{kpis.total_grupos_activos ?? 0}</span>
              <span>{kpis.total_programas ?? 0}</span>
              <span>{kpis.total_areas ?? 0}</span>
              <span>0</span>
            </div>
            <svg viewBox="0 0 680 230" role="img">
              <defs>
                <linearGradient id="asistenciaFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2ca8df" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2ca8df" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="chart-area" d="M25 160 C120 120 180 115 255 130 C320 142 380 110 455 98 C530 85 605 92 655 78 L655 205 L25 205 Z" />
              <path className="chart-line" d="M25 160 C120 120 180 115 255 130 C320 142 380 110 455 98 C530 85 605 92 655 78" />
              {[25, 160, 290, 410, 540, 655].map((x, i) => (
                <circle key={x} cx={x} cy={[160, 122, 132, 110, 94, 78][i]} r="5" />
              ))}
            </svg>
            <div className="chart-months">
              <span>Areas</span>
              <span>Programas</span>
              <span>Grupos</span>
              <span>Alertas</span>
              <span>Observ.</span>
              <span>Aprendices</span>
            </div>
          </div>
        </article>

        <article className="coordinador-card coordinador-jornada-card">
          <div className="coordinador-card-header compacto">
            <div>
              <h2>Estado operativo</h2>
              <strong>{kpis.total_inasistencias_validas ?? 0}</strong>
              <p>Inasistencias validas registradas</p>
            </div>
            <button className="coordinador-select-btn" type="button">Pendientes</button>
          </div>

          <div className="coordinador-bars" aria-label="Resumen operativo por jornada">
            {asistenciaJornada.map((item) => (
              <div className="coordinador-bar-item" key={item.nombre}>
                <div className="coordinador-bar-track">
                  <span
                    className="coordinador-bar-fill"
                    style={{ height: `${item.valor}%`, background: item.color }}
                  ></span>
                </div>
                <strong>{item.nombre}</strong>
                <small>Sin endpoint</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="coordinador-secondary-grid">
        <article className="coordinador-card coordinador-registros">
          <h2>Areas asignadas</h2>
          <div className="coordinador-lista-registros">
            {areasResumen.length > 0 ? areasResumen.map((registro) => {
              const Icon = registro.icono;
              return (
                <div className="coordinador-registro-item" key={registro.titulo}>
                  <span><Icon size={20} /></span>
                  <div>
                    <strong>{registro.titulo}</strong>
                    <small>{registro.subtitulo}</small>
                  </div>
                  <time>{registro.fecha}</time>
                </div>
              );
            }) : (
              <div className="coordinador-registro-item">
                <span><Building2 size={20} /></span>
                <div>
                  <strong>Sin areas activas</strong>
                  <small>No hay asignaciones de coordinacion disponibles.</small>
                </div>
                <time>-</time>
              </div>
            )}
          </div>
          <button className="coordinador-link-btn" type="button">
            Ver resumen <ArrowRight size={17} />
          </button>
        </article>

        <article className="coordinador-card coordinador-estado">
          <h2>Estado academico</h2>
          {estadoAcademico.map((item) => (
            <div className="coordinador-estado-row" key={item.etiqueta}>
              <span>{item.etiqueta}</span>
              <strong>{item.valor}</strong>
            </div>
          ))}
          <div className="coordinador-meta">
            <div>
              <span>Seguimiento general</span>
              <strong>{kpis.total_alertas_activas ?? 0} alertas</strong>
            </div>
            <span className="coordinador-meta-track">
              <span></span>
            </span>
          </div>
        </article>

        <article className="coordinador-novedades">
          <h2>
            <Megaphone size={21} />
            Programas activos
          </h2>
          <div className="coordinador-novedades-list">
            {novedades.map((item) => {
              const Icon = item.icono;
              return (
                <div className="coordinador-novedad-item" key={item.titulo}>
                  <Icon size={25} />
                  <div>
                    <strong>{item.titulo}</strong>
                    <p>{item.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="coordinador-novedades-btn" type="button">
            Ver detalle <ArrowRight size={18} />
          </button>
        </article>
      </section>

      <section className="coordinador-bottom-grid">
        <article className="coordinador-card coordinador-observatorio">
          <h2>Observatorio del aprendiz</h2>
          <div className="coordinador-observatorio-grid">
            <div>
              <h3>Areas priorizadas</h3>
              <ul>
                {areasListadas.length > 0 ? areasListadas.map((area) => (
                  <li key={area.id_area}>{area.nombre_area} con {area.total_grupos || 0} grupos activos</li>
                )) : <li>No hay areas para mostrar.</li>}
              </ul>
              <button type="button">Ver mas</button>
            </div>
            <div>
              <h3>Alertas recientes</h3>
              <ul className="alertas">
                {alertasRecientes.map((texto) => (
                  <li key={texto}>{texto}</li>
                ))}
              </ul>
              <button type="button">Ver mas</button>
            </div>
          </div>
        </article>

        <article className="coordinador-card coordinador-acciones">
          <h2>Acciones rapidas</h2>
          <button type="button" onClick={() => navigate("/usuarios")}>
            <UserPlus size={20} />
            Crear usuario
          </button>
          <button type="button" onClick={() => navigate("/fichas")}>
            <UsersRound size={20} />
            Crear grupo
          </button>
          <button type="button" onClick={() => navigate("/fichas")}>
            <ShieldAlert size={20} />
            Revisar fichas
          </button>
        </article>
      </section>
    </div>
  );
}
