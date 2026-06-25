import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Ban, Building2, CalendarCheck, CheckCircle2, Clock3 } from "lucide-react";
import {
  abrirSesionAsistencia,
  cancelarSesionAsistencia,
  generarSesionesFormacion,
  listarSesionesGrupo,
  obtenerSesionAbiertaPorGrupo,
  obtenerSesionesInstructorDia
} from "../asistencia.service";
import { extraerLista, formatearFecha, obtenerCodigo, obtenerIdGrupo, obtenerIdSesion, obtenerPrograma } from "../asistencia.utils";
import "../../instructor.css";

const RUTA_INICIO_INSTRUCTOR = "/instructor/dashboard";
const MINUTOS_RECORDATORIO = 10;
const ESTADOS_ABRIBLES = ["PROGRAMADA", "PENDIENTE", "ABIERTA", "ACTIVA", "EN_CURSO", ""];
const ESTADOS_CERRADOS = ["CERRADA", "CERRADO", "FINALIZADA", "CANCELADA", "CANCELADO"];
function guardarDatoPersistente(clave, valor) {
  localStorage.setItem(clave, valor);
  sessionStorage.setItem(clave, valor);
}

function guardarJsonPersistente(clave, valor) {
  const serializado = JSON.stringify(valor);
  localStorage.setItem(clave, serializado);
  sessionStorage.setItem(clave, serializado);
}

function leerJsonPersistente(clave) {
  const valor = localStorage.getItem(clave) || sessionStorage.getItem(clave);
  if (!valor) return null;
  try {
    return JSON.parse(valor);
  } catch {
    return null;
  }
}

