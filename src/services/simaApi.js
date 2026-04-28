/**
 * simaApi.js
 * Servicio centralizado para consumir la API del backend SIMA-BACKEND-MONITOREO
 * Base URL: http://localhost:3000/api (proxy configurado en vite.config.js como /api)
 */

const BASE = "/api";

/** Obtiene el token JWT guardado en localStorage */
const getToken = () =>
  localStorage.getItem("access") || localStorage.getItem("token") || "";

/** Cabeceras comunes con Authorization */
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

/** Helper para fetch + manejo de errores */
async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status} en ${path}`);
  }
  return res.json();
}

/* ═══════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════ */

/**
 * Resumen general del coordinador (KPIs globales)
 * GET /api/dashboard/coordinador/resumen
 */
export const getDashboardResumen = () =>
  request("/dashboard/coordinador/resumen");

/**
 * Detalle de un área del coordinador (grupos del área)
 * GET /api/dashboard/coordinador/area/:idArea
 */
export const getDashboardArea = (idArea) =>
  request(`/dashboard/coordinador/area/${idArea}`);

/* ═══════════════════════════════════════════
   GRUPOS (FICHAS)
   ═══════════════════════════════════════════ */

/**
 * Lista todos los grupos del coordinador (paginado)
 * GET /api/groups
 */
export const getGroups = () => request("/groups");

/**
 * Detalle de un grupo por su ID interno de BD
 * GET /api/groups/:id
 */
export const getGroupById = (id) => request(`/groups/${id}`);


/**
 * Verifica si un número de ficha ya existe
 * GET /api/groups/verificar-ficha/:numero_ficha
 */
export const verifyFichaNumber = (numero) =>
  request(`/groups/verificar-ficha/${numero}`);

/**
 * Instructores disponibles para el select
 * GET /api/groups/instructores-disponibles
 */
export const getAvailableInstructors = () =>
  request("/groups/instructores-disponibles");

/**
 * Crear un grupo
 * POST /api/groups
 */
export const createGroup = (payload) =>
  request("/groups", { method: "POST", body: JSON.stringify(payload) });

/* ═══════════════════════════════════════════
   APRENDICES
   ═══════════════════════════════════════════ */

/**
 * Aprendices de un grupo específico
 * GET /api/apprentices/grupo/:idGrupo
 */
export const getApprenticesByGroup = (idGrupo) =>
  request(`/apprentices/grupo/${idGrupo}`);

/**
 * Listado global de aprendices (paginado)
 * GET /api/apprentices/listado
 */
export const getApprenticesListado = () => request("/apprentices/listado");

/**
 * Detalle de un aprendiz
 * GET /api/apprentices/:id
 */
export const getApprenticeById = (id) => request(`/apprentices/${id}`);

/**
 * Fichas activas para selects
 * GET /api/apprentices/grupos-activos
 */
export const getFichasActivas = () => request("/apprentices/grupos-activos");

/* ═══════════════════════════════════════════
   ALERTAS
   ═══════════════════════════════════════════ */

/**
 * Lista todas las alertas (con filtros opcionales: ?id_grupo=X&estado=ACTIVA)
 * GET /api/alerts
 */
export const getAlerts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/alerts${qs ? `?${qs}` : ""}`);
};

/**
 * Detalle de una alerta
 * GET /api/alerts/:id
 */
export const getAlertById = (id) => request(`/alerts/${id}`);

/**
 * Cambiar estado de una alerta
 * PATCH /api/alerts/:id/estado
 */
export const updateAlertStatus = (id, estado) =>
  request(`/alerts/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });

/* ═══════════════════════════════════════════
   ÁREAS
   ═══════════════════════════════════════════ */

/**
 * Áreas de formación disponibles
 * GET /api/areas (definido en GruposFormativos)
 */
export const getAreas = () => request("/areas");

/**
 * Programas de formación por área
 * GET /api/formative-programs/area/:idArea
 */
export const getProgramasByArea = (idArea) =>
  request(`/formative-programs/area/${idArea}`);
