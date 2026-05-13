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

function obtenerNombreReferencia(fuente) {
  const persona = fuente?.persona || fuente?.usuario?.persona || {};
  const nombres = persona.nombres || fuente?.nombres || "";
  const apellidos = persona.apellidos || fuente?.apellidos || "";
  const nombreCompleto = `${nombres} ${apellidos}`.trim();

  return (
    nombreCompleto ||
    fuente?.nombre_completo ||
    fuente?.nombreCompleto ||
    fuente?.nombre ||
    fuente?.username ||
    fuente?.usuario?.email ||
    fuente?.email ||
    ""
  );
}

function normalizarReferenciaInstructor(fuente) {
  if (!fuente) return null;

  if (typeof fuente !== "object") {
    const valor = String(fuente).trim();

    return valor
      ? {
          id: valor,
          documento: valor,
          nombre: valor,
        }
      : null;
  }

  const usuario = fuente.usuario || fuente.user || {};
  const persona = fuente.persona || usuario.persona || {};

  const id =
    fuente.id_instructor ||
    fuente.idInstructor ||
    fuente.id_usuario ||
    fuente.idUsuario ||
    fuente.id ||
    usuario.id_usuario ||
    usuario.id ||
    "";

  const documento =
    fuente.numero_documento ||
    fuente.documento ||
    persona.numero_documento ||
    usuario.numero_documento ||
    "";

  const nombre = obtenerNombreReferencia(fuente);

  if (!id && !documento && !nombre) return null;

  return {
    id: id ? String(id) : "",
    documento: documento ? String(documento) : "",
    nombre,
  };
}

function extraerReferenciasInstructor(grupo) {
  const candidatos = [
    grupo.instructor,
    grupo.instructor_lider,
    grupo.instructorLider,
    grupo.instructor_asignado,
    grupo.instructorAsignado,
    grupo.usuario_instructor,
    grupo.usuarioInstructor,
    grupo.instructor_nombre,
    grupo.nombre_instructor,
    grupo.nombreInstructor,
  ];

  const listas = [
    grupo.instructores,
    grupo.instructores_asignados,
    grupo.instructoresAsignados,
    grupo.asignaciones,
    grupo.asignaciones_instructores,
    grupo.asignacionesInstructores,
  ].filter(Array.isArray);

  listas.forEach((lista) => {
    lista.forEach((item) => {
      candidatos.push(item);
      candidatos.push(item?.instructor);
      candidatos.push(item?.usuario);
      candidatos.push(item?.user);
    });
  });

  return candidatos
    .map(normalizarReferenciaInstructor)
    .filter(Boolean)
    .filter(
      (referencia, indice, lista) =>
        indice ===
        lista.findIndex(
          (item) =>
            item.id === referencia.id &&
            item.documento === referencia.documento &&
            item.nombre === referencia.nombre
        )
    );
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
  const instructores = extraerReferenciasInstructor(grupo);
  const instructorPrincipal = instructores[0] || {};

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
    rolInstructor:
      grupo.rolInstructor ||
      grupo.rol_instructor ||
      grupo.rol_asignacion ||
      grupo.tipo_instructor ||
      "",
    instructorId:
      grupo.id_instructor ||
      grupo.idInstructor ||
      grupo.instructor_id ||
      grupo.id_instructor_asignado ||
      grupo.idInstructorAsignado ||
      grupo.id_instructor_lider ||
      grupo.idInstructorLider ||
      grupo.instructor_lider_id ||
      grupo.id_usuario_instructor ||
      grupo.idUsuarioInstructor ||
      grupo.usuario_instructor_id ||
      instructorPrincipal.id ||
      "",
    instructorDocumento:
      grupo.documento_instructor ||
      grupo.numero_documento_instructor ||
      grupo.documentoInstructor ||
      grupo.documento_instructor_asignado ||
      grupo.numero_documento_instructor_asignado ||
      instructorPrincipal.documento ||
      "",
    instructorNombre:
      grupo.instructor_nombre ||
      grupo.nombre_instructor ||
      grupo.nombreInstructor ||
      instructorPrincipal.nombre ||
      "",
    instructores,
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
