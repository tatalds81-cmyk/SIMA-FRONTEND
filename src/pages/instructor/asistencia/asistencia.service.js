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
    `${API_URL}/groups/mis-grupos?limit=1000`,
    `${API_URL}/groups/instructor?limit=1000`,
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
