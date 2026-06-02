export { default } from "./asistencia/AsistenciaInstructor";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Edit3,
  Eye,
  Filter,
  Fingerprint,
  GripHorizontal,
  Maximize2,
  Minimize2,
  QrCode,
  Save,
  Search,
  Upload,
  X,
} from "lucide-react";
import SimaPagination from "../../components/common/SimaPagination";
import { GRUPOS_LIST_URL } from "../../services/gruposService";
import "../coordinador/coordinador.css";
import "../fichas/fichas.css";
import "../../components/alertas/modal.css";
import "../alertas/detalleAlerta.css";
import "./instructor.css";

const API_URL = "/api";
const APRENDICES_POR_PAGINA = 5;
const HISTORIAL_POR_PAGINA = 4;
const ESTADOS = {
  presente: { label: "Presente", color: "#22c55e" },
  ausente: { label: "Ausente", color: "#ef4444" },
  retardado: { label: "Retardado", color: "#f59e0b" },
  justificado: { label: "Justificado", color: "#3b82f6" }
};
const METODOS = [
  { value: "manual", label: "Manual" },
  { value: "huella", label: "Huella" },
  { value: "qr", label: "QR" },
  { value: "sin-registro", label: "Sin registro" }
];
const MESES = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" }
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
  return grupo?.numero_ficha || grupo?.numero_grupo || grupo?.codigo || grupo?.ficha || grupo?.id_grupo || "Sin ficha";
}

function obtenerPrograma(grupo) {
  return (
    grupo?.programa_formacion?.nombre_programa ||
    grupo?.programa?.nombre_programa ||
    grupo?.nombre_programa ||
    grupo?.programa ||
    "Sin programa"
  );
}

function obtenerIdGrupo(grupo) {
  return grupo?.id_grupo || grupo?.id || grupo?.codigo || grupo?.numero_ficha || "";
}

function obtenerNombreAprendiz(aprendiz, index) {
  const persona = aprendiz?.usuario?.persona || aprendiz?.persona || aprendiz?.aprendiz?.usuario?.persona || {};
  const nombre = `${persona.nombres || ""} ${persona.apellidos || ""}`.trim();
  return nombre || aprendiz?.nombre || aprendiz?.aprendizNombre || aprendiz?.nombre_completo || `Sin nombre ${index + 1}`;
}

