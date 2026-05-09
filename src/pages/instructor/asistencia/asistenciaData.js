// Datos temporales para que la vista funcione mientras el backend queda listo.

export const DIAS_HABILES = [1, 2, 3, 4, 5];

export const HORARIOS_JORNADA = {
  manana: {
    id: "jornada-manana",
    nombre: "Sesión de la mañana",
    inicio: "07:00",
    fin: "12:40",
    siguienteNombre: "tarde",
    siguienteInicio: "13:00",
  },
  tarde: {
    id: "jornada-tarde",
    nombre: "Sesión de la tarde",
    inicio: "13:00",
    fin: "18:40",
    siguienteNombre: "noche",
    siguienteInicio: "19:00",
  },
  noche: {
    id: "jornada-noche",
    nombre: "Sesión de la noche",
    inicio: "19:00",
    fin: "22:00",
    siguienteNombre: "mañana",
    siguienteInicio: "07:00",
  },
};

export const gruposSimulados = [
  {
    id: "2456",
    ficha: "2456",
    programa: "Análisis y Desarrollo de Software",
    jornada: "Mañana",
  },
  {
    id: "2457",
    ficha: "2457",
    programa: "Sistemas Integrados de Gestión",
    jornada: "Tarde",
  },
  {
    id: "2458",
    ficha: "2458",
    programa: "Diseño para Medios Digitales",
    jornada: "Noche",
  },
];

export const horariosSimuladosPorGrupo = {
  "2456": [
    {
      id: "2456-lunes-viernes-manana",
      nombre: "Sesión ADSO",
      dias: DIAS_HABILES,
      inicio: HORARIOS_JORNADA.manana.inicio,
      fin: HORARIOS_JORNADA.manana.fin,
      siguienteNombre: HORARIOS_JORNADA.manana.siguienteNombre,
      siguienteInicio: HORARIOS_JORNADA.manana.siguienteInicio,
      ambiente: "Ambiente 301",
      fuente: "local",
    },
  ],
  "2457": [
    {
      id: "2457-lunes-viernes-tarde",
      nombre: "Sesión SIG",
      dias: DIAS_HABILES,
      inicio: HORARIOS_JORNADA.tarde.inicio,
      fin: HORARIOS_JORNADA.tarde.fin,
      siguienteNombre: HORARIOS_JORNADA.tarde.siguienteNombre,
      siguienteInicio: HORARIOS_JORNADA.tarde.siguienteInicio,
      ambiente: "Ambiente 204",
      fuente: "local",
    },
  ],
  "2458": [
    {
      id: "2458-lunes-viernes-noche",
      nombre: "Sesión medios digitales",
      dias: DIAS_HABILES,
      inicio: HORARIOS_JORNADA.noche.inicio,
      fin: HORARIOS_JORNADA.noche.fin,
      siguienteNombre: HORARIOS_JORNADA.noche.siguienteNombre,
      siguienteInicio: HORARIOS_JORNADA.noche.siguienteInicio,
      ambiente: "Ambiente 112",
      fuente: "local",
    },
  ],
};

export const aprendicesIniciales = [
  {
    id: 1,
    nombre: "Luis Gustavo Ramírez",
    documento: "1.085.234.567",
    estado: "",
    observacion: "",
    estadoFormativo: "En formación",
  },
  {
    id: 2,
    nombre: "María Camila Torres",
    documento: "1.020.345.678",
    estado: "",
    observacion: "",
    estadoFormativo: "En formación",
  },
  {
    id: 3,
    nombre: "Juan Pablo Herrera",
    documento: "1.004.567.890",
    estado: "",
    observacion: "",
    estadoFormativo: "Seguimiento",
  },
  {
    id: 4,
    nombre: "Ana Sofía López",
    documento: "1.007.654.321",
    estado: "",
    observacion: "",
    estadoFormativo: "En formación",
  },
  {
    id: 5,
    nombre: "Diego Alejandro Cruz",
    documento: "1.015.987.654",
    estado: "",
    observacion: "",
    estadoFormativo: "En formación",
  },
];

export const observacionesIniciales = [
  {
    id: "obs-local-1",
    aprendizId: 3,
    aprendizNombre: "Juan Pablo Herrera",
    documento: "1.004.567.890",
    grupoId: "2456",
    ficha: "2456",
    tipo: "Académica",
    severidad: "Moderada",
    descripcion:
      "Presenta inasistencia recurrente y requiere seguimiento formativo.",
    fechaISO: "2025-05-17",
    fechaTexto: "17/05/2025, 08:25 a.m.",
    instructor: "Franco Reina",
  },
  {
    id: "obs-local-2",
    aprendizId: 4,
    aprendizNombre: "Ana Sofía López",
    documento: "1.007.654.321",
    grupoId: "2456",
    ficha: "2456",
    tipo: "Convivencial",
    severidad: "Leve",
    descripcion:
      "Llegó tarde a la sesión y se dejó compromiso de puntualidad.",
    fechaISO: "2025-05-17",
    fechaTexto: "17/05/2025, 09:10 a.m.",
    instructor: "Franco Reina",
  },
];
