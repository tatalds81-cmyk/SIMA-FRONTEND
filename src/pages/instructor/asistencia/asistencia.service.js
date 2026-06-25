import { API_URL } from "./asistencia.constants";
import { extraerLista } from "./asistencia.utils";

function getHeaders() {
  const token = localStorage.getItem("access") || localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token && token !== "undefined") headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function obtenerGruposInstructor() {
  const endpoints = [
    `${API_URL}/apprentices/grupos-activos`,
    `${API_URL}/groups?limit=1000`
  ];

  for (const endpoint of endpoints) {
    const res = await fetch(endpoint, { headers: getHeaders() }).catch(() => null);
    if (!res || !res.ok) continue;

    const data = await res.json().catch(() => null);
    const grupos = extraerLista(data, "grupos");
    const fichas = extraerLista(data, "fichas");
    const lista = grupos.length ? grupos : fichas;
    if (lista.length) return lista;
  }

  return [];
}

function obtenerIdentificadoresGrupo(grupo) {
  if (!grupo) return [];
  const candidatos = typeof grupo === "object"
    ? [
        grupo.id_grupo,
        grupo.id,
        grupo.numero_ficha,
        grupo.numero_grupo,
        grupo.codigo,
        grupo.ficha
      ]
    : [grupo];

  return [...new Set(candidatos.filter(Boolean).map(String))];
}

function grupoCoincideConIdentificador(grupo, identificadores) {
  const idsGrupo = obtenerIdentificadoresGrupo(grupo);
  return idsGrupo.some((id) => identificadores.includes(id));
}

export async function resolverIdGrupoBackend(grupoReferencia) {
  const identificadores = obtenerIdentificadoresGrupo(grupoReferencia);
  if (!identificadores.length) return "";

  if (typeof grupoReferencia === "object" && grupoReferencia.id_grupo) {
    return grupoReferencia.id_grupo;
  }

  const grupos = await obtenerGruposInstructor().catch(() => []);
  const grupoEncontrado = grupos.find((grupo) => grupoCoincideConIdentificador(grupo, identificadores));

  return grupoEncontrado?.id_grupo || identificadores[0];
}

export async function obtenerAprendicesPorGrupo(grupoId) {
  if (!grupoId) return [];
  const idGrupoResuelto = await resolverIdGrupoBackend(grupoId);

  const ids = typeof grupoId === "object"
    ? [
        idGrupoResuelto,
        grupoId.id_grupo,
        grupoId.id,
        grupoId.numero_ficha,
        grupoId.numero_grupo,
        grupoId.codigo,
        grupoId.ficha
      ]
    : [idGrupoResuelto, grupoId];
  const idsUnicos = [...new Set(ids.filter(Boolean).map(String))];
  let ultimoError = null;
  let listaVacia = [];

  for (const id of idsUnicos) {
    const res = await fetch(`${API_URL}/apprentices/grupo/${id}?limit=1000`, {
      headers: getHeaders()
    }).catch((error) => {
      ultimoError = error;
      return null;
    });

    if (!res) continue;

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      ultimoError = new Error(data?.message || data?.error || "No fue posible cargar aprendices.");
      continue;
    }

    const lista = extraerLista(data, "aprendices");
    if (lista.length) return lista;
    listaVacia = lista;
  }

  if (idsUnicos.length && !ultimoError) return listaVacia;
  throw ultimoError || new Error("No fue posible cargar aprendices.");
}

export async function obtenerDetalleGrupo(grupoId) {
  if (!grupoId) return null;

  const data = await requestJson(`${API_URL}/groups/${grupoId}`);
  return data;
}

function extraerPayload(data) {
  return data?.data || data || {};
}

async function requestJson(endpoint, options = {}) {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.message || data?.error || "No fue posible completar la solicitud.");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return extraerPayload(data);
}

export async function obtenerSesionAbiertaPorGrupo(grupoId, fecha) {
  if (!grupoId) return null;
  const idGrupoConsulta = await resolverIdGrupoBackend(grupoId);
  if (!idGrupoConsulta) return null;

  const params = new URLSearchParams({
    id_grupo: String(idGrupoConsulta),
    solo_responsable: "true",
    limit: "20"
  });
  if (fecha) params.set("fecha", fecha);

  const data = await requestJson(`${API_URL}/educational-sessions?${params.toString()}`);
  const sesiones = extraerLista(data, "sesiones");
  return sesiones.find((sesion) =>
    ["ABIERTA", "ACTIVA", "EN_CURSO"].includes(String(sesion?.estado || "").toUpperCase())
  ) || null;
}

export async function obtenerSesionAbiertaInstructor(fecha) {
  const params = new URLSearchParams({
    estado: "ABIERTA",
    solo_responsable: "true",
    limit: "20"
  });
  if (fecha) params.set("fecha", fecha);

  const data = await requestJson(`${API_URL}/educational-sessions?${params.toString()}`);
  const sesiones = extraerLista(data, "sesiones");
  return sesiones[0] || null;
}

