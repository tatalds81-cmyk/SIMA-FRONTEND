import React from "react";
import { Table } from "react-bootstrap";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from "recharts";
import { groupDetailData } from "../../data/mockCoordinatorData";
import { useNavigate, useParams } from "react-router-dom";
import "./CoordinadorDashboard.css";

export default function GrupoDetalle() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const data = groupDetailData[codigo];

  if (!data) {
    return (
      <div className="sima-content-wrapper" style={{ padding: "40px", flexDirection: "column" }}>
        <p>No se encontraron datos para la ficha <strong>{codigo}</strong></p>
        <button className="sima-btn-outline" onClick={() => navigate("/fichas")}>
          ← Volver a Grupos
        </button>
      </div>
    );
  }

  const getRiesgoClass = (risk) => {
    if (risk === "Alto") return "sima-risk-high";
    if (risk === "Medio") return "sima-risk-medium";
    return "sima-risk-low";
  };

  const getSeveridadStyle = (severity) => {
    const map = {
      "Critica": { color: "#721c24", fontWeight: "bold" },
      "Grave": { color: "#dc3545", fontWeight: "bold" },
      "Moderada": { color: "#fd7e14", fontWeight: "bold" },
      "Leve": { color: "#ffc107", fontWeight: "bold" },
    };
    return map[severity] || {};
  };

  const statusBadge = data.status === "Cerrado" ? "sima-bg-desactiva"
    : data.status === "Suspendido" ? "sima-bg-espera" : "sima-bg-activa";

  return (
    <>
      <div className="sima-content-wrapper">
        {/* Encabezado con botón Volver */}
        <div className="sima-page-header">
          <div>
            <button className="sima-btn-outline" onClick={() => navigate("/coordinador")} style={{ marginBottom: "12px" }}>
              ← Volver a los detalles del grupo
            </button>
            <h1 className="sima-page-title">Ficha {data.code} — {data.program}</h1>
            <p className="sima-page-subtitle">
              Jornada: {data.shift} · Trimestres: {data.trimestres} · Instructor: {data.instructorLider} · Área: {data.area}
              <span className={`sima-badge-table ${statusBadge}`} style={{ marginLeft: "12px" }}>{data.status}</span>
            </p>
          </div>
        </div>

        {/* KPIs de la ficha */}
        <div className="sima-dashboard-kpis">
          <div className="sima-kpi-card" style={{ borderLeftColor: "#39A900" }}>
            <span className="sima-kpi-title">Aprendices</span>
            <h3 className="sima-kpi-value">{data.kpis.aprendices}</h3>
            <span className="sima-kpi-tag">en esta ficha</span>
          </div>
          <div className="sima-kpi-card" style={{ borderLeftColor: "#dc3545" }}>
            <span className="sima-kpi-title">Alertas</span>
            <h3 className="sima-kpi-value">{data.kpis.alertas}</h3>
            <span className="sima-kpi-tag">activas</span>
          </div>
          <div className="sima-kpi-card" style={{ borderLeftColor: "#ffc107" }}>
            <span className="sima-kpi-title">Observaciones</span>
            <h3 className="sima-kpi-value">{data.kpis.observaciones}</h3>
            <span className="sima-kpi-tag">abiertas</span>
          </div>
          <div className="sima-kpi-card" style={{ borderLeftColor: "#17a2b8" }}>
            <span className="sima-kpi-title">Inasistencias</span>
            <h3 className="sima-kpi-value">{data.kpis.inasistencias}</h3>
            <span className="sima-kpi-tag">este mes</span>
          </div>
        </div>

        {/* Gráficas de la ficha */}
        <div className="sima-dashboard-charts">
          <div className="sima-chart-container">
            <h3 className="sima-card-title mb-4">Estado Formativo — Ficha {data.code}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.trainingStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {data.trainingStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="sima-chart-container">
            <h3 className="sima-card-title mb-4">Asistencia — Ficha {data.code}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.attendance.items}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.attendance.items.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla de aprendices de la ficha */}
        <div className="sima-dashboard-tables">
          <div className="sima-table-card">
            <h3 className="sima-card-title mb-3">Aprendices de la Ficha {data.code}</h3>
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
                {data.apprentices.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.name}</strong></td>
                    <td>{a.document}</td>
                    <td>{a.status}</td>
                    <td className="text-center">{a.alerts}</td>
                    <td className="text-center">{a.absences}</td>
                    <td className="text-center">
                      <span className={getRiesgoClass(a.risk)}>{a.risk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>

        {/* Alertas de la ficha */}
        <div className="sima-dashboard-tables">
          <div className="sima-table-card">
            <h3 className="sima-card-title mb-3">Alertas de la Ficha {data.code}</h3>
            <Table className="sima-table" responsive>
              <thead>
                <tr>
                  <th>Aprendiz</th>
                  <th>Detalle</th>
                  <th>Severidad</th>
                  <th>Fuente</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.alerts.map((a, i) => (
                  <tr key={i}>
                    <td><strong>{a.apprentice}</strong></td>
                    <td>{a.detail}</td>
                    <td><span style={getSeveridadStyle(a.severity)}>{a.severity}</span></td>
                    <td><small>{a.source}</small></td>
                    <td><small className="text-muted">{a.time}</small></td>
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
