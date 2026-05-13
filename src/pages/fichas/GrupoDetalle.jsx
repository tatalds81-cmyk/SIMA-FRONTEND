import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit3, Save, Users, AlertTriangle, ClipboardList, CalendarX, UserX } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./fichas.css";

/* ── helpers ─────────────────────────────── */
function RiesgoBadge({ nivel }) {
  const map = {
    Alto:  { cls: "gd-badge-alto",  label: "Alto"  },
    Medio: { cls: "gd-badge-medio", label: "Medio" },
    Bajo:  { cls: "gd-badge-bajo",  label: "Bajo"  },
  };
  const entry = map[nivel] || map.Bajo;
  return <span className={`gd-badge ${entry.cls}`}>{entry.label}</span>;
}

function SeveridadLabel({ valor }) {
  const map = {
    Critica:  "gd-sev-critica",
    Grave:    "gd-sev-grave",
    Moderada: "gd-sev-moderada",
    Leve:     "gd-sev-leve",
  };
  return <span className={`gd-sev ${map[valor] || ""}`}>{valor || "-"}</span>;
}

const BARRA_ASISTENCIA = [
  { clave: "presente",   label: "Presente",   color: "#39a900" },
  { clave: "tarde",      label: "Tarde",       color: "#f59e0b" },
  { clave: "inasistente",label: "Inasistente", color: "#ef4444" },
  { clave: "justificada",label: "Justificada", color: "#3b82f6" },
];

const BARRAS_SEVERIDAD = [
  { clave: "leves",     label: "Leves",     color: "#f8d41f" },
  { clave: "moderadas", label: "Moderadas", color: "#f59e0b" },
  { clave: "graves",    label: "Graves",    color: "#ef4444" },
];

