import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Edit3,
  Eye,
  Fingerprint,
  QrCode,
  Save,
  Search,
} from "lucide-react";
import SimaPagination from "../../components/common/SimaPagination";
import "../coordinador/coordinador.css";
import "../fichas/fichas.css";
import "./instructor.css";

const API_URL = "/api";
const APRENDICES_POR_PAGINA = 5;
const ESTADOS = {
  presente: { label: "Presente", color: "#22c55e" },
  ausente: { label: "Ausente", color: "#ef4444" },
  retardado: { label: "Retardado", color: "#f59e0b" },
  justificado: { label: "Justificado", color: "#3b82f6" }
};

const APRENDICES_BASE = [
  { id: 1, nombre: "Anderson Mosquera", hora: "8:00 a.m.", estado: "presente", metodo: "Manual" },
  { id: 2, nombre: "Jorgue crucerira", hora: "7:58 a.m.", estado: "presente", metodo: "Huella" },
  { id: 3, nombre: "Laura Agredo", hora: "8:12 a.m.", estado: "retardado", metodo: "QR" },
  { id: 4, nombre: "Melva Ceron", hora: "-", estado: "ausente", metodo: "-" },
  { id: 5, nombre: "Tatiana Ruco", hora: "7:25 a.m.", estado: "presente", metodo: "Huella" },
  { id: 6, nombre: "Felipe Perez", hora: "8:05 a.m.", estado: "presente", metodo: "QR" },
  { id: 7, nombre: "Esteban Benavides", hora: "8:00 a.m.", estado: "presente", metodo: "Manual" },
  { id: 8, nombre: "johan de jesus", hora: "7:55 a.m.", estado: "presente", metodo: "Huella" },
  { id: 9, nombre: "Jefferson Pineda", hora: "8:15 a.m.", estado: "retardado", metodo: "QR" },
  { id: 10, nombre: "Mariana Rios", hora: "-", estado: "ausente", metodo: "-" },
  { id: 11, nombre: "Sebastian Dorado", hora: "7:50 a.m.", estado: "presente", metodo: "Huella" },
  { id: 12, nombre: "Cristian Rivillas", hora: "8:02 a.m.", estado: "presente", metodo: "Manual" },
  { id: 13, nombre: "Sebastian Garces", hora: "8:10 a.m.", estado: "retardado", metodo: "QR" },
  { id: 14, nombre: "Mauricio Carbajal", hora: "7:58 a.m.", estado: "presente", metodo: "Huella" },
  { id: 15, nombre: "Sebastian Cardona", hora: "7:58 a.m.", estado: "presente", metodo: "Huella" },
  { id: 16, nombre: "jhonathan Popo", hora: "7:58 a.m.", estado: "presente", metodo: "Huella" }
];

