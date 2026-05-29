import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CalendarCheck, X } from "lucide-react";
import { obtenerGruposInstructor } from "../asistencia.service";
import { formatearFecha, obtenerCodigo, obtenerIdGrupo, obtenerPrograma } from "../asistencia.utils";
import "../../instructor.css";

const RUTA_INICIO_INSTRUCTOR = "/instructor/dashboard";

function esInstructor() {
  return String(localStorage.getItem("rol") || "").toLowerCase() === "instructor";
}

function textoActivo(valor) {
  return String(valor || "").trim().toUpperCase();
}

function tieneSesionActiva(grupo) {
  const valoresDirectos = [
    grupo?.sesion_activa,
    grupo?.seccion_activa,
    grupo?.session_active,
    grupo?.asistencia_activa,
    grupo?.clase_activa,
    grupo?.sesion?.activa,
    grupo?.seccion?.activa,
    grupo?.session?.active,
  ];

  if (valoresDirectos.some((valor) => valor === true || valor === 1 || valor === "1")) {
    return true;
  }

  const estados = [
    grupo?.estado_sesion,
    grupo?.estado_seccion,
    grupo?.session_status,
    grupo?.sesion?.estado,
    grupo?.seccion?.estado,
    grupo?.session?.status,
  ].map(textoActivo);

  return estados.some((estado) => ["ACTIVA", "ACTIVO", "EN_CURSO", "ABIERTA"].includes(estado));
}

export default function SesionActivaModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [visible, setVisible] = useState(false);
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

      const grupos = await obtenerGruposInstructor().catch(() => []);
      if (!activo) return;

      const sesion = grupos.find(tieneSesionActiva);
      setGrupoActivo(sesion || null);
      setVisible(Boolean(sesion));
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

  function irAAsistencia() {
    if (grupoActivo) {
      sessionStorage.setItem("sima_asistencia_grupo_activo", String(obtenerIdGrupo(grupoActivo)));
    }

    setVisible(false);
    navigate("/instructor/asistencia");
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

        <button className="asistencia-session-action" type="button" onClick={irAAsistencia}>
          Ir a asistencia
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
}
