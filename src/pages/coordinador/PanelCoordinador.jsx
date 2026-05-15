import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Layers,
  Megaphone,
  UsersRound
} from "lucide-react";
import { obtenerAlertas } from "../../services/alertasService";
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
  const [resumen, setResumen] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorAlertas, setErrorAlertas] = useState("");
  const [filtroResumenActivo, setFiltroResumenActivo] = useState("asistencia");
  const [filtroOperativoActivo, setFiltroOperativoActivo] = useState("inasistencias");

  useEffect(() => {
    let activo = true;

    async function cargarPanel() {
      try {
        const token = localStorage.getItem("access") || localStorage.getItem("token");
        const [res, alertasResp] = await Promise.all([
          fetch("/api/dashboard/coordinador/resumen", {
            headers: {
              "Content-Type": "application/json",
              ...(token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {})
            }
          }),
          obtenerAlertas({ estado: "ACTIVA", limite: 1000 })
        ]);

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || data?.error || "No fue posible cargar el resumen del coordinador");
        }

        if (activo) {
          setResumen(data?.data || null);
          setError("");
          if (alertasResp.error) {
            setAlertas([]);
            setErrorAlertas(alertasResp.error);
          } else {
            setAlertas(alertasResp.data?.data || []);
            setErrorAlertas("");
          }
        }
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        if (activo) {
          setResumen(null);
          setAlertas([]);
          setError(err.message || "No fue posible cargar el dashboard");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarPanel();
    return () => {
      activo = false;
    };
  }, []);

  const kpis = useMemo(() => resumen?.kpis || {}, [resumen]);
  const totalAlertasActivas = alertas.length || kpis.total_alertas_activas || 0;
  const alertasRecientes = useMemo(() => alertas.slice(0, 4), [alertas]);
  const resumenAlertas = useMemo(() => {
    const base = { LEVE: 0, MODERADA: 0, GRAVE: 0, CRITICA: 0 };
    alertas.forEach((alerta) => {
      const severidad = String(alerta.severidad || "").toUpperCase();
      if (base[severidad] !== undefined) base[severidad] += 1;
    });
    return base;
  }, [alertas]);

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
        valor: totalAlertasActivas,
        detalle: "Consumidas desde /api/alerts",
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
  }, [kpis, totalAlertasActivas]);

  const estadoAcademico = useMemo(() => ([
    { etiqueta: "Areas asignadas", valor: kpis.total_areas ?? 0 },
    { etiqueta: "Programas activos", valor: kpis.total_programas ?? 0 },
    { etiqueta: "Alertas activas", valor: totalAlertasActivas },
    { etiqueta: "Inasistencias validas", valor: kpis.total_inasistencias_validas ?? 0 }
  ]), [kpis, totalAlertasActivas]);

  const asistenciaJornada = [
    { nombre: "Manana", valor: 0, color: "#20b9d7" },
    { nombre: "Tarde", valor: 0, color: "#052d4f" },
    { nombre: "Noche", valor: 0, color: "#71ad00" }
  ];

  const filtrosResumen = [
    { id: "asistencia", label: "Asistencia y observaciones" },
    { id: "tiempo", label: "Tiempo" },
    { id: "programas", label: "Programas" },
    { id: "inasistencias", label: "Inasistencias" }
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
      {errorAlertas && <div className="grupos-alert danger">{errorAlertas}</div>}

      <section className="dashboard-welcome">
        <section className="dashboard-role-welcome">
          <h1>Bienvenido coordinador</h1>
        </section>
      </section>

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
            <div className="coordinador-filter-actions" aria-label="Filtros de resumen institucional">
              {filtrosResumen.map((filtro) => {
                const activo = filtroResumenActivo === filtro.id;
                const Icon = activo ? ChevronDown : ChevronRight;

                return (
                  <button
                    className={`coordinador-select-btn ${activo ? "active" : ""}`}
                    type="button"
                    key={filtro.id}
                    onClick={() => setFiltroResumenActivo(filtro.id)}
                  >
                    {filtro.label}
                    <Icon size={15} />
                  </button>
                );
              })}
            </div>
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
            <button
              className={`coordinador-select-btn ${filtroOperativoActivo === "inasistencias" ? "active" : ""}`}
              type="button"
              onClick={() => setFiltroOperativoActivo("inasistencias")}
            >
              Inasistencias
              {filtroOperativoActivo === "inasistencias" ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
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
              <strong>{totalAlertasActivas} alertas</strong>
            </div>
            <span className="coordinador-meta-track">
              <span></span>
            </span>
          </div>
        </article>

        <article className="coordinador-novedades">
          <h2>
            <AlertTriangle size={21} />
            Alertas activas
          </h2>
          <div className="coordinador-novedades-list">
            {alertasRecientes.length ? alertasRecientes.map((alerta) => (
                <div className="coordinador-novedad-item" key={alerta.id || alerta.id_alerta}>
                  <AlertTriangle size={25} />
                  <div>
                    <strong>{alerta.aprendizNombre || "Aprendiz sin nombre"}</strong>
                    <p>{alerta.grupoCodigo || "Sin grupo"} - {alerta.severidad || "Sin severidad"} - {alerta.tipoAlerta || alerta.tipo_alerta || "Alerta"}</p>
                  </div>
                </div>
              )) : (
                <div className="coordinador-novedad-item">
                  <Megaphone size={25} />
                  <div>
                    <strong>Sin alertas activas</strong>
                    <p>No hay alertas pendientes para seguimiento.</p>
                  </div>
                </div>
              )}
          </div>
          <div className="coordinador-estado-row">
            <span>Leves</span><strong>{resumenAlertas.LEVE}</strong>
          </div>
          <div className="coordinador-estado-row">
            <span>Moderadas</span><strong>{resumenAlertas.MODERADA}</strong>
          </div>
          <div className="coordinador-estado-row">
            <span>Graves/Criticas</span><strong>{resumenAlertas.GRAVE + resumenAlertas.CRITICA}</strong>
          </div>
          <button className="coordinador-novedades-btn" type="button" onClick={() => window.location.href = "/alertas/consultar"}>
            Ver alertas <ArrowRight size={18} />
          </button>
        </article>
      </section>
    </div>
  );
}
