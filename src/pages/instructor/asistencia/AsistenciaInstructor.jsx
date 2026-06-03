import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
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
import SimaPagination from "../../../components/common/SimaPagination";
import TablaAsistencia from "./components/TablaAsistencia";
import "../../coordinador/coordinador.css";
import "../../fichas/fichas.css";
import "../../../components/alertas/modal.css";
import "../../alertas/detalleAlerta.css";
import "../instructor.css";
import {
  APRENDICES_POR_PAGINA,
  ESTADOS,
  HISTORIAL_POR_PAGINA,
  MESES,
  METODOS
} from "./asistencia.constants";
import {
  corregirAsistencia,
  generarQrSesion,
  obtenerAprendicesPorGrupo,
  obtenerAsistenciasSesion,
  obtenerGruposInstructor,
  obtenerSesionAbiertaPorGrupo,
  registrarAsistenciaManual
} from "./asistencia.service";
import {
  combinarAprendicesConAsistencias,
  construirHistorialAsistencia,
  formatearFecha,
  normalizarTexto,
  obtenerCodigo,
  obtenerHoraActual,
  obtenerIdGrupo,
  obtenerIdSesion,
  obtenerPrograma,
  prepararAsistenciaSesion,
  textoBusquedaFecha
} from "./asistencia.utils";

function estadoFrontendABackend(estado) {
  const equivalencias = {
    presente: "PRESENTE",
    retardado: "TARDE",
    ausente: "INASISTENCIA",
    justificado: "JUSTIFICADO"
  };
  return equivalencias[estado] || String(estado || "").toUpperCase();
}

