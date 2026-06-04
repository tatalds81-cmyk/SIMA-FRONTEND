/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { ChevronDown, Plus, RefreshCw, X } from "lucide-react";
import api from "../../services/api";

const API_URL = "/api";
export const DIAS_SEMANA = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const OPCIONES_INICIALES = {
  trimestres: [],
  competencias: [],
  instructores: [],
  bloques: [],
};
const BLOQUES_JORNADA_RESPALDO = {
  MANANA: [
    { id_bloque_jornada: 1, jornada: "MAÑANA", nombre_bloque: "Bloque mañana 1", orden: 1, hora_inicio: "07:00:00", hora_fin: "09:30:00" },
    { id_bloque_jornada: 2, jornada: "MAÑANA", nombre_bloque: "Bloque mañana 2", orden: 2, hora_inicio: "10:00:00", hora_fin: "12:30:00" },
  ],
  TARDE: [
    { id_bloque_jornada: 3, jornada: "TARDE", nombre_bloque: "Bloque tarde 1", orden: 1, hora_inicio: "14:00:00", hora_fin: "16:30:00" },
    { id_bloque_jornada: 4, jornada: "TARDE", nombre_bloque: "Bloque tarde 2", orden: 2, hora_inicio: "17:00:00", hora_fin: "19:00:00" },
  ],
  NOCHE: [
    { id_bloque_jornada: 5, jornada: "NOCHE", nombre_bloque: "Bloque noche 1", orden: 1, hora_inicio: "20:00:00", hora_fin: "22:00:00" },
  ],
};
const HORARIO_FORM_INICIAL = {
  id_grupo_trimestre: "",
  id_clase_competencia: "",
  id_instructor_grupo: "",
  id_bloques_jornada: [],
  dias_semana: ["1"],
  semanas: "16",
  tolerancia_minutos: "15",
};

export function extraerListaHorarios(data) {
  const lista =
    data?.data?.horarios ||
    data?.data?.horario ||
    data?.data?.schedule ||
    data?.data?.sesiones ||
    data?.data?.items ||
    data?.data ||
    data?.horarios ||
    data?.horario ||
    data?.schedule ||
    data?.sesiones ||
    data?.items ||
    data;

  if (Array.isArray(lista)) return lista;
  if (
    lista &&
    typeof lista === "object" &&
    (lista.dia || lista.dia_semana || lista.hora_inicio || lista.horaInicio)
  ) {
    return [lista];
  }

  return [];
}

function extraerOpcionesHorario(data) {
  const payload = data?.data || data || {};
  const opciones = payload.opciones || payload || {};

  return {
    trimestres: Array.isArray(opciones.trimestres) ? opciones.trimestres : [],
    competencias: Array.isArray(opciones.competencias) ? opciones.competencias : [],
    instructores: Array.isArray(opciones.instructores_responsables)
      ? opciones.instructores_responsables
      : Array.isArray(opciones.instructores)
        ? opciones.instructores
        : [],
    bloques: Array.isArray(opciones.bloques) ? opciones.bloques : [],
  };
}

