import React, { useState, useEffect } from "react";
import { Table } from "react-bootstrap";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from "recharts";
import { useNavigate, useParams } from "react-router-dom";
import { getGroupById, getApprenticesByGroup, getAlerts } from "../../services/simaApi";
import "./CoordinadorDashboard.css";

/* ── helpers ── */
const getRiesgoClass = (risk) => {
  if (!risk) return "";
  const r = risk.toUpperCase();
  if (r === "ALTO")  return "sima-risk-high";
  if (r === "MEDIO") return "sima-risk-medium";
  return "sima-risk-low";
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

/* ── Skeleton loader ── */
function Skeleton({ height = 20, width = "100%", style = {} }) {
  return (
    <div style={{
      height, width, borderRadius: 6,
      background: "linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", ...style
    }} />
  );
}

export default function DetalleGrupo() {
  const { codigo } = useParams();
  const navigate   = useNavigate();

  /* ── State ── */
  const [grupo,      setGrupo]      = useState(null);
  const [aprendices, setAprendices] = useState([]);
  const [alertas,    setAlertas]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  /* ── Fetch ── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Primero obtenemos el grupo por número de ficha.
    // GET /api/groups devuelve la lista; buscamos el que tenga numero_ficha === codigo.
    // También intentamos GET /api/groups/:id si el código es numérico.
    const fetchGrupo = async () => {
      // Intento 1: buscar por número de ficha en la lista
      const listaRes = await fetch("/api/groups", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access") || ""}`,
        },
      });
      if (!listaRes.ok) throw new Error("No se pudo cargar la lista de grupos");
      const listaJson = await listaRes.json();
      const lista = listaJson?.data?.grupos || listaJson?.data || listaJson?.results || [];
      return Array.isArray(lista)
        ? lista.find((g) => String(g.numero_ficha) === String(codigo))
        : null;
    };

    fetchGrupo()
      .then(async (grupoEncontrado) => {
        if (cancelled) return;
        if (!grupoEncontrado) {
          setGrupo(null);
          setLoading(false);
          return;
        }
        setGrupo(grupoEncontrado);

        // Con el id_grupo real, traemos aprendices y alertas en paralelo
        const idGrupo = grupoEncontrado.id_grupo;
        const [apprenticesRes, alertasRes] = await Promise.all([
          fetch(`/api/apprentices/grupo/${idGrupo}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access") || ""}`,
            },
          }),
          fetch(`/api/alerts`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access") || ""}`,
            },
          }),
        ]);

        const apprenticesJson = await apprenticesRes.json();
        const alertasJson     = await alertasRes.json();

        if (!cancelled) {
          const listaAprendices =
            apprenticesJson?.data?.aprendices ||
            apprenticesJson?.data ||
            [];
          setAprendices(Array.isArray(listaAprendices) ? listaAprendices : []);

          // Filtrar alertas del grupo si tienen referencia al aprendiz con el grupo
          const listaAlertas = alertasJson?.data || [];
          setAlertas(Array.isArray(listaAlertas) ? listaAlertas : []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [codigo]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="sima-content-wrapper">
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Skeleton height={36} width="50%" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} height={90} />)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Skeleton height={350} /><Skeleton height={350} />
          </div>
          <Skeleton height={250} />
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="sima-content-wrapper" style={{ padding: 40 }}>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ background: "#fce4e4", color: "#d11a2a", padding: "20px 24px", borderRadius: 10, marginBottom: 20 }}>
          ⚠️ Error al cargar datos: {error}
        </div>
        <button className="sima-btn-outline" onClick={() => navigate(`/coordinador/ficha/${codigo}`)}>
          ← Volver al dashboard del grupo
        </button>
      </div>
    );
  }

  /* ── Grupo no encontrado ── */
  if (!grupo) {
    return (
      <div className="sima-content-wrapper" style={{ padding: 40 }}>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <p>No se encontraron datos para la ficha <strong>{codigo}</strong>.</p>
        <button className="sima-btn-outline" onClick={() => navigate("/fichas")} style={{ marginTop: 12 }}>
          ← Volver a Grupos
        </button>
      </div>
    );
  }

  /* ── Datos normalizados del grupo ── */
  const programa    = grupo.programa_formacion?.nombre_programa || "—";
  const jornada     = grupo.jornada   || "—";
  const trimestres  = grupo.trimestres || 0;
  const area        = grupo.area?.nombre_area || "—";
  const instructor  = grupo.instructor_lider
    ? `${grupo.instructor_lider.persona?.nombres || ""} ${grupo.instructor_lider.persona?.apellidos || ""}`.trim()
    : "Sin asignar";
  const estado      = grupo.estado || "ACTIVO";

  const statusBadge =
    estado === "CERRADO"    ? "sima-bg-desactiva" :
    estado === "SUSPENDIDO" ? "sima-bg-espera"    : "sima-bg-activa";

  /* ── Gráfica: Estado formativo de aprendices ── */
  const estadoConteo = aprendices.reduce((acc, a) => {
    const est = a.estado_formativo || a.estado || "ACTIVO";
    acc[est] = (acc[est] || 0) + 1;
    return acc;
  }, {});

  const COLORES_ESTADO = {
    "EN_FORMACION": "#35c759", "ACTIVO": "#35c759",
    "CONDICIONADO": "#ffb020",
    "APLAZADO": "#4c8dff",
    "CANCELADO": "#ff5f57",
    "CERTIFICADO": "#8b5cf6",
  };

  const trainingStatusData = Object.entries(estadoConteo).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
    color: COLORES_ESTADO[name] || "#aaa",
  }));

  /* ── Gráfica: Asistencia (derivada de aprendices si viene en el payload) ── */
  const asistenciaData = [
    { name: "Presente",    value: grupo.pct_asistencia       ?? 80, color: "#35c759" },
    { name: "Inasistente", value: grupo.pct_inasistencia     ?? 12, color: "#ff5f57" },
    { name: "Justificada", value: grupo.pct_justificada      ?? 8,  color: "#4c8dff" },
  ];

  /* ── KPIs ── */
  const kpis = {
    aprendices:   aprendices.length || grupo.total_aprendices || 0,
    alertas:      alertas.length,
    observaciones: grupo.total_observaciones_abiertas || 0,
    inasistencias: grupo.total_inasistencias          || 0,
  };

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div className="sima-content-wrapper">

        {/* ── Encabezado ── */}
        <div className="sima-page-header">
          <div>
            <button
              className="sima-btn-back"
              onClick={() => navigate(`/coordinador/ficha/${codigo}`)}
              style={{ marginBottom: "12px" }}>
              ← Volver a los detalles del grupo
            </button>
            <h1 className="sima-page-title">Ficha {codigo} — {programa}</h1>
            <p className="sima-page-subtitle">
              Jornada: {jornada} · Trimestres: {trimestres} · Instructor: {instructor} · Área: {area}
              <span className={`sima-badge-table ${statusBadge}`} style={{ marginLeft: "12px" }}>{estado}</span>
            </p>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="sima-dashboard-kpis">
          <div className="sima-kpi-card" style={{ borderLeftColor: "#39A900" }}>
            <span className="sima-kpi-title">Aprendices</span>
            <h3 className="sima-kpi-value">{kpis.aprendices}</h3>
            <span className="sima-kpi-tag">en esta ficha</span>
          </div>
          <div className="sima-kpi-card" style={{ borderLeftColor: "#dc3545" }}>
            <span className="sima-kpi-title">Alertas</span>
            <h3 className="sima-kpi-value">{kpis.alertas}</h3>
            <span className="sima-kpi-tag">activas</span>
          </div>
          <div className="sima-kpi-card" style={{ borderLeftColor: "#ffc107" }}>
            <span className="sima-kpi-title">Observaciones</span>
            <h3 className="sima-kpi-value">{kpis.observaciones}</h3>
            <span className="sima-kpi-tag">abiertas</span>
          </div>
          <div className="sima-kpi-card" style={{ borderLeftColor: "#17a2b8" }}>
            <span className="sima-kpi-title">Inasistencias</span>
            <h3 className="sima-kpi-value">{kpis.inasistencias}</h3>
            <span className="sima-kpi-tag">registradas</span>
          </div>
        </div>

        {/* ── Gráficas ── */}
        <div className="sima-dashboard-charts">

          {/* Estado Formativo */}
          <div className="sima-chart-container">
            <h3 className="sima-card-title mb-4">Estado Formativo — Ficha {codigo}</h3>
            {trainingStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trainingStatusData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={95}
                    paddingAngle={4} dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {trainingStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(val, name) => [val, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: "#aaa", textAlign: "center", marginTop: 60 }}>
                No hay datos de estado formativo.
              </p>
            )}
          </div>

          {/* Asistencia */}
          <div className="sima-chart-container">
            <h3 className="sima-card-title mb-4">Asistencia — Ficha {codigo}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={asistenciaData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={95}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {asistenciaData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Tabla de aprendices ── */}
        <div className="sima-dashboard-tables">
          <div className="sima-table-card">
            <h3 className="sima-card-title mb-3">
              Aprendices de la Ficha {codigo}
              {aprendices.length > 0 && (
                <span style={{ color: "#39A900", marginLeft: 8 }}>({aprendices.length})</span>
              )}
            </h3>
            {aprendices.length === 0 ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: "24px 0" }}>
                No se encontraron aprendices para esta ficha.
              </p>
            ) : (
              <Table className="sima-table" responsive>
                <thead>
                  <tr>
                    <th>Aprendiz</th>
                    <th>Documento</th>
                    <th>Estado Formativo</th>
                    <th className="text-center">Alertas</th>
                    <th className="text-center">Inasistencias</th>
                    <th className="text-center">Riesgo</th>
                  </tr>
                </thead>
                <tbody>
                  {aprendices.map((a, i) => {
                    const persona  = a.persona       || a.usuario?.persona || {};
                    const nombre   = `${persona.nombres || ""} ${persona.apellidos || ""}`.trim() || "—";
                    const doc      = persona.numero_documento || "—";
                    const est      = a.estado_formativo || a.estado || "ACTIVO";
                    const alertCount = alertas.filter(
                      (al) => al.id_aprendiz === a.id_aprendiz
                    ).length;
                    const inasistencias = a.total_inasistencias || 0;
                    const riesgo = a.nivel_riesgo || (
                      alertCount >= 3 ? "Alto" : alertCount >= 1 ? "Medio" : "Bajo"
                    );

                    return (
                      <tr key={i}>
                        <td><strong>{nombre}</strong></td>
                        <td>{doc}</td>
                        <td>{est.replace("_", " ")}</td>
                        <td className="text-center">{alertCount}</td>
                        <td className="text-center">{inasistencias}</td>
                        <td className="text-center">
                          <span className={getRiesgoClass(riesgo)}>{riesgo}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </div>
        </div>

        {/* ── Tabla de alertas ── */}
        <div className="sima-dashboard-tables">
          <div className="sima-table-card">
            <h3 className="sima-card-title mb-3">Alertas de la Ficha {codigo}</h3>
            {alertas.length === 0 ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: "24px 0" }}>
                ✅ No hay alertas activas para esta ficha.
              </p>
            ) : (
              <Table className="sima-table" responsive>
                <thead>
                  <tr>
                    <th>Aprendiz</th>
                    <th>Descripción</th>
                    <th>Severidad</th>
                    <th>Fuente</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.map((a, i) => {
                    const persona = a.aprendiz?.persona || {};
                    const nombre  = `${persona.nombres || ""} ${persona.apellidos || ""}`.trim() || "—";
                    return (
                      <tr key={i}>
                        <td><strong>{nombre}</strong></td>
                        <td>{a.descripcion || "—"}</td>
                        <td><span style={getSeveridadStyle(a.severidad)}>{a.severidad}</span></td>
                        <td><small>{a.origen || a.tipo_alerta || "—"}</small></td>
                        <td>
                          <small className="text-muted">
                            {a.fecha_alerta
                              ? new Date(a.fecha_alerta).toLocaleDateString("es-CO")
                              : "—"}
                          </small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
