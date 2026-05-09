import { normalizarHorariosGrupo } from "./asistenciaUtils";

export const API_URL = "/api";

export const URL_GRUPOS_ACTIVOS = `${API_URL}/apprentices/grupos-activos`;

// Prepara los headers para consumir endpoints protegidos
export function getHeaders() {
  const token =
    localStorage.getItem("access") ||
    localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token && token !== "undefined") {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

// Extrae listas desde diferentes estructuras posibles del backend
export function extraerLista(data) {
  const lista =
    data?.data?.aprendices ||
    data?.data?.grupos ||
    data?.data ||
    data?.results ||
    data;

  return Array.isArray(lista) ? lista : [];
}

export function normalizarGrupo(grupo) {
  const idGrupo = grupo.id_grupo || grupo.id || "";
  const ficha = grupo.numero_ficha || grupo.ficha || grupo.numero_grupo || idGrupo;

  const programa =
    grupo.programa_formacion?.nombre_programa ||
    grupo.programa?.nombre_programa ||
    grupo.nombre_programa ||
    grupo.programa ||
    "Programa sin nombre";

  return {
    id: String(idGrupo || ficha),
    idGrupo,
    ficha: String(ficha || "Sin ficha"),
    programa,
    jornada: grupo.jornada || "Sin jornada",
    horarios: normalizarHorariosGrupo(
      grupo.horarios ||
        grupo.horario ||
        grupo.sesiones ||
        grupo.sesiones_programadas ||
        grupo.programacion
    ),
    fuente: "backend",
  };
}

export function normalizarAprendiz(aprendiz) {
  const usuario = aprendiz.usuario || {};
  const persona = usuario.persona || aprendiz.persona || {};

  const nombres = persona.nombres || aprendiz.nombres || "";
  const apellidos = persona.apellidos || aprendiz.apellidos || "";
  const nombreCompleto = `${nombres} ${apellidos}`.trim();

  const idAprendiz = aprendiz.id_aprendiz || aprendiz.id || "";

  return {
    id: idAprendiz || aprendiz.id_usuario || persona.numero_documento,
    id_aprendiz: idAprendiz,
    nombre:
      nombreCompleto ||
      usuario.email ||
      aprendiz.email ||
      `Aprendiz ${idAprendiz}`,
    documento: persona.numero_documento || aprendiz.numero_documento || "-",
    estado: "",
    observacion: "",
    estadoFormativo: normalizarEstadoFormativo(aprendiz.estado_formativo),
    fuente: "backend",
  };
}

// Normaliza el estado formativo que llega del backend
export function normalizarEstadoFormativo(estado) {
  const texto = String(estado || "EN_FORMACION")
    .replaceAll("_", " ")
    .toLocaleLowerCase("es-CO");

  return texto.charAt(0).toLocaleUpperCase("es-CO") + texto.slice(1);
}
