import {
  DIAS_HABILES,
  HORARIOS_JORNADA,
  horariosSimuladosPorGrupo,
} from "./asistenciaData";

// Normaliza textos: quita tildes, espacios y pasa a minúsculas
export function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-CO");
}

export function obtenerIniciales(nombre) {
  return String(nombre || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

export function obtenerMetodoRegistro(aprendiz) {
  if (aprendiz.metodoRegistro) return aprendiz.metodoRegistro;
  return aprendiz.estado ? "Ajuste manual" : "Pendiente";
}

export function obtenerClaseEstado(estado) {
  const clasesPorEstado = {
    Asistió: "asistio",
    Ausente: "ausente",
    Tarde: "tarde",
    Justificada: "justificada",
  };

  return clasesPorEstado[estado] || "sin-marcar";
}

export function obtenerClaseMetodoRegistro(aprendiz) {
  const metodo = normalizarTexto(obtenerMetodoRegistro(aprendiz));

  if (metodo.includes("huella")) return "biometrico";
  if (metodo.includes("qr")) return "qr";
  if (metodo.includes("cierre")) return "automatico";
  if (metodo.includes("manual")) return "manual";

  return "pendiente";
}

// Retorna fecha en formato YYYY-MM-DD
export function obtenerFechaInput(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// Crea una fecha local desde un input date
export function crearFechaLocal(fechaInput) {
  const [anio, mes, dia] = String(fechaInput || obtenerFechaInput())
    .split("-")
    .map(Number);

  return new Date(anio, (mes || 1) - 1, dia || 1);
}

// Convierte hora actual a minutos
export function obtenerMinutosActuales(fecha) {
  return fecha.getHours() * 60 + fecha.getMinutes();
}

export function obtenerEstadoPorHuella(
  horario,
  fecha = new Date(),
  minutosToleranciaTarde = 10
) {
  if (!horario) return "Asistió";

  const minutosAhora = obtenerMinutosActuales(fecha);
  const minutosTarde = horario.inicioMinutos + minutosToleranciaTarde;

  return minutosAhora > minutosTarde ? "Tarde" : "Asistió";
}

// Valida y normaliza una hora tipo HH:MM
export function normalizarHora(hora, respaldo = "00:00") {
  const coincidencia = String(hora || respaldo).match(/(\d{1,2}):(\d{2})/);

  if (!coincidencia) return respaldo;

  const horas = Math.min(Number(coincidencia[1]), 23);
  const minutos = Math.min(Number(coincidencia[2]), 59);

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(
    2,
    "0"
  )}`;
}

// Convierte una hora HH:MM a minutos
export function convertirHoraAMinutos(hora) {
  const [horas, minutos] = normalizarHora(hora).split(":").map(Number);
  return horas * 60 + minutos;
}

// Formatea una hora a formato colombiano a.m. / p.m.
export function formatearHora(hora) {
  const [horas, minutos] = normalizarHora(hora).split(":").map(Number);
  const periodo = horas >= 12 ? "p.m." : "a.m.";
  const hora12 = horas % 12 || 12;

  return `${String(hora12).padStart(2, "0")}:${String(minutos).padStart(
    2,
    "0"
  )} ${periodo}`;
}

export function obtenerHoraActualTexto(fecha = new Date()) {
  return formatearHora(`${fecha.getHours()}:${fecha.getMinutes()}`);
}

export function obtenerClaveJornada(jornada) {
  const textoJornada = normalizarTexto(jornada);

  if (textoJornada.includes("tarde")) return "tarde";
  if (textoJornada.includes("noche")) return "noche";

  return "manana";
}

function obtenerClaveJornadaDesdeMinutos(minutosInicio) {
  const inicioTarde = convertirHoraAMinutos(HORARIOS_JORNADA.tarde.inicio);
  const inicioNoche = convertirHoraAMinutos(HORARIOS_JORNADA.noche.inicio);

  if (minutosInicio >= inicioNoche) return "noche";
  if (minutosInicio >= inicioTarde) return "tarde";

  return "manana";
}

function obtenerClaveJornadaHorario(horario) {
  const textoHorario = normalizarTexto(
    [
      horario?.jornada,
      horario?.nombre,
      horario?.titulo,
      horario?.id,
      horario?.id_horario,
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (textoHorario.includes("tarde")) return "tarde";
  if (textoHorario.includes("noche")) return "noche";
  if (textoHorario.includes("manana")) return "manana";

  const inicio =
    typeof horario?.inicioMinutos === "number"
      ? horario.inicioMinutos
      : convertirHoraAMinutos(
          horario?.hora_inicio ||
            horario?.horaInicio ||
            horario?.inicio ||
            horario?.start ||
            HORARIOS_JORNADA.manana.inicio
        );

  return obtenerClaveJornadaDesdeMinutos(inicio);
}

function filtrarHorariosPorJornada(horarios, jornadaSeleccionada) {
  const claveJornada = obtenerClaveJornada(jornadaSeleccionada);

  return horarios.filter(
    (horario) => obtenerClaveJornadaHorario(horario) === claveJornada
  );
}

// Retorna la jornada base según el texto recibido
export function obtenerJornadaBase(jornada) {
  const claveJornada = obtenerClaveJornada(jornada);

  if (claveJornada === "tarde") return HORARIOS_JORNADA.tarde;
  if (claveJornada === "noche") return HORARIOS_JORNADA.noche;

  return HORARIOS_JORNADA.manana;
}

// Formatea minutos como hora a.m. / p.m.
export function formatearMinutos(minutos) {
  const horas = Math.floor(Math.max(minutos, 0) / 60) % 24;
  const minutosRestantes = Math.max(minutos, 0) % 60;

  return formatearHora(
    `${String(horas).padStart(2, "0")}:${String(minutosRestantes).padStart(
      2,
      "0"
    )}`
  );
}

// Formatea una fecha corta para mostrarla en pantalla
export function formatearFechaCorta(fechaInput) {
  return crearFechaLocal(fechaInput).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}

// Formatea fecha y hora
export function formatearFechaHora(fecha = new Date()) {
  return fecha.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Retorna clave local YYYY-MM-DD
export function claveFechaLocal(fecha) {
  return obtenerFechaInput(fecha);
}

// Suma días a una fecha
export function sumarDias(fecha, dias) {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setDate(nuevaFecha.getDate() + dias);
  return nuevaFecha;
}

// Mueve un festivo al lunes siguiente
export function moverFestivoAlLunes(fecha) {
  const nuevaFecha = new Date(fecha);
  const diaSemana = nuevaFecha.getDay();
  const diasHastaLunes = diaSemana === 1 ? 0 : (8 - diaSemana) % 7;

  nuevaFecha.setDate(nuevaFecha.getDate() + diasHastaLunes);

  return nuevaFecha;
}

// Calcula domingo de Pascua
export function obtenerDomingoPascua(anio) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const dia = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(anio, mes, dia);
}

// Lista de festivos en Colombia
export function obtenerFestivosColombia(anio) {
  const festivosFijos = [
    { mes: 0, dia: 1, nombre: "Año Nuevo" },
    { mes: 4, dia: 1, nombre: "Día del Trabajo" },
    { mes: 6, dia: 20, nombre: "Independencia de Colombia" },
    { mes: 7, dia: 7, nombre: "Batalla de Boyacá" },
    { mes: 11, dia: 8, nombre: "Inmaculada Concepción" },
    { mes: 11, dia: 25, nombre: "Navidad" },
  ].map((festivo) => ({
    ...festivo,
    fecha: new Date(anio, festivo.mes, festivo.dia),
  }));

  const festivosTrasladables = [
    { mes: 0, dia: 6, nombre: "Día de Reyes" },
    { mes: 2, dia: 19, nombre: "Día de San José" },
    { mes: 5, dia: 29, nombre: "San Pedro y San Pablo" },
    { mes: 7, dia: 15, nombre: "Asunción de la Virgen" },
    { mes: 9, dia: 12, nombre: "Día de la Raza" },
    { mes: 10, dia: 1, nombre: "Todos los Santos" },
    { mes: 10, dia: 11, nombre: "Independencia de Cartagena" },
  ].map((festivo) => ({
    ...festivo,
    fecha: moverFestivoAlLunes(new Date(anio, festivo.mes, festivo.dia)),
  }));

  const pascua = obtenerDomingoPascua(anio);

  const festivosRelativosAPascua = [
    { dias: -3, nombre: "Jueves Santo" },
    { dias: -2, nombre: "Viernes Santo" },
    { dias: 43, nombre: "Ascensión del Señor" },
    { dias: 64, nombre: "Corpus Christi" },
    { dias: 71, nombre: "Sagrado Corazón" },
  ].map((festivo) => ({
    ...festivo,
    fecha: sumarDias(pascua, festivo.dias),
  }));

  return [
    ...festivosFijos,
    ...festivosTrasladables,
    ...festivosRelativosAPascua,
  ];
}

// Verifica si una fecha es festiva en Colombia
export function obtenerFestivoColombia(fechaInput) {
  const fecha = crearFechaLocal(fechaInput);
  const clave = claveFechaLocal(fecha);

  return obtenerFestivosColombia(fecha.getFullYear()).find(
    (festivo) => claveFechaLocal(festivo.fecha) === clave
  );
}

// Texto de la siguiente jornada
export function obtenerTextoSiguienteJornada(horario) {
  if (!horario?.siguienteInicio) return "";

  return `Siguiente jornada: ${
    horario.siguienteNombre || "próxima sesión"
  } inicia a las ${formatearHora(horario.siguienteInicio)}.`;
}

// Normaliza días de horario
export function normalizarDia(dia) {
  if (typeof dia === "number") {
    if (dia === 7) return 0;
    return dia >= 0 && dia <= 6 ? dia : null;
  }

  const texto = normalizarTexto(dia);

  const mapaDias = {
    domingo: 0,
    dom: 0,
    "0": 0,
    "7": 0,
    lunes: 1,
    lun: 1,
    "1": 1,
    martes: 2,
    mar: 2,
    "2": 2,
    miercoles: 3,
    mie: 3,
    "3": 3,
    jueves: 4,
    jue: 4,
    "4": 4,
    viernes: 5,
    vie: 5,
    "5": 5,
    sabado: 6,
    sab: 6,
    "6": 6,
  };

  return mapaDias[texto] ?? null;
}

// Expande rangos de días
export function expandirRangoDias(diaInicio, diaFin) {
  if (diaInicio === null || diaFin === null) return [];

  const dias = [];
  let diaActual = diaInicio;

  while (dias.length < 7) {
    dias.push(diaActual);

    if (diaActual === diaFin) break;

    diaActual = (diaActual + 1) % 7;
  }

  return dias;
}

// Obtiene días desde texto tipo lunes a viernes
export function obtenerDiasDesdeRangoTexto(valorDias) {
  const patronDia =
    "domingo|dom|0|7|lunes|lun|1|martes|mar|2|miercoles|mie|3|jueves|jue|4|viernes|vie|5|sabado|sab|6";

  const texto = normalizarTexto(valorDias).replace(/-/g, " a ");

  const coincidencia = texto.match(
    new RegExp(`\\b(${patronDia})\\s*(?:a|al|hasta)\\s*(${patronDia})\\b`)
  );

  if (!coincidencia) return [];

  return expandirRangoDias(
    normalizarDia(coincidencia[1]),
    normalizarDia(coincidencia[2])
  );
}

// Normaliza listado de días
export function normalizarDiasHorario(valorDias) {
  if (!valorDias) return DIAS_HABILES;

  if (typeof valorDias === "string") {
    const diasRango = obtenerDiasDesdeRangoTexto(valorDias);
    if (diasRango.length) return diasRango;
  }

  const dias = Array.isArray(valorDias)
    ? valorDias
    : String(valorDias)
        .split(/[,\s|/]+/)
        .filter(Boolean);

  const diasNormalizados = dias
    .map(normalizarDia)
    .filter((dia) => dia !== null);

  return diasNormalizados.length
    ? [...new Set(diasNormalizados)]
    : DIAS_HABILES;
}

// Completa datos faltantes de un horario
export function completarHorario(horario, indice = 0) {
  const jornadaBase = obtenerJornadaBase(
    horario.jornada || horario.nombre || horario.titulo
  );

  const inicio = normalizarHora(
    horario.hora_inicio ||
      horario.horaInicio ||
      horario.inicio ||
      horario.start ||
      jornadaBase.inicio
  );

  const fin = normalizarHora(
    horario.hora_fin ||
      horario.horaFin ||
      horario.fin ||
      horario.end ||
      jornadaBase.fin
  );

  const dias = normalizarDiasHorario(
    horario.dias ||
      horario.dias_semana ||
      horario.dia_semana ||
      horario.dia ||
      horario.diaSemana
  );

  return {
    id:
      horario.id ||
      horario.id_horario ||
      `${dias.join("-")}-${inicio}-${fin}-${indice}`,
    nombre:
      horario.nombre ||
      horario.titulo ||
      horario.competencia?.nombre ||
      horario.competencia ||
      jornadaBase.nombre,
    dias,
    inicio,
    fin,
    inicioMinutos: convertirHoraAMinutos(inicio),
    finMinutos: convertirHoraAMinutos(fin),
    ambiente:
      horario.ambiente || horario.aula || horario.salon || "Ambiente por asignar",
    siguienteNombre:
      horario.siguienteNombre ||
      horario.siguiente_nombre ||
      jornadaBase.siguienteNombre,
    siguienteInicio: normalizarHora(
      horario.siguienteInicio ||
        horario.siguiente_inicio ||
        jornadaBase.siguienteInicio
    ),
    fuente: horario.fuente || "backend",
  };
}

// Normaliza horarios de grupo
export function normalizarHorariosGrupo(horarios) {
  const lista = Array.isArray(horarios) ? horarios : horarios ? [horarios] : [];

  return lista
    .map(completarHorario)
    .sort((a, b) => a.inicioMinutos - b.inicioMinutos);
}

// Horario base por jornada
export function obtenerHorarioPorJornada(jornada) {
  const jornadaBase = obtenerJornadaBase(jornada);

  return [
    completarHorario({
      ...jornadaBase,
      dias: DIAS_HABILES,
      fuente: "jornada",
    }),
  ];
}

// Obtiene horarios del grupo
export function obtenerHorariosGrupo(grupo, jornadaSeleccionada) {
  const horariosBackend = normalizarHorariosGrupo(grupo?.horarios);

  if (horariosBackend.length) {
    const horariosJornada = filtrarHorariosPorJornada(
      horariosBackend,
      jornadaSeleccionada || grupo?.jornada
    );

    return horariosJornada.length
      ? horariosJornada
      : obtenerHorarioPorJornada(jornadaSeleccionada || grupo?.jornada);
  }

  const horariosLocales =
    horariosSimuladosPorGrupo[String(grupo?.ficha)] ||
    horariosSimuladosPorGrupo[String(grupo?.id)] ||
    horariosSimuladosPorGrupo[String(grupo?.idGrupo)];

  if (horariosLocales?.length) {
    const horariosNormalizados = horariosLocales.map(completarHorario);
    const horariosJornada = filtrarHorariosPorJornada(
      horariosNormalizados,
      jornadaSeleccionada || grupo?.jornada
    );

    return horariosJornada.length
      ? horariosJornada
      : obtenerHorarioPorJornada(jornadaSeleccionada || grupo?.jornada);
  }

  return obtenerHorarioPorJornada(jornadaSeleccionada || grupo?.jornada);
}

// Filtra horarios disponibles para una fecha
export function obtenerHorariosParaFecha(horarios, fechaInput) {
  if (obtenerFestivoColombia(fechaInput)) return [];

  const diaSemana = crearFechaLocal(fechaInput).getDay();

  return horarios
    .filter((horario) => horario.dias.includes(diaSemana))
    .sort((a, b) => a.inicioMinutos - b.inicioMinutos);
}

// Busca próxima sesión disponible
export function obtenerProximaSesion(
  horarios,
  fechaHoraActual,
  minutosCierreDespues
) {
  const fechaBase = crearFechaLocal(obtenerFechaInput(fechaHoraActual));
  const minutosAhora = obtenerMinutosActuales(fechaHoraActual);

  for (let desplazamiento = 0; desplazamiento <= 14; desplazamiento += 1) {
    const fecha = new Date(fechaBase);
    fecha.setDate(fechaBase.getDate() + desplazamiento);

    const fechaInput = obtenerFechaInput(fecha);
    const horariosDia = obtenerHorariosParaFecha(horarios, fechaInput);

    const horarioDisponible = horariosDia.find(
      (horario) =>
        desplazamiento > 0 ||
        horario.finMinutos + minutosCierreDespues >= minutosAhora
    );

    if (horarioDisponible) {
      return {
        fechaInput,
        horario: horarioDisponible,
      };
    }
  }

  return null;
}

// Calcula el estado de la sesión según horario, fecha y hora actual
export function obtenerEstadoHorario({
  horario,
  horarios,
  fechaSesion,
  fechaHoraActual,
  minutosAperturaAntes,
  minutosCierreDespues,
}) {
  const hoyInput = obtenerFechaInput(fechaHoraActual);
  const fechaHoy = crearFechaLocal(hoyInput);
  const fechaSeleccionada = crearFechaLocal(fechaSesion);
  const esHoy = fechaSesion === hoyInput;

  const proximaSesion = obtenerProximaSesion(
    horarios,
    fechaHoraActual,
    minutosCierreDespues
  );

  const siguienteTexto = obtenerTextoSiguienteJornada(horario);
  const festivo = obtenerFestivoColombia(fechaSesion);

  if (festivo) {
    return {
      abierta: false,
      estado: "cerrada",
      titulo: "Día festivo",
      detalle: proximaSesion
        ? `No hay sesión por ${festivo.nombre}. Próxima: ${formatearFechaCorta(
            proximaSesion.fechaInput
          )} de ${formatearHora(
            proximaSesion.horario.inicio
          )} a ${formatearHora(proximaSesion.horario.fin)}.`
        : `No hay sesión por ${festivo.nombre}.`,
      bloqueo:
        "No se puede tomar asistencia porque la fecha seleccionada es festiva.",
      festivo,
      proximaSesion,
      siguienteTexto: "",
    };
  }

  if (!horario) {
    return {
      abierta: false,
      estado: "cerrada",
      titulo: "Sin sesión programada",
      detalle: proximaSesion
        ? `Próxima: ${formatearFechaCorta(
            proximaSesion.fechaInput
          )} de ${formatearHora(
            proximaSesion.horario.inicio
          )} a ${formatearHora(proximaSesion.horario.fin)}.`
        : "No hay horario asignado para este grupo.",
      bloqueo:
        "No se puede tomar asistencia porque no hay sesión programada para la fecha seleccionada.",
      proximaSesion,
      siguienteTexto: "",
    };
  }

  if (fechaSeleccionada < fechaHoy) {
    return {
      abierta: false,
      estado: "cerrada",
      titulo: "Fecha cerrada",
      detalle:
        "La asistencia solo se puede modificar durante la ventana horaria de la sesión.",
      bloqueo:
        "Esta fecha ya pasó. Selecciona la sesión actual para tomar asistencia.",
      proximaSesion,
      siguienteTexto,
    };
  }

  if (!esHoy) {
    return {
      abierta: false,
      estado: "programada",
      titulo: "Sesión programada",
      detalle: `Se abrirá el ${formatearFechaCorta(
        fechaSesion
      )} a las ${formatearMinutos(horario.inicioMinutos - minutosAperturaAntes)}.`,
      bloqueo: "La sesión todavía no está abierta según el horario.",
      proximaSesion,
      siguienteTexto,
    };
  }

  const minutosAhora = obtenerMinutosActuales(fechaHoraActual);
  const minutosApertura = horario.inicioMinutos - minutosAperturaAntes;
  const minutosCierre = horario.finMinutos + minutosCierreDespues;

  if (minutosAhora < minutosApertura) {
    return {
      abierta: false,
      estado: "programada",
      titulo: "Aún no abre",
      detalle: `Se habilita desde las ${formatearMinutos(
        minutosApertura
      )} hasta las ${formatearMinutos(minutosCierre)}.`,
      bloqueo: "La sesión todavía no está abierta según el horario.",
      proximaSesion,
      siguienteTexto,
    };
  }

  if (minutosAhora > minutosCierre) {
    return {
      abierta: false,
      estado: "cerrada",
      titulo: "Sesión finalizada",
      detalle: `La ventana de asistencia cerró a las ${formatearMinutos(
        minutosCierre
      )}.`,
      bloqueo: "La ventana horaria de esta sesión ya cerró.",
      proximaSesion,
      siguienteTexto,
    };
  }

  return {
    abierta: true,
    estado: "abierta",
    titulo:
      minutosAhora > horario.finMinutos
        ? "Cierre de asistencia"
        : "Sesión abierta",
    detalle: `Disponible hasta las ${formatearMinutos(minutosCierre)}.`,
    bloqueo: "",
    proximaSesion,
    siguienteTexto,
  };
}