function obtenerMensajeError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
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
  const [sesionActiva, setSesionActiva] = useState(null);
  const [qrSesion, setQrSesion] = useState(null);
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);
  const [modalHuellaAbierto, setModalHuellaAbierto] = useState(false);
  const [qrAbierto, setQrAbierto] = useState(false);
  const [qrPantallaCompleta, setQrPantallaCompleta] = useState(false);
  const [resumenGrande, setResumenGrande] = useState(false);
  const [aprendizDetalle, setAprendizDetalle] = useState(null);
  const [aprendizManual, setAprendizManual] = useState(null);
  const [avisoFaltantesCerrado, setAvisoFaltantesCerrado] = useState("");
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
        const lista = await obtenerGruposInstructor();
        if (activo && lista.length) {
          const grupoPendiente = sessionStorage.getItem("sima_asistencia_grupo_activo");
          const grupoInicial = lista.find((grupo) => String(obtenerIdGrupo(grupo)) === grupoPendiente) || lista[0];

          setGrupos(lista);
          setGrupoSeleccionado(String(obtenerIdGrupo(grupoInicial)));
          sessionStorage.removeItem("sima_asistencia_grupo_activo");
        } else if (activo) {
          setGrupos([]);
          setGrupoSeleccionado("");
          setMensajeError(true);
          setMensaje("No se encontraron fichas disponibles para cargar asistencia.");
        }
      } catch (error) {
        console.error("Error cargando grupos para asistencia:", error);
        if (activo) {
          setGrupos([]);
          setGrupoSeleccionado("");
          setMensajeError(true);
          setMensaje(error.message || "No fue posible cargar las fichas de asistencia.");
        }
      }
    }

    cargarGrupos();
    return () => {
      activo = false;
    };
  }, []);

  const grupoActual = useMemo(
    () => grupos.find((grupo) => String(obtenerIdGrupo(grupo)) === String(grupoSeleccionado)) || grupos[0] || null,
    [grupoSeleccionado, grupos]
  );

  useEffect(() => {
    let activo = true;

    async function cargarAsistenciaSesion() {
      if (!grupoSeleccionado) {
        setSesionActiva(null);
        setAprendices([]);
        return;
      }
      setCargando(true);
      setQrSesion(null);
      setQrAbierto(false);
      setQrPantallaCompleta(false);
      setResumenGrande(false);
      setModalHuellaAbierto(false);
      setAprendizDetalle(null);
      setAprendizManual(null);
      setModoManual(false);

      try {
        const sesion = await obtenerSesionAbiertaPorGrupo(grupoSeleccionado, fecha);
        if (!activo) return;

        if (sesion) {
          const idSesion = obtenerIdSesion(sesion);
          const [detalle, aprendicesGrupo] = await Promise.all([
            obtenerAsistenciasSesion(idSesion),
            obtenerAprendicesPorGrupo(grupoActual || grupoSeleccionado).catch(() => [])
          ]);
          if (!activo) return;

          const lista = aprendicesGrupo.length
            ? combinarAprendicesConAsistencias(aprendicesGrupo, detalle.asistencias)
            : detalle.asistencias.map(prepararAsistenciaSesion);
          setSesionActiva(detalle.sesion || sesion);
          setAprendices(lista);
          setPaginaActual(1);
          setMensajeError(false);
          setMensaje(lista.length ? "" : "La sesion abierta no tiene aprendices para mostrar.");
          return;
        }

        if (activo) {
          setSesionActiva(null);
          setAprendices([]);
          setPaginaActual(1);
          setMensajeError(true);
          setMensaje("No hay una sesion de asistencia abierta para esta ficha hoy. Abre una sesion en el backend para guardar registros.");
        }
      } catch (error) {
        console.error("Error cargando aprendices para asistencia:", error);
        if (activo) {
          setSesionActiva(null);
          setAprendices([]);
          setPaginaActual(1);
          setMensajeError(true);
          setMensaje(error.message || "No fue posible cargar los aprendices de la ficha seleccionada.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarAsistenciaSesion();
    return () => {
      activo = false;
    };
  }, [fecha, grupoActual, grupoSeleccionado]);

  const haySesionActiva = Boolean(obtenerIdSesion(sesionActiva));

  const aprendicesRegistrados = useMemo(() => {
    if (!haySesionActiva) return [];
    const estadosValidos = Object.keys(ESTADOS);
    return aprendices.filter((aprendiz) => estadosValidos.includes(aprendiz.estado));
  }, [aprendices, haySesionActiva]);

  const aprendicesFiltrados = useMemo(() => {
    if (!haySesionActiva) return [];
    const texto = normalizarTexto(busqueda);
    const listaBase = modoManual ? aprendices : aprendicesRegistrados;
    
    return listaBase.filter((aprendiz) => {
      const coincideBusqueda = !texto || normalizarTexto(aprendiz.nombre).includes(texto);
      
      // En modo manual, no filtrar por estado/método/fecha
      if (modoManual) {
        return coincideBusqueda;
      }
      
      // En modo tiempo real, aplicar todos los filtros
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
  }, [aprendices, aprendicesRegistrados, busqueda, filtroAnio, filtroDia, filtroEstado, filtroMes, filtroMetodo, haySesionActiva, modoManual]);

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
    if (!haySesionActiva) return base;
    const listaBase = modoManual ? aprendices : aprendicesRegistrados;
    listaBase.forEach((aprendiz) => {
      if (Object.prototype.hasOwnProperty.call(base, aprendiz.estado)) {
        base[aprendiz.estado] += 1;
      }
    });
    return base;
  }, [aprendices, aprendicesRegistrados, haySesionActiva, modoManual]);

  const totalAprendices = (modoManual ? aprendices.length : aprendicesRegistrados.length) || 1;
  const segmentosDonut = useMemo(() => {
    let inicio = 0;
    return Object.entries(resumen).map(([estado, valor]) => {
      const porcentaje = Math.round((valor / totalAprendices) * 100);
      const fin = inicio + porcentaje;
      const segmento = `${ESTADOS[estado]?.color || "#e5e7eb"} ${inicio}% ${fin}%`;
      inicio = fin;
      return segmento;
    });
  }, [resumen, totalAprendices]);
  const porcentajePresentes = Math.round(((resumen.presente || 0) / totalAprendices) * 100);
  const resumenRecogido = qrAbierto && !resumenGrande;
  const aprendicesSinRegistro = useMemo(
    () => aprendices.filter((aprendiz) => !aprendiz.estado),
    [aprendices]
  );
  const claveAprendicesSinRegistro = useMemo(
    () => aprendicesSinRegistro.map((aprendiz) => aprendiz.id).sort().join("-"),
    [aprendicesSinRegistro]
  );
  const mostrarAvisoFaltantes =
    !cargando &&
    haySesionActiva &&
    aprendices.length > 0 &&
    aprendicesSinRegistro.length > 0 &&
    aprendicesSinRegistro.length <= 3 &&
    claveAprendicesSinRegistro !== avisoFaltantesCerrado;
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

  async function recargarAsistenciasSesion(sesion = sesionActiva) {
    const idSesion = obtenerIdSesion(sesion);
    if (!idSesion) {
      setSesionActiva(null);
      setAprendices([]);
      return;
    }

    const [detalle, aprendicesGrupo] = await Promise.all([
      obtenerAsistenciasSesion(idSesion),
      obtenerAprendicesPorGrupo(grupoActual || grupoSeleccionado).catch(() => [])
    ]);
    setSesionActiva(detalle.sesion || sesion);
    setAprendices(
      aprendicesGrupo.length
        ? combinarAprendicesConAsistencias(aprendicesGrupo, detalle.asistencias)
        : detalle.asistencias.map(prepararAsistenciaSesion)
    );
  }

  async function guardarEstadoBackend(aprendiz, nuevoEstado, observacion) {
    if (!sesionActiva) {
      throw new Error("No hay una sesion abierta para registrar asistencia.");
    }
    const estadoBackend = estadoFrontendABackend(nuevoEstado);

    if (aprendiz?.idAsistencia) {
      await corregirAsistencia(aprendiz.idAsistencia, {
        estado: estadoBackend,
        observacion
      });
    } else {
      if (estadoBackend === "INASISTENCIA") {
        throw new Error("Para marcar inasistencia se necesita un registro creado por la sesion o por cierre automatico.");
      }

      await registrarAsistenciaManual({
        idSesion: obtenerIdSesion(sesionActiva),
        idAprendiz: aprendiz.id,
        estado: estadoBackend,
        observacion
      });
    }

    await recargarAsistenciasSesion();
  }

  async function cambiarEstado(id, nuevoEstado) {
    const aprendiz = aprendices.find((item) => item.id === id);
    if (!aprendiz || guardandoAsistencia) return;

    setGuardandoAsistencia(true);
    setMensaje("");

    try {
      await guardarEstadoBackend(
        aprendiz,
        nuevoEstado,
        "Actualizacion manual realizada por instructor responsable"
      );
      setMensajeError(false);
      setMensaje("Asistencia actualizada en el backend.");
    } catch (error) {
      setMensajeError(true);
      setMensaje(obtenerMensajeError(error, "No fue posible actualizar la asistencia."));
    } finally {
      setGuardandoAsistencia(false);
    }
  }

  function guardarAsistencia() {
    setMensajeError(false);
    setMensaje("Los cambios manuales se guardan automaticamente en el backend.");
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

  function cerrarAvisoFaltantes() {
    setAvisoFaltantesCerrado(claveAprendicesSinRegistro);
  }

  function abrirDetalleAsistencia(aprendiz) {
    setAprendizDetalle(aprendiz);
    setPaginaHistorialDetalle(1);
    setBusquedaHistorialDetalle("");
  }

  function abrirEdicionManual(aprendiz) {
    if (!haySesionActiva) return;
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

  async function guardarCambioManual() {
    if (!aprendizManual) return;
    const nota = formManual.descripcion.trim() || formManual.motivo;
    const observacion = nota.length >= 20 ? nota : `${nota}. Cambio manual validado por instructor.`;

    setGuardandoAsistencia(true);
    try {
      await guardarEstadoBackend(aprendizManual, formManual.estado, observacion);
      setMensajeError(false);
      setMensaje("Cambio manual guardado en el backend.");
      setAprendizManual(null);
    } catch (error) {
      setMensajeError(true);
      setMensaje(obtenerMensajeError(error, "No fue posible guardar el cambio manual."));
    } finally {
      setGuardandoAsistencia(false);
    }
  }

  function abrirModalHuella() {
    if (!haySesionActiva) {
      setMensajeError(true);
      setMensaje("No hay una sesion abierta para registrar asistencia por huella.");
      return;
    }
    const anchoModal = 340;
    const x = Math.min(Math.max(12, window.innerWidth - anchoModal - 28), 580);
    setPosicionHuella({ x, y: 190 });
    setModalHuellaAbierto(true);
  }

  async function alternarQr() {
    if (qrAbierto) {
      setQrAbierto(false);
      setResumenGrande(false);
      setQrPantallaCompleta(false);
      return;
    }

    const idSesion = obtenerIdSesion(sesionActiva);
    if (!idSesion) {
      setMensajeError(true);
      setMensaje("No hay una sesion abierta para generar QR.");
      return;
    }

    try {
      const qr = await generarQrSesion(idSesion);
      setQrSesion(qr);
      setQrAbierto(true);
      setResumenGrande(false);
      setMensajeError(false);
      setMensaje("QR generado para la sesion abierta.");
    } catch (error) {
      setMensajeError(true);
      setMensaje(obtenerMensajeError(error, "No fue posible generar el QR de asistencia."));
    }
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
           <h1>Control de Asistencia de Aprendices</h1>
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

{/* filtracion de asistencia */}
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
        <div className="asistencia-hero-grid">
          <div>
            <span>Fecha:</span>
            <strong>{formatearFecha(fecha)}</strong>
          </div>
          <div>
            <span>Estado de sesion:</span>
            <strong className={`asistencia-pill ${haySesionActiva ? "success" : "danger"}`}>
              {haySesionActiva ? "Activa" : "Sin sesion"}
            </strong>
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
            <strong>
              {grupoActual?.instructor_lider?.usuario?.persona?.nombres || 
               grupoActual?.instructor_lider?.nombres ||
               grupoActual?.instructor_lider?.nombre ||
               grupoActual?.instructor_lider?.persona?.nombres ||
               grupoActual?.instructor?.usuario?.persona?.nombres || 
               grupoActual?.instructor?.nombres ||
               grupoActual?.instructor?.nombre || 
               "Sin instructor"}
            </strong>
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
              <h2>{modoManual ? "Listado completo de aprendices" : "Asistencia en tiempo real"}</h2>
              <p>{modoManual ? "Gestion manual de asistencia" : "Solo aprendices registrados"}</p>
            </div>
            <div className="asistencia-header-actions">
              {modoManual && (
                <button type="button" className="coordinador-select-btn" onClick={guardarAsistencia} disabled={guardandoAsistencia}>
                  <Save size={15} />
                  Finalizar edicion
                </button>
              )}
              {!modoManual && (
                <button
                  type="button"
                  className="asistencia-manual-toggle"
                  onClick={() => setModoManual(true)}
                  disabled={!sesionActiva || guardandoAsistencia}
                >
                  Manual
                </button>
              )}
              {modoManual && (
                <button
                  type="button"
                  className="asistencia-manual-toggle"
                  onClick={() => setModoManual(false)}
                  disabled={guardandoAsistencia}
                >
                  Tiempo real
                </button>
              )}
            </div>
          </div>

          <TablaAsistencia
            aprendices={aprendicesPagina}
            cargando={cargando}
            guardando={guardandoAsistencia}
            modoManual={modoManual}
            onAbrirDetalle={abrirDetalleAsistencia}
            onAbrirManual={abrirEdicionManual}
            onCambiarEstado={cambiarEstado}
          />

          <SimaPagination
            desde={desde}
            hasta={hasta}
            total={aprendicesFiltrados.length}
            entidad={modoManual ? "aprendices" : "registros"}
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
                <p>{modoManual ? `Total aprendices: ${aprendices.length}` : `Aprendices registrados: ${aprendicesRegistrados.length}`}</p>
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
                  <div className="asistencia-donut" style={{ background: `conic-gradient(${segmentosDonut.join(", ") || "#e5e7eb 0% 100%"})` }}>
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
                  <small>{qrSesion?.qr_token ? `Token: ${qrSesion.qr_token}` : "QR activo"}</small>
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
              <button
                type="button"
                className="asistencia-method huella"
                onClick={abrirModalHuella}
                disabled={!haySesionActiva}
              >
                <Fingerprint size={22} />
                <span>
                  <strong>Registro por huella</strong>
                  <small>{haySesionActiva ? "Dispositivo conectado" : "Sin sesion abierta"}</small>
                </span>
              </button>

              <button
                type="button"
                className={`asistencia-method qr ${qrAbierto ? "active" : ""}`}
                onClick={alternarQr}
                disabled={!haySesionActiva}
              >
                <QrCode size={22} />
                <span>
                  <strong>Registro por QR</strong>
                  <small>{qrAbierto ? "Cerrar QR" : haySesionActiva ? "Generar QR" : "Sin sesion abierta"}</small>
                </span>
              </button>
            </div>
          </article>

        </aside>
      </section>

      {mostrarAvisoFaltantes && (
        <>
          <div className="mcal-overlay" onClick={cerrarAvisoFaltantes} aria-hidden="true" />

          <section
            className="mcal-modal asistencia-faltantes-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="asistencia-faltantes-titulo"
          >
            <div className="asistencia-faltantes-icon">
              <AlertTriangle size={30} />
            </div>

            <button
              type="button"
              className="mcal-btn-close asistencia-faltantes-close"
              onClick={cerrarAvisoFaltantes}
              aria-label="Cerrar aviso de aprendices faltantes"
            >
              <X size={20} />
            </button>

            <div className="asistencia-faltantes-copy">
              <span>Registro pendiente</span>
              <h2 id="asistencia-faltantes-titulo">
                Faltan {aprendicesSinRegistro.length} {aprendicesSinRegistro.length === 1 ? "aprendiz" : "aprendices"} por registrarse
              </h2>
              <p>Estos aprendices todavia no tienen asistencia registrada en la sesion.</p>
            </div>

            <div className="asistencia-faltantes-list">
              {aprendicesSinRegistro.map((aprendiz) => (
                <div key={aprendiz.id}>
                  <strong>{aprendiz.nombre}</strong>
                  <small>ID {aprendiz.id}</small>
                </div>
              ))}
            </div>

            <div className="asistencia-faltantes-actions">
              <button type="button" className="mcal-btn-cancelar" onClick={cerrarAvisoFaltantes}>
                Revisar luego
              </button>
              <button
                type="button"
                className="mcal-btn-enviar"
                onClick={() => {
                  setFiltroEstado("");
                  setFiltroMetodo("sin-registro");
                  setPaginaActual(1);
                  cerrarAvisoFaltantes();
                }}
              >
                Ver pendientes
              </button>
            </div>
          </section>
        </>
      )}

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
            {qrSesion?.qr_token && <small>{qrSesion.qr_token}</small>}
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
                  <button type="button" className="mcal-btn-enviar" onClick={guardarCambioManual} disabled={guardandoAsistencia}>
                    {guardandoAsistencia ? "Guardando..." : "Guardar cambio"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
