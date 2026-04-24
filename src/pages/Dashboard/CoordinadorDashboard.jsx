import React, { useState } from "react";
import { Table } from "react-bootstrap";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { coordinatorDashboardData as DATA, fichaDestacada as FICHA } from "../../data/mockCoordinatorData";
import { useNavigate } from "react-router-dom";
import "./CoordinadorDashboard.css";

/* ── helpers ── */
const fmt = (dateStr) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

const getSeveridadStyle = (s) => {
  const map = {
    Critica:  { color: "#721c24", fontWeight: "bold" },
    Grave:    { color: "#dc3545", fontWeight: "bold" },
    Moderada: { color: "#fd7e14", fontWeight: "bold" },
    Leve:     { color: "#ffc107", fontWeight: "bold" },
  };
  return map[s] || {};
};

const accentBorder = {
  green: "#39A900", blue: "#007bff",
  red: "#dc3545",  yellow: "#ffc107", orange: "#fd7e14",
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

/* ═══════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════ */
export default function CoordinadorDashboard() {
  const navigate = useNavigate();

  /* Filtro de aprendices: "activos" | "inactivos" */
  const [filtroAprendices, setFiltroAprendices] = useState("activos");

  /* Filtro de asistencia: "dia" | "semana" | "mes" */
  const [filtroAsistencia, setFiltroAsistencia] = useState("mes");

  /* Datos según filtros */
  const apprenticeChartData =
    filtroAprendices === "activos"
      ? DATA.apprenticeStatus.activosChart
      : DATA.apprenticeStatus.inactivosChart;

  const asistenciaData = DATA.attendance[filtroAsistencia];

  /* Datos de alertas por severidad */
  const severidadAlertasData = [
    { name: "Leves",    cantidad: 6, fill: "#ffc107" },
    { name: "Moderadas",cantidad: 5, fill: "#fd7e14" },
    { name: "Graves",   cantidad: 3, fill: "#dc3545" },
    { name: "Críticas", cantidad: 1, fill: "#721c24" },
  ];

  /* Totales para la sección de aprendices */
  const totalActivos   = DATA.apprenticeStatus.activos.total;
  const totalInactivos = DATA.apprenticeStatus.inactivos.total;

  /* Badge de estado de la ficha */
  const fichaBadge =
    FICHA.status === "Cerrado"    ? "sima-bg-desactiva" :
    FICHA.status === "Suspendido" ? "sima-bg-espera"    : "sima-bg-activa";

  return (
    <>
      <div className="sima-content-wrapper">
        {/* ── Encabezado ── */}
        <div className="sima-page-header">
          <div>
            <h1 className="sima-page-title">{FICHA.programa}</h1>
            <p className="sima-page-subtitle">
              Ficha {FICHA.codigo} · {FICHA.jornada} · Instructor: {FICHA.instructorLider}
            </p>
          </div>
          <span className={`sima-badge-table ${fichaBadge}`} style={{ fontSize: 13 }}>{FICHA.status}</span>
        </div>

        {/* ── KPI Cards (se excluye "Grupos activos") ── */}
        <div className="sima-dashboard-kpis">
          {DATA.summaryCards
            .filter(card => card.title !== "Grupos activos")
            .map((card, i) => (
              <div key={i} className="sima-kpi-card"
                style={{ borderLeftColor: accentBorder[card.accent] || "#39A900" }}>
                <span className="sima-kpi-title">{card.title}</span>
                <h3 className="sima-kpi-value">{card.value}</h3>
                <span className="sima-kpi-tag">{card.tag}</span>
              </div>
            ))}
        </div>

        {/* ── Fila 1 de gráficas: Aprendices (filtro) + Alertas por Severidad ── */}
        <div className="sima-dashboard-charts">

          {/* Aprendices Activos / Inactivos */}
          <div className="sima-chart-container">
            <div className="sima-chart-header">
              <h3 className="sima-card-title">Estado de Aprendices</h3>
              <div className="sima-filter-tabs">
                <button
                  className={`sima-filter-tab ${filtroAprendices === "activos" ? "active" : ""}`}
                  onClick={() => setFiltroAprendices("activos")}>
                  Activos ({totalActivos})
                </button>
                <button
                  className={`sima-filter-tab ${filtroAprendices === "inactivos" ? "active" : ""}`}
                  onClick={() => setFiltroAprendices("inactivos")}>
                  Inactivos ({totalInactivos})
                </button>
              </div>
            </div>

            {/* Mini stats */}
            <div className="sima-apprentice-status" style={{ marginBottom: 16 }}>
              {(filtroAprendices === "activos"
                ? [
                    { label: "En formación", count: DATA.apprenticeStatus.activos.enFormacion, color: "#35c759" },
                    { label: "Condicionado",  count: DATA.apprenticeStatus.activos.condicionado, color: "#ffb020" },
                  ]
                : [
                    { label: "Aplazado",    count: DATA.apprenticeStatus.inactivos.aplazados,   color: "#4c8dff" },
                    { label: "Cancelado",   count: DATA.apprenticeStatus.inactivos.cancelados,  color: "#ff5f57" },
                    { label: "Certificado", count: DATA.apprenticeStatus.inactivos.certificados,color: "#8b5cf6" },
                  ]
              ).map((row) => {
                const total = filtroAprendices === "activos" ? totalActivos : totalInactivos;
                const pct = total > 0 ? (row.count / total) * 100 : 0;
                return (
                  <div className="sima-status-bar-row" key={row.label}>
                    <span className="sima-status-bar-label">{row.label}</span>
                    <div className="sima-status-bar-track">
                      <div className="sima-status-bar-fill"
                        style={{ width: `${pct}%`, background: row.color }} />
                    </div>
                    <span className="sima-status-bar-count">{row.count}</span>
                  </div>
                );
              })}
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={apprenticeChartData} cx="50%" cy="50%"
                  innerRadius={50} outerRadius={88} paddingAngle={4} dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {apprenticeChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Alertas por Severidad — sin cambios */}
          <div className="sima-chart-container">
            <div className="sima-chart-header">
              <h3 className="sima-card-title">Alertas por Severidad</h3>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severidadAlertasData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {severidadAlertasData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Fila 2: Asistencia (filtro Día/Semana/Mes) + Timeline de Ficha ── */}
        <div className="sima-dashboard-charts">

          {/* Asistencia con filtro temporal — gráfica de BARRAS */}
          <div className="sima-chart-container">
            <div className="sima-chart-header">
              <h3 className="sima-card-title">Asistencia — {asistenciaData.label}</h3>
              <div className="sima-filter-tabs">
                {[{ key: "dia", label: "Hoy" }, { key: "semana", label: "Semana" }, { key: "mes", label: "Mes" }].map(opt => (
                  <button key={opt.key}
                    className={`sima-filter-tab ${filtroAsistencia === opt.key ? "active" : ""}`}
                    onClick={() => setFiltroAsistencia(opt.key)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={asistenciaData.items.map(e => ({ name: e.label, cantidad: e.value, fill: e.color }))}
                margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={(val) => [`${val}%`, "Asistencia"]} />
                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} label={{ position: "top", fontSize: 12, formatter: (v) => `${v}%` }}>
                  {asistenciaData.items.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline de Ficha (reemplaza "Grupos por Programa") */}
          <div className="sima-chart-container" style={{ height: "auto" }}>
            <div className="sima-chart-header">
              <h3 className="sima-card-title">Línea de Tiempo — Ficha {FICHA.codigo}</h3>
              <span className={`sima-badge-table ${fichaBadge}`}>{FICHA.status}</span>
            </div>

            <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px" }}>
              {FICHA.programa} · {FICHA.jornada} · Instructor: {FICHA.instructorLider}
            </p>

            {/* Progreso de trimestres */}
            <p style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 8 }}>
              Progreso por Trimestres
            </p>
            <TrimestreTimeline total={FICHA.trimestres} actual={FICHA.trimestreActual} />

            {/* Fechas clave */}
            <div className="sima-ficha-info-list" style={{ marginTop: 20 }}>
              <div className="sima-ficha-info-row">
                <span className="sima-ficha-info-label">📅 Inicio de ficha</span>
                <span className="sima-ficha-info-value">{fmt(FICHA.fechaInicio)}</span>
              </div>
              <div className="sima-ficha-info-row">
                <span className="sima-ficha-info-label">🏁 Fin de ficha</span>
                <span className="sima-ficha-info-value">{fmt(FICHA.fechaFin)}</span>
              </div>
              <div className="sima-ficha-info-row">
                <span className="sima-ficha-info-label">🏭 Inicio etapa productiva</span>
                <span className="sima-ficha-info-value">{fmt(FICHA.fechaInicioEtapaProductiva)}</span>
              </div>
              <div className="sima-ficha-info-row">
                <span className="sima-ficha-info-label">📚 Trimestre actual</span>
                <span className="sima-ficha-info-value">
                  <span className="sima-info-pill sima-info-pill-green">
                    T{FICHA.trimestreActual} de {FICHA.trimestres}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tarjeta de Ficha Destacada (reemplaza "Novedades por Grupo") ── */}
        <div className="sima-ficha-card">
          <div className="sima-ficha-card-header">
            <div>
              <h2 className="sima-ficha-title">
                Ficha {FICHA.codigo} — {FICHA.programa}
              </h2>
              <p className="sima-ficha-subtitle">
                {FICHA.nivel} · Área: {FICHA.area} · Jornada: {FICHA.jornada}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className={`sima-badge-table ${fichaBadge}`}>{FICHA.status}</span>
              <button
                className="sima-btn-outline"
                onClick={() => navigate(`/coordinador/ficha/${FICHA.codigo}`)}
                style={{ fontSize: 12, padding: "6px 14px" }}>
                Ver detalle completo →
              </button>
            </div>
          </div>

          <div className="sima-ficha-body">
            {/* Columna izquierda: Información de la ficha */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", marginBottom: 12 }}>
                Información general
              </p>
              <div className="sima-ficha-info-list">
                <div className="sima-ficha-info-row">
                  <span className="sima-ficha-info-label">Instructor líder</span>
                  <span className="sima-ficha-info-value">{FICHA.instructorLider}</span>
                </div>
                <div className="sima-ficha-info-row">
                  <span className="sima-ficha-info-label">Fecha inicio</span>
                  <span className="sima-ficha-info-value">{fmt(FICHA.fechaInicio)}</span>
                </div>
                <div className="sima-ficha-info-row">
                  <span className="sima-ficha-info-label">Fecha fin</span>
                  <span className="sima-ficha-info-value">{fmt(FICHA.fechaFin)}</span>
                </div>
                <div className="sima-ficha-info-row">
                  <span className="sima-ficha-info-label">Inicio etapa productiva</span>
                  <span className="sima-ficha-info-value">{fmt(FICHA.fechaInicioEtapaProductiva)}</span>
                </div>
                <div className="sima-ficha-info-row">
                  <span className="sima-ficha-info-label">Duración total</span>
                  <span className="sima-ficha-info-value">{FICHA.trimestres} trimestres</span>
                </div>
                <div className="sima-ficha-info-row">
                  <span className="sima-ficha-info-label">Trimestre actual</span>
                  <span className="sima-ficha-info-value">
                    <span className="sima-info-pill sima-info-pill-green">
                      T{FICHA.trimestreActual} / {FICHA.trimestres}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Columna derecha: Aprendices y métricas */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", marginBottom: 12 }}>
                Aprendices y métricas
              </p>

              {/* KPIs rápidos en grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total aprendices", value: FICHA.totalAprendices, color: "#39A900" },
                  { label: "Activos",           value: FICHA.aprendicesActivos, color: "#35c759" },
                  { label: "Condicionados",     value: FICHA.aprendicesCondicionados, color: "#ffb020" },
                  { label: "Inactivos",         value: FICHA.aprendicesInactivos, color: "#ff5f57" },
                ].map((k) => (
                  <div key={k.label} style={{
                    background: "#f9f9f9", borderRadius: 10, padding: "12px 16px",
                    borderLeft: `3px solid ${k.color}`
                  }}>
                    <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase" }}>{k.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1e2d3d", marginTop: 2 }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* Asistencia del mes de la ficha */}
              <p style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", marginBottom: 8 }}>
                Asistencia este mes (%)
              </p>
              <div className="sima-apprentice-status">
                {[
                  { label: "Presente",     count: FICHA.asistencia.presente,    color: "#35c759" },
                  { label: "Tarde",        count: FICHA.asistencia.tarde,       color: "#ffb020" },
                  { label: "Inasistente",  count: FICHA.asistencia.inasistente, color: "#ff5f57" },
                  { label: "Justificada",  count: FICHA.asistencia.justificada, color: "#4c8dff" },
                ].map((row) => (
                  <div className="sima-status-bar-row" key={row.label}>
                    <span className="sima-status-bar-label">{row.label}</span>
                    <div className="sima-status-bar-track">
                      <div className="sima-status-bar-fill"
                        style={{ width: `${row.count}%`, background: row.color }} />
                    </div>
                    <span className="sima-status-bar-count">{row.count}%</span>
                  </div>
                ))}
              </div>

              {/* Alertas y observaciones */}
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <span className="sima-info-pill sima-info-pill-red">
                  ⚠️ {FICHA.alertasActivas} alertas activas
                </span>
                <span className="sima-info-pill sima-info-pill-blue">
                  📋 {FICHA.observacionesAbiertas} observaciones
                </span>
                <span className="sima-info-pill sima-info-pill-gray">
                  📅 {FICHA.inasistenciasEsteMes} inasistencias este mes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Alertas Recientes (ancho completo) ── */}
        <div className="sima-dashboard-tables">
          <div className="sima-table-card">
            <h3 className="sima-card-title mb-3">Alertas Recientes</h3>
            <Table className="sima-table" responsive>
              <thead>
                <tr>
                  <th>Aprendiz / Grupo</th>
                  <th>Detalle</th>
                  <th>Severidad</th>
                  <th>Fuente</th>
                </tr>
              </thead>
              <tbody>
                {DATA.recentAlerts.map((a, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{a.apprentice}</strong><br />
                      <small className="text-muted">{a.group}</small>
                    </td>
                    <td>
                      {a.detail}<br />
                      <small className="text-muted">{a.time}</small>
                    </td>
                    <td><span style={getSeveridadStyle(a.severity)}>{a.severity}</span></td>
                    <td><small>{a.source}</small></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>

      </div>
    </>
  );
}
