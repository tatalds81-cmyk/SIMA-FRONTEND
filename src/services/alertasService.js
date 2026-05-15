import api from './api';

// 💡 INTERRUPTOR DE MODO (true = datos quemados, false = backend real)
const USE_MOCK = false;

/**
 * Retorna el rol del usuario actual.
 * En modo mock, simula rol COORDINADOR para poder demostrar H24.
 * En producción (USE_MOCK = false), lee el rol real del localStorage.
 */
export function getRolActual() {
  const rolLocal = (localStorage.getItem('rol') || '').toLowerCase();
  if (USE_MOCK && !rolLocal) return 'coordinador';
  return rolLocal;
}

// ─── HELPER: Mensajes de error ───────────────────────────────────────────────
function mensajeError(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;
  return error.message || 'Error en la comunicación con el servidor';
}

function limpiarParams(filtros = {}) {
  const p = {};
  Object.keys(filtros).forEach(k => {
    if (filtros[k] !== '' && filtros[k] !== null && filtros[k] !== undefined) {
      p[k] = filtros[k];
    }
  });
  return p;
}

function mapBackendAlerta(alerta) {
  if (!alerta) return alerta;

  // Extraer información del aprendiz si está disponible (vía joins del backend)
  const persona = alerta.aprendiz?.usuario?.persona;
  const nombreAprendiz = persona 
    ? `${persona.nombres || ''} ${persona.apellidos || ''}`.trim() 
    : (alerta.aprendizNombre || '—');
  
  const documentoAprendiz = persona?.numero_documento || alerta.aprendizDocumento || '—';

  return {
    ...alerta,
    id: alerta.id_alerta || alerta.id,
    fechaCreacion: alerta.fecha_alerta || alerta.fechaCreacion,
    tipoAlerta: alerta.tipo_alerta || alerta.tipoAlerta,
    grupoCodigo: alerta.grupo?.numero_ficha || alerta.grupoCodigo,
    idGrupo: alerta.id_grupo || alerta.idGrupo,
    responsableNombre: alerta.creada_por ? `ID Usuario ${alerta.creada_por}` : 'Sistema',
    aprendizNombre: nombreAprendiz,
    aprendizDocumento: documentoAprendiz,
    // Mapear observaciones vinculadas si vienen del backend (alerta_observaciones)
    observacionesVinculadas: (alerta.alerta_observaciones || []).map(ao => ({
      id: ao.id_observacion,
      fecha: ao.observacion?.fecha_observacion || ao.fecha_asociacion,
      descripcion: ao.observacion?.descripcion || '—'
    }))
  };
}

// ─── MOCKS DE PRUEBA ─────────────────────────────────────────────────────────
let MOCK_ALERTAS = [
  {
    id: 'AL-101',
    aprendizNombre: 'Juan Pablo Duarte',
    aprendizDocumento: '1020304050',
    grupoCodigo: '3064975 (ADSO)',
    tipoAlerta: 'ACADEMICA',
    severidad: 'GRAVE',
    estado: 'ACTIVA',
    fechaCreacion: new Date().toISOString(),
    responsableNombre: 'Franco Reina',
    descripcion: 'El aprendiz no ha entregado las últimas 3 evidencias técnicas de la fase de diseño.',
    observacionesVinculadas: [
      { id: 'OBS-1', fecha: new Date(Date.now() - 5*86400000).toISOString(), descripcion: 'Falta de entrega evidencia 1' },
      { id: 'OBS-2', fecha: new Date(Date.now() - 3*86400000).toISOString(), descripcion: 'Falta de entrega evidencia 2' }
    ]
  },
  {
    id: 'AL-102',
    aprendizNombre: 'Maria Fernanda Lopez',
    aprendizDocumento: '1098765432',
    grupoCodigo: '2850312 (IoT)',
    tipoAlerta: 'CONVIVENCIAL',
    severidad: 'MODERADA',
    estado: 'EN_SEGUIMIENTO',
    fechaCreacion: new Date(Date.now() - 86400000).toISOString(),
    responsableNombre: 'Sistema',
    origen: 'AUTOMATICO',
    fuente: 'SISTEMA',
    descripcion: 'Se reporta uso inadecuado de equipos en el laboratorio de electrónica.',
    observacionesVinculadas: [
      { id: 'OBS-3', fecha: new Date(Date.now() - 2*86400000).toISOString(), descripcion: 'Llamado de atención verbal por mal uso de cautín.' }
    ]
  },
  {
    id: 'AL-103',
    aprendizNombre: 'Carlos Alberto Perez',
    aprendizDocumento: '1122334455',
    grupoCodigo: '3064975 (ADSO)',
    tipoAlerta: 'INASISTENCIA_CONSECUTIVA',
    severidad: 'GRAVE',
    estado: 'ABIERTA',
    fechaCreacion: new Date(Date.now() - 48*3600000).toISOString(),
    responsableNombre: 'Sistema',
    origen: 'AUTOMATICO',
    fuente: 'SISTEMA',
    descripcion: 'El aprendiz ha superado el límite de fallas permitidas en la semana.',
    observacionesVinculadas: []
  }
];

