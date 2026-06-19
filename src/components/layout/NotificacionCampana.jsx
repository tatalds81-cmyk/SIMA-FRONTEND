import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, BellOff, MessageSquareWarning, Bot, 
  CheckCheck, Info, Clock
} from 'lucide-react';
import { 
  obtenerNotificaciones, 
  marcarNotificacionLeida, 
  marcarTodasComoLeidas 
} from '../../services/alertasService';
import './notificaciones.css';

// ── Helper tiempo relativo ───────────────────────────────────────────────────
function tiempoRelativo(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  const horas = Math.floor(mins / 60);
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Ayer';
  return `Hace ${dias} días`;
}

export default function NotificacionCampana({ esCoordinador = false }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const cargarNotificaciones = useCallback(async () => {
    const { data } = await obtenerNotificaciones();
    if (data) setNotificaciones(data);
  }, []);

  // Polling cada 60s
  useEffect(() => {
    const inicial = setTimeout(() => {
      cargarNotificaciones();
    }, 0);
    const interval = setInterval(cargarNotificaciones, 60000);
    return () => {
      clearTimeout(inicial);
      clearInterval(interval);
    };
  }, [cargarNotificaciones]);

  // Cerrar al click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleNotifClick = async (notif) => {
    if (!notif.leida) {
      await marcarNotificacionLeida(notif.id);
      cargarNotificaciones();
    }
    setIsOpen(false);
    if (notif.alertaId) {
      navigate(`/alertas/${notif.alertaId}`);
    }
  };

  const handleMarcarTodas = async () => {
    setLoading(true);
    await marcarTodasComoLeidas();
    await cargarNotificaciones();
    setLoading(false);
  };

  return (
    <div className="notif-container" ref={dropdownRef}>
      <button 
        className={`notif-btn ${esCoordinador ? 'coordinador' : ''} ${isOpen ? 'active' : ''}`} 
        onClick={handleToggle}
        aria-label="Notificaciones"
      >
        <Bell size={22} />
        {noLeidas > 0 && <span className="notif-badge">{noLeidas}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h3>Notificaciones</h3>
            <Link to="/notificaciones" className="notif-ver-todas" onClick={() => setIsOpen(false)}>
              Ver todas
            </Link>
          </div>

          <div className="notif-list">
            {notificaciones.length > 0 ? (
              notificaciones.slice(0, 5).map(n => (
                <div 
                  key={n.id} 
                  className={`notif-item ${!n.leida ? 'unread' : ''}`}
                  onClick={() => handleNotifClick(n)}
                >
                  <div className={`notif-icon-box ${n.tipo.toLowerCase()}`}>
                    {n.tipo === 'MANUAL' && <MessageSquareWarning size={16} />}
                    {n.tipo === 'AUTOMATICA' && <Bot size={16} />}
                    {n.tipo === 'SISTEMA' && <Info size={16} />}
                  </div>
                  <div className="notif-content">
                    <p className="notif-msg">{n.mensaje}</p>
                    <span className="notif-time">
                      <Clock size={10} /> {tiempoRelativo(n.fecha)}
                    </span>
                  </div>
                  {!n.leida && <div className="notif-dot" />}
                </div>
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
              <button 
                className="notif-btn-readall" 
                onClick={handleMarcarTodas}
                disabled={loading || noLeidas === 0}
              >
                {loading ? 'Procesando...' : (
                  <>
                    <CheckCheck size={14} /> Marcar todas como leídas
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