export default function GrupoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rol = (localStorage.getItem("rol") || "").toLowerCase();
  const esInstructor = rol === "instructor" || rol === "instructor_lider" || rol === "instructor_asignado";

  /* ── estado del grupo (ya existente) ── */
  const [grupo, setGrupo] = useState(null);
  const [aprendicesGrupo, setAprendicesGrupo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [detalleForm, setDetalleForm] = useState({ numero_ficha: "", jornada: "", trimestres: "", fecha_inicio: "" });

  /* ── estado para secciones pendientes de endpoint ── */
  const [alertas, setAlertas] = useState(null);          // null = sin endpoint
  const [asistencia, setAsistencia] = useState(null);    // null = sin endpoint
  const [metricas, setMetricas] = useState(null);        // null = sin endpoint
  const [periodoAsist, setPeriodoAsist] = useState("Hoy");

  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        const token = localStorage.getItem("access") || localStorage.getItem("token");
        const h = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
        const [gr, apr] = await Promise.all([
          fetch(`/api/groups/${id}`, { headers: h }),
          fetch(`/api/apprentices/grupo/${id}`, { headers: h }),
        ]);
        const gData = await gr.json().catch(() => null);
        const aData = await apr.json().catch(() => null);
        if (!gr.ok) throw gData;
        if (activo) {
          const g = gData?.data || null;
          const lista = aData?.data?.aprendices || aData?.data?.items || aData?.data || [];
          setGrupo(g);
          setAprendicesGrupo(Array.isArray(lista) ? lista : []);
          setDetalleForm({
            numero_ficha: g?.numero_ficha || "",
            jornada: g?.jornada || "",
            trimestres: g?.trimestres || "",
            fecha_inicio: g?.fecha_inicio || "",
          });
        }
      } catch (e) {
        if (activo) setError(e?.message || e?.error || "Error al cargar la ficha");
      } finally {
        if (activo) setCargando(false);
      }

      // Cargar alertas del grupo desde el backend real
      try {
        const { data: respAlertas } = await api.get('/api/alerts', { params: { id_grupo: id } });
        const listaAlertas = respAlertas?.data || respAlertas?.results || (Array.isArray(respAlertas) ? respAlertas : []);
        if (activo && listaAlertas.length >= 0) {
          const porSeveridad = { leves: 0, moderadas: 0, graves: 0 };
          listaAlertas.forEach(a => {
            const sev = (a.severidad || '').toUpperCase();
            if (sev === 'LEVE') porSeveridad.leves++;
            else if (sev === 'MODERADA') porSeveridad.moderadas++;
            else if (sev === 'GRAVE') porSeveridad.graves++;
          });
          setAlertas({
            total: listaAlertas.length,
            observaciones: listaAlertas.filter(a => a.tipo_alerta === 'OBSERVACIONES_RECURRENTES').length,
            porSeveridad,
            lista: listaAlertas.map(a => ({
              aprendiz: a.aprendiz?.nombre || a.aprendizNombre || 'Aprendiz',
              detalle: a.descripcion || '-',
              severidad: a.severidad ? a.severidad.charAt(0).toUpperCase() + a.severidad.slice(1).toLowerCase() : '-',
              fuente: a.tipo_alerta === 'MANUAL' ? 'Manual' : 'Sistema',
              fecha: a.fecha_creacion ? new Date(a.fecha_creacion).toLocaleDateString('es-CO') : '-',
            })),
          });
        }
      } catch (_) {
        // Si el endpoint de alertas falla, dejamos alertas en null (sin endpoint)
      }
    }
    cargar();
    return () => { activo = false; };
  }, [id]);

  const detalle = useMemo(() => {
    if (!grupo) return null;
    const estado = `${grupo.estado || "ACTIVO"}`.toUpperCase();
    const estadoTexto = estado === "SUSPENDIDO" ? "En espera" : estado === "CERRADO" ? "Cerrada" : "Activo";
    const estadoClase = estado === "SUSPENDIDO" ? "suspendido" : estado === "CERRADO" ? "cerrado" : "activo";
    const persona = grupo.instructor_lider?.usuario?.persona;
    const instructor = persona ? `${persona.nombres} ${persona.apellidos}` : "Sin asignar";
    const iniciales = persona ? `${persona.nombres[0]}${persona.apellidos[0]}` : "?";
    return {
      ficha: grupo.numero_ficha || grupo.numero_grupo || grupo.codigo || id,
      estadoTexto, estadoClase,
      area: grupo.programa_formacion?.area?.nombre_area || "No especificada",
      programa: grupo.programa_formacion?.nombre_programa || "No especificado",
      jornada: grupo.jornada || "No especificada",
      trimestres: grupo.trimestres || 0,
      fechaInicio: grupo.fecha_inicio || "No registrada",
      fechaFin: grupo.fecha_fin || "No registrada",
      inicioProductiva: grupo.inicio_etapa_productiva || "No registrada",
      instructor, iniciales,
      ambiente: grupo.ambiente?.nombre_ambiente || "Sin asignar",
      ubicacion: grupo.ambiente?.ubicacion || "No registrada",
      aprendices: aprendicesGrupo.length || grupo.total_aprendices || 0,
    };
  }, [grupo, id, aprendicesGrupo]);

  /* ── KPIs derivados de datos reales cuando lleguen ── */
  const kpis = useMemo(() => {
    const base = [
      { icon: Users,        label: "Aprendices activos",     valor: detalle?.aprendices ?? "-",       sub: detalle?.aprendices ? "registrados" : "Sin registros", cls: "gd-kpi-green" },
      { icon: CalendarX,    label: "Inasistencias válidas",  valor: asistencia?.inasistencias ?? "-", sub: asistencia ? "este mes" : "Sin endpoint",              cls: "gd-kpi-blue" },
      { icon: UserX,        label: "Inactivos",              valor: metricas?.inactivos ?? "-",       sub: metricas ? "aprendices" : "Sin endpoint",              cls: "gd-kpi-gray" },
    ];
    
    if (esInstructor) {
      base.splice(1, 0, 
        { icon: AlertTriangle,label: "Alertas activas",        valor: alertas?.total ?? "-",            sub: alertas ? "activas" : "Sin endpoint",                  cls: "gd-kpi-red"   },
        { icon: ClipboardList,label: "Observaciones abiertas", valor: alertas?.observaciones ?? "-",    sub: alertas ? "abiertas" : "Sin endpoint",                 cls: "gd-kpi-yellow" }
      );
    }
    return base;
  }, [detalle, alertas, asistencia, metricas, esInstructor]);

  /* ── funciones de edición (existentes) ── */
  function cambiarForm(e) { const { name, value } = e.target; setDetalleForm(p => ({ ...p, [name]: value })); }
  function cancelar() { setModoEdicion(false); setDetalleForm({ numero_ficha: grupo?.numero_ficha || "", jornada: grupo?.jornada || "", trimestres: grupo?.trimestres || "", fecha_inicio: grupo?.fecha_inicio || "" }); }
  async function guardar() {
    try {
      const token = localStorage.getItem("access") || localStorage.getItem("token");
      const res = await fetch(`/api/groups/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...detalleForm, trimestres: parseInt(detalleForm.trimestres, 10) }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw data;
      setGrupo(data?.data || grupo);
      setModoEdicion(false);
      setMensaje("Grupo actualizado correctamente.");
    } catch (e) { setMensaje(e?.message || e?.error || "No fue posible actualizar."); }
  }

  if (cargando) return <div className="fichas-modulo fichas-detail-state"><p>Cargando información de la ficha...</p></div>;
  if (error || !detalle) return (
    <div className="fichas-modulo fichas-detail-state">
      <div className="fichas-alerta error">{error || "No se pudo cargar la información del grupo."}</div>
      <button className="fichas-btn-cancelar" onClick={() => navigate("/fichas")}>Volver a Grupos</button>
    </div>
  );

  /* ── render ── */
  return (
    <div className="fichas-modulo fichas-detail-page fichas-detail-page-v2">
      <button className="fichas-detail-back" onClick={() => navigate("/fichas")}><ArrowLeft size={16} /> Volver a Mis Grupos</button>
      {mensaje && <div className="grupos-alert info">{mensaje}</div>}

      {/* ── BANNER ── */}
      <section className="fichas-banner">
        <div className="gd-banner-inner">
          <div>
            <div className="fichas-banner-title-row">
              <h1>{detalle.programa}</h1>
              <span className={`fichas-banner-badge ${detalle.estadoClase}`}>{detalle.estadoTexto}</span>
            </div>
            <p>Ficha {detalle.ficha} · {detalle.jornada} · Instructor: {detalle.instructor}</p>
          </div>
        </div>
      </section>

      {/* ── KPIs ── */}
      <section className="gd-kpi-grid">
        {kpis.map(({ icon: Icon, label, valor, sub, cls }) => (
          <article key={label} className={`gd-kpi-card ${cls}`}>
            <span className="gd-kpi-label">{label}</span>
            <strong className="gd-kpi-valor">{valor}</strong>
            <small className="gd-kpi-sub">{sub}</small>
          </article>
        ))}
      </section>

      {/* ── FICHA DETALLE / INFO GENERAL ── */}
      <article className="fichas-panel">
        <div className="gd-card-header" style={{ marginBottom: 18 }}>
          <h2>Ficha {detalle.ficha} — {detalle.programa}</h2>
          <div className="gd-header-actions">
            <span className={`fichas-banner-badge ${detalle.estadoClase}`}>{detalle.estadoTexto}</span>
            {modoEdicion ? (
              <>
                <button type="button" className="grupos-secondary-btn" onClick={cancelar}>Cancelar</button>
                <button type="button" className="grupos-primary-btn" onClick={guardar}><Save size={15} /> Guardar</button>
              </>
            ) : (
              <button type="button" className="grupos-secondary-btn" onClick={() => setModoEdicion(true)}><Edit3 size={15} /> Editar</button>
            )}
          </div>
        </div>
        <div style={{ width: '100%' }}>
          {/* columna izquierda */}
          <div className="gd-info-col" style={{ flex: 1 }}>
            <p className="gd-info-section-label" style={{ textAlign: 'center', fontSize: '13px', marginBottom: '24px' }}>Información General</p>
            <div className="gd-info-rows" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px 16px' }}>
              <div className="gd-info-row" style={{ borderBottom: 'none', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span>Instructor líder</span><strong style={{ fontSize: '15px', textAlign: 'center' }}>{detalle.instructor}</strong></div>
              <div className="gd-info-row" style={{ borderBottom: 'none', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span>Área</span><strong style={{ textAlign: 'center', fontSize: '15px' }}>{detalle.area}</strong></div>
              <div className="gd-info-row" style={{ borderBottom: 'none', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span>Fecha inicio</span>
                {modoEdicion ? <input type="date" name="fecha_inicio" value={detalleForm.fecha_inicio} onChange={cambiarForm} className="gd-inline-input" /> : <strong style={{ fontSize: '15px', textAlign: 'center' }}>{detalle.fechaInicio}</strong>}
              </div>
              <div className="gd-info-row" style={{ borderBottom: 'none', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span>Fecha fin</span><strong style={{ fontSize: '15px', textAlign: 'center' }}>{detalle.fechaFin}</strong></div>
              <div className="gd-info-row" style={{ borderBottom: 'none', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span>Etapa productiva</span><strong style={{ fontSize: '15px', textAlign: 'center' }}>{detalle.inicioProductiva}</strong></div>
              <div className="gd-info-row" style={{ borderBottom: 'none', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span>Duración</span>
                {modoEdicion ? <input type="number" name="trimestres" value={detalleForm.trimestres} onChange={cambiarForm} className="gd-inline-input" style={{ width: 80 }} /> : <strong style={{ fontSize: '15px', textAlign: 'center' }}>{detalle.trimestres} trimestres</strong>}
              </div>
              <div className="gd-info-row" style={{ borderBottom: 'none', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span>Jornada</span>
                {modoEdicion ? (
                  <select name="jornada" value={detalleForm.jornada} onChange={cambiarForm} className="gd-inline-input">
                    <option value="Manana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                  </select>
                ) : <strong style={{ fontSize: '15px', textAlign: 'center' }}>{detalle.jornada}</strong>}
              </div>
              <div className="gd-info-row" style={{ borderBottom: 'none', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><span>Trimestre actual</span><strong style={{ fontSize: '15px', textAlign: 'center' }}>{metricas?.trimestreActual ?? "-"}</strong></div>
            </div>
          </div>
        </div>
      </article>

      {/* ── FILA PRINCIPAL: asistencia + línea de tiempo ── */}
      <section className="gd-main-grid">
        {/* Asistencia */}
        <article className="fichas-panel gd-chart-card">
          <div className="gd-card-header">
            <h2>Asistencia — {periodoAsist}</h2>
            <div className="gd-period-btns">
              {["Hoy", "Semana", "Mes"].map(p => (
                <button key={p} type="button" className={`gd-period-btn${periodoAsist === p ? " active" : ""}`} onClick={() => setPeriodoAsist(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div className="gd-bar-chart">
            <div className="gd-bar-scale">
              {["100%","75%","50%","25%","0%"].map(v => <span key={v}>{v}</span>)}
            </div>
            <div className="gd-bars-wrap">
              {BARRA_ASISTENCIA.map(({ clave, label, color }) => {
                const pct = asistencia?.[periodoAsist.toLowerCase()]?.[clave] ?? 0;
                return (
                  <div key={clave} className="gd-bar-item">
                    <span>{pct}%</span>
                    <div className="gd-bar-track">
                      <span className="gd-bar-fill" style={{ height: `${pct}%`, background: color }} />
                    </div>
                    <small>{label}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        {/* Línea de tiempo */}
        <article className="fichas-panel gd-timeline-card">
          <div className="gd-card-header">
            <h2>Línea de Tiempo — Ficha {detalle.ficha}</h2>
            <span className={`fichas-banner-badge ${detalle.estadoClase}`}>{detalle.estadoTexto}</span>
          </div>
          <p className="gd-timeline-sub">{detalle.programa} · {detalle.jornada} · Instructor: {detalle.instructor}</p>
          <div className="gd-trimestre-track">
            {Array.from({ length: detalle.trimestres || 6 }).map((_, i) => (
              <div key={i} className="gd-trimestre-step">
                <div className="gd-trimestre-dot">T{i + 1}</div>
                {i < (detalle.trimestres || 6) - 1 && <div className="gd-trimestre-line" />}
              </div>
            ))}
          </div>
          <div className="gd-timeline-rows">
            <div className="gd-timeline-row"><span>Inicio de ficha</span><strong>{detalle.fechaInicio}</strong></div>
            <div className="gd-timeline-row"><span>Fin de ficha</span><strong>{detalle.fechaFin}</strong></div>
            <div className="gd-timeline-row"><span>Inicio etapa productiva</span><strong>{detalle.inicioProductiva}</strong></div>
          </div>
        </article>
      </section>

      {/* ── TABLA APRENDICES ── */}
      <article className="fichas-panel">
        <div className="fichas-panel-header-actions">
          <h2>Aprendices de la Ficha {detalle.ficha}</h2>
          <span className="gd-count-chip">{detalle.aprendices} registrados</span>
        </div>
        <div className="gd-table-wrap">
          <table className="gd-table">
            <thead>
              <tr>
                <th>Aprendiz</th>
                <th>Documento</th>
                <th>Estado Formativo</th>
                <th>Alertas</th>
                <th>Inasistencias</th>
                <th>Riesgo</th>
              </tr>
            </thead>
            <tbody>
              {aprendicesGrupo.length > 0 ? aprendicesGrupo.map((item) => {
                const p = item.usuario?.persona || item.persona || {};
                const nombre = `${p.nombres || item.nombres || ""} ${p.apellidos || item.apellidos || ""}`.trim() || "Aprendiz";
                const doc = p.numero_documento || item.numero_documento || "-";
                const estado = item.estado_formativo || item.usuario?.estado || item.estado || "En formación";
                const alertasCnt = item.alertas ?? "-";
                const inasis = item.inasistencias ?? "-";
                const riesgo = item.nivel_riesgo || "Bajo";
                return (
                  <tr key={item.id_aprendiz || item.id || doc}>
                    <td><strong>{nombre}</strong></td>
                    <td>{doc}</td>
                    <td>{estado}</td>
                    <td className={alertasCnt > 0 ? "gd-num-alerta" : ""}>{alertasCnt}</td>
                    <td className={inasis > 0 ? "gd-num-inasis" : ""}>{inasis}</td>
                    <td><RiesgoBadge nivel={riesgo} /></td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="gd-empty">No hay aprendices registrados en esta ficha o el endpoint aún no está disponible.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* ── TABLA ALERTAS (Solo Instructor) ── */}
      {esInstructor && (
        <article className="fichas-panel">
        <div className="fichas-panel-header-actions">
          <h2>Alertas de la Ficha {detalle.ficha}</h2>
        </div>
        <div className="gd-table-wrap">
          <table className="gd-table gd-alerts-table">
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
              {alertas?.lista?.length > 0 ? alertas.lista.map((a, i) => {
                const esManual  = a.fuente === "Manual";
                const esTardio  = typeof a.fecha === "string" && (a.fecha.toLowerCase().startsWith("hoy") || a.fecha.toLowerCase().startsWith("ayer"));
                return (
                  <tr key={i}>
                    <td><strong>{a.aprendiz}</strong></td>
                    <td className={esManual ? "gd-td-link" : ""}>{a.detalle}</td>
                    <td><SeveridadLabel valor={a.severidad} /></td>
                    <td className={esManual ? "gd-td-link" : ""}>{a.fuente}</td>
                    <td className={esTardio ? "gd-td-link" : ""}>{a.fecha}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} className="gd-empty">Sin datos — endpoint pendiente.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </article>
      )}

      {/* ── GRÁFICAS: severidad (Solo Instructor) ── */}
      {esInstructor && (
        <section>
        {/* Alertas por Severidad */}
        <article className="fichas-panel gd-sev-chart-card">
          <div className="gd-card-header"><h2>Alertas por Severidad</h2></div>
          <div className="gd-sev-chart">
            <div className="gd-sev-scale">
              {[8, 6, 4, 2, 0].map(v => <span key={v}>{v}</span>)}
            </div>
            <div className="gd-sev-bars" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {BARRAS_SEVERIDAD.map(({ clave, label, color }) => {
                const val = alertas?.porSeveridad?.[clave] ?? 0;
                const max = Math.max(...BARRAS_SEVERIDAD.map(b => alertas?.porSeveridad?.[b.clave] ?? 0), 1);
                return (
                  <div key={clave} className="gd-sev-bar-item">
                    <span className="gd-sev-bar-val">{val}</span>
                    <div className="gd-sev-bar-track">
                      <span className="gd-sev-bar-fill" style={{ height: `${(val / max) * 100}%`, background: color }} />
                    </div>
                    <small>{label}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        </section>
      )}

    </div>
  );
}