function diaDesdeFecha(valor) {
  if (!valor) return "";
  const fecha = new Date(`${String(valor).split("T")[0]}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return "";
  return DIAS_SEMANA[fecha.getDay() - 1] || "";
}

function normalizarDia(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";

  const numeroDia = Number(texto);
  if (Number.isInteger(numeroDia) && numeroDia >= 1 && numeroDia <= DIAS_SEMANA.length) {
    return DIAS_SEMANA[numeroDia - 1];
  }

  return DIAS_SEMANA.find((dia) => dia.toLowerCase() === texto.toLowerCase()) || texto;
}

function normalizarHora(valor) {
  const texto = String(valor || "").trim();
  return texto ? texto.slice(0, 5) : "-";
}

function obtenerNombreInstructor(item) {
  const instructor = item.instructor_grupo?.instructor || item.instructor || {};
  const instructorTexto = typeof instructor === "string" ? instructor.trim() : "";
  const persona = instructor?.usuario?.persona || instructor?.persona || item.persona || {};
  const nombreCompleto = `${persona.nombres || ""} ${persona.apellidos || ""}`.trim();

  return (
    item.instructor_nombre ||
    item.nombre_instructor ||
    instructor?.nombre ||
    instructorTexto ||
    nombreCompleto ||
    instructor?.codigo_instructor ||
    instructor?.usuario?.email ||
    "Sin instructor"
  );
}

function obtenerDetalleInstructor(item) {
  const instructor = item.instructor_grupo?.instructor || item.instructor || {};
  const partes = [instructor?.codigo_instructor, instructor?.especialidad].filter(Boolean);
  return partes.join(" - ") || instructor?.usuario?.email || "Asignado al grupo";
}

function normalizarBusqueda(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizarJornada(valor) {
  const texto = normalizarBusqueda(valor).toUpperCase();
  if (texto.includes("MAÑANA")) return "MAÑANA";
  if (texto.includes("TARDE")) return "TARDE";
  if (texto.includes("NOCHE")) return "NOCHE";
  if (texto.includes("SABADO")) return "SABADO";
  return texto;
}

function normalizarTextoFormulario(valor) {
  return String(valor || "").trim().replace(/\s+/g, " ");
}

function fechaIso(fecha) {
  return fecha.toISOString().slice(0, 10);
}

function obtenerFechaInicioSesiones(grupo) {
  const hoy = new Date();
  const inicioGrupo = grupo?.fecha_inicio ? new Date(`${String(grupo.fecha_inicio).split("T")[0]}T00:00:00`) : null;

  if (inicioGrupo && !Number.isNaN(inicioGrupo.getTime()) && inicioGrupo > hoy) {
    return fechaIso(inicioGrupo);
  }

  return fechaIso(hoy);
}

function obtenerFechaFinSesiones(fechaInicio, semanas) {
  const fecha = new Date(`${fechaInicio}T00:00:00`);
  fecha.setDate(fecha.getDate() + (semanas * 7) - 1);
  return fechaIso(fecha);
}

function completarOpcionesDesdeGrupo(opciones, grupo) {
  const jornada = normalizarJornada(grupo?.jornada);
  const bloques = opciones.bloques.length
    ? opciones.bloques
    : BLOQUES_JORNADA_RESPALDO[jornada] || [];

  return {
    ...opciones,
    bloques,
  };
}

function obtenerTextoBusquedaInstructor(item) {
  return normalizarBusqueda(`${obtenerNombreInstructor(item)} ${obtenerDetalleInstructor(item)}`);
}

function obtenerCompetencia(item) {
  return item.competencia || item;
}

function obtenerIdCompetencia(item) {
  return obtenerCompetencia(item).id_clase_competencia;
}

function obtenerNombreCompetencia(item) {
  return obtenerCompetencia(item).nombre_competencia || obtenerCompetencia(item).nombre || "";
}

function obtenerDetalleCompetencia(item) {
  return obtenerCompetencia(item).tipo_competencia || "FORMATIVA";
}

function obtenerTextoBusquedaCompetencia(item) {
  return normalizarBusqueda(`${obtenerNombreCompetencia(item)} ${obtenerDetalleCompetencia(item)}`);
}

function obtenerNombreAmbiente(item) {
  const ambienteTexto = typeof item.ambiente === "string" ? item.ambiente.trim() : "";

  return (
    item.ambiente?.nombre_ambiente ||
    item.ambiente?.nombre ||
    item.nombre_ambiente ||
    item.ambiente_nombre ||
    ambienteTexto ||
    "Ambiente por asignar"
  );
}

export function normalizarHorario(item, index = 0) {
  return {
    id: item.id_horario || item.id_sesion_formacion || item.id || `${item.dia || item.dia_semana || "dia"}-${index}`,
    dia: normalizarDia(item.dia || item.dia_semana || item.day || item.nombre_dia || diaDesdeFecha(item.fecha_clase)),
    horaInicio: normalizarHora(
      item.hora_inicio ||
        item.hora_inicio_programada ||
        item.horaInicio ||
        item.inicio ||
        item.start_time ||
        item.bloque_jornada?.hora_inicio
    ),
    horaFin: normalizarHora(
      item.hora_fin ||
        item.hora_fin_programada ||
        item.horaFin ||
        item.fin ||
        item.end_time ||
        item.bloque_jornada?.hora_fin
    ),
    ambiente: obtenerNombreAmbiente(item),
    instructor: obtenerNombreInstructor(item),
    actividad:
      item.competencia?.nombre_competencia ||
      item.competencia?.nombre ||
      item.competencia ||
      item.bloque_jornada?.nombre_bloque ||
      item.actividad ||
      item.descripcion ||
      item.modulo ||
      "Actividad academica",
    trimestre: item.grupo_trimestre?.numero_trimestre || item.numero_trimestre || "",
  };
}

export function obtenerIdGrupo(grupo) {
  return grupo?.id_grupo || grupo?.id || grupo?.codigo || grupo?.numero_ficha || grupo?.numero_grupo;
}

function extraerListaGruposHorario(data) {
  const lista =
    data?.data?.grupos ||
    data?.data?.items ||
    data?.data ||
    data?.grupos ||
    data?.items ||
    data;

  return Array.isArray(lista) ? lista : [];
}

async function resolverIdGrupoHorario(grupo) {
  if (grupo?.id_grupo) return grupo.id_grupo;

  const candidato = grupo?.id;
  if (candidato) {
    try {
      const { data } = await api.get(`${API_URL}/groups/${encodeURIComponent(candidato)}`);
      const detalle = data?.data || data || {};
      if (detalle?.id_grupo) return detalle.id_grupo;
    } catch {
      // Puede ser numero de ficha; se resuelve con el listado.
    }
  }

  const ficha = String(grupo?.numero_ficha || grupo?.numero_grupo || grupo?.codigo || grupo?.ficha || candidato || "");
  if (ficha) {
    const { data } = await api.get(`${API_URL}/groups?limit=1000`);
    const encontrado = extraerListaGruposHorario(data).find((item) =>
      String(item.id_grupo || "") === ficha ||
      String(item.numero_ficha || item.numero_grupo || item.codigo || item.ficha || "") === ficha
    );
    if (encontrado?.id_grupo) return encontrado.id_grupo;
  }

  return obtenerIdGrupo(grupo);
}

export function obtenerHorariosEmbebidos(grupo) {
  return extraerListaHorarios(
    grupo?.horarios ||
      grupo?.horario ||
      grupo?.schedule ||
      grupo?.schedules ||
      grupo?.programacion?.horarios
  ).map(normalizarHorario);
}

function obtenerInstructorMuestra(grupo) {
  const persona =
    grupo?.instructor_lider?.usuario?.persona ||
    grupo?.instructor_lider?.persona ||
    grupo?.instructor?.usuario?.persona ||
    grupo?.instructor?.persona ||
    {};
  const nombreCompleto = `${persona.nombres || ""} ${persona.apellidos || ""}`.trim();

  return (
    nombreCompleto ||
    grupo?.instructor_lider?.nombre ||
    grupo?.instructor?.nombre ||
    "Instructor asignado"
  );
}

function obtenerHorasPorJornada(jornada) {
  const texto = String(jornada || "").toLowerCase();

  if (texto.includes("tarde")) {
    return [
      ["12:00", "14:00"],
      ["14:00", "16:00"],
      ["16:00", "18:00"],
    ];
  }

  if (texto.includes("noche")) {
    return [
      ["18:00", "19:30"],
      ["19:30", "21:00"],
      ["21:00", "22:00"],
    ];
  }

  return [
    ["07:00", "10:00"],
    ["10:00", "13:00"],
  ];
}

export function generarHorariosMuestra(grupo) {
  const instructor = obtenerInstructorMuestra(grupo);
  const programa = String(grupo?.programa || grupo?.nombre_programa || grupo?.programa_formacion?.nombre_programa || "ADSO");
  const esAdso = programa.toLowerCase().includes("adso") || programa.toLowerCase().includes("software");
  const horas = obtenerHorasPorJornada(grupo?.jornada);
  const actividades = esAdso
    ? [
        "Analisis de requerimientos",
        "Desarrollo de interfaces",
        "Base de datos",
        "Programacion orientada a objetos",
        "Pruebas de software",
        "Proyecto formativo",
      ]
    : [
        "Competencia tecnica",
        "Taller practico",
        "Proyecto formativo",
        "Laboratorio aplicado",
        "Evidencias de aprendizaje",
        "Acompanamiento academico",
      ];

  return [
    { dia: "Lunes", bloque: 0, ambiente: "Ambiente 201", actividad: actividades[0] },
    { dia: "Lunes", bloque: 1, ambiente: "Ambiente 201", actividad: actividades[1] },
    { dia: "Martes", bloque: 0, ambiente: "Ambiente 305", actividad: actividades[2] },
    { dia: "Miercoles", bloque: 1, ambiente: "Ambiente 204", actividad: actividades[3] },
    { dia: "Jueves", bloque: 0, ambiente: "Ambiente 305", actividad: actividades[4] },
    { dia: "Viernes", bloque: 1, ambiente: "Ambiente 201", actividad: actividades[5] },
  ].map((item, index) => ({
    id: `muestra-${index}`,
    dia: item.dia,
    horaInicio: horas[item.bloque][0],
    horaFin: horas[item.bloque][1],
    ambiente: item.ambiente,
    instructor,
    actividad: item.actividad,
  }));
}

export function resolverHorariosLocales(grupo) {
  const embebidos = obtenerHorariosEmbebidos(grupo);
  if (embebidos.length) return { horarios: embebidos, esMuestra: false };

  return { horarios: generarHorariosMuestra(grupo), esMuestra: true };
}

export async function consultarHorariosGrupo(idGrupo) {
  const data = await consultarHorarioGrupoData(idGrupo);
  return data.horarios;
}

export async function consultarHorarioGrupoData(idGrupo, { usarFallbackSesiones = true } = {}) {
  if (!idGrupo) return { horarios: [], opciones: OPCIONES_INICIALES };

  const idGrupoSeguro = encodeURIComponent(idGrupo);
  const [horariosRespuesta, catalogosRespuesta] = await Promise.all([
    api.get(`${API_URL}/educational-schedules/group/${idGrupoSeguro}`),
    api.get(`${API_URL}/educational-schedules/catalogs?id_grupo=${idGrupoSeguro}`),
  ]);

  let horarios = extraerListaHorarios(horariosRespuesta.data)
    .map(normalizarHorario)
    .filter((horario) => horario.dia);

  if (!horarios.length && usarFallbackSesiones) {
    const { data } = await api.get(`${API_URL}/educational-sessions?id_grupo=${idGrupoSeguro}&limit=100`);
    horarios = extraerListaHorarios(data)
      .map(normalizarHorario)
      .filter((horario) => horario.dia);
  }

  return {
    horarios,
    opciones: extraerOpcionesHorario(catalogosRespuesta.data),
  };
}

export default function HorarioGrupoModal({
  grupo,
  onClose,
  obtenerCodigo,
  obtenerPrograma,
}) {
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [opciones, setOpciones] = useState(OPCIONES_INICIALES);
  const [formHorario, setFormHorario] = useState(HORARIO_FORM_INICIAL);
  const [busquedaCompetencia, setBusquedaCompetencia] = useState("");
  const [competenciaAbierta, setCompetenciaAbierta] = useState(false);
  const [busquedaInstructor, setBusquedaInstructor] = useState("");
  const [diasAbiertos, setDiasAbiertos] = useState(false);
  const [mensajeForm, setMensajeForm] = useState("");
  const [mensajeFormTipo, setMensajeFormTipo] = useState("success");
  const [idGrupoCatalogo, setIdGrupoCatalogo] = useState("");

  useEffect(() => {
    let activo = true;
    const idGrupo = obtenerIdGrupo(grupo);

    if (!idGrupo) {
      return () => {
        activo = false;
      };
    }

    async function cargarHorario() {
      setCargando(true);

      try {
        const idGrupoReal = await resolverIdGrupoHorario(grupo);
        const dataHorario = await consultarHorarioGrupoData(idGrupoReal, { usarFallbackSesiones: false });
        if (!activo) return;
        const opcionesCompletas = completarOpcionesDesdeGrupo(dataHorario.opciones, grupo);
        setIdGrupoCatalogo(idGrupoReal);
        setOpciones(opcionesCompletas);
        setFormHorario((actual) => completarFormHorario(actual, opcionesCompletas));
        setError("");
      } catch (err) {
        console.error("Error cargando horario:", err);
        if (activo) {
          setOpciones(OPCIONES_INICIALES);
          setError(err.message || "No fue posible cargar el horario.");
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    Promise.resolve().then(cargarHorario);

    return () => {
      activo = false;
    };
  }, [grupo]);

  if (!grupo) return null;

  const codigo = obtenerCodigo ? obtenerCodigo(grupo) : obtenerIdGrupo(grupo);
  const programa = obtenerPrograma ? obtenerPrograma(grupo) : grupo.programa || "Programa de formacion";
  const diasSeleccionados = Array.isArray(formHorario.dias_semana) ? formHorario.dias_semana.map(String) : [];
  const bloquesSeleccionadosIds = Array.isArray(formHorario.id_bloques_jornada)
    ? formHorario.id_bloques_jornada.map(String)
    : [];
  const bloquesSeleccionados = opciones.bloques.filter((bloque) =>
    bloquesSeleccionadosIds.includes(String(bloque.id_bloque_jornada))
  );
  const competenciaSeleccionada = opciones.competencias.find(
    (item) => String(obtenerIdCompetencia(item)) === String(formHorario.id_clase_competencia)
  );
  const textoCompetencia = busquedaCompetencia || (competenciaSeleccionada ? obtenerNombreCompetencia(competenciaSeleccionada) : "");
  const nombreCompetenciaIngresada = normalizarTextoFormulario(textoCompetencia);
  const filtroCompetencia = normalizarBusqueda(textoCompetencia);
  const competenciasFiltradas = opciones.competencias.filter((item) => {
    if (!filtroCompetencia) return true;
    return obtenerTextoBusquedaCompetencia(item).includes(filtroCompetencia);
  });
  const competenciaExacta = opciones.competencias.find((item) =>
    normalizarBusqueda(obtenerNombreCompetencia(item)) === normalizarBusqueda(nombreCompetenciaIngresada)
  );
  const instructorSeleccionado = opciones.instructores.find(
    (item) => String(item.id_instructor_grupo) === String(formHorario.id_instructor_grupo)
  );
  const textoInstructor = busquedaInstructor || (instructorSeleccionado ? obtenerNombreInstructor(instructorSeleccionado) : "");
  const filtroInstructor = normalizarBusqueda(textoInstructor);
  const instructoresFiltrados = opciones.instructores.filter((item) => {
    if (!filtroInstructor) return true;
    return obtenerTextoBusquedaInstructor(item).includes(filtroInstructor);
  });
  const etiquetaDiasSeleccionados = diasSeleccionados.length
    ? diasSeleccionados.map((dia) => DIAS_SEMANA[Number(dia) - 1]).filter(Boolean).join(", ")
    : "Seleccione";
  const semanasHorario = Number(formHorario.semanas || 16);
  const semanasValidas = Number.isInteger(semanasHorario) && semanasHorario >= 1 && semanasHorario <= 16;
  const totalHorariosAcrear = diasSeleccionados.length * bloquesSeleccionados.length;
  const puedeGuardarHorario = Boolean(
    formHorario.id_grupo_trimestre &&
      formHorario.id_clase_competencia &&
      formHorario.id_instructor_grupo &&
      diasSeleccionados.length &&
      bloquesSeleccionados.length &&
      semanasValidas &&
      !guardando
  );

  function completarFormHorario(actual, opcionesActuales) {
    const bloquesActuales = Array.isArray(actual.id_bloques_jornada) ? actual.id_bloques_jornada.map(String) : [];
    const bloquesDisponibles = opcionesActuales.bloques.map((bloque) => String(bloque.id_bloque_jornada));
    const bloquesValidos = bloquesActuales.filter((idBloque) => bloquesDisponibles.includes(idBloque));

    return {
      ...actual,
      id_grupo_trimestre: actual.id_grupo_trimestre || opcionesActuales.trimestres[0]?.id_grupo_trimestre || "",
      id_clase_competencia:
        actual.id_clase_competencia ||
        opcionesActuales.competencias[0]?.id_clase_competencia ||
        opcionesActuales.competencias[0]?.competencia?.id_clase_competencia ||
        "",
      id_instructor_grupo: actual.id_instructor_grupo || opcionesActuales.instructores[0]?.id_instructor_grupo || "",
      dias_semana: Array.isArray(actual.dias_semana) && actual.dias_semana.length ? actual.dias_semana : ["1"],
      id_bloques_jornada: bloquesValidos.length ? bloquesValidos : bloquesDisponibles,
      semanas: actual.semanas || "16",
      tolerancia_minutos: actual.tolerancia_minutos || "15",
    };
  }

  function cambiarFormHorario(evento) {
    const { name, value } = evento.target;
    setMensajeForm("");
    setMensajeFormTipo("success");

    setFormHorario((actual) => ({ ...actual, [name]: value }));
  }

  function seleccionarCompetenciaHorario(item) {
    const valor = obtenerIdCompetencia(item);
    setMensajeForm("");
    setMensajeFormTipo("success");
    setBusquedaCompetencia(obtenerNombreCompetencia(item));
    setCompetenciaAbierta(false);
    setFormHorario((actual) => ({ ...actual, id_clase_competencia: String(valor) }));
  }

  function cambiarBusquedaCompetencia(evento) {
    const value = evento.target.value;
    const filtro = normalizarBusqueda(value);
    const exacta = opciones.competencias.find((item) =>
      filtro && normalizarBusqueda(obtenerNombreCompetencia(item)) === filtro
    );

    setMensajeForm("");
    setMensajeFormTipo("success");
    setCompetenciaAbierta(true);
    setBusquedaCompetencia(value);
    setFormHorario((actual) => ({
      ...actual,
      id_clase_competencia: exacta ? String(obtenerIdCompetencia(exacta)) : "",
    }));
  }

  function seleccionarInstructorHorario(item) {
    const valor = item.id_instructor_grupo;
    setMensajeForm("");
    setMensajeFormTipo("success");
    setBusquedaInstructor(obtenerNombreInstructor(item));
    setFormHorario((actual) => ({ ...actual, id_instructor_grupo: String(valor) }));
  }

  function cambiarBusquedaInstructor(evento) {
    const value = evento.target.value;
    const filtro = normalizarBusqueda(value);
    const exacto = opciones.instructores.find((item) => {
      const nombre = normalizarBusqueda(obtenerNombreInstructor(item));
      const detalle = normalizarBusqueda(obtenerDetalleInstructor(item));
      return filtro && (nombre === filtro || detalle === filtro);
    });

    setMensajeForm("");
    setMensajeFormTipo("success");
    setBusquedaInstructor(value);
    setFormHorario((actual) => ({
      ...actual,
      id_instructor_grupo: exacto ? String(exacto.id_instructor_grupo) : "",
    }));
  }

  function alternarDiaHorario(valor) {
    setMensajeForm("");
    setMensajeFormTipo("success");
    setFormHorario((actual) => {
      const diasActuales = Array.isArray(actual.dias_semana) ? actual.dias_semana.map(String) : [];
      const existe = diasActuales.includes(String(valor));
      return {
        ...actual,
        dias_semana: existe
          ? diasActuales.filter((dia) => dia !== String(valor))
          : [...diasActuales, String(valor)],
      };
    });
  }

  function alternarBloqueHorario(valor) {
    setMensajeForm("");
    setMensajeFormTipo("success");
    setFormHorario((actual) => {
      const bloquesActuales = Array.isArray(actual.id_bloques_jornada)
        ? actual.id_bloques_jornada.map(String)
        : [];
      const existe = bloquesActuales.includes(String(valor));
      return {
        ...actual,
        id_bloques_jornada: existe
          ? bloquesActuales.filter((idBloque) => idBloque !== String(valor))
          : [...bloquesActuales, String(valor)],
      };
    });
  }

  async function recargarHorario(idGrupo) {
    const dataHorario = await consultarHorarioGrupoData(idGrupo, { usarFallbackSesiones: false });
    const opcionesCompletas = completarOpcionesDesdeGrupo(dataHorario.opciones, grupo);
    setOpciones(opcionesCompletas);
    setFormHorario((actual) => completarFormHorario(actual, opcionesCompletas));
    return dataHorario;
  }

  async function guardarBloqueHorario(evento) {
    evento.preventDefault();
    const idGrupo = idGrupoCatalogo || await resolverIdGrupoHorario(grupo);

    if (!idGrupo) return;

    if (!formHorario.id_clase_competencia) {
      setMensajeFormTipo("error");
      setMensajeForm("Selecciona una competencia existente del programa.");
      return;
    }

    if (!formHorario.id_instructor_grupo) {
      setMensajeFormTipo("error");
      setMensajeForm("Selecciona un instructor de la ficha.");
      return;
    }

    if (!diasSeleccionados.length || !bloquesSeleccionados.length) {
      setMensajeFormTipo("error");
      setMensajeForm("Selecciona al menos un dia y un bloque.");
      return;
    }

    if (!semanasValidas) {
      setMensajeFormTipo("error");
      setMensajeForm("Las semanas deben estar entre 1 y 16.");
      return;
    }

    try {
      setGuardando(true);
      setMensajeForm("");
      setMensajeFormTipo("success");

      let creados = 0;
      let sesionesGeneradas = 0;
      const duplicados = [];
      const fallidos = [];
      const sesionesFallidas = [];
      const fechaDesde = obtenerFechaInicioSesiones(grupo);
      const fechaHasta = obtenerFechaFinSesiones(fechaDesde, semanasHorario);

      for (const dia of diasSeleccionados) {
        for (const bloque of bloquesSeleccionados) {
          const descripcion = `${DIAS_SEMANA[Number(dia) - 1]} - ${bloque.nombre_bloque}`;
          const horaInicio = normalizarHora(bloque.hora_inicio);
          const horaFin = normalizarHora(bloque.hora_fin);
          const payload = {
            id_grupo_trimestre: Number(formHorario.id_grupo_trimestre),
            id_clase_competencia: Number(formHorario.id_clase_competencia),
            id_instructor_grupo: Number(formHorario.id_instructor_grupo),
            id_bloque_jornada: Number(bloque.id_bloque_jornada),
            dia_semana: Number(dia),
            tolerancia_minutos: Number(formHorario.tolerancia_minutos || 15),
          };

          if (horaInicio !== "-") payload.hora_inicio = horaInicio;
          if (horaFin !== "-") payload.hora_fin = horaFin;

          try {
            const { data: horarioRespuesta } = await api.post(`${API_URL}/educational-schedules`, payload);
            const horarioCreado = horarioRespuesta?.data || horarioRespuesta || {};
            creados += 1;

            if (horarioCreado.id_horario) {
              try {
                const { data: sesionesRespuesta } = await api.post(`${API_URL}/educational-sessions/generate`, {
                  id_grupo_trimestre: Number(formHorario.id_grupo_trimestre),
                  id_horario: Number(horarioCreado.id_horario),
                  fecha_desde: fechaDesde,
                  fecha_hasta: fechaHasta,
                });
                sesionesGeneradas += Number(sesionesRespuesta?.data?.creadas || sesionesRespuesta?.creadas || 0);
              } catch (errorSesiones) {
                const data = errorSesiones?.response?.data;
                const mensaje = data?.message || data?.error || errorSesiones?.message || "No fue posible generar sesiones.";
                sesionesFallidas.push(`${descripcion}: ${mensaje}`);
              }
            }
          } catch (error) {
            const data = error?.response?.data;
            const mensaje = data?.message || data?.error || error?.message || "No fue posible crear el horario.";

            if (error?.response?.status === 409 || mensaje.toLowerCase().includes("existe")) {
              duplicados.push(descripcion);
            } else {
              fallidos.push(`${descripcion}: ${mensaje}`);
            }
          }
        }
      }

      const dataHorarioActualizado = await recargarHorario(idGrupo);

      window.dispatchEvent(
        new CustomEvent("sima:horarios-actualizados", {
          detail: { idGrupo, total: dataHorarioActualizado.horarios.length },
        })
      );

      if (!creados && fallidos.length) {
        throw new Error(fallidos[0]);
      }

      const partesMensaje = [];
      if (creados) partesMensaje.push(`${creados} horario${creados === 1 ? "" : "s"} creado${creados === 1 ? "" : "s"}.`);
      if (sesionesGeneradas) partesMensaje.push(`${sesionesGeneradas} sesion${sesionesGeneradas === 1 ? "" : "es"} generada${sesionesGeneradas === 1 ? "" : "s"}.`);
      if (duplicados.length) partesMensaje.push(`${duplicados.length} ya existia${duplicados.length === 1 ? "" : "n"} y se omitio${duplicados.length === 1 ? "" : "eron"}.`);
      if (fallidos.length) partesMensaje.push(`${fallidos.length} no se pudo${fallidos.length === 1 ? "" : "ieron"} crear.`);
      if (sesionesFallidas.length) partesMensaje.push(`${sesionesFallidas.length} horario${sesionesFallidas.length === 1 ? "" : "s"} no generaron sesiones.`);

      setMensajeFormTipo(fallidos.length || sesionesFallidas.length || (!creados && duplicados.length) ? "warning" : "success");
      setMensajeForm(partesMensaje.join(" ") || "No se crearon horarios nuevos.");
    } catch (err) {
      setMensajeFormTipo("error");
      setMensajeForm(err.message || "No fue posible crear el horario.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="grupos-modal-backdrop" role="presentation">
      <section className="grupos-modal grupos-horario-modal" role="dialog" aria-modal="true" aria-labelledby="horario-grupo-title">
        <div className="grupos-modal-header">
          <div>
            <span className="grupos-eyebrow">Horario academico</span>
            <h2 id="horario-grupo-title">Ficha {codigo}</h2>
            <p>{programa} - {grupo.jornada || "Jornada sin registrar"}</p>
          </div>
          <button type="button" className="grupos-close-btn" onClick={onClose} aria-label="Cerrar horario">
            <X size={18} />
          </button>
        </div>

        <div className="grupos-horario-body">
          {cargando && (
            <div className="grupos-horario-empty">
              <RefreshCw size={18} />
              Cargando horario...
            </div>
          )}

          {!cargando && error && <div className="grupos-horario-empty">{error}</div>}

          {!cargando && !error && (
            <form className="grupos-horario-form" onSubmit={guardarBloqueHorario}>
              <div className="grupos-horario-form-grid">
                <label>
                  <span>Trimestre</span>
                  <select name="id_grupo_trimestre" value={formHorario.id_grupo_trimestre} onChange={cambiarFormHorario} required>
                    <option value="">Seleccione</option>
                    {opciones.trimestres.map((trimestre) => (
                      <option key={trimestre.id_grupo_trimestre} value={trimestre.id_grupo_trimestre}>
                        Trimestre {trimestre.numero_trimestre} - {trimestre.estado}
                      </option>
                    ))}
                  </select>
                  {!opciones.trimestres.length && (
                    <small className="grupos-horario-field-hint">
                      No hay trimestres programados o activos para esta ficha.
                    </small>
                  )}
                </label>

                <div className="grupos-horario-form-field grupos-horario-form-wide">
                  <span>Competencia</span>
                  <div className={`grupos-horario-dropdown ${competenciaAbierta ? "open" : ""}`}>
                    <div className="grupos-horario-combobox">
                      <input
                        type="text"
                        value={textoCompetencia}
                        onChange={cambiarBusquedaCompetencia}
                        onFocus={() => setCompetenciaAbierta(true)}
                        placeholder="Escribe la competencia"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="grupos-horario-arrow-btn"
                        onClick={() => setCompetenciaAbierta((actual) => !actual)}
                        aria-label="Desplegar competencias"
                      >
                        <ChevronDown size={18} />
                      </button>
                    </div>

                    {competenciaAbierta && (
                      <div className="grupos-horario-dropdown-panel">
                        <div className="grupos-horario-instructor-results">
                          {competenciasFiltradas.map((item) => {
                            const valor = String(obtenerIdCompetencia(item));
                            return (
                              <button
                                type="button"
                                key={valor}
                                className={`grupos-horario-instructor-option ${String(formHorario.id_clase_competencia) === valor ? "selected" : ""}`}
                                onClick={() => seleccionarCompetenciaHorario(item)}
                              >
                                <span>
                                  {obtenerNombreCompetencia(item)}
                                  <small>{obtenerDetalleCompetencia(item)}</small>
                                </span>
                              </button>
                            );
                          })}
                          {nombreCompetenciaIngresada && !competenciaExacta && (
                            <div className="grupos-horario-instructor-empty">
                              Selecciona una competencia existente para poder guardar.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grupos-horario-form-field grupos-horario-form-wide">
                  <span>Dias</span>
                  <div className={`grupos-horario-dropdown ${diasAbiertos ? "open" : ""}`}>
                    <button
                      type="button"
                      className="grupos-horario-dropdown-control"
                      onClick={() => setDiasAbiertos((actual) => !actual)}
                      aria-expanded={diasAbiertos}
                    >
                      <span>{etiquetaDiasSeleccionados}</span>
                      <ChevronDown size={18} />
                    </button>

                    {diasAbiertos && (
                      <div className="grupos-horario-dropdown-panel">
                        <div className="grupos-horario-check-grid">
                          {DIAS_SEMANA.map((dia, index) => {
                            const valor = String(index + 1);
                            return (
                              <label
                                key={dia}
                                className={`grupos-horario-check ${diasSeleccionados.includes(valor) ? "selected" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={diasSeleccionados.includes(valor)}
                                  onChange={() => alternarDiaHorario(valor)}
                                />
                                <span>{dia}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <label>
                  <span>Semanas</span>
                  <input type="number" min="1" max="16" name="semanas" value={formHorario.semanas} onChange={cambiarFormHorario} required />
                </label>

                <div className="grupos-horario-form-field grupos-horario-form-full">
                  <span>Instructor</span>
                  <input
                    type="text"
                    value={textoInstructor}
                    onChange={cambiarBusquedaInstructor}
                    placeholder="Escribe el nombre del instructor"
                    autoComplete="off"
                  />
                  <div className="grupos-horario-instructor-results">
                    {instructoresFiltrados.map((item) => {
                      const valor = String(item.id_instructor_grupo);
                      return (
                        <button
                          type="button"
                          key={item.id_instructor_grupo}
                          className={`grupos-horario-instructor-option ${String(formHorario.id_instructor_grupo) === valor ? "selected" : ""}`}
                          onClick={() => seleccionarInstructorHorario(item)}
                        >
                          <span>
                            {obtenerNombreInstructor(item)}
                            <small>{obtenerDetalleInstructor(item)}</small>
                          </span>
                        </button>
                      );
                    })}
                    {!instructoresFiltrados.length && (
                      <div className="grupos-horario-instructor-empty">
                        No hay instructores asignados que coincidan.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grupos-horario-form-field grupos-horario-form-full">
                  <span>Bloques</span>
                  <div className="grupos-horario-check-grid bloques">
                    {opciones.bloques.map((bloque) => {
                      const valor = String(bloque.id_bloque_jornada);
                      return (
                        <label
                          key={bloque.id_bloque_jornada}
                          className={`grupos-horario-check ${bloquesSeleccionadosIds.includes(valor) ? "selected" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={bloquesSeleccionadosIds.includes(valor)}
                            onChange={() => alternarBloqueHorario(valor)}
                          />
                          <span>
                            {bloque.nombre_bloque}
                            <small>{normalizarHora(bloque.hora_inicio)} - {normalizarHora(bloque.hora_fin)}</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {bloquesSeleccionados.length > 0 && (
                <div className="grupos-horario-form-msg">
                  Se crearan {totalHorariosAcrear} horario{totalHorariosAcrear === 1 ? "" : "s"} para {semanasHorario} semana{semanasHorario === 1 ? "" : "s"}.
                </div>
              )}
              {/* /hola// */}

              {mensajeForm && <div className={`grupos-horario-form-msg ${mensajeFormTipo}`}>{mensajeForm}</div>}

              <div className="grupos-modal-actions">
                <button type="submit" className="grupos-primary-btn" disabled={!puedeGuardarHorario}>
                  <Plus size={16} />
                  {guardando ? "Creando..." : "Crear horario"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