function prepararAprendiz(aprendiz, index) {
  const asistencia = aprendiz?.asistencia || aprendiz?.registro_asistencia || {};
  const estado = asistencia.estado_asistencia || asistencia.estado || aprendiz.estado_asistencia || aprendiz.estado || "";

  return {
    id: aprendiz.id_aprendiz || aprendiz.id || index + 1,
    nombre: obtenerNombreAprendiz(aprendiz, index),
    hora: asistencia.hora_registro || asistencia.hora || aprendiz.hora_registro || aprendiz.hora || "-",
    estado: String(estado).toLowerCase(),
    metodo: asistencia.metodo_registro || asistencia.metodo || aprendiz.metodo_registro || aprendiz.metodo || "-",
    fecha: asistencia.fecha || asistencia.fecha_registro || aprendiz.fecha || aprendiz.fecha_registro || "",
    historial: aprendiz.historial || aprendiz.historial_asistencia || aprendiz.asistencias || []
  };
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "Sin fecha";
  const fecha = new Date(`${fechaISO}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return "Sin fecha";
  return fecha.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

function obtenerHoraActual() {
  return new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true });
}

function textoBusquedaFecha(fechaISO) {
  if (!fechaISO) return "";
  const fecha = new Date(`${fechaISO}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return "";
  const mes = fecha.toLocaleDateString("es-CO", { month: "long" });
  const dia = fecha.toLocaleDateString("es-CO", { day: "numeric" });
  const anio = fecha.toLocaleDateString("es-CO", { year: "numeric" });
  const mesNumero = String(fecha.getMonth() + 1).padStart(2, "0");
  const diaNumero = String(fecha.getDate()).padStart(2, "0");
  return `${fechaISO} ${dia} ${diaNumero} ${mes} ${mesNumero} ${anio} ${dia} de ${mes} de ${anio}`;
}

function construirHistorialAsistencia(aprendiz) {
  const historial = extraerLista(aprendiz?.historial).length
    ? extraerLista(aprendiz.historial)
    : extraerLista(aprendiz?.historial_asistencia);

  return historial.map((item, index) => ({
    id: item.id || item.id_asistencia || `${aprendiz?.id || "aprendiz"}-${index}`,
    estado: String(item.estado_asistencia || item.estado || "").toLowerCase(),
    fecha: item.fecha || item.fecha_registro || "",
    hora: item.hora_registro || item.hora || "-",
    metodo: item.metodo_registro || item.metodo || "-",
    nota: item.nota || item.observacion || item.descripcion || ""
  }));
}

export default function AsistenciaInstructor() {
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
  const [aprendices, setAprendices] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState("");
  const [filtroDia, setFiltroDia] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [seccionFiltro, setSeccionFiltro] = useState("buscar");
  const [modoManual, setModoManual] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [paginaHistorialDetalle, setPaginaHistorialDetalle] = useState(1);
  const [busquedaHistorialDetalle, setBusquedaHistorialDetalle] = useState("");
  const [fecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mensajeError, setMensajeError] = useState(false);
  const [modalHuellaAbierto, setModalHuellaAbierto] = useState(false);
  const [qrAbierto, setQrAbierto] = useState(false);
  const [qrPantallaCompleta, setQrPantallaCompleta] = useState(false);
  const [resumenGrande, setResumenGrande] = useState(false);
  const [aprendizDetalle, setAprendizDetalle] = useState(null);
  const [aprendizManual, setAprendizManual] = useState(null);
  const [formManual, setFormManual] = useState({
    estado: "presente",
    hora: "",
    motivo: "Correccion de registro",
    descripcion: ""
  });
  const [posicionHuella, setPosicionHuella] = useState({ x: 580, y: 190 });
  const [arrastreHuella, setArrastreHuella] = useState(null);

  useEffect(() => {
    let activo = true;

    async function cargarGrupos() {
      try {
        const res = await fetch(GRUPOS_LIST_URL, { headers: getHeaders() });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || data?.error || "No fue posible cargar tus grupos.");
        }

        const lista = extraerLista(data, "grupos").length
          ? extraerLista(data, "grupos")
          : extraerLista(data, "fichas");

        if (activo) {
          setGrupos(lista);
          setGrupoSeleccionado(lista.length ? String(obtenerIdGrupo(lista[0])) : "");
        }
      } catch (error) {
        console.error("Error cargando grupos para asistencia:", error);
        if (activo) {
          setGrupos([]);
          setGrupoSeleccionado("");
        }
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
        if (activo) setAprendices(lista.map(prepararAprendiz));
      } catch (error) {
        console.error("Error cargando aprendices para asistencia:", error);
        if (activo) setAprendices([]);
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
      const metodoAprendiz = aprendiz.metodo === "-" ? "sin-registro" : normalizarTexto(aprendiz.metodo);
      const coincideMetodo = !filtroMetodo || metodoAprendiz === filtroMetodo;
      const fechaAprendiz = aprendiz.fecha ? new Date(`${aprendiz.fecha}T12:00:00`) : null;
      const fechaValida = fechaAprendiz && !Number.isNaN(fechaAprendiz.getTime());
      const coincideDia = !filtroDia || (fechaValida && String(fechaAprendiz.getDate()) === filtroDia);
      const coincideMes = !filtroMes || (fechaValida && String(fechaAprendiz.getMonth() + 1) === filtroMes);
      const coincideAnio = !filtroAnio || (fechaValida && String(fechaAprendiz.getFullYear()) === filtroAnio);
      const coincideFecha = coincideDia && coincideMes && coincideAnio;
      return coincideBusqueda && coincideEstado && coincideMetodo && coincideFecha;
    });
  }, [aprendices, busqueda, filtroAnio, filtroDia, filtroEstado, filtroMes, filtroMetodo]);

  const opcionesAnios = useMemo(() => {
    const anioBase = new Date(`${fecha}T12:00:00`).getFullYear();
    return Array.from({ length: 5 }, (_, index) => String(anioBase - 2 + index));
  }, [fecha]);

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
  const resumenRecogido = qrAbierto && !resumenGrande;
  const historialDetalle = useMemo(
    () => (aprendizDetalle ? construirHistorialAsistencia(aprendizDetalle) : []),
    [aprendizDetalle]
  );
  const historialFiltradoDetalle = useMemo(
    () => {
      const texto = normalizarTexto(busquedaHistorialDetalle);
      if (!texto) return historialDetalle;
      return historialDetalle.filter((item) => normalizarTexto(textoBusquedaFecha(item.fecha)).includes(texto));
    },
    [historialDetalle, busquedaHistorialDetalle]
  );
  const totalPaginasHistorial = Math.max(1, Math.ceil(historialFiltradoDetalle.length / HISTORIAL_POR_PAGINA));
  const paginaHistorialSegura = Math.min(paginaHistorialDetalle, totalPaginasHistorial);
  const inicioHistorial = (paginaHistorialSegura - 1) * HISTORIAL_POR_PAGINA;
  const historialDetallePagina = historialFiltradoDetalle.slice(inicioHistorial, inicioHistorial + HISTORIAL_POR_PAGINA);
  const desdeHistorial = historialFiltradoDetalle.length === 0 ? 0 : inicioHistorial + 1;
  const hastaHistorial = Math.min(inicioHistorial + HISTORIAL_POR_PAGINA, historialFiltradoDetalle.length);

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
    setModoManual(false);
  }

  function limpiarFiltrosAsistencia() {
    setBusqueda("");
    setFiltroEstado("");
    setFiltroMetodo("");
    setFiltroDia("");
    setFiltroMes("");
    setFiltroAnio("");
    setPaginaActual(1);
  }

  function abrirDetalleAsistencia(aprendiz) {
    setAprendizDetalle(aprendiz);
    setPaginaHistorialDetalle(1);
    setBusquedaHistorialDetalle("");
  }

  function abrirEdicionManual(aprendiz) {
    setAprendizManual(aprendiz);
    setFormManual({
      estado: aprendiz.estado || "presente",
      hora: aprendiz.hora === "-" ? obtenerHoraActual() : aprendiz.hora,
      motivo: "Correccion de registro",
      descripcion: ""
    });
  }

  function cambiarFormManual(e) {
    const { name, value } = e.target;
    setFormManual((actual) => ({ ...actual, [name]: value }));
  }

  function guardarCambioManual() {
    if (!aprendizManual) return;
    setAprendices((actuales) =>
      actuales.map((aprendiz) =>
        aprendiz.id === aprendizManual.id
          ? {
              ...aprendiz,
              estado: formManual.estado,
              hora: formManual.estado === "ausente" ? "-" : formManual.hora || obtenerHoraActual(),
              metodo: "Manual"
            }
          : aprendiz
      )
    );
    setMensajeError(false);
    setMensaje("Cambio manual registrado en pantalla.");
    setAprendizManual(null);
  }

  function abrirModalHuella() {
    const anchoModal = 340;
    const x = Math.min(Math.max(12, window.innerWidth - anchoModal - 28), 580);
    setPosicionHuella({ x, y: 190 });
    setModalHuellaAbierto(true);
  }

  function alternarQr() {
    setQrAbierto((actual) => {
      const siguiente = !actual;
      if (siguiente) {
        setResumenGrande(false);
      } else {
        setResumenGrande(false);
        setQrPantallaCompleta(false);
      }
      return siguiente;
    });
  }

  function cambiarPagina(nuevaPagina) {
    setPaginaActual(Math.min(Math.max(nuevaPagina, 1), totalPaginas));
  }

  function iniciarArrastreHuella(e) {
    setArrastreHuella({
      x: e.clientX - posicionHuella.x,
      y: e.clientY - posicionHuella.y
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function moverModalHuella(e) {
    if (!arrastreHuella) return;
    const anchoModal = 340;
    const altoModal = 300;
    const limiteX = Math.max(12, window.innerWidth - anchoModal - 12);
    const limiteY = Math.max(12, window.innerHeight - altoModal - 12);
    setPosicionHuella({
      x: Math.min(Math.max(12, e.clientX - arrastreHuella.x), limiteX),
      y: Math.min(Math.max(12, e.clientY - arrastreHuella.y), limiteY)
    });
  }

  function finalizarArrastreHuella(e) {
    setArrastreHuella(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div className="coordinador-panel instructor-panel-v2 asistencia-instructor">
      <section className="dashboard-welcome asistencia-page-title">
        <section className="dashboard-role-welcome">
          <h1>Asistencia</h1>
        </section>

        <div className="asistencia-control-filter">
          <div className="asistencia-control-filter-top">
            <button
              type="button"
              className={`asistencia-filter-tab asistencia-filter-tab-main ${filtrosAbiertos ? "active" : ""}`}
              onClick={() => setFiltrosAbiertos((abierto) => !abierto)}
            >
              <Filter size={15} />
              Filtrado
              <ChevronDown size={14} />
            </button>
          </div>

          {filtrosAbiertos && (
            <div className="asistencia-filter-panel">
              <aside className="asistencia-filter-menu" aria-label="Categorias de filtros de asistencia">
                {[
                  ["buscar", "Buscar"],
                  ["metodo", "Metodo"],
                  ["estado", "Estado"],
                  ["fechas", "Fechas"],
                  ["ficha", "Ficha"]
                ].map(([valor, etiqueta]) => (
                  <button
                    key={valor}
                    type="button"
                    className={seccionFiltro === valor ? "active" : ""}
                    onClick={() => setSeccionFiltro(valor)}
                  >
                    {etiqueta}
                  </button>
                ))}
              </aside>

              <div className="asistencia-filter-content">
                {seccionFiltro === "buscar" && (
                  <section>
                    <h3>Buscar aprendiz</h3>
                    <label className="grupos-search asistencia-panel-search">
                      <Search size={18} />
                      <input
                        value={busqueda}
                        onChange={(e) => {
                          setBusqueda(e.target.value);
                          setPaginaActual(1);
                        }}
                        placeholder="Nombre del aprendiz"
                      />
                    </label>
                  </section>
                )}

                {seccionFiltro === "estado" && (
                  <section>
                    <h3>Estado</h3>
                    <div className="asistencia-filter-options">
                      {Object.entries(ESTADOS).map(([estado, item]) => (
                        <button
                          key={estado}
                          type="button"
                          className={filtroEstado === estado ? "selected" : ""}
                          onClick={() => {
                            setFiltroEstado(filtroEstado === estado ? "" : estado);
                            setPaginaActual(1);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {seccionFiltro === "metodo" && (
                  <section>
                    <h3>Metodo</h3>
                    <div className="asistencia-filter-options">
                      {METODOS.map((metodo) => (
                        <button
                          key={metodo.value}
                          type="button"
                          className={filtroMetodo === metodo.value ? "selected" : ""}
                          onClick={() => {
                            setFiltroMetodo(filtroMetodo === metodo.value ? "" : metodo.value);
                            setPaginaActual(1);
                          }}
                        >
                          {metodo.label}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {seccionFiltro === "fechas" && (
                  <section>
                    <h3>Fecha</h3>
                    <div className="asistencia-date-filter">
                      <label>
                        <span>Dia</span>
                        <select
                          value={filtroDia}
                          onChange={(e) => {
                            setFiltroDia(e.target.value);
                            setPaginaActual(1);
                          }}
                        >
                          <option value="">Todos</option>
                          {Array.from({ length: 31 }, (_, index) => String(index + 1)).map((dia) => (
                            <option key={dia} value={dia}>{dia}</option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Mes</span>
                        <select
                          value={filtroMes}
                          onChange={(e) => {
                            setFiltroMes(e.target.value);
                            setPaginaActual(1);
                          }}
                        >
                          <option value="">Todos</option>
                          {MESES.map((mes) => (
                            <option key={mes.value} value={mes.value}>{mes.label}</option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Año</span>
                        <select
                          value={filtroAnio}
                          onChange={(e) => {
                            setFiltroAnio(e.target.value);
                            setPaginaActual(1);
                          }}
                        >
                          <option value="">Todos</option>
                          {opcionesAnios.map((anio) => (
                            <option key={anio} value={anio}>{anio}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </section>
                )}

                {seccionFiltro === "ficha" && (
                  <section>
                    <h3>Ficha</h3>
                    <label className="asistencia-select-filter">
                      <span>Seleccionar otra ficha</span>
                      <select
                        value={grupoSeleccionado}
                        onChange={(e) => {
                          setGrupoSeleccionado(e.target.value);
                          setPaginaActual(1);
                        }}
                      >
                        {grupos.length ? (
                          grupos.map((grupo) => (
                            <option key={obtenerIdGrupo(grupo)} value={obtenerIdGrupo(grupo)}>
                              {obtenerCodigo(grupo)} - {obtenerPrograma(grupo)}
                            </option>
                          ))
                        ) : (
                          <option value={grupoSeleccionado}>{obtenerCodigo(grupoActual)}</option>
                        )}
                      </select>
                    </label>
                  </section>
                )}
              </div>

              <footer className="asistencia-filter-footer">
                <button type="button" className="asistencia-filter-clear" onClick={limpiarFiltrosAsistencia}>
                  Limpiar
                </button>
              </footer>
            </div>
          )}
        </div>
      </section>

      {mensaje && <div className={`grupos-alert ${mensajeError ? "danger" : "info"}`}>{mensaje}</div>}

      <section className="asistencia-hero coordinador-card">
        <h2>Control de Asistencia de Aprendices</h2>
        <div className="asistencia-hero-grid">
          <div>
            <span>Fecha:</span>
            <strong>{formatearFecha(fecha)}</strong>
          </div>
          <div>
            <span>Estado de sesion:</span>
            <strong className="asistencia-pill success">Activa</strong>
          </div>
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
            <strong>{grupoActual?.instructor_lider?.usuario?.persona?.nombres || "Sin instructor"}</strong>
          </div>

          <div>
            <span>Horario:</span>
            <strong>{grupoActual?.horario || grupoActual?.jornada || "Sin horario"}</strong>
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
              {!modoManual && (
                <button
                  type="button"
                  className="asistencia-manual-toggle"
                  onClick={() => setModoManual(true)}
                >
                  Manual
                </button>
              )}
            </div>
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
                    </>
                  )}
                  <th>Acciones</th>
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
                        </>
                      )}
                      <td>
                        <button
                          type="button"
                          className="asistencia-icon-action"
                          aria-label={modoManual ? `Editar asistencia manual de ${aprendiz.nombre}` : `Ver asistencia de ${aprendiz.nombre}`}
                          onClick={() => (modoManual ? abrirEdicionManual(aprendiz) : abrirDetalleAsistencia(aprendiz))}
                        >
                          {modoManual ? <Edit3 size={15} /> : <Eye size={15} />}
                        </button>
                      </td>
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
          <article className={`coordinador-card asistencia-summary-card ${resumenRecogido ? "compact" : ""} ${resumenGrande ? "large" : ""}`}>
            <div className="coordinador-card-header">
              <div>
                <h2>Resumen de asistencia</h2>
                <p>Total aprendices: {aprendices.length}</p>
              </div>
              {qrAbierto && (
                <button
                  type="button"
                  className="asistencia-icon-action"
                  onClick={() => setResumenGrande((actual) => !actual)}
                  aria-label={resumenGrande ? "Recoger resumen de asistencia" : "Agrandar resumen de asistencia"}
                >
                  {resumenGrande ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              )}
            </div>

            {resumenRecogido ? (
              <div className="asistencia-summary-compact">
                <strong>{porcentajePresentes}%</strong>
                <span>Presentes</span>
                <small>{aprendices.length} aprendices</small>
              </div>
            ) : (
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
            )}
          </article>

          {qrAbierto && (
            <article className="coordinador-card asistencia-qr-card">
              <div className="coordinador-card-header">
                <div>
                  <h2>Registro por QR</h2>
                  <p>Escanea el codigo para registrar asistencia</p>
                </div>
              </div>

              <div className="asistencia-qr-content">
                <div className="asistencia-qr-info">
                  <strong>{obtenerCodigo(grupoActual)}</strong>
                  <span>{formatearFecha(fecha)}</span>
                  <small>QR activo</small>
                </div>
                <button
                  type="button"
                  className="asistencia-qr-visual"
                  onClick={() => setQrPantallaCompleta(true)}
                  aria-label="Agrandar codigo QR de asistencia"
                >
                  <QrCode size={126} />
                </button>
              </div>
            </article>
          )}

          <article className="coordinador-card asistencia-methods-card">
            <div className="coordinador-card-header">
              <h2>Metodos de registro</h2>
            </div>

            <div className="asistencia-methods-grid">
              <button type="button" className="asistencia-method huella" onClick={abrirModalHuella}>
                <Fingerprint size={22} />
                <span>
                  <strong>Registro por huella</strong>
                  <small>Dispositivo conectado</small>
                </span>
              </button>

              <button type="button" className={`asistencia-method qr ${qrAbierto ? "active" : ""}`} onClick={alternarQr}>
                <QrCode size={22} />
                <span>
                  <strong>Registro por QR</strong>
                  <small>{qrAbierto ? "Cerrar QR" : "QR activo"}</small>
                </span>
              </button>
            </div>
          </article>

        </aside>
      </section>

      {modalHuellaAbierto && (
        <section
          className="asistencia-fingerprint-modal"
          style={{ left: `${posicionHuella.x}px`, top: `${posicionHuella.y}px` }}
          role="dialog"
          aria-modal="false"
          aria-label="Registro por huella"
        >
          <div
            className="asistencia-fingerprint-header"
            onPointerDown={iniciarArrastreHuella}
            onPointerMove={moverModalHuella}
            onPointerUp={finalizarArrastreHuella}
            onPointerCancel={finalizarArrastreHuella}
          >
            <GripHorizontal size={18} />
            <strong>Registro por huella</strong>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setModalHuellaAbierto(false)}
              aria-label="Cerrar registro por huella"
            >
              <X size={16} />
            </button>
          </div>

          <div className="asistencia-fingerprint-body">
            <div className="asistencia-fingerprint-icon">
              <Fingerprint size={76} />
            </div>
            <h2>Esperando lectura</h2>
            <p>Coloca el dedo en el lector para registrar la asistencia del aprendiz.</p>
            <span>Dispositivo conectado</span>
          </div>
        </section>
      )}

      {qrPantallaCompleta && (
        <section className="asistencia-qr-fullscreen" role="dialog" aria-modal="true" aria-label="Codigo QR de asistencia en pantalla completa">
          <button type="button" className="asistencia-qr-close-full" onClick={() => setQrPantallaCompleta(false)}>
            Cerrar QR
          </button>
          <div className="asistencia-qr-full-content">
            <div className="asistencia-qr-full-visual" aria-label="Codigo QR de asistencia">
              <QrCode size={260} />
            </div>
            <strong>{obtenerCodigo(grupoActual)}</strong>
            <span>{formatearFecha(fecha)}</span>
          </div>
        </section>
      )}

      {aprendizDetalle && (
        <>
          <div className="mcal-overlay" onClick={() => setAprendizDetalle(null)} aria-hidden="true" />

          <div
            className="mcal-modal asistencia-detalle-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de asistencia de ${aprendizDetalle.nombre}`}
          >
            <div className="mcal-header asistencia-detalle-header">
              <div>
                <h2 className="mcal-titulo">Detalle de asistencia</h2>
                <p>{aprendizDetalle.nombre}</p>
              </div>
              <div className="asistencia-detail-search">
                <Search size={15} />
                <input
                  id="fecha-historial-asistencia"
                  type="date"
                  value={busquedaHistorialDetalle}
                  onChange={(e) => {
                    setBusquedaHistorialDetalle(e.target.value);
                    setPaginaHistorialDetalle(1);
                  }}
                  placeholder="Buscar fecha, mes o año"
                />
                {busquedaHistorialDetalle && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusquedaHistorialDetalle("");
                      setPaginaHistorialDetalle(1);
                    }}
                    aria-label="Limpiar busqueda"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button type="button" className="mcal-btn-close" onClick={() => setAprendizDetalle(null)} aria-label="Cerrar detalle de asistencia">
                <X size={20} />
              </button>
            </div>

            <div className="asistencia-detalle-body">
              <div className="da-grid">
                <aside className="da-col-aside">
                  <section className="da-card">
                    <div className="da-timeline">
                      {historialDetallePagina.length ? (
                        historialDetallePagina.map((item) => (
                          <div className="da-timeline-item" key={item.id}>
                            <div className={`da-timeline-dot asistencia-da-dot ${item.estado}`} />
                            <div className="da-timeline-content">
                              <div className="da-timeline-head">
                                <strong>{ESTADOS[item.estado]?.label || item.estado}</strong>
                                <span>{formatearFecha(item.fecha)} a las {item.hora}</span>
                              </div>
                              <p>{item.nota}</p>
                            <div className={`da-origen-tag asistencia-da-metodo ${normalizarTexto(item.metodo)}`}>
                              {item.metodo}
                            </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="da-timeline-vacio">
                          <p>No hay registros para esa fecha.</p>
                        </div>
                      )}
                    </div>

                    <div className="asistencia-detail-pagination">
                      <SimaPagination
                        desde={desdeHistorial}
                        hasta={hastaHistorial}
                        total={historialFiltradoDetalle.length}
                        entidad="registros"
                        paginaActual={paginaHistorialSegura}
                        totalPaginas={totalPaginasHistorial}
                        onCambiarPagina={(pagina) => setPaginaHistorialDetalle(Math.min(Math.max(pagina, 1), totalPaginasHistorial))}
                        className="asistencia-detail-pager"
                      />
                    </div>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        </>
      )}

      {aprendizManual && (
        <>
          <div className="mcal-overlay" onClick={() => setAprendizManual(null)} aria-hidden="true" />

          <div className="mcal-modal asistencia-manual-modal" role="dialog" aria-modal="true" aria-label="Editar asistencia manual">
            <div className="mcal-header asistencia-manual-modal-header">
              <h2 className="mcal-titulo">Editar asistencia manual</h2>
              <button type="button" className="mcal-btn-close" onClick={() => setAprendizManual(null)} aria-label="Cerrar edicion manual">
                <X size={20} />
              </button>
            </div>

            <div className="asistencia-manual-modal-body">
              <aside className="asistencia-manual-info">
                <h3>Informacion del aprendiz</h3>
                <div className="asistencia-manual-profile">
                  <div className="asistencia-manual-avatar">{aprendizManual.nombre.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{aprendizManual.nombre}</strong>
                    <span>ID {aprendizManual.id}</span>
                  </div>
                </div>

                <dl>
                  <div>
                    <dt>Ficha</dt>
                    <dd>{obtenerCodigo(grupoActual)}</dd>
                  </div>
                  <div>
                    <dt>Programa</dt>
                    <dd>{obtenerPrograma(grupoActual)}</dd>
                  </div>
                  <div>
                    <dt>Estado actual</dt>
                    <dd>
                      <span className={`asistencia-status ${aprendizManual.estado}`}>
                        {ESTADOS[aprendizManual.estado]?.label || "Sin estado"}
                      </span>
                    </dd>
                  </div>
                </dl>

                <label className="mcal-label" htmlFor="estado-manual">Cambiar estado a</label>
                <select id="estado-manual" name="estado" className="mcal-select" value={formManual.estado} onChange={cambiarFormManual}>
                  <option value="presente">Presente</option>
                  <option value="ausente">Ausente</option>
                  <option value="retardado">Retardo</option>
                  <option value="justificado">Justificado</option>
                </select>

                <label className="mcal-label" htmlFor="hora-manual">Hora del registro</label>
                <input id="hora-manual" name="hora" className="mcal-input" value={formManual.hora} onChange={cambiarFormManual} />
              </aside>

              <section className="asistencia-manual-form">
                <label className="mcal-label" htmlFor="motivo-manual">Motivo del cambio</label>
                <select id="motivo-manual" name="motivo" className="mcal-select" value={formManual.motivo} onChange={cambiarFormManual}>
                  <option>Correccion de registro</option>
                  <option>Error de marcacion</option>
                  <option>Registro tardio validado</option>
                  <option>Soporte presentado</option>
                </select>

                <label className="mcal-label" htmlFor="descripcion-manual">Descripcion detallada</label>
                <textarea
                  id="descripcion-manual"
                  name="descripcion"
                  className="mcal-textarea asistencia-manual-textarea"
                  value={formManual.descripcion}
                  onChange={cambiarFormManual}
                  maxLength={300}
                  placeholder="Explica brevemente por que se realiza este cambio."
                />
                <small className="asistencia-manual-counter">{formManual.descripcion.length}/300</small>

                <label className="mcal-label">Evidencia</label>
                <label className="asistencia-evidence-btn">
                  <Upload size={15} />
                  Adjuntar archivo
                  <input type="file" />
                </label>

                <div className="mcal-banner asistencia-manual-note">
                  <p>Este cambio quedara registrado en el historial de auditoria de la sesion.</p>
                </div>

                <div className="mcal-footer">
                  <button type="button" className="mcal-btn-cancelar" onClick={() => setAprendizManual(null)}>Cancelar</button>
                  <button type="button" className="mcal-btn-enviar" onClick={guardarCambioManual}>Guardar cambio</button>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