function obtenerFechaLocal() {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function obtenerGrupoDesdeSesion(sesion) {
  return sesion?.grupo || sesion?.grupo_formacion || sesion?.grupo_trimestre?.grupo || {};
}

function obtenerIdGrupoSesion(sesion) {
  return sesion?.id_grupo || sesion?.grupo?.id_grupo || sesion?.grupo_formacion?.id_grupo || sesion?.grupo_trimestre?.id_grupo || "";
}

function obtenerIdSesionFormacion(sesion) {
  return sesion?.id_sesion_formacion || sesion?.sesion?.id_sesion_formacion || "";
}

function extraerSesionRespuesta(respuesta, fallback = {}) {
  const sesion = respuesta?.sesion || respuesta?.data?.sesion || respuesta || {};
  return { ...fallback, ...sesion };
}

function esperar(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function sesionEstaAbiertaEnBackend(sesion) {
  return ["ABIERTA", "ACTIVA", "EN_CURSO"].includes(String(sesion?.estado || "").toUpperCase());
}

function normalizarHora(valor) {
  return String(valor || "").slice(0, 5) || "--:--";
}

function obtenerHoraInicioSesion(sesion) {
  return normalizarHora(
    sesion?.hora_inicio_programada ||
    sesion?.hora_inicio ||
    sesion?.inicio ||
    sesion?.bloque_jornada?.hora_inicio
  );
}

function obtenerHoraFinSesion(sesion) {
  return normalizarHora(
    sesion?.hora_fin_programada ||
    sesion?.hora_fin ||
    sesion?.fin ||
    sesion?.bloque_jornada?.hora_fin
  );
}

function obtenerAmbienteSesion(sesion) {
  return (
    sesion?.ambiente?.nombre_ambiente ||
    sesion?.ambiente?.nombre ||
    sesion?.nombre_ambiente ||
    sesion?.bloque_jornada?.ambiente?.nombre_ambiente ||
    sesion?.bloque_jornada?.ambiente?.nombre ||
    "Ambiente asignado"
  );
}

function crearFechaHora(fechaISO, hora) {
  const horaNormalizada = normalizarHora(hora);
  if (!fechaISO || horaNormalizada === "--:--") return null;
  const fecha = new Date(`${fechaISO}T${horaNormalizada}:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function sesionSigueVigente(sesion) {
  const estado = String(sesion?.estado || "").toUpperCase();
  return !ESTADOS_CERRADOS.includes(estado);
}

function sesionDebeIniciarse(sesion, fechaISO) {
  const inicio = crearFechaHora(fechaISO, obtenerHoraInicioSesion(sesion));
  return !inicio || new Date() >= inicio;
}

function sesionEstaEnHorarioActual(sesion, fechaISO) {
  const inicio = crearFechaHora(fechaISO, obtenerHoraInicioSesion(sesion));
  const fin = crearFechaHora(fechaISO, obtenerHoraFinSesion(sesion));
  const ahora = new Date();
  if (inicio && ahora < inicio) return false;
  if (fin && ahora > fin) return false;
  return true;
}

function sesionEstaProgramada(sesion) {
  const estado = String(sesion?.estado || "").toUpperCase();
  return ESTADOS_ABRIBLES.includes(estado);
}

function sesionYaEstaAbiertaEnEsteNavegador(sesion) {
  const idsSesion = [
    sesion?.id_sesion_formacion,
    sesion?.id
  ].filter(Boolean).map(String);
  const idsAbiertos = [
    localStorage.getItem("sima_asistencia_sesion_activa"),
    sessionStorage.getItem("sima_asistencia_sesion_activa"),
    localStorage.getItem("sima_asistencia_sesion_seleccionada"),
    sessionStorage.getItem("sima_asistencia_sesion_seleccionada")
  ].filter(Boolean).map(String);

  if (idsSesion.some((id) => idsAbiertos.includes(id))) return true;

  const bloqueActivo = leerJsonPersistente("sima_asistencia_bloque_activo");
  if (!bloqueActivo) return false;

  const fechaSesion = obtenerFechaSesion(sesion, bloqueActivo.fecha || "");
  const mismoHorario =
    bloqueActivo.hora_inicio === obtenerHoraInicioSesion(sesion) &&
    bloqueActivo.hora_fin === obtenerHoraFinSesion(sesion);
  const mismoDia = !bloqueActivo.fecha || !fechaSesion || bloqueActivo.fecha === fechaSesion;
  const idsGrupoSesion = [
    obtenerIdGrupoSesion(sesion),
    sesion?.id_grupo,
    sesion?.grupo?.id_grupo,
    sesion?.numero_ficha,
    obtenerCodigo(construirGrupoConSesion(sesion))
  ].filter(Boolean).map(String);
  const idsGrupoActivo = [
    bloqueActivo.id_grupo,
    bloqueActivo.numero_ficha
  ].filter(Boolean).map(String);
  const mismoGrupo = !idsGrupoActivo.length || idsGrupoSesion.some((id) => idsGrupoActivo.includes(id));

  return mismoDia && mismoHorario && mismoGrupo;
}

function obtenerClaveAviso(fechaISO, sesion = null) {
  return `sima_aviso_asistencia_${fechaISO}_${obtenerIdSesion(sesion) || "dia"}`;
}

function obtenerFechaSesion(sesion, fallback = "") {
  const valor = String(sesion?.fecha_clase || sesion?.fecha || sesion?.fecha_sesion || sesion?.fechaCalendario || fallback || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : fallback;
}

function construirGrupoConSesion(sesion) {
  const idGrupoSesion = String(obtenerIdGrupoSesion(sesion));
  const grupoSesion = obtenerGrupoDesdeSesion(sesion);
  return {
    ...grupoSesion,
    id_grupo: idGrupoSesion || obtenerIdGrupo(grupoSesion),
    numero_ficha: grupoSesion.numero_ficha || sesion.numero_ficha,
    nombre_programa: grupoSesion.nombre_programa || sesion.nombre_programa,
    programa: grupoSesion.programa || sesion.programa,
    sesion
  };
}

function sesionCoincideConBloque(sesion, bloqueReferencia) {
  const idHorarioReferencia = bloqueReferencia?.id_horario || bloqueReferencia?.horario?.id_horario;
  const idHorarioSesion = sesion?.id_horario || sesion?.horario?.id_horario;
  if (idHorarioReferencia && idHorarioSesion && String(idHorarioReferencia) === String(idHorarioSesion)) return true;

  return obtenerHoraInicioSesion(sesion) === obtenerHoraInicioSesion(bloqueReferencia) &&
    obtenerHoraFinSesion(sesion) === obtenerHoraFinSesion(bloqueReferencia);
}

function sesionCoincideConFecha(sesion, fechaISO) {
  const fechaSesion = obtenerFechaSesion(sesion);
  return !fechaSesion || fechaSesion === fechaISO;
}

function prioridadSesionParaAbrir(sesion) {
  const estado = String(sesion?.estado || "").toUpperCase();
  if (["ABIERTA", "ACTIVA", "EN_CURSO"].includes(estado)) return 5;
  if (estado === "PROGRAMADA") return 4;
  if (estado === "PENDIENTE") return 3;
  if (!estado) return 2;
  return 0;
}

export default function SesionActivaModal({
  onRevisionCompleta,
  onSesionManualAtendida,
  sesionesAlternativas = [],
  sesionManual = null
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [visible, setVisible] = useState(false);
  const [abriendoSesion, setAbriendoSesion] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [revisionInicialCompleta, setRevisionInicialCompleta] = useState(false);
  const [revisionAviso, setRevisionAviso] = useState(0);
  const fechaHoy = useMemo(() => obtenerFechaLocal(), []);
  const rutaActual = location.pathname;

  useEffect(() => {
    if (!sesionManual) return;
    const timeout = window.setTimeout(() => {
      setGrupoActivo(construirGrupoConSesion(sesionManual));
      setVisible(true);
      setRevisionInicialCompleta(true);
      onRevisionCompleta?.();
      onSesionManualAtendida?.();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [onRevisionCompleta, onSesionManualAtendida, sesionManual]);

  useEffect(() => {
    let activo = true;
    let consultando = false;
    let temporizadorRevision = null;

    function programarSiguienteRevision(sesiones = []) {
      if (!activo) return;
      const ahora = Date.now();
      const esperas = sesiones
        .filter((sesion) => sesionEstaProgramada(sesion) && sesionSigueVigente(sesion) && !sesionYaEstaAbiertaEnEsteNavegador(sesion))
        .map((sesion) => crearFechaHora(fechaHoy, obtenerHoraInicioSesion(sesion)))
        .filter((inicio) => inicio && inicio.getTime() > ahora)
        .map((inicio) => inicio.getTime() - ahora);
      const hastaProximaSesion = esperas.length ? Math.min(...esperas) + 250 : Number.POSITIVE_INFINITY;
      const espera = Math.min(hastaProximaSesion, 10 * 60 * 1000);
      temporizadorRevision = window.setTimeout(revisarSesionActiva, Math.max(1000, espera));
    }

    async function revisarSesionActiva() {
      if (consultando) return;
      if (rutaActual !== RUTA_INICIO_INSTRUCTOR) {
        setVisible(false);
        setRevisionInicialCompleta(true);
        return;
      }

      consultando = true;
      const sesionesConsultadas = sesionesAlternativas.length
        ? []
        : await obtenerSesionesInstructorDia(fechaHoy).catch(() => []);
      const sesionesDia = [...new Map(
        [...sesionesConsultadas, ...sesionesAlternativas]
          .map((sesion) => [String(obtenerIdSesion(sesion) || JSON.stringify(sesion)), sesion])
      ).values()];
      consultando = false;
      if (!activo) return;
      let grupoConSesion = null;
      const sesionVigente = sesionesDia
        .filter((sesion) =>
          sesionEstaProgramada(sesion) &&
          sesionSigueVigente(sesion) &&
          !sesionYaEstaAbiertaEnEsteNavegador(sesion) &&
          sesionDebeIniciarse(sesion, fechaHoy) &&
          sesionEstaEnHorarioActual(sesion, fechaHoy)
        )
        .sort((a, b) => {
          const estadoA = String(a?.estado || "").toUpperCase();
          const estadoB = String(b?.estado || "").toUpperCase();
          const prioridadA = ["PROGRAMADA", ""].includes(estadoA) ? 0 : 1;
          const prioridadB = ["PROGRAMADA", ""].includes(estadoB) ? 0 : 1;
          return prioridadA - prioridadB || obtenerHoraInicioSesion(a).localeCompare(obtenerHoraInicioSesion(b));
        })[0];

      if (sesionVigente) {
        grupoConSesion = construirGrupoConSesion(sesionVigente);
      }

      if (!activo) return;
      const sesionAviso = grupoConSesion?.sesion;
      if (sesionAviso && !sesionSigueVigente(sesionAviso)) {
        setVisible(false);
        setRevisionInicialCompleta(true);
        onRevisionCompleta?.();
        return;
      }

      setGrupoActivo(grupoConSesion);
      setVisible(Boolean(grupoConSesion));
      setRevisionInicialCompleta(true);
      onRevisionCompleta?.();
      if (!grupoConSesion) programarSiguienteRevision(sesionesDia);
    }

    revisarSesionActiva();
    return () => {
      activo = false;
      window.clearTimeout(temporizadorRevision);
    };
  }, [fechaHoy, onRevisionCompleta, revisionAviso, rutaActual, sesionesAlternativas]);

  async function resolverSesionParaAbrir(sesionProgramada, idGrupo) {
    const fechaSesion = obtenerFechaSesion(sesionProgramada, fechaHoy);
    const idGrupoTrimestre = sesionProgramada?.id_grupo_trimestre || sesionProgramada?.grupo_trimestre?.id_grupo_trimestre;

    const escogerSesionReal = (sesiones = []) => {
      const sesionesReales = sesiones
        .filter((sesion) => obtenerIdSesionFormacion(sesion))
        .filter((sesion) => sesionCoincideConFecha(sesion, fechaSesion));
      const sesionesDelBloque = sesionesReales.filter((sesion) => sesionCoincideConBloque(sesion, sesionProgramada));
      const sesionesAbribles = sesionesDelBloque
        .filter((sesion) => sesionEstaProgramada(sesion))
        .sort((a, b) => prioridadSesionParaAbrir(b) - prioridadSesionParaAbrir(a));
      return sesionesAbribles[0] || sesionesDelBloque[0] || null;
    };

    const buscarSesionReal = async () => {
      const consultas = [
        () => listarSesionesGrupo({
          idGrupo,
          idGrupoTrimestre,
          fechaDesde: fechaSesion,
          fechaHasta: fechaSesion,
          soloResponsable: true,
          limit: 100
        }).then((resultado) => resultado.sesiones),
        () => listarSesionesGrupo({
          idGrupo,
          idGrupoTrimestre,
          fechaDesde: fechaSesion,
          fechaHasta: fechaSesion,
          soloResponsable: false,
          limit: 100
        }).then((resultado) => resultado.sesiones),
        () => listarSesionesGrupo({
          idGrupo,
          fechaDesde: fechaSesion,
          fechaHasta: fechaSesion,
          soloResponsable: false,
          limit: 100
        }).then((resultado) => resultado.sesiones),
        () => obtenerSesionesInstructorDia(fechaSesion)
      ];

      for (const consultar of consultas) {
        const sesion = escogerSesionReal(await consultar().catch(() => []));
        if (sesion) return sesion;
      }

      return null;
    };

    let sesionGenerada = await buscarSesionReal();

    if (!sesionGenerada && idGrupoTrimestre) {
      await generarSesionesFormacion({
        idGrupoTrimestre,
        fechaDesde: fechaSesion,
        fechaHasta: fechaSesion
      }).catch((error) => {
        if (error?.status === 409) {
          const data = error?.data || {};
          sesionGenerada = escogerSesionReal([
            data.sesion,
            data.data?.sesion,
            ...extraerLista(data, "sesiones"),
            ...extraerLista(data?.data, "sesiones")
          ].filter(Boolean));
          return null;
        }
        throw error;
      });
      sesionGenerada = sesionGenerada || await buscarSesionReal();
    }

    if (!sesionGenerada) {
      throw new Error("El backend no devolvio una sesion real para este bloque y fecha.");
    }

    return sesionGenerada;
  }

  async function obtenerSesionRealDelBloque(sesionProgramada, idGrupo) {
    return resolverSesionParaAbrir(sesionProgramada, idGrupo).catch(() => sesionProgramada);
  }

  async function confirmarSesionAbierta(idGrupo, idSesionReal, sesionFallback) {
    if (sesionEstaAbiertaEnBackend(sesionFallback)) return sesionFallback;

    for (let intento = 0; intento < 6; intento += 1) {
      const sesionYaAbierta = await obtenerSesionAbiertaPorGrupo(idGrupo, fechaHoy).catch(() => null);
      if (sesionYaAbierta && String(obtenerIdSesion(sesionYaAbierta)) === String(idSesionReal)) {
        return sesionYaAbierta;
      }
      await esperar(500);
    }

    throw new Error("El backend todavia no confirmo la sesion como ABIERTA. Intenta de nuevo en unos segundos.");
  }

  async function irAAsistencia() {
    const idGrupo = obtenerIdGrupo(grupoActivo);
    const sesionProgramada = grupoActivo?.sesion;
    const idSesion = obtenerIdSesion(sesionProgramada);

    if (!idGrupo || !idSesion) {
      setMensajeError("No se encontro la ficha o la sesion programada.");
      return;
    }

    setAbriendoSesion(true);
    setMensajeError("");

    try {
      let sesionAbierta = await obtenerSesionRealDelBloque(sesionProgramada, idGrupo);
      let estado = String(sesionAbierta?.estado || sesionProgramada?.estado || "").toUpperCase();
      let idSesionReal = obtenerIdSesionFormacion(sesionAbierta);

      if (!idSesionReal) {
        throw new Error("No se encontro la sesion real para cargar asistencia.");
      }

      if (!sesionEstaAbiertaEnBackend(sesionAbierta)) {
        try {
          sesionAbierta = extraerSesionRespuesta(await abrirSesionAsistencia(idSesionReal), sesionAbierta);
        } catch (errorApertura) {
          const sesionRealActualizada = await obtenerSesionRealDelBloque(sesionProgramada, idGrupo);
          if (sesionEstaAbiertaEnBackend(sesionRealActualizada)) {
            sesionAbierta = sesionRealActualizada;
            idSesionReal = obtenerIdSesionFormacion(sesionRealActualizada) || idSesionReal;
          } else {
            estado = String(sesionRealActualizada?.estado || "").toUpperCase();
          }
          const sesionYaAbierta = await obtenerSesionAbiertaPorGrupo(idGrupo, fechaHoy).catch(() => null);
          if (sesionYaAbierta && (
            String(obtenerIdSesion(sesionYaAbierta)) === String(idSesionReal) ||
            sesionCoincideConBloque(sesionYaAbierta, sesionProgramada)
          )) {
            sesionAbierta = sesionYaAbierta;
          } else {
            const mensaje = errorApertura?.message || "";
            if (mensaje.includes("PROGRAMADAS") || mensaje.includes("PROGRAMADA")) {
              throw new Error(`El backend tiene esta seccion en estado ${estado || "desconocido"} y no permitio abrirla como programada.`, { cause: errorApertura });
            }
            throw new Error(errorApertura.message || "No fue posible abrir la sesion de asistencia.", { cause: errorApertura });
          }
        }
      }

      const idSesionAbierta = obtenerIdSesionFormacion(sesionAbierta) || idSesionReal;
      if (!idSesionAbierta) {
        throw new Error("No se encontro la sesion real para cargar asistencia.");
      }
      const sesionConfirmada = await confirmarSesionAbierta(idGrupo, idSesionAbierta, sesionAbierta);
      const sesionActiva = {
        ...sesionProgramada,
        ...sesionConfirmada,
        id_sesion_formacion: idSesionAbierta,
        estado: "ABIERTA"
      };
      guardarDatoPersistente("sima_asistencia_grupo_activo", String(idGrupo));
      guardarDatoPersistente("sima_asistencia_sesion_activa", String(idSesionAbierta));
      guardarDatoPersistente("sima_asistencia_sesion_seleccionada", String(idSesionAbierta));
      guardarJsonPersistente("sima_asistencia_sesion_detalle", sesionActiva);
      guardarJsonPersistente("sima_asistencia_bloque_activo", {
        fecha: obtenerFechaSesion(sesionActiva, fechaHoy),
        hora_inicio: obtenerHoraInicioSesion(sesionActiva),
        hora_fin: obtenerHoraFinSesion(sesionActiva),
        id_grupo: idGrupo,
        numero_ficha: obtenerCodigo(grupoActivo)
      });
      guardarDatoPersistente(obtenerClaveAviso(fechaHoy, sesionProgramada), "cerrado");
      setVisible(false);
      window.dispatchEvent(new CustomEvent("sima:sesiones-actualizadas", {
        detail: { sesion: sesionActiva }
      }));
      navigate("/instructor/asistencia");
    } catch (error) {
      const mensaje = error.message || "No fue posible abrir la seccion de asistencia.";
      setMensajeError(
        mensaje.includes("PROGRAMADAS")
          ? "Solo se pueden abrir secciones en Proxima seccion o Pendiente."
          : mensaje
      );
    } finally {
      setAbriendoSesion(false);
    }
  }

  async function cancelarAviso() {
    const sesionProgramada = grupoActivo?.sesion;
    const idSesion = obtenerIdSesion(sesionProgramada);
    if (!idSesion || !window.confirm("¿Confirmas que deseas cancelar esta sesion?")) return;

    setAbriendoSesion(true);
    setMensajeError("");
    try {
      const respuestaCancelacion = await cancelarSesionAsistencia(idSesion);
      const datosCancelados = respuestaCancelacion?.sesion || respuestaCancelacion?.data?.sesion || respuestaCancelacion || {};
      const sesionCancelada = {
        ...sesionProgramada,
        ...datosCancelados,
        id_sesion_formacion: datosCancelados.id_sesion_formacion || idSesion,
        estado: "CANCELADA"
      };
      guardarDatoPersistente(`sima_sesion_cancelada_${idSesion}`, "true");
      guardarDatoPersistente(obtenerClaveAviso(fechaHoy, sesionProgramada), "cerrado");
      setVisible(false);
      setGrupoActivo(null);
      window.dispatchEvent(new CustomEvent("sima:sesiones-actualizadas", {
        detail: { sesion: sesionCancelada }
      }));
    } catch (error) {
      setMensajeError(error.message || "No fue posible cancelar la sesion.");
    } finally {
      setAbriendoSesion(false);
    }
  }

  if (!revisionInicialCompleta && rutaActual === RUTA_INICIO_INSTRUCTOR) {
    return (
      <div className="asistencia-session-overlay" role="status" aria-live="polite">
        <section className="asistencia-session-modal">
          <span className="asistencia-session-icon">
            <Clock3 size={30} />
          </span>
          <div className="asistencia-session-copy">
            <span>Revisando horario</span>
            <h2>Consultando la sesion programada...</h2>
            <small>Esto tomara solo un momento.</small>
          </div>
        </section>
      </div>
    );
  }

  function recordarMasTarde() {
    setVisible(false);
    window.setTimeout(() => {
      setRevisionAviso((valor) => valor + 1);
    }, MINUTOS_RECORDATORIO * 60 * 1000);
  }

  if (!visible || !grupoActivo) return null;

  const sesionActiva = grupoActivo.sesion || {};
  const horaInicio = obtenerHoraInicioSesion(sesionActiva);
  const horaFin = obtenerHoraFinSesion(sesionActiva);
  const estadoSesionModal = String(sesionActiva.estadoCalendario || sesionActiva.estado || "PROGRAMADA").toUpperCase();
  const etiquetaSesionModal = estadoSesionModal === "PENDIENTE" ? "Sesion pendiente" : "Proxima seccion";

  return (
    <div className="asistencia-session-overlay" role="dialog" aria-modal="true" aria-labelledby="asistencia-session-title">
      <section className="asistencia-session-modal">
        <span className="asistencia-session-icon">
          <CalendarCheck size={30} />
        </span>

        <div className="asistencia-session-copy">
          <span><CheckCircle2 size={14} /> {etiquetaSesionModal}</span>
          <h2 id="asistencia-session-title">Ficha {obtenerCodigo(grupoActivo)} · {obtenerPrograma(grupoActivo)}</h2>
          <small>{formatearFecha(fechaHoy)}</small>
        </div>

        <div className="asistencia-session-details">
          <div>
            <Clock3 size={18} />
            <strong>{horaInicio} -<br />{horaFin}</strong>
          </div>
          <div>
            <Building2 size={18} />
            <strong>{obtenerAmbienteSesion(sesionActiva)}</strong>
          </div>
        </div>

        {mensajeError && <p className="asistencia-session-error">{mensajeError}</p>}

        <div className="asistencia-session-actions">
          <button className="asistencia-session-action primary" type="button" onClick={irAAsistencia} disabled={abriendoSesion}>
            <ArrowRight size={18} />
            {abriendoSesion ? "Abriendo sesion..." : "Ir a asistencia"}
          </button>
          <button className="asistencia-session-action secondary" type="button" onClick={recordarMasTarde} disabled={abriendoSesion}>
            <Clock3 size={17} />
            Mas tarde
          </button>
          <button className="asistencia-session-action danger" type="button" onClick={cancelarAviso} disabled={abriendoSesion}>
            <Ban size={17} />
            {abriendoSesion ? "Procesando..." : "Cancelar sesion"}
          </button>
        </div>
      </section>
    </div>
  );
}
