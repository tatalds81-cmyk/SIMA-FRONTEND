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

export async function obtenerAprendicesPorGrupo(grupoId) {
  if (!grupoId) return [];

  const ids = typeof grupoId === "object"
    ? [
        grupoId.id_grupo,
        grupoId.id,
        grupoId.numero_ficha,
        grupoId.numero_grupo,
        grupoId.codigo,
        grupoId.ficha
      ]
    : [grupoId];
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
    throw new Error(data?.message || data?.error || "No fue posible completar la solicitud.");
  }

  return extraerPayload(data);
}

export async function obtenerSesionAbiertaPorGrupo(grupoId, fecha) {
  if (!grupoId) return null;

  const params = new URLSearchParams({
    estado: "ABIERTA",
    id_grupo: String(grupoId),
    solo_responsable: "true",
    limit: "20"
  });
  if (fecha) params.set("fecha", fecha);

  const data = await requestJson(`${API_URL}/educational-sessions?${params.toString()}`);
  const sesiones = extraerLista(data, "sesiones");
  return sesiones[0] || null;
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

export async function obtenerAsistenciasSesion(idSesion) {
  if (!idSesion) return { sesion: null, asistencias: [] };
  const data = await requestJson(`${API_URL}/educational-sessions/${idSesion}/attendances`);
  return {
    sesion: data.sesion || null,
    asistencias: extraerLista(data, "asistencias")
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
