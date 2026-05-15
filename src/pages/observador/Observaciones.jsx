import { useCallback, useEffect, useState, useRef } from "react";
import {
  obtenerMisGrupos,
  obtenerAprendicesPorGrupo,
  obtenerObservacionesPorGrupo,
  crearObservacion,
} from "../../services/observationsService";
import "./Observaciones.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const SEVERIDAD_LABELS = { LEVE: "Leve", MODERADA: "Moderada", GRAVE: "Grave" };
const TIPO_LABELS = { ACADEMICA: "Académica", CONVIVENCIAL: "Convivencial" };

function BadgeSeveridad({ severidad }) {
  const clase = (severidad || "").toLowerCase();
  return (
    <span className={`badge ${clase}`}>
      {SEVERIDAD_LABELS[severidad] ?? severidad}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function Observaciones() {

  // ── Datos globales ─────────────────────────────────────────────────────────
  const [grupos, setGrupos] = useState([]);
  const [observaciones, setObservaciones] = useState([]);
  const [totalObs, setTotalObs] = useState(0);
  const [obsAbiertas, setObsAbiertas] = useState(0);

  // ── Filtros de la tabla (solo afectan lo que se muestra en la tabla) ───────
  const [filtroGrupo, setFiltroGrupo] = useState("");   // ficha activa en la tabla
  const [filtroBusqueda, setFiltroBusqueda] = useState(""); // búsqueda por nombre (local)
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  // ── Estado de carga / error de la tabla ───────────────────────────────────
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [loadingObs, setLoadingObs] = useState(false);
  const [errorObs, setErrorObs] = useState(null);

  // ── Modal: estado propio e independiente de los filtros ───────────────────
  const [mostrarModal, setMostrarModal] = useState(false);

  // Paso 1 del modal: elegir ficha
  const [modalGrupo, setModalGrupo] = useState("");

  // Paso 2 del modal: aprendices de esa ficha + selección
  const [aprendices, setAprendices] = useState([]);
  const [loadingAprendices, setLoadingAprendices] = useState(false);
  const [busquedaAprendiz, setBusquedaAprendiz] = useState("");

  // Campos del formulario
  const [form, setForm] = useState({
    aprendizId: "",
    tipo: "ACADEMICA",
    severidad: "LEVE",
    descripcion: "",
    notificarLider: false,
  });
  const [formError, setFormError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const busquedaRef = useRef(null);

  // ── Cargar los grupos del instructor al montar ─────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingGrupos(true);
      const { data } = await obtenerMisGrupos();
      setGrupos(data);
      if (data.length > 0) {
        const primerIdGrupo = String(data[0].id_grupo ?? data[0].id);
        setFiltroGrupo(primerIdGrupo);
      }
      setLoadingGrupos(false);
    })();
  }, []);

  // ── Cargar observaciones cuando cambia la ficha activa o los filtros ───────
  const cargarObservaciones = useCallback(async () => {
    if (!filtroGrupo) return;
    setLoadingObs(true);
    setErrorObs(null);

    const filtros = {};
    if (filtroTipo) filtros.tipo_observacion = filtroTipo;
    if (filtroFecha) filtros.fecha_desde = filtroFecha;

    const { data, error } = await obtenerObservacionesPorGrupo(filtroGrupo, filtros);

    if (error) {
      setErrorObs(error);
      setObservaciones([]);
    } else {
      setObservaciones(data?.observaciones ?? []);
      setTotalObs(data?.total ?? 0);
      setObsAbiertas(data?.observaciones_abiertas ?? 0);
    }
    setLoadingObs(false);
  }, [filtroGrupo, filtroTipo, filtroFecha]);

  useEffect(() => {
    cargarObservaciones();
  }, [cargarObservaciones]);

  // ── Cargar aprendices cuando cambia la ficha dentro del modal ─────────────
  useEffect(() => {
    if (!modalGrupo) {
      setAprendices([]);
      setForm((p) => ({ ...p, aprendizId: "" }));
      setBusquedaAprendiz("");
      return;
    }
    (async () => {
      setLoadingAprendices(true);
      setBusquedaAprendiz("");
      setForm((p) => ({ ...p, aprendizId: "" }));
      const { data } = await obtenerAprendicesPorGrupo(modalGrupo);
      setAprendices(data);
      setLoadingAprendices(false);
    })();
  }, [modalGrupo]);

  // ── Filtro local: búsqueda por nombre en la tabla ─────────────────────────
  const obsFiltradas = filtroBusqueda.trim()
    ? observaciones.filter((o) =>
        o.aprendizNombre.toLowerCase().includes(filtroBusqueda.trim().toLowerCase())
      )
    : observaciones;

  // ── Aprendices filtrados para el autocomplete del modal ─────────────────────
  const aprendicesFiltrados = busquedaAprendiz.trim()
    ? aprendices.filter(
        (a) =>
          a.nombre.toLowerCase().includes(busquedaAprendiz.trim().toLowerCase()) ||
          a.documento.includes(busquedaAprendiz.trim())
      )
    : aprendices;

  // Aprendiz seleccionado (para mostrar el nombre en el input)
  const aprendizSeleccionado = aprendices.find((a) => String(a.id) === form.aprendizId);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  function seleccionarAprendiz(a) {
    setForm((p) => ({ ...p, aprendizId: String(a.id) }));
    setBusquedaAprendiz("");
    setMostrarDropdown(false);
  }

  function handleBusquedaAprendiz(e) {
    // Si el usuario empieza a escribir, limpia la selección actual
    if (form.aprendizId) setForm((p) => ({ ...p, aprendizId: "" }));
    setBusquedaAprendiz(e.target.value);
    setMostrarDropdown(true);
  }

  // ── Nombre de la ficha activa en la tabla ─────────────────────────────────
  const grupoActivoTabla = grupos.find(
    (g) => String(g.id_grupo ?? g.id) === filtroGrupo
  );
  const subtitulo = grupoActivoTabla
    ? `Ficha ${grupoActivoTabla.numero_ficha} — ${obsAbiertas} abiertas de ${totalObs}`
    : "Selecciona una ficha para ver las observaciones.";

  // ── Helpers del modal ─────────────────────────────────────────────────────
  function abrirModal() {
    setFormError("");
    setForm({ aprendizId: "", tipo: "ACADEMICA", severidad: "LEVE", descripcion: "", notificarLider: false });
    setModalGrupo("");     // el instructor elige la ficha dentro del modal
    setAprendices([]);
    setBusquedaAprendiz("");
    setMostrarModal(true);
  }

  function cerrarModal() {
    setMostrarModal(false);
    setFormError("");
  }

  function limpiarFiltros() {
    setFiltroBusqueda("");
    setFiltroTipo("");
    setFiltroFecha("");
  }

  async function handleGuardar(e) {
    e.preventDefault();

    if (!modalGrupo) { setFormError("Selecciona una ficha."); return; }
    if (!form.aprendizId) { setFormError("Selecciona un aprendiz."); return; }
    if (form.descripcion.trim().length < 20) {
      setFormError("La descripción debe tener al menos 20 caracteres.");
      return;
    }

    setFormError("");
    setGuardando(true);

    const { error } = await crearObservacion({
      idAprendiz: form.aprendizId,
      idGrupo: modalGrupo,
      tipo: form.tipo,
      severidad: form.severidad,
      descripcion: form.descripcion.trim(),
      notificarLider: form.notificarLider,
    });

    setGuardando(false);

    if (error) { setFormError(error); return; }

    cerrarModal();
    // Si la ficha del modal coincide con la que se ve en la tabla, refrescar
    if (modalGrupo === filtroGrupo) cargarObservaciones();
  }

  // ─── Nombre de la ficha seleccionada en el modal ──────────────────────────
  const grupoActivoModal = grupos.find(
    (g) => String(g.id_grupo ?? g.id) === modalGrupo
  );

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="coordinador-panel obs-page">

      {/* ── HEADER + FILTROS DE LA TABLA ── */}
      <div className="coordinador-card">
        <div className="coordinador-card-header obs-header">
          <div>
            <h2>Consultar observaciones</h2>
            <p>{loadingGrupos ? "Cargando fichas…" : subtitulo}</p>
          </div>
          <button className="obs-btn-primary" onClick={abrirModal} disabled={loadingGrupos || grupos.length === 0}>
            + Registrar observación
          </button>
        </div>

        {/* Barra de filtros — solo para filtrar la tabla */}
        <div className="obs-filters">

          {/* Búsqueda por nombre (filtro controlado) */}
          <input
            value={filtroBusqueda}
            placeholder="Buscar por aprendiz"
            onChange={(e) => setFiltroBusqueda(e.target.value)}
          />

          {/* Selector de ficha — cambia qué observaciones se muestran */}
          <select
            value={filtroGrupo}
            onChange={(e) => setFiltroGrupo(e.target.value)}
            disabled={loadingGrupos}
          >
            {loadingGrupos ? (
              <option>Cargando…</option>
            ) : grupos.length === 0 ? (
              <option value="">Sin fichas</option>
            ) : (
              grupos.map((g) => {
                const id = String(g.id_grupo ?? g.id);
                return (
                  <option key={id} value={id}>
                    {g.numero_ficha}{" "}
                    {g.programa_formacion?.nombre_programa
                      ? `(${g.programa_formacion.nombre_programa.substring(0, 10)}…)`
                      : ""}
                  </option>
                );
              })
            )}
          </select>

          {/* Tipo */}
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Tipo</option>
            <option value="ACADEMICA">Académica</option>
            <option value="CONVIVENCIAL">Convivencial</option>
          </select>

          {/* Fecha desde */}
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            title="Desde esta fecha"
          />

          <button className="obs-btn-secondary" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>
      </div>

      {/* ── TABLA DE OBSERVACIONES ── */}
      <div className="coordinador-card">
        <h2>Observaciones registradas</h2>

        {errorObs && !loadingObs && (
          <div style={{ margin: "16px 0", padding: "12px 16px", background: "#fff1f2", borderRadius: 8, color: "#dc2626", fontSize: 13, fontWeight: 700 }}>
            {errorObs}{" "}
            <button onClick={cargarObservaciones} style={{ marginLeft: 10, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 900 }}>
              Reintentar
            </button>
          </div>
        )}

        {loadingObs && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#6b7a8b", fontSize: 13, fontWeight: 700 }}>
            Cargando observaciones…
          </div>
        )}

        {!loadingObs && !errorObs && obsFiltradas.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7a8b" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
              {filtroBusqueda ? "Sin resultados para la búsqueda" : "No hay observaciones en esta ficha"}
            </p>
            <p style={{ fontSize: 12, margin: "4px 0 0", color: "#9aa5b1" }}>
              {filtroBusqueda ? "Ajusta el nombre buscado" : "Registra la primera observación"}
            </p>
          </div>
        )}

        {!loadingObs && !errorObs && obsFiltradas.length > 0 && (
          <div className="obs-table">
            <table>
              <thead>
                <tr>
                  <th>Aprendiz</th>
                  <th>Documento</th>
                  <th>Tipo</th>
                  <th>Severidad</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Autor</th>
                </tr>
              </thead>
              <tbody>
                {obsFiltradas.map((obs) => (
                  <tr key={obs.id}>
                    <td style={{ fontWeight: 700 }}>{obs.aprendizNombre}</td>
                    <td style={{ color: "#6b7a8b" }}>{obs.aprendizDocumento || "—"}</td>
                    <td>{TIPO_LABELS[obs.tipo] ?? obs.tipo}</td>
                    <td><BadgeSeveridad severidad={obs.severidad} /></td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 999,
                        background: obs.estado === "ABIERTA" ? "#e0f2fe" : "#f1f5f9",
                        color: obs.estado === "ABIERTA" ? "#0369a1" : "#64748b",
                      }}>
                        {obs.estado}
                      </span>
                    </td>
                    <td>{formatFecha(obs.fecha)}</td>
                    <td style={{ color: "#6b7a8b" }}>{obs.autor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL — completamente independiente de los filtros ── */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <span className="modal-tag">NUEVO REGISTRO</span>
            <h2>Registrar observación</h2>

            <form onSubmit={handleGuardar}>

              {/* ── PASO 1: Seleccionar la ficha ── */}
              <div className="modal-full" style={{ marginTop: 20 }}>
                <label>
                  Ficha / Grupo formativo
                  <span style={{ color: "#9aa5b1", fontWeight: 600, marginLeft: 6, fontSize: 12 }}>
                    (selecciona primero)
                  </span>
                </label>
                <select
                  value={modalGrupo}
                  onChange={(e) => setModalGrupo(e.target.value)}
                  style={{ height: 38, border: "1px solid #d7e0ea", borderRadius: 8, padding: "0 11px", fontSize: 13, fontWeight: 700, color: "#0b2442", outline: 0, width: "100%" }}
                >
                  <option value="">— Selecciona una ficha —</option>
                  {grupos.map((g) => {
                    const id = String(g.id_grupo ?? g.id);
                    return (
                      <option key={id} value={id}>
                        {g.numero_ficha}
                        {g.programa_formacion?.nombre_programa
                          ? ` — ${g.programa_formacion.nombre_programa}`
                          : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* ── PASO 2: Buscar y seleccionar el aprendiz ── */}
              <div className="modal-full" style={{ opacity: modalGrupo ? 1 : 0.4, pointerEvents: modalGrupo ? "auto" : "none", position: "relative" }}>
                <label>
                  Aprendiz
                  {grupoActivoModal && (
                    <span style={{ color: "#39a900", fontWeight: 700, marginLeft: 6, fontSize: 12 }}>
                      — ficha {grupoActivoModal.numero_ficha}
                    </span>
                  )}
                </label>

                {/* Input único: muestra el seleccionado o permite buscar */}
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder={loadingAprendices ? "Cargando aprendices…" : "Escribe el nombre o documento…"}
                    value={aprendizSeleccionado ? aprendizSeleccionado.nombre + (aprendizSeleccionado.documento ? ` (${aprendizSeleccionado.documento})` : "") : busquedaAprendiz}
                    onChange={handleBusquedaAprendiz}
                    onFocus={() => { if (!form.aprendizId) setMostrarDropdown(true); }}
                    disabled={!modalGrupo || loadingAprendices}
                    autoComplete="off"
                    style={{
                      height: 38, width: "100%", boxSizing: "border-box",
                      border: `1px solid ${aprendizSeleccionado ? "#39a900" : "#d7e0ea"}`,
                      borderRadius: 8, padding: "0 36px 0 11px",
                      fontSize: 13, fontWeight: 700,
                      color: aprendizSeleccionado ? "#0b2442" : "#6b7a8b",
                      outline: 0, background: aprendizSeleccionado ? "#f0fbe9" : "#fff"
                    }}
                  />
                  {/* Botón para limpiar selección */}
                  {(aprendizSeleccionado || busquedaAprendiz) && (
                    <button
                      type="button"
                      onClick={() => { setForm((p) => ({ ...p, aprendizId: "" })); setBusquedaAprendiz(""); setMostrarDropdown(false); }}
                      style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9aa5b1", fontSize: 16, lineHeight: 1, padding: 2 }}
                      title="Limpiar selección"
                    >✕</button>
                  )}
                </div>

                {/* Dropdown de resultados */}
                {mostrarDropdown && !aprendizSeleccionado && modalGrupo && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                    background: "#fff", border: "1px solid #d7e0ea", borderRadius: 8,
                    boxShadow: "0 8px 24px rgba(9,36,68,0.12)", maxHeight: 200, overflowY: "auto",
                    marginTop: 4
                  }}>
                    {aprendicesFiltrados.length === 0 ? (
                      <div style={{ padding: "12px 14px", fontSize: 13, color: "#9aa5b1", fontWeight: 600 }}>
                        {aprendices.length === 0 ? "Sin aprendices activos en esta ficha" : "Sin resultados"}
                      </div>
                    ) : (
                      aprendicesFiltrados.map((a) => (
                        <div
                          key={a.id}
                          onMouseDown={() => seleccionarAprendiz(a)}
                          style={{
                            padding: "10px 14px", cursor: "pointer",
                            fontSize: 13, fontWeight: 700, color: "#0b2442",
                            borderBottom: "1px solid #f1f5f9",
                            transition: "background 0.15s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f0fbe9"}
                          onMouseLeave={(e) => e.currentTarget.style.background = ""}
                        >
                          {a.nombre}
                          {a.documento && <span style={{ color: "#9aa5b1", marginLeft: 6, fontWeight: 600 }}>{a.documento}</span>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* ── Tipo y Severidad ── */}
              <div className="modal-grid" style={{ opacity: form.aprendizId ? 1 : 0.4, pointerEvents: form.aprendizId ? "auto" : "none" }}>
                <div>
                  <label>Tipo</label>
                  <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
                    <option value="ACADEMICA">Académica</option>
                    <option value="CONVIVENCIAL">Convivencial</option>
                  </select>
                </div>
                <div>
                  <label>Severidad</label>
                  <select value={form.severidad} onChange={(e) => setForm((p) => ({ ...p, severidad: e.target.value }))}>
                    <option value="LEVE">Leve</option>
                    <option value="MODERADA">Moderada</option>
                    <option value="GRAVE">Grave</option>
                  </select>
                </div>
              </div>

              {/* ── Descripción ── */}
              <div className="modal-full" style={{ opacity: form.aprendizId ? 1 : 0.4, pointerEvents: form.aprendizId ? "auto" : "none" }}>
                <label>
                  Descripción{" "}
                  <span style={{ color: "#9aa5b1", fontWeight: 600, fontSize: 12 }}>(mín. 20 caracteres)</span>
                </label>
                <textarea
                  placeholder="Describe la situación observada con detalle suficiente…"
                  value={form.descripcion}
                  onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                />
                <span style={{ fontSize: 11, color: form.descripcion.length >= 20 ? "#39a900" : "#9aa5b1", textAlign: "right", fontWeight: 700 }}>
                  {form.descripcion.length} caracteres
                </span>
              </div>

              {/* ── Notificar al líder ── */}
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13, fontWeight: 700, color: "#0b2442", cursor: "pointer", opacity: form.aprendizId ? 1 : 0.4 }}>
                <input
                  type="checkbox"
                  checked={form.notificarLider}
                  onChange={(e) => setForm((p) => ({ ...p, notificarLider: e.target.checked }))}
                  disabled={!form.aprendizId}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                Notificar al instructor líder de la ficha
              </label>

              {/* ── Error ── */}
              {formError && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff1f2", borderRadius: 8, color: "#dc2626", fontSize: 13, fontWeight: 700 }}>
                  {formError}
                </div>
              )}

              {/* ── Acciones ── */}
              <div className="modal-actions">
                <button type="button" onClick={cerrarModal} disabled={guardando}>
                  Cancelar
                </button>
                <button type="submit" className="obs-btn-primary" disabled={guardando || !form.aprendizId || !modalGrupo}>
                  {guardando ? "Guardando…" : "Guardar observación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}