// ════════════════════════════════════════════════════════════════════════════
//  ALERTAS
// ════════════════════════════════════════════════════════════════════════════

export async function crearAlertaManual(payload) {
  if (USE_MOCK) {
    const nueva = {
      id: `AL-${Math.floor(Math.random() * 900) + 200}`,
      aprendizNombre: payload.aprendizNombre || 'Aprendiz Nuevo',
      aprendizDocumento: payload.aprendizDocumento || '00000000',
      grupoCodigo: payload.grupoCodigo || 'Grupo Desconocido',
      tipoAlerta: payload.tipoAlerta,
      severidad: payload.severidad,
      estado: 'ABIERTA',
      fechaCreacion: new Date().toISOString(),
      responsableNombre: 'Franco Reina (Tú)',
      descripcion: payload.descripcion
    };
    MOCK_ALERTAS = [nueva, ...MOCK_ALERTAS];
    return new Promise(resolve => setTimeout(() => resolve({ data: nueva, error: null }), 800));
  }

  try {
    const backendPayload = {
      id_aprendiz: payload.aprendizId,
      id_grupo: payload.grupoId,
      severidad: payload.severidad,
      descripcion: payload.descripcion
    };
    const { data } = await api.post('/api/alerts/manual', backendPayload);
    return { data: mapBackendAlerta(data.data || data), error: null };
  } catch (error) {
    return { data: null, error: mensajeError(error) };
  }
}

export async function crearAlertaDesdeObservaciones(payload) {
  if (USE_MOCK) {
    const nueva = {
      id: `AL-${Math.floor(Math.random() * 900) + 200}`,
      aprendizNombre: payload.aprendizNombre || 'Aprendiz Nuevo',
      aprendizDocumento: payload.aprendizDocumento || '00000000',
      grupoCodigo: payload.grupoCodigo || 'Grupo Desconocido',
      tipoAlerta: 'MANUAL',
      severidad: payload.severidad,
      estado: 'ACTIVA',
      fechaCreacion: new Date().toISOString(),
      responsableNombre: 'Instructor',
      descripcion: payload.descripcion,
      observacionesVinculadas: (payload.observationIds || []).map(id => ({
        id,
        fecha: new Date().toISOString(),
        descripcion: `Observacion ${id}`
      }))
    };
    MOCK_ALERTAS = [nueva, ...MOCK_ALERTAS];
    return new Promise(resolve => setTimeout(() => resolve({ data: nueva, error: null }), 800));
  }

  try {
    const backendPayload = {
      id_aprendiz: Number(payload.aprendizId),
      id_grupo: Number(payload.grupoId),
      severidad: payload.severidad,
      descripcion: payload.descripcion,
      observationIds: (payload.observationIds || []).map(Number),
      notificar_coordinador: Boolean(payload.notificarCoordinador)
    };
    const { data } = await api.post('/api/alerts/from-observations', backendPayload);
    return { data: mapBackendAlerta(data.data || data), error: null };
  } catch (error) {
    return { data: null, error: mensajeError(error) };
  }
}

