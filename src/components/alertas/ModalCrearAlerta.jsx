import { useState, useEffect, useRef } from 'react';
import { Info, Search, Loader2, X, AlertTriangle, Bell } from 'lucide-react';
import AvatarAprendiz from './AvatarAprendiz';
import { crearAlertaManual, buscarAprendices } from '../../services/alertasService';
import Toast from '../common/Toast';
import './modal.css';

const FORM_INICIAL = {
  aprendizId: '', aprendizNombre: '',
  grupoId: '', tipoAlerta: '', severidad: '', descripcion: '',
  notificarCoordinador: true,
  notificarInstructorLider: true
};
const MAX_DESC = 500;

export default function ModalCrearAlerta({ isOpen, onClose, onAlertaCreada }) {
  const [form,       setForm]       = useState({ ...FORM_INICIAL });
  const [errores,    setErrores]    = useState({});
  const [loading,    setLoading]    = useState(false);
  const [duplicado,  setDuplicado]  = useState(false);
  const [toast,      setToast]      = useState(null);
  const [busqueda,   setBusqueda]   = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando,   setBuscando]   = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  const [grupos,     setGrupos]     = useState([]);
  const debRef = useRef(null);
  const dropRef = useRef(null);

  const MOCK_GRUPOS = [
    { id: 1, codigo: '3064975 (ADSO)' },
    { id: 2, codigo: '2850312 (IoT)' },
    { id: 3, codigo: '2901234 (MULTIMEDIA)' }
  ];

  useEffect(() => {
    if (isOpen) {
      setGrupos(MOCK_GRUPOS);
    }
  }, [isOpen]);

  useEffect(() => {
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    if (busqueda.length < 3) { setResultados([]); setDropOpen(false); return; }
    clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      setBuscando(true);
      const { data } = await buscarAprendices(busqueda);
      if (data) setResultados(data);
      setBuscando(false);
      setDropOpen(true);
    }, 400);
    return () => clearTimeout(debRef.current);
  }, [busqueda]);

  function resetear() {
    setForm({ ...FORM_INICIAL }); setErrores({});
    setBusqueda(''); setResultados([]); setDropOpen(false);
    setDuplicado(false); setLoading(false);
  }
  function handleClose() { resetear(); onClose(); }
  
  function seleccionarAprendiz(ap) {
    setBusqueda(ap.nombre);
    setForm(p => ({ ...p, aprendizId: ap.id, aprendizNombre: ap.nombre }));
    setDropOpen(false);
    if (errores.aprendizId) setErrores(p => ({ ...p, aprendizId: '' }));
  }

  function validar() {
    const e = {};
    if (!form.aprendizId) e.aprendizId = 'Selecciona un aprendiz';
    if (!form.grupoId) e.grupoId = 'Selecciona un grupo';
    if (!form.tipoAlerta) e.tipoAlerta = 'Selecciona el tipo';
    if (!form.severidad) e.severidad = 'Selecciona la severidad';
    if (!form.descripcion.trim()) e.descripcion = 'La descripción es obligatoria';
    else if (form.descripcion.trim().length < 20) e.descripcion = 'Mínimo 20 caracteres';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function enviar(forzar = false) {
    if (!forzar && !validar()) return;
    setLoading(true); setDuplicado(false);
    
    const { error } = await crearAlertaManual({
      ...form,
      aprendizNombre: form.aprendizNombre,
      aprendizDocumento: form.aprendizId ? resultados.find(r => r.id === form.aprendizId)?.documento : '',
      grupoCodigo: form.grupoId ? grupos.find(g => g.id === Number(form.grupoId))?.codigo : '',
      descripcion: form.descripcion.trim()
    });

    if (error) {
      if (error.includes('409') || error.includes('duplicada')) setDuplicado(true);
      else setErrores(p => ({ ...p, _global: error }));
      setLoading(false); return;
    }

    setToast({ message: "Alerta registrada correctamente", type: 'success' });
    
    setTimeout(() => {
      onAlertaCreada?.();
      handleClose();
    }, 1500);
  }

  if (!isOpen) return null;

  const descLen = form.descripcion.length;

  return (
    <>
      <div className="mcal-overlay" onClick={handleClose} />
      <div className="mcal-modal">
        {/* Header */}
        <div className="mcal-header">
          <h2 className="mcal-titulo">Crear alerta manual</h2>
          <button type="button" className="mcal-btn-close" onClick={handleClose}><X size={20} /></button>
        </div>

        {/* Banner Informativo */}
        <div className="mcal-banner info">
          <Info size={18} className="mcal-banner-icon" />
          <p>Las alertas manuales se crean para reportar situaciones que requieren seguimiento académico o convivencial.</p>
        </div>

        {/* Advertencia Duplicado */}
        {duplicado && (
          <div className="mcal-duplicado">
            <AlertTriangle size={15} />
            <div>
              <strong>Ya existe una alerta activa</strong> de este tipo para este aprendiz.
              ¿Deseas crear una nueva de todas formas?
            </div>
            <div className="mcal-duplicado-btns">
              <button type="button" className="mcal-btn-cancelar" onClick={() => setDuplicado(false)}>Cancelar</button>
              <button type="button" className="mcal-btn-enviar" onClick={() => enviar(true)} disabled={loading}>Crear</button>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form className="mcal-form" onSubmit={e => { e.preventDefault(); enviar(); }}>
          
          {/* Aprendiz */}
          <div className="mcal-field" ref={dropRef}>
            <label className="mcal-label">Aprendiz <span className="mcal-req">*</span></label>
            <div className={`mcal-search-wrap ${errores.aprendizId ? 'error' : ''}`}>
              <input 
                type="text" className="mcal-input" placeholder="Buscar aprendiz por nombre o documento..." 
                value={busqueda} onChange={e => setBusqueda(e.target.value)} 
              />
              <Search size={18} className="mcal-search-icon" />
              {buscando && <Loader2 size={16} className="mcal-search-spin" />}
            </div>
            {dropOpen && resultados.length > 0 && (
              <ul className="mcal-dropdown">
                {resultados.map(ap => (
                  <li key={ap.id} className="mcal-dropdown-item" onClick={() => seleccionarAprendiz(ap)}>
                    <span className="mcal-drop-nombre">{ap.nombre}</span>
                    <span className="mcal-drop-doc">{ap.documento}</span>
                  </li>
                ))}
              </ul>
            )}
            {errores.aprendizId && <span className="mcal-error-msg">{errores.aprendizId}</span>}
          </div>

          {/* Grupo */}
          <div className="mcal-field">
            <label className="mcal-label">Grupo <span className="mcal-req">*</span></label>
            <select className={`mcal-select ${errores.grupoId ? 'error' : ''}`} value={form.grupoId} onChange={e => setForm({...form, grupoId: e.target.value})}>
              <option value="">Seleccione un grupo</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.codigo}</option>)}
            </select>
            {errores.grupoId && <span className="mcal-error-msg">{errores.grupoId}</span>}
          </div>

          {/* Tipo + Severidad */}
          <div className="mcal-row">
            <div className="mcal-field">
              <label className="mcal-label">Tipo de alerta <span className="mcal-req">*</span></label>
              <select className={`mcal-select ${errores.tipoAlerta ? 'error' : ''}`} value={form.tipoAlerta} onChange={e => setForm({...form, tipoAlerta: e.target.value})}>
                <option value="">Seleccione el tipo de alerta</option>
                <option value="ACADEMICA">Académica</option>
                <option value="CONVIVENCIAL">Convivencial</option>
              </select>
              {errores.tipoAlerta && <span className="mcal-error-msg">{errores.tipoAlerta}</span>}
            </div>
            <div className="mcal-field">
              <label className="mcal-label">Severidad <span className="mcal-req">*</span></label>
              <select className={`mcal-select ${errores.severidad ? 'error' : ''}`} value={form.severidad} onChange={e => setForm({...form, severidad: e.target.value})}>
                <option value="">Seleccione la severidad</option>
                <option value="LEVE">Leve</option>
                <option value="MODERADA">Moderada</option>
                <option value="GRAVE">Grave</option>
              </select>
              <div className="mcal-sev-leyenda">
                <span><i className="mcal-dot leve" /> LEVE</span>
                <span><i className="mcal-dot moderada" /> MODERADA</span>
                <span><i className="mcal-dot grave" /> GRAVE</span>
              </div>
              {errores.severidad && <span className="mcal-error-msg">{errores.severidad}</span>}
            </div>
          </div>

          {/* Notificaciones */}
          <div className="mcal-notif-group">
            <div className="mcal-notif-check">
              <label className="mcal-checkbox-container">
                <input 
                  type="checkbox" 
                  checked={form.notificarCoordinador} 
                  onChange={e => setForm({...form, notificarCoordinador: e.target.checked})} 
                />
                <span className="mcal-checkmark"></span>
                <div className="mcal-check-text">
                  <strong>Notificar al Coordinador</strong>
                  <span>Se enviará un correo y notificación automática.</span>
                </div>
              </label>
            </div>

            <div className="mcal-notif-check">
              <label className="mcal-checkbox-container">
                <input 
                  type="checkbox" 
                  checked={form.notificarInstructorLider} 
                  onChange={e => setForm({...form, notificarInstructorLider: e.target.checked})} 
                />
                <span className="mcal-checkmark"></span>
                <div className="mcal-check-text">
                  <strong>Notificar al Instructor Líder</strong>
                  <span>Informa directamente al responsable del grupo.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Descripción */}
          <div className="mcal-field">
            <label className="mcal-label">Descripción <span className="mcal-req">*</span></label>
            <textarea 
              className={`mcal-textarea ${errores.descripcion ? 'error' : ''}`} 
              placeholder="Describa detalladamente la situación que requiere seguimiento..." 
              maxLength={MAX_DESC}
              value={form.descripcion} 
              onChange={e => setForm({...form, descripcion: e.target.value})}
            />
            <div className="mcal-desc-footer">
               {errores.descripcion && <span className="mcal-error-msg">{errores.descripcion}</span>}
               <span className="mcal-contador">{descLen} / {MAX_DESC} caracteres</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mcal-footer">
            <button type="button" className="mcal-btn-cancelar" onClick={handleClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="mcal-btn-enviar" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar alerta'}
            </button>
          </div>
        </form>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
