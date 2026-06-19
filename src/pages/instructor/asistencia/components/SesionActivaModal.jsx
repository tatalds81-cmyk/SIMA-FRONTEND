import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Ban, Building2, CalendarCheck, CheckCircle2, Clock3, X } from "lucide-react";
import {
  obtenerGruposInstructor,
  obtenerSesionAbiertaInstructor,
  obtenerSesionAbiertaPorGrupo,
  obtenerSesionesInstructorDia
} from "../asistencia.service";
import { formatearFecha, obtenerCodigo, obtenerIdGrupo, obtenerIdSesion, obtenerPrograma } from "../asistencia.utils";
import "../../instructor.css";

const RUTA_INICIO_INSTRUCTOR = "/instructor/dashboard";
const MINUTOS_RECORDATORIO = 30;

function esInstructor() {
  return String(localStorage.getItem("rol") || "").toLowerCase() === "instructor";
}

function obtenerGrupoDesdeSesion(sesion) {
  return sesion?.grupo || sesion?.grupo_formacion || sesion?.grupo_trimestre?.grupo || {};
}

function obtenerIdGrupoSesion(sesion) {
  return sesion?.id_grupo || sesion?.grupo?.id_grupo || sesion?.grupo_formacion?.id_grupo || sesion?.grupo_trimestre?.id_grupo || "";
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

function sesionSigueVigente(sesion, fechaISO) {
  const estado = String(sesion?.estado || "").toUpperCase();
  if (["CANCELADA", "CANCELADO", "CERRADA", "CERRADO", "FINALIZADA"].includes(estado)) return false;

  const fin = crearFechaHora(fechaISO, obtenerHoraFinSesion(sesion));
  if (fin && new Date() > fin) return false;
  if (["ABIERTA", "ACTIVA", "EN_CURSO"].includes(estado)) return true;

  return true;
}

function sesionYaInicio(sesion, fechaISO) {
  const estado = String(sesion?.estado || "").toUpperCase();
  if (["ABIERTA", "ACTIVA", "EN_CURSO"].includes(estado)) return true;

  const inicio = crearFechaHora(fechaISO, obtenerHoraInicioSesion(sesion));
  return inicio ? new Date() >= inicio : true;
}

function obtenerClaveAviso(fechaISO, sesion = null) {
  return `sima_aviso_asistencia_${fechaISO}_${obtenerIdSesion(sesion) || "dia"}`;
}

function obtenerClaveRecordatorio(fechaISO, sesion = null) {
  return `sima_aviso_asistencia_recordar_${fechaISO}_${obtenerIdSesion(sesion) || "dia"}`;
}

export default function SesionActivaModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [visible, setVisible] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [revisionAviso, setRevisionAviso] = useState(0);
  const fechaHoy = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const rutaActual = location.pathname;

  useEffect(() => {
    let activo = true;

    async function revisarSesionActiva() {
      if (!esInstructor() || rutaActual !== RUTA_INICIO_INSTRUCTOR) {
        setVisible(false);
        return;
      }

      const [sesionDirecta, sesionesDia, grupos] = await Promise.all([
        obtenerSesionAbiertaInstructor(fechaHoy).catch(() => null),
        obtenerSesionesInstructorDia(fechaHoy).catch(() => []),
        obtenerGruposInstructor().catch(() => [])
      ]);
      if (!activo) return;

      let grupoConSesion = null;
      const sesionVigente = sesionDirecta || sesionesDia.find((sesion) =>
        sesionYaInicio(sesion, fechaHoy) && sesionSigueVigente(sesion, fechaHoy)
      );

      if (sesionVigente) {
        const idGrupoSesion = String(obtenerIdGrupoSesion(sesionVigente));
        const grupoEnLista = grupos.find((grupo) => String(obtenerIdGrupo(grupo)) === idGrupoSesion);
        grupoConSesion = {
          ...obtenerGrupoDesdeSesion(sesionVigente),
          ...grupoEnLista,
          id_grupo: idGrupoSesion || obtenerIdGrupo(grupoEnLista) || obtenerIdGrupo(obtenerGrupoDesdeSesion(sesionVigente)),
          sesion: sesionVigente
        };
      }

      for (const grupo of grupos) {
        if (grupoConSesion) break;
        const idGrupo = obtenerIdGrupo(grupo);
        const sesion = await obtenerSesionAbiertaPorGrupo(idGrupo, fechaHoy).catch(() => null);
        if (sesion) {
          grupoConSesion = { ...grupo, sesion };
          break;
        }
      }

      if (!activo) return;
      const sesionAviso = grupoConSesion?.sesion;
      if (sesionAviso && !sesionSigueVigente(sesionAviso, fechaHoy)) {
        setVisible(false);
        return;
      }

      const avisoCerrado = sessionStorage.getItem(obtenerClaveAviso(fechaHoy, sesionAviso));
      if (avisoCerrado === "cerrado") {
        setVisible(false);
        return;
      }

      const recordarHasta = Number(sessionStorage.getItem(obtenerClaveRecordatorio(fechaHoy, sesionAviso)) || 0);
      if (recordarHasta && Date.now() < recordarHasta) {
        setVisible(false);
        return;
      }

      setGrupoActivo(grupoConSesion);
      setVisible(Boolean(grupoConSesion));
    }

    revisarSesionActiva();
    return () => {
      activo = false;
    };
  }, [fechaHoy, rutaActual, revisionAviso]);

  useEffect(() => {
    if (!visible || !grupoActivo?.sesion) return undefined;

    const fin = crearFechaHora(fechaHoy, obtenerHoraFinSesion(grupoActivo.sesion));
    if (!fin) return undefined;

    const tiempoRestante = fin.getTime() - Date.now();
    if (tiempoRestante <= 0) {
      setVisible(false);
      setGrupoActivo(null);
      return undefined;
    }

    const temporizador = window.setTimeout(() => {
      setVisible(false);
      setGrupoActivo(null);
      setRevisionAviso((valor) => valor + 1);
    }, tiempoRestante + 250);

    return () => window.clearTimeout(temporizador);
  }, [fechaHoy, grupoActivo, visible]);

  function cerrarAviso() {
    sessionStorage.setItem(obtenerClaveAviso(fechaHoy, grupoActivo?.sesion), "cerrado");
    setVisible(false);
  }

  function recordarMasTarde() {
    const recordarHasta = Date.now() + MINUTOS_RECORDATORIO * 60 * 1000;
    sessionStorage.setItem(
      obtenerClaveRecordatorio(fechaHoy, grupoActivo?.sesion),
      String(recordarHasta)
    );
    setVisible(false);
    window.setTimeout(() => setRevisionAviso((valor) => valor + 1), recordarHasta - Date.now() + 250);
  }

  function irAAsistencia() {
    if (grupoActivo) {
      sessionStorage.setItem("sima_asistencia_grupo_activo", String(obtenerIdGrupo(grupoActivo)));
    }

    const idSesion = obtenerIdSesion(grupoActivo?.sesion);
    if (idSesion) {
      sessionStorage.setItem("sima_asistencia_sesion_activa", String(idSesion));
    }

    sessionStorage.setItem(obtenerClaveAviso(fechaHoy, grupoActivo?.sesion), "cerrado");
    setVisible(false);
    navigate("/instructor/asistencia");
  }

  function cancelarAviso() {
    sessionStorage.setItem(obtenerClaveAviso(fechaHoy, grupoActivo?.sesion), "cerrado");
    setVisible(false);
  }

  if (!visible || !grupoActivo) return null;

  const sesionActiva = grupoActivo.sesion || {};
  const horaInicio = obtenerHoraInicioSesion(sesionActiva);
  const horaFin = obtenerHoraFinSesion(sesionActiva);

  return (
    <div className="asistencia-session-overlay" role="dialog" aria-modal="true" aria-labelledby="asistencia-session-title">
      <section className="asistencia-session-modal">
        <button className="asistencia-session-close" type="button" onClick={cerrarAviso} aria-label="Cerrar aviso">
          <X size={18} />
        </button>

        <span className="asistencia-session-icon">
          <CalendarCheck size={30} />
        </span>

        <div className="asistencia-session-copy">
          <span><CheckCircle2 size={14} /> Sesion activa</span>
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
          <button className="asistencia-session-action primary" type="button" onClick={irAAsistencia}>
            <ArrowRight size={18} />
            Ir a asistencia
          </button>
          <button className="asistencia-session-action secondary" type="button" onClick={recordarMasTarde}>
            <Clock3 size={17} />
            Recordar mas tarde
          </button>
          <button className="asistencia-session-action danger" type="button" onClick={cancelarAviso}>
            <Ban size={17} />
            Cancelar
          </button>
        </div>
      </section>
    </div>
  );
}
