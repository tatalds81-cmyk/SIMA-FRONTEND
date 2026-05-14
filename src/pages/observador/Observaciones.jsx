import { useEffect, useState } from "react";
import "./Observaciones.css";

export default function Observaciones() {
  const API_URL = "/api";

  // ─── Auth helpers ───────────────────────────────────────────────────────────
  function safeParse(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch {
      return null;
    }
  }

  const usuario = safeParse("user_data") || safeParse("usuario") || {};

  const rol = (
    localStorage.getItem("rol") ||
    usuario?.rol ||
    usuario?.tipo_rol ||
    ""
  ).toLowerCase();

  const esInstructor = rol === "instructor";

  function getHeaders() {
    const token =
      localStorage.getItem("access") || localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token && token !== "undefined") {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  // ─── Fecha de hoy para max en inputs (evita fechas futuras) ─────────────────
  const hoy = new Date().toISOString().split("T")[0];

  // ─── Formatea ISO a dd/mm/aaaa hh:mm ────────────────────────────────────────
  function formatFecha(iso) {
    if (!iso) return "Sin fecha";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ─── State principal ─────────────────────────────────────────────────────────
  const [fichas, setFichas] = useState([]);
  // Recupera la última ficha seleccionada de sessionStorage
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(
    () => sessionStorage.getItem("obs_grupo_seleccionado") || ""
  );

  const [observaciones, setObservaciones] = useState([]);
  const [total, setTotal] = useState(0);
  const [observacionesAbiertas, setObservacionesAbiertas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(1);
  const LIMIT = 10;

  const [filtros, setFiltros] = useState({
    id_aprendiz: "",
    tipo: "",
    severidad: "",
    estado: "",
    fecha_desde: "",
    fecha_hasta: "",
  });

  const [aprendices, setAprendices] = useState([]);

  // Modal de registro/edición
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    id_aprendiz: "",
    tipo_observacion: "ACADEMICA",
    severidad: "LEVE",
    descripcion: "",
    notificar_lider: false,
  });
  const [mostrarDropdownModal, setMostrarDropdownModal] = useState(false);
  const [busquedaModal, setBusquedaModal] = useState("");

  // Modal de historial
  const [historial, setHistorial] = useState([]);
  const [totalHistorial, setTotalHistorial] = useState(0);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [aprendizHistorial, setAprendizHistorial] = useState(null);

  // ─── Carga inicial de fichas ─────────────────────────────────────────────────
  useEffect(() => {
    fetchFichas();
  }, []);

  // ─── Cuando cambia grupo, página o filtros → recarga ─────────────────────────
  useEffect(() => {
    if (!grupoSeleccionado) return;
    // Persiste la ficha seleccionada para que sobreviva cambios de pestaña
    sessionStorage.setItem("obs_grupo_seleccionado", grupoSeleccionado);
    fetchObservaciones();
    fetchAprendices();
  }, [grupoSeleccionado, pagina, filtros]);

  // ─── API calls ───────────────────────────────────────────────────────────────
  async function fetchFichas() {
    try {
      const res = await fetch(`${API_URL}/apprentices/grupos-activos`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("No se pudieron cargar las fichas");
      const data = await res.json();
      const lista = data?.data || [];
      setFichas(Array.isArray(lista) ? lista : []);

      // Solo establece el primer grupo si no hay uno guardado en sessionStorage
      if (Array.isArray(lista) && lista.length > 0 && !grupoSeleccionado) {
        setGrupoSeleccionado(String(lista[0].id_grupo));
      }
    } catch (error) {
      console.error(error);
      setFichas([]);
    }
  }

  async function fetchAprendices() {
    try {
      const res = await fetch(
        `${API_URL}/apprentices/grupo/${grupoSeleccionado}`,
        { headers: getHeaders() }
      );
      if (!res.ok) throw new Error("No se pudieron cargar aprendices");
      const data = await res.json();
      const lista = data?.data?.aprendices || [];
      setAprendices(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error(error);
      setAprendices([]);
    }
  }

  async function fetchObservaciones() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagina);
      params.append("limit", LIMIT);

      if (filtros.id_aprendiz) params.append("id_aprendiz", filtros.id_aprendiz);
      if (filtros.tipo) params.append("tipo_observacion", filtros.tipo);
      if (filtros.severidad) params.append("severidad", filtros.severidad);
      if (filtros.estado) params.append("estado", filtros.estado);
      if (filtros.fecha_desde) params.append("fecha_desde", filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append("fecha_hasta", filtros.fecha_hasta);

      const res = await fetch(
        `${API_URL}/observations/group/${grupoSeleccionado}?${params}`,
        { headers: getHeaders() }
      );
      if (!res.ok) throw new Error("Error cargando observaciones");
      const data = await res.json();

      setObservaciones(data?.data?.observaciones || []);
      setTotal(data?.data?.total || 0);
      setObservacionesAbiertas(data?.data?.observaciones_abiertas ?? 0);
    } catch (error) {
      console.error(error);
      setObservaciones([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistorial(idAprendiz, nombreAprendiz) {
    try {
      const params = new URLSearchParams();
      params.append("id_grupo", grupoSeleccionado);
      const res = await fetch(
        `${API_URL}/observations/apprentice/${idAprendiz}?${params}`,
        { headers: getHeaders() }
      );
      if (!res.ok) throw new Error("No se pudo cargar el historial");
      const data = await res.json();
      const lista = data?.data?.observaciones || [];
      setHistorial(lista);
      setTotalHistorial(data?.data?.total || 0);
      setAprendizHistorial(nombreAprendiz);
      setMostrarHistorial(true);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function handleSubmit() {
    if (!grupoSeleccionado) {
      alert("Debes seleccionar una ficha");
      return;
    }
    if (!form.id_aprendiz) {
      alert("Selecciona un aprendiz");
      return;
    }
    if (form.descripcion.trim().length < 20) {
      alert("La descripción debe tener mínimo 20 caracteres");
      return;
    }

    try {
      const payload = editando
        ? {
            tipo_observacion: form.tipo_observacion,
            severidad: form.severidad,
            descripcion: form.descripcion.trim(),
          }
        : {
            id_aprendiz: Number(form.id_aprendiz),
            id_grupo: Number(grupoSeleccionado),
            tipo_observacion: form.tipo_observacion,
            severidad: form.severidad,
            descripcion: form.descripcion.trim(),
            notificar_lider: form.notificar_lider,
          };

      const url = editando
        ? `${API_URL}/observations/${editando}`
        : `${API_URL}/observations`;

      const method = editando ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "Error guardando observación"
        );
      }

      cerrarModal();
      fetchObservaciones();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  // ─── Helpers UI ──────────────────────────────────────────────────────────────
  function handleEditar(obs) {
    setEditando(obs.id_observacion || obs.id);
    setForm({
      id_aprendiz: obs.id_aprendiz,
      tipo_observacion: obs.tipo_observacion,
      severidad: obs.severidad,
      descripcion: obs.descripcion,
      notificar_lider: false,
    });
    setMostrarModal(true);
  }

  function cerrarModal() {
    setMostrarModal(false);
    setEditando(null);
    setMostrarDropdownModal(false);
    setBusquedaModal("");
    setForm({
      id_aprendiz: "",
      tipo_observacion: "ACADEMICA",
      severidad: "LEVE",
      descripcion: "",
      notificar_lider: false,
    });
  }

  function limpiarFiltros() {
    setFiltros({
      id_aprendiz: "",
      tipo: "",
      severidad: "",
      estado: "",
      fecha_desde: "",
      fecha_hasta: "",
    });
    setPagina(1);
  }

  function getNombreAprendiz(obs) {
    const p = obs.aprendiz?.usuario?.persona;
    return p ? `${p.nombres} ${p.apellidos}` : "Sin nombre";
  }

  function getNombreInstructor(obs) {
    const p = obs.instructor?.usuario?.persona;
    return p ? `${p.nombres} ${p.apellidos}` : "Instructor";
  }

  const totalPaginas = Math.ceil(total / LIMIT);

  const aprendizSeleccionadoModal = aprendices.find(
    (a) => Number(a.id_aprendiz) === Number(form.id_aprendiz)
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="coordinador-panel obs-page">

      {/* ── Encabezado + filtros ── */}
      <div className="coordinador-card">
        <div className="coordinador-card-header obs-header">
          <div>
            <h2>Consultar observaciones</h2>
            <p>Visualiza y administra observaciones del grupo.</p>
          </div>

          {esInstructor && (
            <button
              className="obs-btn-primary"
              onClick={() => {
                cerrarModal();
                setMostrarModal(true);
              }}
            >
              + Registrar observación
            </button>
          )}
        </div>

        {/* Stats rápidas */}
        {grupoSeleccionado && (
          <div className="obs-stats">
            <span className="badge leve">Total: {total}</span>
            <span className="badge abierta">Abiertas: {observacionesAbiertas}</span>
          </div>
        )}

        {/* Fila 1 de filtros */}
        <div className="obs-filters">
          <select
            value={grupoSeleccionado}
            onChange={(e) => {
              setGrupoSeleccionado(e.target.value);
              setPagina(1);
              setFiltros((f) => ({ ...f, id_aprendiz: "" }));
            }}
          >
            <option value="">Seleccione ficha</option>
            {fichas.map((grupo) => (
              <option key={grupo.id_grupo} value={grupo.id_grupo}>
                Ficha {grupo.numero_ficha}
              </option>
            ))}
          </select>

          <select
            value={filtros.id_aprendiz}
            onChange={(e) => {
              setFiltros({ ...filtros, id_aprendiz: e.target.value });
              setPagina(1);
            }}
          >
            <option value="">Todos los aprendices</option>
            {aprendices.map((a) => (
              <option key={a.id_aprendiz} value={a.id_aprendiz}>
                {a.nombre_completo}
              </option>
            ))}
          </select>

          <select
            value={filtros.tipo}
            onChange={(e) => {
              setFiltros({ ...filtros, tipo: e.target.value });
              setPagina(1);
            }}
          >
            <option value="">Tipo</option>
            <option value="ACADEMICA">ACADEMICA</option>
            <option value="CONVIVENCIAL">CONVIVENCIAL</option>
          </select>

          <select
            value={filtros.severidad}
            onChange={(e) => {
              setFiltros({ ...filtros, severidad: e.target.value });
              setPagina(1);
            }}
          >
            <option value="">Severidad</option>
            <option value="LEVE">LEVE</option>
            <option value="MODERADA">MODERADA</option>
            <option value="GRAVE">GRAVE</option>
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => {
              setFiltros({ ...filtros, estado: e.target.value });
              setPagina(1);
            }}
          >
            <option value="">Estado</option>
            <option value="ABIERTA">ABIERTA</option>
            <option value="CERRADA">CERRADA</option>
          </select>
        </div>

        {/* Fila 2: fechas separadas para no repetir la columna en tabla */}
        <div className="obs-filters-dates">
          <input
            type="date"
            value={filtros.fecha_desde}
            max={hoy}
            onChange={(e) => {
              setFiltros({ ...filtros, fecha_desde: e.target.value });
              setPagina(1);
            }}
          />
          <input
            type="date"
            value={filtros.fecha_hasta}
            max={hoy}
            onChange={(e) => {
              setFiltros({ ...filtros, fecha_hasta: e.target.value });
              setPagina(1);
            }}
          />
          <button className="obs-btn-secondary" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>
      </div>

      {/* ── Tabla de observaciones ── */}
      <div className="coordinador-card">
        <h2>Observaciones registradas</h2>

        {loading ? (
          <p style={{ color: "var(--sima-muted)", fontSize: 13 }}>Cargando...</p>
        ) : (
          <>
            <div className="obs-table">
              <table>
                <thead>
                  <tr>
                    <th>Aprendiz</th>
                    <th>Tipo</th>
                    <th>Severidad</th>
                    <th>Estado</th>
                    <th>Descripción</th>
                    <th>Fecha</th>
                    <th>Autor</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {observaciones.length > 0 ? (
                    observaciones.map((obs) => (
                      <tr key={obs.id_observacion}>
                        <td>{getNombreAprendiz(obs)}</td>
                        <td>
                          <span className={`badge ${(obs.tipo_observacion || "").toLowerCase()}`}>
                            {obs.tipo_observacion}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${(obs.severidad || "").toLowerCase()}`}>
                            {obs.severidad}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${(obs.estado || "").toLowerCase()}`}>
                            {obs.estado}
                          </span>
                        </td>
                        <td>
                          {obs.descripcion?.length > 80
                            ? obs.descripcion.slice(0, 80) + "..."
                            : obs.descripcion}
                        </td>
                        {/* Fecha formateada — sin duplicado */}
                        <td>{formatFecha(obs.fecha_observacion)}</td>
                        <td>{getNombreInstructor(obs)}</td>
                        <td>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() =>
                                fetchHistorial(
                                  obs.id_aprendiz,
                                  getNombreAprendiz(obs)
                                )
                              }
                            >
                              Historial
                            </button>

                            {esInstructor && obs.estado === "ABIERTA" && (
                              <button onClick={() => handleEditar(obs)}>
                                Editar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="obs-empty">
                        {grupoSeleccionado
                          ? "No hay observaciones registradas para este grupo"
                          : "Selecciona una ficha para ver observaciones"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="obs-pagination">
              <span>Total registros: {total}</span>
              <div className="obs-pagination-btns">
                <button
                  disabled={pagina === 1}
                  onClick={() => setPagina(pagina - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {pagina}{totalPaginas > 0 ? ` de ${totalPaginas}` : ""}
                </span>
                <button
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina(pagina + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal registro / edición ── */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <span className="modal-tag">
              {editando ? "EDITANDO" : "NUEVO REGISTRO"}
            </span>

            <h2>{editando ? "Editar observación" : "Registrar observación"}</h2>

            <div className="modal-grid">
              <div>
                <label>Aprendiz</label>
                <div className="multi-select">
                  <button
                    type="button"
                    className="multi-select-trigger"
                    disabled={!!editando}
                    onClick={() =>
                      !editando && setMostrarDropdownModal(!mostrarDropdownModal)
                    }
                  >
                    {aprendizSeleccionadoModal?.nombre_completo ||
                      (form.id_aprendiz ? "Aprendiz seleccionado" : "Seleccione")}
                  </button>

                  {mostrarDropdownModal && !editando && (
                    <div className="multi-select-dropdown">
                      <input
                        type="text"
                        placeholder="Buscar aprendiz..."
                        value={busquedaModal}
                        onChange={(e) => setBusquedaModal(e.target.value)}
                        className="multi-select-search"
                      />
                      <div className="multi-select-options">
                        {aprendices
                          .filter((a) =>
                            (a.nombre_completo || "")
                              .toLowerCase()
                              .includes(busquedaModal.toLowerCase())
                          )
                          .map((a) => (
                            <label
                              key={a.id_aprendiz}
                              className="multi-select-option"
                            >
                              <input
                                type="radio"
                                name="aprendiz"
                                checked={
                                  Number(form.id_aprendiz) ===
                                  Number(a.id_aprendiz)
                                }
                                onChange={() => {
                                  setForm({ ...form, id_aprendiz: a.id_aprendiz });
                                  setMostrarDropdownModal(false);
                                  setBusquedaModal("");
                                }}
                              />
                              <span>{a.nombre_completo}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label>Tipo</label>
                <select
                  value={form.tipo_observacion}
                  onChange={(e) =>
                    setForm({ ...form, tipo_observacion: e.target.value })
                  }
                >
                  <option value="ACADEMICA">Académica</option>
                  <option value="CONVIVENCIAL">Convivencial</option>
                </select>
              </div>

              <div>
                <label>Severidad</label>
                <select
                  value={form.severidad}
                  onChange={(e) =>
                    setForm({ ...form, severidad: e.target.value })
                  }
                >
                  <option value="LEVE">Leve</option>
                  <option value="MODERADA">Moderada</option>
                  <option value="GRAVE">Grave</option>
                </select>
              </div>
            </div>

            <div className="modal-full">
              <label>Descripción</label>
              <textarea
                placeholder="Describe la observación (mínimo 20 caracteres)..."
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
              />
              <small style={{ color: form.descripcion.trim().length < 20 ? "var(--sima-red)" : "var(--sima-green-dark)" }}>
                {form.descripcion.trim().length} / 20 caracteres mínimo
              </small>
            </div>

            {!editando && (
              <div style={{ marginTop: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={form.notificar_lider}
                    onChange={(e) =>
                      setForm({ ...form, notificar_lider: e.target.checked })
                    }
                  />
                  Notificar al instructor líder
                </label>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={cerrarModal}>Cancelar</button>
              <button className="obs-btn-primary" onClick={handleSubmit}>
                {editando ? "Actualizar" : "Guardar observación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal historial ── */}
      {mostrarHistorial && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>
              Historial de observaciones
              {aprendizHistorial && (
                <span style={{ fontWeight: 400, fontSize: "0.82em", marginLeft: 8, color: "var(--sima-muted)" }}>
                  — {aprendizHistorial}
                </span>
              )}
            </h2>

            <p style={{ marginBottom: 16, marginTop: 6, color: "var(--sima-muted)", fontSize: 13, fontWeight: 700 }}>
              {totalHistorial} observación{totalHistorial !== 1 ? "es" : ""} registrada{totalHistorial !== 1 ? "s" : ""}
            </p>

            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {historial.length > 0 ? (
                historial.map((item) => (
                  <div key={item.id_observacion} className="historial-item">
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span className={`badge ${(item.tipo_observacion || "").toLowerCase()}`}>
                        {item.tipo_observacion}
                      </span>
                      <span className={`badge ${(item.severidad || "").toLowerCase()}`}>
                        {item.severidad}
                      </span>
                      <span className={`badge ${(item.estado || "").toLowerCase()}`}>
                        {item.estado}
                      </span>
                    </div>
                    <p><strong>Fecha:</strong> {formatFecha(item.fecha_observacion)}</p>
                    <p><strong>Descripción:</strong> {item.descripcion}</p>
                    <p className="historial-meta">
                      <strong>Instructor:</strong>{" "}
                      {item.instructor?.usuario?.persona
                        ? `${item.instructor.usuario.persona.nombres} ${item.instructor.usuario.persona.apellidos}`
                        : "Sin datos"}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--sima-muted)", fontSize: 13 }}>
                  No hay observaciones disponibles para este aprendiz.
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setMostrarHistorial(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
