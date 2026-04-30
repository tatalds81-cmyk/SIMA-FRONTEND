import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./fichas.css";

export default function GrupoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grupo, setGrupo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const URL_BASE = "/api";

  useEffect(() => {
    cargarDetalleGrupo();
  }, [id]);

  async function cargarDetalleGrupo() {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`${URL_BASE}/groups/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setGrupo(data.data);
    } catch (err) {
      console.log("Error al cargar detalle:", err);
      setError(err?.message || err?.error || "Error al cargar la información del grupo");
    } finally {
      setCargando(false);
    }
  }

  if (cargando) {
    return (
      <div className="fichas-modulo" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Cargando información de la ficha...</p>
      </div>
    );
  }

  if (error || !grupo) {
    return (
      <div className="fichas-modulo">
        <div className="fichas-alerta error">
          {error || "No se pudo cargar la información del grupo."}
        </div>
        <button className="fichas-btn-cancelar" onClick={() => navigate("/fichas")}>
          ← Volver a Grupos
        </button>
      </div>
    );
  }

  const badgeClass = grupo.estado === "ACTIVO" ? "activo" : grupo.estado === "SUSPENDIDO" ? "suspendido" : "cerrado";
  const textoEstado = grupo.estado === "ACTIVO" ? "Activa" : grupo.estado === "SUSPENDIDO" ? "En espera" : "Desactiva";

  const instructorNombre = grupo.instructor_lider?.usuario?.persona
    ? `${grupo.instructor_lider.usuario.persona.nombres} ${grupo.instructor_lider.usuario.persona.apellidos}`
    : "Sin asignar";

  const instructorIniciales = grupo.instructor_lider?.usuario?.persona
    ? `${grupo.instructor_lider.usuario.persona.nombres.charAt(0)}${grupo.instructor_lider.usuario.persona.apellidos.charAt(0)}`
    : "?";

  return (
    <div className="fichas-modulo">
      {/* Boton Volver */}
      <button 
        className="fichas-btn-cancelar" 
        style={{ marginBottom: "20px", border: "none", background: "transparent", padding: 0, color: "var(--sima-gray-text)" }} 
        onClick={() => navigate("/fichas")}
      >
        ← Volver a Mis Grupos
      </button>

      {/* Hero Header */}
      <div className="detalle-hero">
        <h1 className="detalle-hero-title">
          Ficha {grupo.numero_ficha}
          <span className="detalle-badge-white">{textoEstado}</span>
        </h1>
        <p className="detalle-hero-subtitle">
          {grupo.programa_formacion?.nombre_programa} — {grupo.programa_formacion?.area?.nombre_area}
        </p>
      </div>

      {/* KPIs Grid Placeholder */}
      <div className="kpi-container">
        <div className="kpi-card" style={{ borderColor: "#37b723" }}>
          <span className="kpi-title">Aprendices</span>
          <h3 className="kpi-value">-</h3>
          <div className="kpi-coming-soon">Próximamente</div>
        </div>
        <div className="kpi-card" style={{ borderColor: "#ef4444" }}>
          <span className="kpi-title">Alertas Activas</span>
          <h3 className="kpi-value">-</h3>
          <div className="kpi-coming-soon">Próximamente</div>
        </div>
        <div className="kpi-card" style={{ borderColor: "#f59e0b" }}>
          <span className="kpi-title">Observaciones</span>
          <h3 className="kpi-value">-</h3>
          <div className="kpi-coming-soon">Próximamente</div>
        </div>
        <div className="kpi-card" style={{ borderColor: "#3b82f6" }}>
          <span className="kpi-title">Inasistencias</span>
          <h3 className="kpi-value">-</h3>
          <div className="kpi-coming-soon">Próximamente</div>
        </div>
      </div>

      {/* Detalles Grid */}
      <div className="detalle-grid">
        {/* Columna Principal */}
        <div className="detalle-card">
          <h2 className="detalle-card-title">Detalles Académicos</h2>
          
          <div className="info-item">
            <div className="info-label">Área de Formación</div>
            <div className="info-value">{grupo.programa_formacion?.area?.nombre_area || "No especificada"}</div>
          </div>

          <div className="info-item">
            <div className="info-label">Programa de Formación</div>
            <div className="info-value info-value-highlight">{grupo.programa_formacion?.nombre_programa || "No especificado"}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "24px" }}>
            <div className="info-item">
              <div className="info-label">Jornada</div>
              <div className="info-value">{grupo.jornada}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Duración</div>
              <div className="info-value">{grupo.trimestres} Trimestres</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
            <div className="info-item">
              <div className="info-label">Fecha de Inicio</div>
              <div className="info-value">{grupo.fecha_inicio}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Fecha de Fin (Estimada)</div>
              <div className="info-value">{grupo.fecha_fin}</div>
            </div>
          </div>
        </div>

        {/* Columna Secundaria */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="detalle-card">
            <h2 className="detalle-card-title">Instructor Líder</h2>
            <div className="info-item" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="instructor-avatar">
                {instructorIniciales}
              </div>
              <div>
                <div className="info-value" style={{ fontSize: "16px" }}>{instructorNombre}</div>
                <div className="info-label" style={{ marginBottom: 0, marginTop: "4px" }}>Responsable principal</div>
              </div>
            </div>
          </div>

          <div className="detalle-card">
            <h2 className="detalle-card-title">Ambiente Principal</h2>
            <div className="info-item">
              <div className="info-label">Nombre del Ambiente</div>
              <div className="info-value">{grupo.ambiente?.nombre_ambiente || "Sin asignar"}</div>
            </div>
            <div className="info-item" style={{ marginTop: "16px" }}>
              <div className="info-label">Ubicación</div>
              <div className="info-value">{grupo.ambiente?.ubicacion || "N/A"}</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