export async function obtenerAlertas(filtros = {}) {
  if (USE_MOCK) {
    return new Promise(resolve => {
      setTimeout(() => {
        let res = [...MOCK_ALERTAS];
        if (filtros.aprendizBusqueda) {
          res = res.filter(a => a.aprendizNombre.toLowerCase().includes(filtros.aprendizBusqueda.toLowerCase()));
        }
        if (filtros.fechaInicio) {
          const d = new Date(filtros.fechaInicio);
          res = res.filter(a => new Date(a.fechaCreacion) >= d);
        }
        if (filtros.fechaFin) {
          const h = new Date(filtros.fechaFin);
          h.setHours(23, 59, 59, 999); // Incluir todo el día final
          res = res.filter(a => new Date(a.fechaCreacion) <= h);
        }
        resolve({ data: { data: res, total: res.length }, error: null });
      }, 600);
    });
  }

  try {
    const params = limpiarParams(filtros);
    
    // ── Mapeo de filtros Frontend -> Backend ──
    if (params.aprendizBusqueda) {
      params.q = params.aprendizBusqueda;
      delete params.aprendizBusqueda;
    }
    if (params.grupoId) {
      params.id_grupo = params.grupoId;
      delete params.grupoId;
    }
    if (params.tipoAlerta) {
      // Mapeo de tipos de frontend a categorías del backend
      if (params.tipoAlerta === 'ACADEMICA' || params.tipoAlerta === 'CONVIVENCIAL') {
        params.tipo_alerta = 'MANUAL';
      } else if (params.tipoAlerta.includes('INASISTENCIA')) {
        params.tipo_alerta = 'INASISTENCIA';
      } else if (params.tipoAlerta === 'RECURRENCIA_OBSERVACIONES') {
        params.tipo_alerta = 'OBSERVACIONES_RECURRENTES';
      } else {
        params.tipo_alerta = params.tipoAlerta;
      }
      delete params.tipoAlerta;
    }
    if (params.fechaInicio) {
      params.fecha_desde = params.fechaInicio;
      delete params.fechaInicio;
    }
    if (params.fechaFin) {
      params.fecha_hasta = params.fechaFin;
      delete params.fechaFin;
    }
    
    // Mapear parámetros de paginación
    if (params.pagina) {
      params.page = params.pagina;
      delete params.pagina;
    }
    if (params.limite) {
      params.limit = params.limite;
      delete params.limite;
    }

    const { data } = await api.get('/api/alerts', { params });
    const res = data.data || data;
    let arr = res.alertas || res;

    if (Array.isArray(arr)) {
      arr = arr.map(mapBackendAlerta);
    }
    return { 
      data: { 
        data: arr, 
        total: res.total || arr.length,
        pagina: res.pagina || 1,
        totalPaginas: res.total_paginas || 1
      }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error: mensajeError(error) };
  }
}

export async function obtenerAlertaPorId(id) {
  if (USE_MOCK) {
    const alerta = MOCK_ALERTAS.find(a => a.id === id) || MOCK_ALERTAS[0];
    return new Promise(resolve => setTimeout(() => resolve({ data: alerta, error: null }), 300));
  }

  try {
    const { data } = await api.get(`/api/alerts/${id}`);
    const alerta = data.data || data;
    return { data: mapBackendAlerta(alerta), error: null };
  } catch (error) {
    return { data: null, error: mensajeError(error) };
  }
}

export async function cerrarAlerta(id, justificacion, estadoFinal = 'CERRADA') {
  if (USE_MOCK) {
    return new Promise(resolve => {
      setTimeout(() => {
        const index = MOCK_ALERTAS.findIndex(a => a.id === id);
        if (index !== -1) {
          MOCK_ALERTAS[index] = { 
            ...MOCK_ALERTAS[index], 
            estado: estadoFinal,
            justificacionCierre: justificacion,
            fechaCierre: new Date().toISOString(),
            cerradoPor: 'Coordinador (Tú)'
          };
        }
        resolve({ data: true, error: null });
      }, 1000);
    });
  }
  try {
    const payload = { estado: estadoFinal };
    if (estadoFinal === 'CERRADA') {
      payload.justificacion_cierre = justificacion;
    }
    const { data } = await api.patch(`/api/alerts/${id}/status`, payload);
    const alerta = data.data || data;
    return { data: mapBackendAlerta(alerta), error: null };
  } catch (error) {
    return { data: null, error: error.response?.status || mensajeError(error), fullError: error };
  }
}

export async function obtenerAlertasPorAprendiz(aprendizId) {
  if (USE_MOCK) return { data: MOCK_ALERTAS, error: null };
  try {
    const { data } = await api.get('/api/alerts', { params: { id_aprendiz: aprendizId } });
    let arr = data.data || data;
    if (Array.isArray(arr)) arr = arr.map(mapBackendAlerta);
    return { data: arr, error: null };
  } catch (error) {
    return { data: null, error: mensajeError(error) };
  }
}