function getHeaders() {
  const token = localStorage.getItem("access") || localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token && token !== "undefined") headers.Authorization = `Bearer ${token}`;
  return headers;
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function extraerLista(data, llave = "") {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  if (llave && Array.isArray(data?.data?.[llave])) return data.data[llave];
  if (llave && Array.isArray(data?.[llave])) return data[llave];
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function obtenerCodigo(grupo) {
  return grupo?.numero_ficha || grupo?.numero_grupo || grupo?.codigo || grupo?.ficha || grupo?.id_grupo || "ADSO - 301";
}

function obtenerPrograma(grupo) {
  return (
    grupo?.programa_formacion?.nombre_programa ||
    grupo?.programa?.nombre_programa ||
    grupo?.nombre_programa ||
    grupo?.programa ||
    "Analisis y Desarrollo de Software"
  );
}

function obtenerIdGrupo(grupo) {
  return grupo?.id_grupo || grupo?.id || grupo?.codigo || grupo?.numero_ficha || "";
}

function obtenerNombreAprendiz(aprendiz, index) {
  const persona = aprendiz?.usuario?.persona || aprendiz?.persona || aprendiz?.aprendiz?.usuario?.persona || {};
  const nombre = `${persona.nombres || ""} ${persona.apellidos || ""}`.trim();
  return nombre || aprendiz?.nombre || aprendiz?.aprendizNombre || `Aprendiz ${index + 1}`;
}

function prepararAprendiz(aprendiz, index) {
  const estados = ["presente", "presente", "retardado", "ausente"];
  const metodos = ["Manual", "Huella", "QR", "-"];
  const estado = aprendiz.estado_asistencia || aprendiz.estado || estados[index % estados.length];

  return {
    id: aprendiz.id_aprendiz || aprendiz.id || index + 1,
    nombre: obtenerNombreAprendiz(aprendiz, index),
    hora: aprendiz.hora_registro || aprendiz.hora || (estado === "ausente" ? "-" : "8:00 a.m."),
    estado: String(estado).toLowerCase(),
    metodo: aprendiz.metodo_registro || aprendiz.metodo || metodos[index % metodos.length]
  };
}

function formatearFecha(fechaISO) {
  const fecha = new Date(`${fechaISO}T12:00:00`);
  return fecha.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

function obtenerHoraActual() {
  return new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function AsistenciaInstructor() {
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
  const [aprendices, setAprendices] = useState(APRENDICES_BASE);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modoManual, setModoManual] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [fecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mensajeError, setMensajeError] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarGrupos() {
      try {
        const endpoints = [
          `${API_URL}/groups/mis-grupos`,
          `${API_URL}/groups/instructor`,
          `${API_URL}/groups`
        ];

        for (const endpoint of endpoints) {
          const res = await fetch(endpoint, { headers: getHeaders() }).catch(() => null);
          if (!res || !res.ok) continue;

          const data = await res.json().catch(() => null);
          const lista = extraerLista(data, "grupos").length
            ? extraerLista(data, "grupos")
            : extraerLista(data, "fichas");

          if (activo && lista.length) {
            setGrupos(lista);
            setGrupoSeleccionado(String(obtenerIdGrupo(lista[0])));
            return;
          }
        }
      } catch (error) {
        console.error("Error cargando grupos para asistencia:", error);
      }
    }

    cargarGrupos();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;

    async function cargarAprendices() {
      if (!grupoSeleccionado) return;
      setCargando(true);

      try {
        const res = await fetch(`${API_URL}/apprentices/grupo/${grupoSeleccionado}`, {
          headers: getHeaders()
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) throw new Error(data?.message || data?.error || "No fue posible cargar aprendices.");

        const lista = extraerLista(data, "aprendices");
        if (activo) setAprendices(lista.length ? lista.map(prepararAprendiz) : APRENDICES_BASE);
      } catch (error) {
        console.error("Error cargando aprendices para asistencia:", error);
        if (activo) setAprendices(APRENDICES_BASE);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarAprendices();
    return () => {
      activo = false;
    };
  }, [grupoSeleccionado]);

  const grupoActual = useMemo(
    () => grupos.find((grupo) => String(obtenerIdGrupo(grupo)) === String(grupoSeleccionado)) || grupos[0] || null,
    [grupoSeleccionado, grupos]
  );

  const aprendicesFiltrados = useMemo(() => {
    const texto = normalizarTexto(busqueda);
    return aprendices.filter((aprendiz) => {
      const coincideBusqueda = !texto || normalizarTexto(aprendiz.nombre).includes(texto);
      const coincideEstado = !filtroEstado || aprendiz.estado === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }, [aprendices, busqueda, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(aprendicesFiltrados.length / APRENDICES_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * APRENDICES_POR_PAGINA;
  const aprendicesPagina = aprendicesFiltrados.slice(inicioPagina, inicioPagina + APRENDICES_POR_PAGINA);
  const desde = aprendicesFiltrados.length === 0 ? 0 : inicioPagina + 1;
  const hasta = Math.min(inicioPagina + APRENDICES_POR_PAGINA, aprendicesFiltrados.length);

  const resumen = useMemo(() => {
    const base = { presente: 0, ausente: 0, retardado: 0, justificado: 0 };
    aprendices.forEach((aprendiz) => {
      base[aprendiz.estado] = (base[aprendiz.estado] || 0) + 1;
    });
    return base;
  }, [aprendices]);

  const totalAprendices = aprendices.length || 1;
  const segmentosDonut = useMemo(() => {
    let inicio = 0;
    return Object.entries(resumen).map(([estado, valor]) => {
      const porcentaje = Math.round((valor / totalAprendices) * 100);
      const fin = inicio + porcentaje;
      const segmento = `${ESTADOS[estado].color} ${inicio}% ${fin}%`;
      inicio = fin;
      return segmento;
    });
  }, [resumen, totalAprendices]);
  const porcentajePresentes = Math.round(((resumen.presente || 0) / totalAprendices) * 100);

  function cambiarEstado(id, nuevoEstado) {
    setAprendices((actuales) =>
      actuales.map((aprendiz) =>
        aprendiz.id === id
          ? {
              ...aprendiz,
              estado: nuevoEstado,
              hora: nuevoEstado === "ausente" ? "-" : aprendiz.hora === "-" ? obtenerHoraActual() : aprendiz.hora,
              metodo: aprendiz.metodo === "-" && nuevoEstado !== "ausente" ? "Manual" : aprendiz.metodo
            }
          : aprendiz
      )
    );
    setMensaje("");
  }

  function guardarAsistencia() {
    setMensajeError(false);
    setMensaje("Asistencia actualizada en pantalla. Cuando el backend habilite el endpoint, este control quedara listo para persistirla.");
  }

  function cambiarPagina(nuevaPagina) {
    setPaginaActual(Math.min(Math.max(nuevaPagina, 1), totalPaginas));
  }

  return (
    <div className="coordinador-panel instructor-panel-v2 asistencia-instructor">
      <section className="dashboard-welcome asistencia-page-title">
        <section className="dashboard-role-welcome">
          <h1>Asistencia</h1>
        </section>
      </section>

      {mensaje && <div className={`grupos-alert ${mensajeError ? "danger" : "info"}`}>{mensaje}</div>}

      <section className="asistencia-hero coordinador-card">
        <h2>Control de Asistencia de Aprendices</h2>
        <div className="asistencia-hero-grid">
          <div>
            <span>Ficha:</span>
            <strong>{obtenerCodigo(grupoActual)}</strong>
          </div>
          <div>
            <span>Programa:</span>
            <strong>{obtenerPrograma(grupoActual)}</strong>
          </div>
          <div>
            <span>Instructor lider:</span>
            <strong>{grupoActual?.instructor_lider?.usuario?.persona?.nombres || "Jorge Molina"}</strong>
          </div>
          <div>
            <span>Fecha:</span>
            <strong>{formatearFecha(fecha)}</strong>
          </div>
          <div>
            <span>Horario:</span>
            <strong>{grupoActual?.horario || grupoActual?.jornada || "7:00 a.m. - 11:00 a.m."}</strong>
          </div>
          <div>
            <span>Estado de sesion:</span>
            <strong className="asistencia-pill success">Activa</strong>
          </div>
        </div>
      </section>

      <section className="asistencia-layout">
        <article className="coordinador-card asistencia-list-card">
          <div className="coordinador-card-header">
            <div>
              <h2>Listado completo de aprendices</h2>
              <p>Gestion de asistencia en tiempo real</p>
            </div>
            <div className="asistencia-header-actions">
              {modoManual && (
                <button type="button" className="coordinador-select-btn" onClick={guardarAsistencia}>
                  <Save size={15} />
                  Guardar cambios
                </button>
              )}
              <button
                type="button"
                className={`asistencia-manual-toggle ${modoManual ? "active" : ""}`}
                onClick={() => setModoManual((actual) => !actual)}
              >
                {modoManual ? "Ocultar Manual" : "Manual"}
              </button>
            </div>
          </div>

          <div className="asistencia-toolbar">
            <div className="grupos-search asistencia-search">
              <Search size={18} />
              <input
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                placeholder="Buscar aprendiz..."
              />
            </div>

            <select
              className="grupos-select-filtro"
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="">Filtrar por estado</option>
              {Object.entries(ESTADOS).map(([estado, item]) => (
                <option key={estado} value={estado}>{item.label}</option>
              ))}
            </select>
          </div>

          <div className="asistencia-table-wrap">
            <table className={`asistencia-table ${modoManual ? "manual-active" : ""}`}>
              <thead>
                <tr>
                  <th>Aprendiz</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th>Metodo</th>
                  {modoManual && (
                    <>
                      <th>Asistencia manual</th>
                      <th>Justificacion</th>
                    </>
                  )}
                  {!modoManual && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={modoManual ? 6 : 5} className="grupos-empty">Cargando aprendices...</td>
                  </tr>
                ) : aprendicesPagina.length ? (
                  aprendicesPagina.map((aprendiz) => (
                    <tr key={aprendiz.id}>
                      <td>{aprendiz.nombre}</td>
                      <td>{aprendiz.hora}</td>
                      <td>
                        <span className={`asistencia-status ${aprendiz.estado}`}>
                          {ESTADOS[aprendiz.estado]?.label || "Sin estado"}
                        </span>
                      </td>
                      <td>{aprendiz.metodo}</td>
                      {modoManual && (
                        <>
                          <td>
                            <label className="asistencia-manual-select">
                              <select
                                value={aprendiz.estado}
                                onChange={(e) => cambiarEstado(aprendiz.id, e.target.value)}
                              >
                                <option value="presente">Presente</option>
                                <option value="ausente">Ausente</option>
                                <option value="retardado">Retardo</option>
                                <option value="justificado">Justificado</option>
                              </select>
                              <ChevronDown size={14} />
                            </label>
                          </td>
                          <td>
                            <button type="button" className="asistencia-icon-action" aria-label={`Editar justificacion de ${aprendiz.nombre}`}>
                              <Edit3 size={15} />
                            </button>
                          </td>
                        </>
                      )}
                      {!modoManual && (
                        <td>
                          <button type="button" className="asistencia-icon-action" aria-label={`Ver asistencia de ${aprendiz.nombre}`}>
                            <Eye size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={modoManual ? 6 : 5} className="grupos-empty">No hay aprendices con esos filtros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <SimaPagination
            desde={desde}
            hasta={hasta}
            total={aprendicesFiltrados.length}
            entidad="aprendices"
            paginaActual={paginaSegura}
            totalPaginas={totalPaginas}
            onCambiarPagina={cambiarPagina}
          />

        </article>

        <aside className="asistencia-side">
          <article className="coordinador-card asistencia-summary-card">
            <div className="coordinador-card-header">
              <div>
                <h2>Resumen de asistencia</h2>
                <p>Total aprendices: {aprendices.length}</p>
              </div>
            </div>

            <div className="asistencia-dashboard-summary">
              <div className="asistencia-dashboard-top">
                <div className="asistencia-donut" style={{ background: `conic-gradient(${segmentosDonut.join(", ")})` }}>
                  <div>
                    <strong>{porcentajePresentes}%</strong>
                    <span>Presentes</span>
                  </div>
                </div>
              </div>

              {Object.entries(ESTADOS).map(([estado, item]) => {
                const valor = resumen[estado] || 0;
                const porcentaje = Math.round((valor / totalAprendices) * 100);
                return (
                  <div className="asistencia-dashboard-row" key={estado}>
                    <div>
                      <span className="asistencia-dot" style={{ background: item.color }}></span>
                      <strong>{item.label}</strong>
                    </div>
                    <b>{valor}</b>
                    <small>{porcentaje}%</small>
                    <i>
                      <em style={{ width: `${porcentaje}%`, background: item.color }}></em>
                    </i>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="coordinador-card asistencia-methods-card">
            <div className="coordinador-card-header">
              <h2>Metodos de registro</h2>
            </div>

            <div className="asistencia-methods-grid">
              <button type="button" className="asistencia-method huella">
                <Fingerprint size={22} />
                <span>
                  <strong>Registro por huella</strong>
                  <small>Dispositivo conectado</small>
                </span>
              </button>

              <button type="button" className="asistencia-method qr">
                <QrCode size={22} />
                <span>
                  <strong>Registro por QR</strong>
                  <small>QR activo</small>
                </span>
              </button>
            </div>
          </article>

        </aside>
      </section>
    </div>
  );
}
