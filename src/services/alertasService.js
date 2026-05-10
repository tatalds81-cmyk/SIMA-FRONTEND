import api from './api';

// 💡 INTERRUPTOR DE MODO (true = datos quemados, false = backend real)
const USE_MOCK = true;

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
    const { data } = await api.post('/api/alertas/manual', payload);
    return { data, error: null };
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
    const { data } = await api.get('/api/alertas', { params });
    return { data, error: null };
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
    const { data } = await api.get(`/api/alertas/${id}`);
    return { data, error: null };
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
  // Cuando haya backend real: PATCH /api/alertas/:id/cerrar
  try {
    const { data } = await api.patch(`/api/alertas/${id}/cerrar`, { justificacion, estadoFinal });
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.response?.status || mensajeError(error), fullError: error };
  }
}

export async function obtenerAlertasPorAprendiz(aprendizId) {
  if (USE_MOCK) return { data: MOCK_ALERTAS, error: null };
  try {
    const { data } = await api.get(`/api/alertas/aprendiz/${aprendizId}`);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: mensajeError(error) };
  }
}

export async function obtenerGruposAlertasCoordinador() {
  if (USE_MOCK) {
    // Agrupar MOCK_ALERTAS por grupoCodigo y contar severidades
    const resumen = {};
    MOCK_ALERTAS.forEach(alerta => {
      if (alerta.estado === 'CERRADA' || alerta.estado === 'RESUELTA') return;
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
      resumen[g].totalAlertas++;
      if (alerta.severidad === 'LEVE') resumen[g].leves++;
      if (alerta.severidad === 'MODERADA') resumen[g].moderadas++;
      if (alerta.severidad === 'GRAVE') resumen[g].graves++;
      if (new Date(alerta.fechaCreacion) > new Date(resumen[g].ultimaAlerta)) {
        resumen[g].ultimaAlerta = alerta.fechaCreacion;
      }
    });
    return new Promise(resolve => setTimeout(() => resolve({ data: Object.values(resumen), error: null }), 600));
  }

  try {
    const { data } = await api.get('/api/alertas/coordinador/grupos');
    return { data, error: null };
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
    const { data } = await api.get(`/api/alertas/grupo/${encodeURIComponent(grupoCodigo)}`);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: mensajeError(error) };
  }
}

export async function buscarAprendices(query) {
  if (USE_MOCK) {
    const db = [
      { id: 101, nombre: 'Juan Pablo Duarte', documento: '1020304050' },
      { id: 102, nombre: 'Maria Fernanda Lopez', documento: '1098765432' },
      { id: 103, nombre: 'Carlos Alberto Perez', documento: '1122334455' },
      { id: 104, nombre: 'Ana Maria Restrepo', documento: '1000222333' }
    ];
    const filtrados = db.filter(a => 
      a.nombre.toLowerCase().includes(query.toLowerCase()) || 
      a.documento.includes(query)
    );
    return new Promise(resolve => setTimeout(() => resolve({ data: filtrados, error: null }), 400));
  }

  try {
    const { data } = await api.get('/api/aprendices/buscar', { params: { q: query } });
    return { data, error: null };
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