export async function obtenerGruposAlertasCoordinador() {
  if (USE_MOCK) {
    // Agrupar MOCK_ALERTAS por grupoCodigo y contar severidades
    const resumen = {};
    MOCK_ALERTAS.forEach(alerta => {
      const g = alerta.grupoCodigo;
      if (!resumen[g]) {
        resumen[g] = {
          grupoCodigo: g,
          instructorLider: g.includes('ADSO') ? 'Franco Reina' : 'Maria Gomez',
          totalAlertas: 0,
          leves: 0, moderadas: 0, graves: 0,
          ultimaAlerta: alerta.fechaCreacion
        };
      }
      if (alerta.estado !== 'CERRADA' && alerta.estado !== 'RESUELTA') {
        resumen[g].totalAlertas++;
        if (alerta.severidad === 'LEVE') resumen[g].leves++;
        if (alerta.severidad === 'MODERADA') resumen[g].moderadas++;
        if (alerta.severidad === 'GRAVE') resumen[g].graves++;
      }
      if (new Date(alerta.fechaCreacion) > new Date(resumen[g].ultimaAlerta)) {
        resumen[g].ultimaAlerta = alerta.fechaCreacion;
      }
    });
    return new Promise(resolve => setTimeout(() => resolve({ data: Object.values(resumen), error: null }), 600));
  }

  try {
    // 1. Obtener todos los grupos a los que el coordinador tiene acceso
    const { data: respGrupos } = await api.get('/api/groups', { params: { limit: 1000 } });
    let listaGrupos = respGrupos.data?.grupos || respGrupos.data || respGrupos;
    if (!Array.isArray(listaGrupos)) listaGrupos = [];

    // 2. Traemos todas las alertas activas
    const { data: respAlertas } = await api.get('/api/alerts', { params: { estado: 'ACTIVA', limit: 1000 } });
    let arrAlertas = respAlertas.data?.alertas || respAlertas.data || respAlertas;
    if (!Array.isArray(arrAlertas)) arrAlertas = [];

    const resumen = {};

    // 3. Inicializar el resumen con TODOS los grupos
    listaGrupos.forEach(grupo => {
      const idGrupo = grupo.id_grupo || grupo.id;
      const instructor = grupo.instructor_lider?.usuario?.persona;
      const nombreInstructor = instructor ? `${instructor.nombres} ${instructor.apellidos}`.trim() : (grupo.instructor_lider_nombre || 'Sin asignar');

      resumen[idGrupo] = {
        idGrupo: idGrupo,
        grupoCodigo: grupo.numero_ficha || String(idGrupo),
        instructorLider: nombreInstructor,
        totalAlertas: 0,
        leves: 0, moderadas: 0, graves: 0,
        ultimaAlerta: null
      };
    });

    // 4. Mapear y agrupar las alertas
    const alertasMapeadas = arrAlertas.map(mapBackendAlerta);

    alertasMapeadas.forEach(alerta => {
      const idGrupo = alerta.id_grupo;
      if (!idGrupo) return;

      if (!resumen[idGrupo]) {
        // Si el grupo no vino en /api/groups pero tiene alertas, lo añadimos
        resumen[idGrupo] = {
          idGrupo: idGrupo,
          grupoCodigo: alerta.grupoCodigo || String(idGrupo),
          instructorLider: alerta.responsableNombre || 'Sistema',
          totalAlertas: 0,
          leves: 0, moderadas: 0, graves: 0,
          ultimaAlerta: null
        };
      }

      if (alerta.estado !== 'CERRADA' && alerta.estado !== 'RESUELTA') {
        resumen[idGrupo].totalAlertas++;
        if (alerta.severidad === 'LEVE') resumen[idGrupo].leves++;
        if (alerta.severidad === 'MODERADA') resumen[idGrupo].moderadas++;
        if (alerta.severidad === 'GRAVE' || alerta.severidad === 'CRITICA') resumen[idGrupo].graves++;
      }
      
      const fechaAlerta = new Date(alerta.fechaCreacion);
      if (!resumen[idGrupo].ultimaAlerta || fechaAlerta > new Date(resumen[idGrupo].ultimaAlerta)) {
        resumen[idGrupo].ultimaAlerta = alerta.fechaCreacion;
      }
    });

    return { data: Object.values(resumen), error: null };
  } catch (error) {
    return { data: null, error: mensajeError(error) };
  }
}

