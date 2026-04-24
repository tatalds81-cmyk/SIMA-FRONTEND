import { useState, useEffect } from 'react';
import "./registroAprendices.css"

// URL base de nuestro backend que provee la API de aprendices
const API_URL = 'http://localhost:3000/api/aprendices';

function RegistroAprendices() {
  // === ESTADOS GENERALES DE DATOS ===
  // Listado de fichas de formación extraídas de la base de datos
  const [fichas, setFichas] = useState([]);
  // Listado completo de aprendices registrados en el sistema
  const [aprendices, setAprendices] = useState([]);
  
  // === NAVEGACIÓN ===
  // Controla qué pestaña (tab) se está mostrando actualmente. 
  // Puede ser: 'individual', 'masiva', o 'registrados'.
  const [activeTab, setActiveTab] = useState('individual'); 

  // === ESTADO DEL FORMULARIO INDIVIDUAL ===
  // Almacena los datos introducidos en el formulario de registro manual
  const [formData, setFormData] = useState({
    tipo_documento: 'CC', // Por defecto 'Cédula de Ciudadanía' para agilizar el registro
    numero_documento: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    numero_ficha: '' // Relación con el programa de formación al que será asignado
  });
  
  // === ESTADOS DE INTERFAZ DE USUARIO (UI) ===
  // Indica si hay un proceso de petición en curso (para deshabilitar botones, mostrar spinners, etc.)
  const [loading, setLoading] = useState(false);
  // Almacena y muestra mensajes de éxito o error tras enviar el formulario individual
  const [mensaje, setMensaje] = useState(null);
  
  // === ESTADO DEL FORMULARIO DE CARGA MASIVA ===
  // Archivo Excel (.xlsx) subido por el usuario
  const [file, setFile] = useState(null);
  // Indicador de carga específico para procesos masivos (que suelen tardar más)
  const [masiveLoading, setMasiveLoading] = useState(false);
  // Almacena el resultado del procesamiento del backend (éxitos, fallos, detalles por fila)
  const [masiveResult, setMasiveResult] = useState(null);

  // Inicializar datos (se explicará en el useEffect)
  // === CARGA INICIAL DE DATOS ===
  // hook de React que se ejecuta al montar el componente (crearse por primera vez)
  useEffect(() => {
    fetchFichas();     // Trae las fichas disponibles
    fetchAprendices(); // Trae los aprendices ya guardados
  }, []); // El arreglo vacío [] indica que se ejecuta solo una vez.

  // Función asíncrona para obtener las fichas activas disponibles para inscribirse
  const fetchFichas = async () => {
    try {
      const resp = await fetch(`${API_URL}/fichas-activas`); // Petición GET
      const data = await resp.json();
      if (data.ok) setFichas(data.data); // Guarda el data array en el estado
    } catch (error) {
      console.error('Error cargando fichas:', error);
    }
  };

  // Función asíncrona para descargar a todos los aprendices y llenar la tabla de "Registrados"
  const fetchAprendices = async () => {
    try {
      const resp = await fetch(API_URL); // Petición GET por defecto a la ruta principal
      const data = await resp.json();
      if (data.ok) setAprendices(data.data); // Guarda en estado para renderizar
    } catch (error) {
      console.error('Error cargando aprendices:', error);
    }
  };

  // === MANEJADORES DE EVENTOS ===

  // Actualiza genéricamente cualquier campo del formulario individual
  // Escucha el evento change de los inputs, e inyecta el `value` en el estado usando la llave `name` del input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Procesa y envía la información del formulario manual de inscripción individual al servidor
  const handleIndividualSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se resfresque al mandar el formulario
    setLoading(true);   // Bloquea el botón de envío
    setMensaje(null);   // Reinicia mensajes previos
    
    try {
      // Petición POST con el contenido en formato JSON
      const resp = await fetch(`${API_URL}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData) // Transforma el estado JavaScript a string JSON
      });
      const data = await resp.json();
      
      if (resp.ok) {
        // En caso de éxito, notifica y limpia el formulario
        setMensaje({ type: 'success', text: 'Aprendiz registrado exitosamente' });
        setFormData({
          tipo_documento: 'CC', numero_documento: '', nombres: '', 
          apellidos: '', email: '', telefono: '', numero_ficha: ''
        });
        fetchAprendices(); // Refresca automáticamente la tabla con el nuevo usuario
      } else {
        // En caso de respuesta negativa (pero resuelta del api), muestra el mensaje
        setMensaje({ type: 'error', text: data.error || 'Error al registrar' });
      }
    } catch (error) {
      // Ocurre si el servidor cae o hay un problema de red HTTP
      setMensaje({ type: 'error', text: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false); // Libera el botón al terminar en cualquier escenario
    }
  };

  // Permite al usuario adjuntar y prepar en el estado el archivo Excel que seleccione
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Se encarga de empaquetar y enviar el archivo Excel masivo al Backend para procesarlo
  const handleMasiveSubmit = async (e) => {
    e.preventDefault();
    if (!file) return; // Validación rapida: si no sube nada no ejecuta nada.
    
    setMasiveLoading(true);
    setMasiveResult(null);
    
    // Al ser un archivo no sirve JSON. Necesitamos estrucutrarlo en FormData nativo
    const fd = new FormData();
    fd.append('archivo', file);
    
    try {
      const resp = await fetch(`${API_URL}/registro-masivo`, {
        method: 'POST',
        body: fd // Mandamos el FormData directamente (fetch auto-asigna el header de multipart/form-data)
      });
      const data = await resp.json();
      setMasiveResult(data); // El backend deberíai devolver desglosado lo qué se añadio y qué falló
      
      // Si insertamos o sea más de 0 éxitos, actualizamos el componente visual de la tabla
      if (data.exitosos > 0) {
        fetchAprendices(); 
      }
    } catch (error) {
      setMasiveResult({ 
        ok: false, 
        error: 'Error de conexión con el servidor. ¿Está ejecutándose en el puerto 3000?' 
      });
    } finally {
      setMasiveLoading(false);
      setFile(null); // Borra el archivo de nuestro estado interno en JS
      // Resetea el elemento de entrada archivo en el DOM visual del HTML
      const fileInput = document.getElementById('excel-upload');
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <div className="app-container">
      
      {/* Header Section */}
      <header className="header-section">
        <div className="title-area">
          <h1>Registro de Aprendices</h1>
          <p>Registra aprendices de forma individual o mediante carga masiva</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setActiveTab('individual')}
          style={{ visibility: activeTab === 'individual' ? 'hidden' : 'visible' }}
        >
          + Nuevo aprendiz
        </button>
      </header>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'individual' ? 'active' : 'inactive'}`}
          onClick={() => setActiveTab('individual')}
        >
          Registro individual
        </button>
        <button 
          className={`tab-btn ${activeTab === 'masiva' ? 'active' : 'inactive'}`}
          onClick={() => setActiveTab('masiva')}
        >
          Carga masiva
        </button>
        <button 
          className={`tab-btn ${activeTab === 'registrados' ? 'active' : 'inactive'}`}
          onClick={() => setActiveTab('registrados')}
        >
          Aprendices registrados
        </button>
      </div>

      {/* Main Content Area */}
      
      {/* === REGISTRO INDIVIDUAL === */}
      {activeTab === 'individual' && (
        <section className="card">
          <div className="card-header">
            <h2>Datos Personales</h2>
            <span>Campos marcados con <span className="asterisk">*</span> son obligatorios</span>
          </div>
          
          {mensaje && (
            <div className={`alert ${mensaje.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {mensaje.text}
            </div>
          )}
          
          <form onSubmit={handleIndividualSubmit}>
            
            <div className="form-row">
              <div className="form-group">
                <label>Número de documento <span className="asterisk">*</span></label>
                <div className="document-group">
                  <select 
                    name="tipo_documento" 
                    className="form-control" 
                    value={formData.tipo_documento} 
                    onChange={handleInputChange} 
                    required
                  >
                    <option value="CC">CC</option>
                    <option value="TI">TI</option>
                    <option value="CE">CE</option>
                  </select>
                  <input 
                    type="text" 
                    name="numero_documento" 
                    className={`form-control ${formData.numero_documento.length > 5 ? 'input-success' : ''}`}
                    value={formData.numero_documento} 
                    onChange={handleInputChange} 
                    placeholder="1001234567"
                    required 
                  />
                </div>
                {/* Visual feedback optional based on the mockup */}
                {formData.numero_documento.length > 5 && (
                  <span style={{color: 'var(--primary-green)', fontSize: '0.85rem', marginTop: '0.2rem', display: 'block'}}>✓ Documento válido</span>
                )}
              </div>

              <div className="form-group">
                <label>Nombres Completos <span className="asterisk">*</span></label>
                {/* We split names and last names into two 50% inputs to keep them in one row visually, matching the mock's horizontal space but keeping backend compatible */}
                <div style={{display: 'flex', gap: '1rem'}}>
                  <input 
                    type="text" 
                    name="nombres" 
                    className="form-control" 
                    value={formData.nombres} 
                    onChange={handleInputChange} 
                    placeholder="Nombres"
                    required 
                  />
                  <input 
                    type="text" 
                    name="apellidos" 
                    className="form-control" 
                    value={formData.apellidos} 
                    onChange={handleInputChange} 
                    placeholder="Apellidos"
                    required 
                  />
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Correo electrónico <span className="asterisk">*</span></label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-control" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  placeholder="correo@sena.edu.co"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input 
                  type="text" 
                  name="telefono" 
                  className="form-control" 
                  value={formData.telefono} 
                  onChange={handleInputChange} 
                  placeholder="3001234567"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ficha de formación <span className="asterisk">*</span></label>
                <select 
                  name="numero_ficha" 
                  className="form-control" 
                  value={formData.numero_ficha} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="">Seleccione Ficha...</option>
                  {fichas.map(f => (
                    <option key={f.id_grupo} value={f.numero_ficha}>
                      {f.numero_ficha} - {f.programa}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group" style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', paddingBottom: '0.85rem'}}>
                 {/* Empty space matching mockup visually, we removed "rol asignado" */}
              </div>
            </div>

            <div className="info-box">
              Si el documento no existe en el sistema, se creará el usuario automáticamente con rol <strong>Aprendiz</strong>. La contraseña inicial será su número de documento y deberá cambiarla en el primer inicio de sesión.
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setFormData({tipo_documento: 'CC', numero_documento: '', nombres: '', apellidos: '', email: '', telefono: '', numero_ficha: ''})}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar aprendiz'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* === CARGA MASIVA === */}
      {activeTab === 'masiva' && (
        <section className="card">
          <div className="card-header">
            <h2>Carga Masiva (Excel)</h2>
          </div>
          <p style={{marginBottom: '1.5rem', color: 'var(--text-muted)'}}>
            Sube un archivo .xlsx con las columnas:<br/>
            <strong>tipo_documento, numero_documento, nombres, apellidos, email, numero_ficha</strong>, telefono.
          </p>
          
          <form onSubmit={handleMasiveSubmit}>
            <div className="file-upload-wrapper">
              <div style={{color: 'var(--primary-green)', fontWeight: '600', fontSize: '1.1rem'}}>
                {file ? file.name : 'Arrastra o haz clic para subir Excel (.xlsx)'}
              </div>
              <input 
                id="excel-upload"
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileChange}
              />
            </div>
            
            <div className="form-actions" style={{marginTop: 0}}>
              <button type="submit" className="btn btn-primary" disabled={masiveLoading || !file}>
                {masiveLoading ? 'Procesando archivo...' : 'Registrar por Lote'}
              </button>
            </div>
          </form>

          {masiveResult && (
              <div className="results-modal">
                <h4>Resultados de Carga</h4>
                {masiveResult.error ? (
                  <p className="error-text">{masiveResult.error}</p>
                ) : (
                  <>
                    <p style={{marginBottom: '1rem'}}>
                      Total procesados: {masiveResult.total} | 
                      <span className="success-text" style={{margin: '0 10px'}}>Exitos: {masiveResult.exitosos}</span> | 
                      <span className="error-text">Fallos: {masiveResult.fallidos}</span>
                    </p>
                    <ul className="results-list">
                      {masiveResult.resultados && masiveResult.resultados.map((r, i) => (
                        <li key={i}>
                          Fila {r.fila}: {r.numero_documento} - {r.ok ? 
                            <span className="success-text"> ✓ OK</span> : 
                            <span className="error-text"> ✗ {r.error}</span>
                          }
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
          )}
        </section>
      )}

      {/* === TABLA DE REGISTRADOS === */}
      {activeTab === 'registrados' && (
        <section className="card">
          <div className="card-header">
            <h2>Aprendices Registrados</h2>
          </div>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Doc.</th>
                  <th>Nombre Completo</th>
                  <th>Email</th>
                  <th>Ficha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {aprendices.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', color: 'var(--text-muted)'}}>No hay aprendices registrados aún</td>
                  </tr>
                ) : (
                  aprendices.map(a => (
                    <tr key={a.id_persona || a.numero_documento}> {/* fallback if id_persona missing */}
                      <td><strong>{a.tipo_documento}</strong> {a.numero_documento}</td>
                      <td>{a.nombres} {a.apellidos}</td>
                      <td>{a.email}</td>
                      <td>
                        {a.numero_ficha ? 
                          <span className="badge">{a.numero_ficha}</span> : 
                          <span style={{color: '#9CA3AF'}}>Sin Ficha</span>
                        }
                      </td>
                      <td>
                        <span style={{
                          color: a.estado_formativo === 'EN_FORMACION' ? 'var(--primary-green)' : 'inherit',
                          fontWeight: a.estado_formativo === 'EN_FORMACION' ? '600' : 'normal'
                        }}>
                          {a.estado_formativo ? a.estado_formativo.replace('_', ' ') : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      
    </div>
  );
}

export default RegistroAprendices;
