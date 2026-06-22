import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  Download,
  FileText,
  Info,
  MessageSquareWarning,
  Stethoscope,
  X
} from "lucide-react";
import {
  marcarNotificacionLeida,
  marcarTodasComoLeidas,
  obtenerNotificaciones
} from "../../services/alertasService";
import "./notificaciones.css";

const JUSTIFICACION_DEMO = {
  id: "justificacion-demo-1",
  tipo: "JUSTIFICACION",
  mensaje: "Laura Gómez Ruiz envió una justificación médica para revisión.",
  fecha: new Date().toISOString(),
  leida: false,
  aprendiz: "Laura Gómez Ruiz",
  ficha: "2847301",
  hora: "08:15 a. m.",
  justificacion: "Cita médica",
  descripcion:
    "Solicito permiso de ausentismo para el día de hoy debido a una cita médica programada con antelación en el hospital universitario. Adjunto el comprobante correspondiente.",
  archivo: "comprobante_cita_medica.pdf",
  archivoDetalle: "PDF · 342 KB"
};

function tiempoRelativo(fecha) {
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (minutos < 1) return "Ahora mismo";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  return `Hace ${Math.floor(horas / 24)} días`;
}

export default function NotificacionCampana({ esCoordinador = false }) {
  const esInstructor = !esCoordinador;
  const [notificaciones, setNotificaciones] = useState(
    esInstructor ? [JUSTIFICACION_DEMO] : []
  );
  const [isOpen, setIsOpen] = useState(false);
  const [justificacion, setJustificacion] = useState(null);
  const [demoVisible, setDemoVisible] = useState(esInstructor);
  const [demoLeida, setDemoLeida] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const noLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length;

  const cargarNotificaciones = useCallback(async () => {
    const { data } = await obtenerNotificaciones();
    const recibidas = Array.isArray(data) ? data : [];
    setNotificaciones(
      demoVisible ? [{ ...JUSTIFICACION_DEMO, leida: demoLeida }, ...recibidas] : recibidas
    );
  }, [demoLeida, demoVisible]);

  useEffect(() => {
    const inicial = setTimeout(cargarNotificaciones, 0);
    const interval = setInterval(cargarNotificaciones, 60000);
    return () => {
      clearTimeout(inicial);
      clearInterval(interval);
    };
  }, [cargarNotificaciones]);

  useEffect(() => {
    function cerrarAlHacerClickAfuera(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", cerrarAlHacerClickAfuera);
    return () => document.removeEventListener("mousedown", cerrarAlHacerClickAfuera);
  }, [isOpen]);

  useEffect(() => {
    function cerrarConEscape(event) {
      if (event.key === "Escape") setJustificacion(null);
    }
    if (justificacion) {
      document.addEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "";
    };
  }, [justificacion]);

  async function abrirNotificacion(notificacion) {
    setIsOpen(false);
    if (notificacion.tipo === "JUSTIFICACION") {
      setDemoLeida(true);
      setNotificaciones((actuales) =>
        actuales.map((item) =>
          item.id === notificacion.id ? { ...item, leida: true } : item
        )
      );
      setResultado("");
      setObservacion("");
      setJustificacion(notificacion);
      return;
    }
    if (!notificacion.leida) {
      await marcarNotificacionLeida(notificacion.id);
      await cargarNotificaciones();
    }
  }

  async function marcarTodas() {
    setLoading(true);
    if (esInstructor) {
      setDemoLeida(true);
      setNotificaciones((actuales) => actuales.map((item) => ({ ...item, leida: true })));
    }
    await marcarTodasComoLeidas();
    await cargarNotificaciones();
    setLoading(false);
  }

  function resolverJustificacion(decision) {
    setResultado(decision);
    setDemoVisible(false);
    setNotificaciones((actuales) =>
      actuales.filter((item) => item.id !== justificacion.id)
    );
  }

  return (
    <>
      <div className="notif-container" ref={dropdownRef}>
        <button
          className={`notif-btn ${esCoordinador ? "coordinador" : ""} ${isOpen ? "active" : ""}`}
          type="button"
          onClick={() => setIsOpen((abierto) => !abierto)}
          aria-label={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ""}`}
          aria-expanded={isOpen}
        >
          <Bell size={22} />
          {noLeidas > 0 && <span className="notif-badge">{noLeidas}</span>}
        </button>

        {isOpen && (
          <div className="notif-dropdown">
            <div className="notif-header">
              <h3>Notificaciones</h3>
              <span>{noLeidas} pendiente{noLeidas === 1 ? "" : "s"}</span>
            </div>

            <div className="notif-list">
              {notificaciones.length ? (
                notificaciones.slice(0, 5).map((notificacion) => (
                  <button
                    type="button"
                    key={notificacion.id}
                    className={`notif-item ${!notificacion.leida ? "unread" : ""}`}
                    onClick={() => abrirNotificacion(notificacion)}
                  >
                    <span className={`notif-icon-box ${notificacion.tipo.toLowerCase()}`}>
                      {notificacion.tipo === "JUSTIFICACION" ? <Stethoscope size={17} /> :
                        notificacion.tipo === "MANUAL" ? <MessageSquareWarning size={17} /> :
                          <Info size={17} />}
                    </span>
                    <span className="notif-content">
                      <strong>{notificacion.tipo === "JUSTIFICACION" ? "Justificación del aprendiz" : "Nueva notificación"}</strong>
                      <span className="notif-msg">{notificacion.mensaje}</span>
                      <span className="notif-time"><Clock size={11} /> {tiempoRelativo(notificacion.fecha)}</span>
                    </span>
                    {!notificacion.leida && <span className="notif-dot" />}
                  </button>
                ))
              ) : (
                <div className="notif-empty">
                  <BellOff size={32} />
                  <p>No tienes notificaciones pendientes</p>
                </div>
              )}
            </div>

            {notificaciones.length > 0 && (
              <div className="notif-footer">
                <button className="notif-btn-readall" type="button" onClick={marcarTodas} disabled={loading || noLeidas === 0}>
                  <CheckCheck size={14} /> {loading ? "Procesando..." : "Marcar todas como leídas"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {justificacion && createPortal(
        <div className="justificacion-overlay" onMouseDown={(event) => event.target === event.currentTarget && setJustificacion(null)}>
          <section className="justificacion-modal" role="dialog" aria-modal="true" aria-labelledby="justificacion-title">
            <header className="justificacion-header">
              <span className="justificacion-header-icon"><Bell size={21} /></span>
              <div>
                <h2 id="justificacion-title">Novedad del aprendiz</h2>
                <p>Solicitud pendiente de revisión</p>
              </div>
              <span className={`justificacion-estado ${resultado ? "resuelta" : ""}`}>
                {resultado || "Pendiente"}
              </span>
              <button className="justificacion-cerrar" type="button" onClick={() => setJustificacion(null)} aria-label="Cerrar ventana">
                <X size={20} />
              </button>
            </header>

            <div className="justificacion-body">
              {resultado ? (
                <div className="justificacion-resultado">
                  <span><Check size={30} /></span>
                  <h3>Justificación {resultado.toLowerCase()}</h3>
                  <p>La decisión se guardó localmente como demostración.</p>
                  {observacion && <blockquote>“{observacion}”</blockquote>}
                  <button type="button" onClick={() => setJustificacion(null)}>Cerrar</button>
                </div>
              ) : (
                <>
                  <div className="justificacion-grid">
                    <div><span>Aprendiz</span><strong>{justificacion.aprendiz}</strong></div>
                    <div><span>Ficha</span><strong>{justificacion.ficha}</strong></div>
                    <div><span>Hora de novedad</span><strong>{justificacion.hora}</strong></div>
                    <div><span>Justificación</span><strong>{justificacion.justificacion}</strong></div>
                  </div>

                  <div className="justificacion-descripcion">
                    <span>Descripción</span>
                    <p>{justificacion.descripcion}</p>
                  </div>

                  <div className="justificacion-archivo">
                    <FileText size={22} />
                    <span><strong>{justificacion.archivo}</strong><small>{justificacion.archivoDetalle}</small></span>
                    <button type="button" title="Archivo simulado para esta demostración"><Download size={16} /> Ver archivo</button>
                  </div>

                  <label className="justificacion-observacion">
                    <span>Observación del instructor</span>
                    <textarea
                      value={observacion}
                      onChange={(event) => setObservacion(event.target.value)}
                      placeholder="Escriba aquí su observación (opcional)..."
                      maxLength={500}
                    />
                  </label>

                  <div className="justificacion-actions">
                    <button className="rechazar" type="button" onClick={() => resolverJustificacion("Rechazada")}><X size={18} /> Rechazar</button>
                    <button className="aceptar" type="button" onClick={() => resolverJustificacion("Aceptada")}><Check size={18} /> Aceptar</button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