export async function obtenerAlertasPorGrupo(grupoCodigo) {
  if (USE_MOCK) {
    const filtradas = MOCK_ALERTAS.filter(a => a.grupoCodigo === grupoCodigo && a.estado !== 'CERRADA' && a.estado !== 'RESUELTA');
    return new Promise(resolve => setTimeout(() => resolve({ data: filtradas, error: null }), 400));
  }

  try {
    const { data } = await api.get('/api/alerts', { params: { id_grupo: grupoCodigo } });
    const res = data.data || data;
    let arr = res.alertas || res;
    if (Array.isArray(arr)) arr = arr.map(mapBackendAlerta);
    return { data: arr, error: null };
  } catch (error) {
    return { data: null, error: mensajeError(error) };
  }
}

export async function obtenerGrupos() {
  if (USE_MOCK) {
    return { data: [{ id: 1, numero_ficha: '3064975', programa_formacion: { nombre_programa: 'ADSO' } }], error: null };
  }
  try {
    const { data } = await api.get('/api/groups');
    // Mapear respuesta según lo que devuelve el backend
    const lista = data.data?.grupos || data.data || data;
    return { data: Array.isArray(lista) ? lista : [], error: null };
  } catch (error) {
    return { data: [], error: mensajeError(error) };
  }
}

function mapAprendiz(aprendiz) {
  const persona = aprendiz?.usuario?.persona;
  const nombre = persona
    ? `${persona.nombres || ''} ${persona.apellidos || ''}`.trim()
    : aprendiz?.nombre;

  return {
    id: aprendiz?.id_aprendiz || aprendiz?.id,
    nombre: nombre || `ID ${aprendiz?.id_aprendiz || aprendiz?.id || ''}`,
    documento: persona?.numero_documento || aprendiz?.documento || '---',
    email: aprendiz?.usuario?.email || aprendiz?.email || '',
    raw: aprendiz
  };
}

export async function obtenerAprendicesPorGrupo(grupoId, filtros = {}) {
  if (USE_MOCK) {
    const data = [
      { id: 1, nombre: 'Juan Pablo Duarte', documento: '1020304050' },
      { id: 2, nombre: 'Maria Fernanda Lopez', documento: '1098765432' },
      { id: 3, nombre: 'Carlos Alberto Perez', documento: '1122334455' }
    ];
    return { data, error: null };
  }

  try {
    const params = limpiarParams({
      estado: 'ACTIVO',
      limit: 1000,
      ...filtros
    });
    const { data } = await api.get(`/api/apprentices/grupo/${grupoId}`, { params });
    const res = data.data || data;
    const lista = res.aprendices || res.data || res;
    return { data: Array.isArray(lista) ? lista.map(mapAprendiz) : [], error: null };
  } catch (error) {
    return { data: [], error: mensajeError(error) };
  }
}

function mapObservacion(observacion) {
  const persona = observacion?.aprendiz?.usuario?.persona;
  const instructorPersona = observacion?.instructor?.usuario?.persona;
  const autor = instructorPersona
    ? `${instructorPersona.nombres || ''} ${instructorPersona.apellidos || ''}`.trim()
    : 'Instructor';

  return {
    id: observacion?.id_observacion || observacion?.id,
    idAprendiz: observacion?.id_aprendiz,
    idGrupo: observacion?.id_grupo,
    tipo: observacion?.tipo_observacion,
    severidad: observacion?.severidad,
    estado: observacion?.estado,
    descripcion: observacion?.descripcion || '',
    fecha: observacion?.fecha_observacion,
    autor,
    aprendizNombre: persona ? `${persona.nombres || ''} ${persona.apellidos || ''}`.trim() : '',
    raw: observacion
  };
}

