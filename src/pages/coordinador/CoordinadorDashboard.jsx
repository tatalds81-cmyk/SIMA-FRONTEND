import React, { useState, useEffect } from "react";
import { Table } from "react-bootstrap";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useNavigate, useParams } from "react-router-dom";
import { getDashboardResumen, getAlerts, getGroups } from "../../services/simaApi";
import "./CoordinadorDashboard.css";

/* ── helpers ── */
const fmt = (dateStr) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

const getSeveridadStyle = (s) => {
  const map = {
    CRITICA:  { color: "#721c24", fontWeight: "bold" },
    GRAVE:    { color: "#dc3545", fontWeight: "bold" },
    MODERADA: { color: "#fd7e14", fontWeight: "bold" },
    LEVE:     { color: "#ffc107", fontWeight: "bold" },
  };
  return map[s?.toUpperCase()] || {};
};

const accentBorder = {
  green: "#39A900", blue: "#007bff",
  red: "#dc3545", yellow: "#ffc107", orange: "#fd7e14",
};

/* ── Trimester Timeline ── */
function TrimestreTimeline({ total, actual }) {
  const items = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="sima-trimestre-timeline">
      {items.map((t, idx) => (
        <React.Fragment key={t}>
          <div className="sima-trimestre-step">
            <div className={`sima-trimestre-dot ${t < actual ? "done" : t === actual ? "current" : "pending"}`}>
              {t < actual ? "✓" : t}
            </div>
            <span className="sima-trimestre-label">T{t}</span>
          </div>
          {idx < items.length - 1 && (
            <div className={`sima-trimestre-line ${t < actual ? "done" : ""}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Skeleton loader ── */
function Skeleton({ height = 20, width = "100%", style = {} }) {
  return (
    <div style={{
      height, width, borderRadius: 6, background: "linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", ...style
    }} />
  );
}

/* ═══════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════ */
export default function CoordinadorDashboard() {
  const navigate = useNavigate();
  const { codigo } = useParams();

  /* ── State API ── */
  const [resumen, setResumen]   = useState(null);
  const [grupo,   setGrupo]     = useState(null);
  const [alertas, setAlertas]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  /* ── Filtros UI ── */
  const [filtroAprendices,  setFiltroAprendices]  = useState("activos");
  const [filtroAsistencia,  setFiltroAsistencia]  = useState("mes");

  /* ── Fetch inicial ── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getDashboardResumen(),
      // Traemos la lista completa y buscamos por numero_ficha
      // (el parámetro :codigo de la URL es numero_ficha, NO el id interno de BD)
      codigo ? getGroups() : Promise.resolve(null),
      getAlerts(),
    ])
      .then(([resumenData, gruposData, alertasData]) => {
        if (cancelled) return;
        setResumen(resumenData?.data || null);

        // Buscar el grupo cuyo numero_ficha coincida con el código de la URL
        if (codigo && gruposData) {
          const lista =
            gruposData?.data?.grupos ||
            gruposData?.data ||
            gruposData?.results ||
            [];
          const encontrado = Array.isArray(lista)
            ? lista.find((g) => String(g.numero_ficha) === String(codigo))
            : null;
          setGrupo(encontrado || null);
        }

        // Filtrar alertas activas
        const todasAlertas = alertasData?.data || [];
        const activas = Array.isArray(todasAlertas)
          ? todasAlertas.filter((a) => a.estado === "ACTIVA")
          : [];
        setAlertas(activas);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [codigo]);

  /* ── KPI cards derivadas de la API ── */
  const kpiCards = resumen
    ? [
        { title: "Aprendices activos",  value: resumen.kpis?.total_aprendices_activos  ?? "—", tag: "Este trimestre",  accent: "green"  },
        { title: "Alertas activas",     value: resumen.kpis?.total_alertas_activas     ?? "—", tag: "Sin resolver",    accent: "red"    },
        { title: "Observaciones",       value: resumen.kpis?.total_observaciones_abiertas ?? "—", tag: "Abiertas",    accent: "yellow" },
        { title: "Inasistencias",       value: resumen.kpis?.total_inasistencias_validas  ?? "—", tag: "Registradas", accent: "orange" },
      ]
    : [];

  /* ── Datos del grupo seleccionado ── */
  const ficha = grupo
    ? {
        codigo:        grupo.numero_ficha   || codigo,
        programa:      grupo.programa_formacion?.nombre_programa || "—",
        nivel:         grupo.programa_formacion?.nivel           || "—",
        area:          grupo.area?.nombre_area                   || "—",
        jornada:       grupo.jornada        || "—",
        instructor:    grupo.instructor_lider
                         ? `${grupo.instructor_lider.persona?.nombres || ""} ${grupo.instructor_lider.persona?.apellidos || ""}`.trim()
                         : "Sin asignar",
        estado:        grupo.estado         || "ACTIVO",
        fechaInicio:   grupo.fecha_inicio   || null,
        trimestres:    grupo.trimestres     || 0,
        trimestreActual: grupo.trimestre_actual || 1,
        id:            grupo.id_grupo,
      }
    : null;

  const fichaBadge =
    ficha?.estado === "CERRADO"    ? "sima-bg-desactiva" :
    ficha?.estado === "SUSPENDIDO" ? "sima-bg-espera"    : "sima-bg-activa";

  /* ── Alertas: construir datos para la gráfica ── */
  const alertasPorSeveridad = ["LEVE", "MODERADA", "GRAVE", "CRITICA"].map((sev) => ({
    name: sev.charAt(0) + sev.slice(1).toLowerCase(),
    cantidad: alertas.filter((a) => a.severidad === sev).length,
    fill: accentBorder[sev === "LEVE" ? "yellow" : sev === "MODERADA" ? "orange" : sev === "GRAVE" ? "red" : "red"],
  }));

  /* ── Render de carga ── */
  if (loading) {
    return (
      <div className="sima-content-wrapper">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Skeleton height={40} width="40%" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} height={100} />)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Skeleton height={350} /><Skeleton height={350} />
          </div>
        </div>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    );
  }

  /* ── Render de error ── */
  if (error) {
    return (
      <div className="sima-content-wrapper" style={{ padding: 40 }}>
        <div style={{ background: "#fce4e4", color: "#d11a2a", padding: "20px 24px", borderRadius: 10, marginBottom: 20 }}>
          ⚠️ Error al cargar datos: {error}
        </div>
        <button className="sima-btn-outline" onClick={() => navigate("/fichas")}>← Volver a mis grupos</button>
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div className="sima-content-wrapper">

        {/* ── Botón volver ── */}
        <button className="sima-btn-back" onClick={() => navigate("/fichas")}>
          ← Volver a mis grupos
        </button>

        {/* ── Encabezado ── */}
        <div className="sima-page-header">
          <div>
            <h1 className="sima-page-title">
              {ficha ? ficha.programa : "Panel del Coordinador"}
            </h1>
            <p className="sima-page-subtitle">
              {ficha
                ? `Ficha ${ficha.codigo} · ${ficha.jornada} · Instructor: ${ficha.instructor}`
                : "Vista general de todos los grupos"}
            </p>
          </div>
          {ficha && (
            <span className={`sima-badge-table ${fichaBadge}`} style={{ fontSize: 13 }}>
              {ficha.estado}
            </span>
          )}
        </div>

        {/* ── KPI Cards ── */}
        {kpiCards.length > 0 && (
          <div className="sima-dashboard-kpis">
            {kpiCards.map((card, i) => (
              <div key={i} className="sima-kpi-card"
                style={{ borderLeftColor: accentBorder[card.accent] || "#39A900" }}>
                <span className="sima-kpi-title">{card.title}</span>
                <h3 className="sima-kpi-value">{card.value}</h3>
                <span className="sima-kpi-tag">{card.tag}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Gráfica de Alertas por Severidad ── */}
        <div className="sima-dashboard-charts">
          <div className="sima-chart-container">
            <div className="sima-chart-header">
              <h3 className="sima-card-title">Alertas por Severidad</h3>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertasPorSeveridad} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {alertasPorSeveridad.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline del grupo si aplica */}
          {ficha && (
            <div className="sima-chart-container" style={{ height: "auto" }}>
              <div className="sima-chart-header">
                <h3 className="sima-card-title">Línea de Tiempo — Ficha {ficha.codigo}</h3>
                <span className={`sima-badge-table ${fichaBadge}`}>{ficha.estado}</span>
              </div>
              <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px" }}>
                {ficha.programa} · {ficha.jornada}
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 8 }}>
                Progreso por Trimestres
              </p>
              <TrimestreTimeline total={ficha.trimestres || 6} actual={ficha.trimestreActual || 1} />
              <div className="sima-ficha-info-list" style={{ marginTop: 20 }}>
                <div className="sima-ficha-info-row">
                  <span className="sima-ficha-info-label">📅 Inicio de ficha</span>
                  <span className="sima-ficha-info-value">{fmt(ficha.fechaInicio?.slice(0, 10))}</span>
                </div>
                <div className="sima-ficha-info-row">
                  <span className="sima-ficha-info-label">📚 Trimestre actual</span>
                  <span className="sima-ficha-info-value">
                    <span className="sima-info-pill sima-info-pill-green">
                      T{ficha.trimestreActual} de {ficha.trimestres}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Info del grupo seleccionado ── */}
        {ficha && (
          <div className="sima-ficha-card">
            <div className="sima-ficha-card-header">
              <div>
                <h2 className="sima-ficha-title">Ficha {ficha.codigo} — {ficha.programa}</h2>
                <p className="sima-ficha-subtitle">
                  {ficha.nivel} · Área: {ficha.area} · Jornada: {ficha.jornada}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span className={`sima-badge-table ${fichaBadge}`}>{ficha.estado}</span>
                <button
                  className="sima-btn-outline"
                  onClick={() => navigate(`/coordinador/ficha/${codigo}/detalle`)}
                  style={{ fontSize: 12, padding: "6px 14px" }}>
                  Ver detalle completo →
                </button>
              </div>
            </div>
            <div className="sima-ficha-info-list">
              <div className="sima-ficha-info-row">
                <span className="sima-ficha-info-label">Instructor líder</span>
                <span className="sima-ficha-info-value">{ficha.instructor}</span>
              </div>
              <div className="sima-ficha-info-row">
                <span className="sima-ficha-info-label">Área de formación</span>
                <span className="sima-ficha-info-value">{ficha.area}</span>
              </div>
              <div className="sima-ficha-info-row">
                <span className="sima-ficha-info-label">Duración total</span>
                <span className="sima-ficha-info-value">{ficha.trimestres} trimestres</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Tabla de Alertas Recientes ── */}
        <div className="sima-dashboard-tables">
          <div className="sima-table-card">
            <h3 className="sima-card-title mb-3">
              Alertas Activas {alertas.length > 0 && <span style={{ color: "#dc3545" }}>({alertas.length})</span>}
            </h3>
            {alertas.length === 0 ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: "24px 0" }}>
                ✅ No hay alertas activas en este momento.
              </p>
            ) : (
              <Table className="sima-table" responsive>
                <thead>
                  <tr>
                    <th>Aprendiz</th>
                    <th>Descripción</th>
                    <th>Severidad</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.slice(0, 10).map((a, i) => (
                    <tr key={i}>
                      <td>
                        <strong>
                          {a.aprendiz?.persona?.nombres || "—"} {a.aprendiz?.persona?.apellidos || ""}
                        </strong>
                        <br />
                        <small className="text-muted">
                          {a.aprendiz?.grupo?.numero_ficha
                            ? `Ficha ${a.aprendiz.grupo.numero_ficha}`
                            : ""}
                        </small>
                      </td>
                      <td>{a.descripcion || "—"}</td>
                      <td><span style={getSeveridadStyle(a.severidad)}>{a.severidad}</span></td>
                      <td><small>{a.tipo_alerta || a.origen || "—"}</small></td>
                      <td>
                        <small className="text-muted">
                          {a.fecha_alerta ? new Date(a.fecha_alerta).toLocaleDateString("es-CO") : "—"}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
