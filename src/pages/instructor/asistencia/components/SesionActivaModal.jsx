import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Ban, CalendarCheck, Clock3, X } from "lucide-react";
import {
  cancelarSesionAsistencia,
  obtenerGruposInstructor,
  obtenerSesionAbiertaInstructor,
  obtenerSesionAbiertaPorGrupo
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

export default function SesionActivaModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [visible, setVisible] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const fechaHoy = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const rutaActual = location.pathname;

  useEffect(() => {
    let activo = true;

    async function revisarSesionActiva() {
      if (!esInstructor() || rutaActual !== RUTA_INICIO_INSTRUCTOR) {
        setVisible(false);
        return;
      }

      const avisoCerrado = sessionStorage.getItem(`sima_aviso_asistencia_${fechaHoy}`);
      if (avisoCerrado === "cerrado") return;
      const recordarHasta = Number(sessionStorage.getItem(`sima_aviso_asistencia_recordar_${fechaHoy}`) || 0);
      if (recordarHasta && Date.now() < recordarHasta) return;

      const [sesionDirecta, grupos] = await Promise.all([
        obtenerSesionAbiertaInstructor(fechaHoy).catch(() => null),
        obtenerGruposInstructor().catch(() => [])
      ]);
      if (!activo) return;

      let grupoConSesion = null;
      if (sesionDirecta) {
        const idGrupoSesion = String(obtenerIdGrupoSesion(sesionDirecta));
        const grupoEnLista = grupos.find((grupo) => String(obtenerIdGrupo(grupo)) === idGrupoSesion);
        grupoConSesion = {
          ...obtenerGrupoDesdeSesion(sesionDirecta),
          ...grupoEnLista,
          id_grupo: idGrupoSesion || obtenerIdGrupo(grupoEnLista) || obtenerIdGrupo(obtenerGrupoDesdeSesion(sesionDirecta)),
          sesion: sesionDirecta
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
      setGrupoActivo(grupoConSesion);
      setVisible(Boolean(grupoConSesion));
    }

    revisarSesionActiva();
    return () => {
      activo = false;
    };
  }, [fechaHoy, rutaActual]);

  function cerrarAviso() {
    sessionStorage.setItem(`sima_aviso_asistencia_${fechaHoy}`, "cerrado");
    setVisible(false);
  }

  function recordarMasTarde() {
    sessionStorage.setItem(
      `sima_aviso_asistencia_recordar_${fechaHoy}`,
      String(Date.now() + MINUTOS_RECORDATORIO * 60 * 1000)
    );
    setVisible(false);
  }

  function irAAsistencia() {
    if (grupoActivo) {
      sessionStorage.setItem("sima_asistencia_grupo_activo", String(obtenerIdGrupo(grupoActivo)));
    }

    setVisible(false);
    navigate("/instructor/asistencia");
  }

  async function cancelarAsistencia() {
    const idSesion = obtenerIdSesion(grupoActivo?.sesion);
    setCancelando(true);
    setMensajeError("");

    try {
      await cancelarSesionAsistencia(idSesion, "Cancelada desde aviso de sesion activa.");
      sessionStorage.setItem(`sima_aviso_asistencia_${fechaHoy}`, "cerrado");
      setVisible(false);
      setGrupoActivo(null);
    } catch (error) {
      setMensajeError(error.message || "No fue posible cancelar la asistencia.");
    } finally {
      setCancelando(false);
    }
  }

  if (!visible || !grupoActivo) return null;

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
          <span>Sesion activa</span>
          <p>
            Ficha <strong>{obtenerCodigo(grupoActivo)}</strong> - {obtenerPrograma(grupoActivo)}
          </p>
          <small>{formatearFecha(fechaHoy)}</small>
        </div>

        {mensajeError && <p className="asistencia-session-error">{mensajeError}</p>}

        <div className="asistencia-session-actions">
          <button className="asistencia-session-action primary" type="button" onClick={irAAsistencia} disabled={cancelando}>
            Ir a asistencia
            <ArrowRight size={18} />
          </button>
          <button className="asistencia-session-action secondary" type="button" onClick={recordarMasTarde} disabled={cancelando}>
            Recordar mas tarde
            <Clock3 size={17} />
          </button>
          <button className="asistencia-session-action danger" type="button" onClick={cancelarAsistencia} disabled={cancelando}>
            {cancelando ? "Cancelando..." : "Cancelar asistencia"}
            <Ban size={17} />
          </button>
        </div>
      </section>
    </div>
  );
}