export async function obtenerObservacionesAbiertasPorAprendiz(grupoId, aprendizId) {
  if (USE_MOCK) {
    return {
      data: [
        {
          id: 11,
          tipo: 'ACADEMICA',
          severidad: 'GRAVE',
          estado: 'ABIERTA',
          fecha: new Date().toISOString(),
          autor: 'Instructor',
          descripcion: 'Observacion abierta de prueba con evidencia suficiente para escalar.'
        }
      ],
      error: null
    };
  }

  try {
    const { data } = await api.get(`/api/observations/group/${grupoId}`, {
      params: {
        id_aprendiz: aprendizId,
        estado: 'ABIERTA',
        limit: 1000
      }
    });
    const res = data.data || data;
    const lista = res.observaciones || res.data || res;
    return { data: Array.isArray(lista) ? lista.map(mapObservacion) : [], error: null };
  } catch (error) {
    return { data: [], error: mensajeError(error) };
  }
}

export async function buscarAprendices(query) {
  if (USE_MOCK) {
    const db = [
      { id: 1, nombre: 'Juan Pablo Duarte', documento: '1020304050' },
      { id: 2, nombre: 'Maria Fernanda Lopez', documento: '1098765432' },
      { id: 3, nombre: 'Carlos Alberto Perez', documento: '1122334455' }
    ];
    const filtrados = db.filter(a => a.nombre.toLowerCase().includes(query.toLowerCase()) || a.documento.includes(query));
    return new Promise(resolve => setTimeout(() => resolve({ data: filtrados, error: null }), 400));
  }

  try {
    const { data } = await api.get('/api/apprentices/listado', { params: { nombre: query } });
    const lista = data.data?.aprendices || data.data || [];
    
    // Mapear para el modal: { id, nombre, documento }
    const mapeados = lista.map(a => ({
      id: a.id_aprendiz,
      nombre: `${a.usuario?.persona?.nombres || ''} ${a.usuario?.persona?.apellidos || ''}`.trim() || `ID ${a.id_aprendiz}`,
      documento: a.usuario?.persona?.numero_documento || '—'
    }));

    return { data: mapeados, error: null };
  } catch (error) {
    return { data: [], error: mensajeError(error) };
  }
}

// ─── MOCKS DE NOTIFICACIONES (Alineados con H27) ───────────────────────────
let MOCK_NOTIFICACIONES = [
  {
    id: 1,
    mensaje: 'H26: Aprendiz con 3 inasistencias consecutivas en ADSO-2456',
    tipo: 'AUTOMATICA',
    fecha: new Date(Date.now() - 300000).toISOString(),
    leida: false,
    alertaId: 'AL-102'
  },
  {
    id: 2,
    mensaje: 'H25: Alerta GRAVE generada por recurrencia de observaciones técnicas',
    tipo: 'AUTOMATICA',
    fecha: new Date(Date.now() - 3600000).toISOString(),
    leida: false,
    alertaId: 'AL-101'
  },
  {
    id: 3,
    mensaje: 'H24: La coordinación ha cerrado la alerta de inasistencia de Carlos Perez',
    tipo: 'SISTEMA',
    fecha: new Date(Date.now() - 86400000).toISOString(),
    leida: true,
    alertaId: 'AL-103'
  }
];

// ════════════════════════════════════════════════════════════════════════════
//  NOTIFICACIONES
// ════════════════════════════════════════════════════════════════════════════

export async function obtenerNotificaciones() {
  if (USE_MOCK) return new Promise(resolve => setTimeout(() => resolve({ data: MOCK_NOTIFICACIONES, error: null }), 300));
  try {
    const { data } = await api.get('/api/notificaciones');
    return { data, error: null };
  } catch (error) {
    return { data: null, error: mensajeError(error) };
  }
}

export async function marcarNotificacionLeida(id) {
  if (USE_MOCK) {
    const idx = MOCK_NOTIFICACIONES.findIndex(n => n.id === id);
    if (idx !== -1) MOCK_NOTIFICACIONES[idx].leida = true;
    return { data: true, error: null };
  }
  try {
    const { data } = await api.patch(`/api/notificaciones/${id}/leer`);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: mensajeError(error) };
  }
}

export async function marcarTodasComoLeidas() {
  if (USE_MOCK) {
    MOCK_NOTIFICACIONES = MOCK_NOTIFICACIONES.map(n => ({ ...n, leida: true }));
    return { data: true, error: null };
  }
  try {
    const { data } = await api.patch('/api/notificaciones/leer-todas');
    return { data, error: null };
  } catch (error) {
    return { data: null, error: mensajeError(error) };
  }
}

