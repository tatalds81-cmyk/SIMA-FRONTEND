import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, AlertTriangle, ShieldAlert, ChevronRight, 
  Search, ExternalLink, Calendar, Loader2
} from 'lucide-react';
import { obtenerGruposAlertasCoordinador, obtenerAlertasPorGrupo } from '../../services/alertasService';
import AvatarAprendiz from '../../components/alertas/AvatarAprendiz';
import BadgeSeveridad from '../../components/alertas/BadgeSeveridad';
import './alertasCoordinador.css';

export default function AlertasCoordinador() {
  const navigate = useNavigate();
  
  // Estados: 'GRUPOS' | 'APRENDICES'
  const [vistaActual, setVistaActual] = useState('GRUPOS');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  
  // Datos
  const [grupos, setGrupos] = useState([]);
  const [aprendices, setAprendices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar lista de grupos al montar
  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    setLoading(true);
    const { data, error } = await obtenerGruposAlertasCoordinador();
    if (data) setGrupos(data);
    setLoading(false);
  };

  const manejarSeleccionGrupo = async (grupo) => {
    setGrupoSeleccionado(grupo);
    setVistaActual('APRENDICES');
    setLoading(true);
    const { data, error } = await obtenerAlertasPorGrupo(grupo.idGrupo ?? grupo.grupoCodigo);
    if (data) setAprendices(data);
    setLoading(false);
  };

  const volverAGrupos = () => {
    setVistaActual('GRUPOS');
    setGrupoSeleccionado(null);
    setAprendices([]);
    cargarGrupos(); // Recargar por si hubo cierres
  };

  const formatearFecha = (isoStr) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="ac-page">
      <div className="ac-page-header">
        <div>
          <nav className="ac-breadcrumb">
            <span className="ac-bread-link" onClick={() => navigate('/')}>Inicio</span>
            <span className="ac-bread-sep">›</span>
            {vistaActual === 'GRUPOS' ? (
              <span className="ac-bread-active">Alertas por Ficha</span>
            ) : (
              <>
                <span className="ac-bread-link" onClick={volverAGrupos}>Alertas por Ficha</span>
                <span className="ac-bread-sep">›</span>
                <span className="ac-bread-active">Ficha {grupoSeleccionado?.grupoCodigo}</span>
              </>
            )}
          </nav>
          <h1 className="ac-page-title">
            {vistaActual === 'GRUPOS' ? 'Gestión de Alertas' : `Alertas: Ficha ${grupoSeleccionado?.grupoCodigo}`}
          </h1>
        </div>
      </div>

      <div className="ac-panel">
        <div className="ac-panel-header">
          <h2 className="ac-panel-title">
            {vistaActual === 'GRUPOS' ? 'Consolidado por Fichas' : 'Aprendices con Alertas Activas'}
          </h2>
          {vistaActual === 'APRENDICES' && (
             <div className="ac-grupo-info" style={{ textAlign: 'right' }}>
               <span>Instructor Líder</span>
               <strong>{grupoSeleccionado?.instructorLider}</strong>
             </div>
          )}
        </div>

        {loading ? (
          <div className="ac-empty-state">
            <Loader2 className="spin" size={40} style={{ color: '#2563eb', marginBottom: 16 }} />
            <p>Cargando información...</p>
          </div>
        ) : vistaActual === 'GRUPOS' ? (
          /* VISTA 1: TABLA DE GRUPOS */
          <div className="ac-table-wrap">
            {grupos.length > 0 ? (
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>Ficha y Programa</th>
                    <th>Instructor Líder</th>
                    <th>Total Alertas</th>
                    <th>Desglose Severidad</th>
                    <th>Último Reporte</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map((g) => (
                    <tr key={g.grupoCodigo} className="ac-tr-clickable" onClick={() => manejarSeleccionGrupo(g)}>
                      <td>
                        <div className="ac-grupo-info">
                          <strong>{g.grupoCodigo.split(' ')[0]}</strong>
                          <span>{g.grupoCodigo.substring(g.grupoCodigo.indexOf(' ') + 1)}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Users size={16} color="#64748b" />
                          <span style={{ fontWeight: 600, color: '#334155' }}>{g.instructorLider}</span>
                        </div>
                      </td>
                      <td>
                        <span className="ac-badge-total">{g.totalAlertas}</span>
                      </td>
                      <td>
                        <div className="ac-severidad-dots">
                          {g.graves > 0 && <span className="ac-sev-dot"><i className="grave" /> {g.graves} Graves</span>}
                          {g.moderadas > 0 && <span className="ac-sev-dot"><i className="moderada" /> {g.moderadas} Moderadas</span>}
                          {g.leves > 0 && <span className="ac-sev-dot"><i className="leve" /> {g.leves} Leves</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
                          <Calendar size={14} /> {formatearFecha(g.ultimaAlerta)}
                        </div>
                      </td>
                      <td>
                        <button className="ac-action-btn">
                          Ver aprendices <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="ac-empty-state">
                <ShieldAlert size={48} />
                <h3>No hay alertas activas</h3>
                <p>Todas las fichas se encuentran sin alertas académicas o convivenciales en este momento.</p>
              </div>
            )}
          </div>
        ) : (
          /* VISTA 2: TABLA DE APRENDICES (Por grupo) */
          <div className="ac-table-wrap">
            {aprendices.length > 0 ? (
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>Aprendiz</th>
                    <th>Tipo de Alerta</th>
                    <th>Severidad</th>
                    <th>Reportado Por</th>
                    <th>Fecha</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {aprendices.map((a) => (
                    <tr key={a.id} className="ac-tr-clickable" onClick={() => navigate(`/alertas/${a.id}`)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <AvatarAprendiz nombre={a.aprendizNombre} size="md" />
                          <div className="ac-grupo-info">
                            <strong>{a.aprendizNombre}</strong>
                            <span>{a.aprendizDocumento}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                          {a.tipoAlerta.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <BadgeSeveridad severidad={a.severidad} />
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
                          {a.responsableNombre}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
                          <Calendar size={14} /> {formatearFecha(a.fechaCreacion)}
                        </div>
                      </td>
                      <td>
                        <button className="ac-action-btn-primary" onClick={(e) => { e.stopPropagation(); navigate(`/alertas/${a.id}`); }}>
                          Revisar y Cerrar <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="ac-empty-state">
                <ShieldAlert size={48} />
                <h3>No hay aprendices con alertas</h3>
                <p>No se encontraron alertas activas para esta ficha.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