export async function obtenerSesionesInstructorDia(fecha) {
  const params = new URLSearchParams({
    solo_responsable: "true",
    limit: "100"
  });
  if (fecha) params.set("fecha", fecha);

  const data = await requestJson(`${API_URL}/educational-sessions?${params.toString()}`);
  return extraerLista(data, "sesiones");
}

export async function generarSesionesFormacion({ idGrupoTrimestre, fechaDesde, fechaHasta }) {
  if (!idGrupoTrimestre) throw new Error("No se encontro el trimestre del bloque para generar la sesion.");
  return requestJson(`${API_URL}/educational-sessions/generate`, {
    method: "POST",
    body: JSON.stringify({
      id_grupo_trimestre: Number(idGrupoTrimestre),
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta || fechaDesde
    })
  });
}

export async function abrirSesionAsistencia(idSesion) {
  if (!idSesion) throw new Error("No se encontro la sesion programada para abrir.");
  return requestJson(`${API_URL}/educational-sessions/${idSesion}/open`, {
    method: "PATCH"
  });
}

export async function obtenerAsistenciasSesion(idSesion) {
  if (!idSesion) return { sesion: null, asistencias: [] };
  const data = await requestJson(`${API_URL}/educational-sessions/${idSesion}/attendances`);
  return {
    sesion: data.sesion || null,
    asistencias: extraerLista(data, "asistencias")
  };
}

export async function obtenerCatalogosHorarioGrupo(idGrupo) {
  if (!idGrupo) return { trimestres: [], competencias: [] };

  const idGrupoSeguro = encodeURIComponent(idGrupo);
  const data = await requestJson(`${API_URL}/educational-schedules/catalogs?id_grupo=${idGrupoSeguro}`);
  const opciones = data.opciones || data || {};

  return {
    trimestres: Array.isArray(opciones.trimestres) ? opciones.trimestres : [],
    competencias: Array.isArray(opciones.competencias) ? opciones.competencias : []
  };
}

export async function listarSesionesGrupo({
  idGrupo,
  idGrupoTrimestre = "",
  fechaDesde = "",
  fechaHasta = "",
  estado = "",
  soloResponsable = true,
  limit = 100
} = {}) {
  if (!idGrupo) return { total: 0, sesiones: [] };
  const idGrupoConsulta = await resolverIdGrupoBackend(idGrupo);
  if (!idGrupoConsulta) return { total: 0, sesiones: [] };

  const params = new URLSearchParams({
    id_grupo: String(idGrupoConsulta),
    limit: String(limit)
  });

  if (soloResponsable) params.set("solo_responsable", "true");
  if (idGrupoTrimestre) params.set("id_grupo_trimestre", String(idGrupoTrimestre));
  if (estado) params.set("estado", estado);
  if (fechaDesde && fechaHasta && fechaDesde === fechaHasta) {
    params.set("fecha", fechaDesde);
  } else {
    if (fechaDesde) params.set("fecha_desde", fechaDesde);
    if (fechaHasta) params.set("fecha_hasta", fechaHasta);
  }

  const data = await requestJson(`${API_URL}/educational-sessions?${params.toString()}`);
  const sesiones = extraerLista(data, "sesiones");

  return {
    total: data.total || sesiones.length,
    sesiones
  };
}

export async function generarQrSesion(idSesion) {
  if (!idSesion) throw new Error("No hay una sesion abierta para generar QR.");
  return requestJson(`${API_URL}/educational-sessions/${idSesion}/qr`, {
    method: "POST"
  });
}

export async function cerrarSesionAsistencia(idSesion) {
  if (!idSesion) throw new Error("No hay una sesion abierta para cerrar.");
  return requestJson(`${API_URL}/educational-sessions/${idSesion}/close`, {
    method: "PATCH"
  });
}

export async function cancelarSesionAsistencia(idSesion, motivo = "Cancelada desde aviso de sesion activa.") {
  if (!idSesion) throw new Error("No hay una sesion abierta para cancelar.");
  return requestJson(`${API_URL}/educational-sessions/${idSesion}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ motivo })
  });
}

export async function corregirAsistencia(idAsistencia, { estado, observacion }) {
  if (!idAsistencia) throw new Error("No se encontro el registro de asistencia para actualizar.");
  return requestJson(`${API_URL}/attendances/${idAsistencia}/correction`, {
    method: "PATCH",
    body: JSON.stringify({ estado, observacion })
  });
}

export async function registrarAsistenciaManual({ idSesion, idAprendiz, estado, observacion }) {
  if (!idSesion) throw new Error("No hay una sesion abierta para registrar asistencia.");
  if (!idAprendiz) throw new Error("No se encontro el aprendiz para registrar asistencia.");

  return requestJson(`${API_URL}/attendances/manual`, {
    method: "POST",
    body: JSON.stringify({
      id_sesion_formacion: Number(idSesion),
      id_aprendiz: Number(idAprendiz),
      estado,
      observacion
    })
  });
}
