/* ============================================================
   mockCoordinatorData.js
   Datos de demostración para el CoordinadorDashboard
   ============================================================ */

export const coordinatorDashboardData = {
  summaryCards: [
    { title: "Aprendices activos",    value: 87,  tag: "Este trimestre",    accent: "green"  },
    { title: "Grupos activos",        value: 5,   tag: "Fichas en curso",   accent: "blue"   },
    { title: "Alertas activas",       value: 14,  tag: "Sin resolver",      accent: "red"    },
    { title: "Asistencia promedio",   value: "78%", tag: "Mes actual",      accent: "yellow" },
    { title: "Inasistencias",         value: 23,  tag: "Este mes",          accent: "orange" },
  ],

  apprenticeStatus: {
    activos:   { total: 87, enFormacion: 74, condicionado: 13 },
    inactivos: { total: 19, aplazados: 8, cancelados: 7, certificados: 4 },

    activosChart: [
      { name: "En formación",  value: 74, color: "#35c759" },
      { name: "Condicionado",  value: 13, color: "#ffb020" },
    ],
    inactivosChart: [
      { name: "Aplazado",    value: 8,  color: "#4c8dff" },
      { name: "Cancelado",   value: 7,  color: "#ff5f57" },
      { name: "Certificado", value: 4,  color: "#8b5cf6" },
    ],
  },

  attendance: {
    dia: {
      label: "Hoy",
      items: [
        { label: "Presentes",    value: 82, color: "#35c759" },
        { label: "Ausentes",     value: 11, color: "#ff5f57" },
        { label: "Justificados", value: 7,  color: "#4c8dff" },
      ],
    },
    semana: {
      label: "Esta semana",
      items: [
        { label: "Lunes",    value: 88, color: "#35c759" },
        { label: "Martes",   value: 85, color: "#35c759" },
        { label: "Miércoles",value: 79, color: "#ffb020" },
        { label: "Jueves",   value: 81, color: "#35c759" },
        { label: "Viernes",  value: 74, color: "#ffb020" },
      ],
    },
    mes: {
      label: "Este mes",
      items: [
        { label: "Semana 1", value: 88, color: "#35c759" },
        { label: "Semana 2", value: 82, color: "#35c759" },
        { label: "Semana 3", value: 76, color: "#ffb020" },
        { label: "Semana 4", value: 71, color: "#ffb020" },
      ],
    },
  },

  recentAlerts: [
    { apprentice: "Carlos Méndez",   group: "Ficha 2847621", detail: "3 inasistencias consecutivas", time: "Hace 2 horas",    severity: "Grave",    source: "Asistencia"  },
    { apprentice: "Laura Ríos",      group: "Ficha 2847621", detail: "Bajo rendimiento académico",   time: "Hace 5 horas",    severity: "Moderada", source: "Seguimiento" },
    { apprentice: "Andrés Torres",   group: "Ficha 2068574", detail: "Situación económica crítica",  time: "Ayer",            severity: "Critica",  source: "Bienestar"   },
    { apprentice: "Sofía Jiménez",   group: "Ficha 2068574", detail: "Documentación incompleta",     time: "Hace 2 días",     severity: "Leve",     source: "Secretaría"  },
    { apprentice: "Mario Castillo",  group: "Ficha 3064975", detail: "Solicitud de aplazamiento",    time: "Hace 3 días",     severity: "Moderada", source: "Coordinación" },
  ],
};

/* Ficha destacada que se muestra en el CoordinadorDashboard */
export const fichaDestacada = {
  codigo:                    "2847621",
  programa:                  "Análisis y Desarrollo de Software",
  nivel:                     "Tecnólogo",
  area:                      "Tecnología",
  jornada:                   "Mañana",
  instructorLider:           "Carlos Pérez",
  status:                    "Activo",
  fechaInicio:               "2023-08-15",
  fechaFin:                  "2025-08-15",
  fechaInicioEtapaProductiva:"2025-02-01",
  trimestres:                6,
  trimestreActual:           4,
  totalAprendices:           32,
  aprendicesActivos:         27,
  aprendicesCondicionados:   5,
  aprendicesInactivos:       3,
  alertasActivas:            6,
  observacionesAbiertas:     3,
  inasistenciasEsteMes:      12,
  asistencia: {
    presente:    78,
    tarde:       9,
    inasistente: 8,
    justificada: 5,
  },
};

/* Lista de fichas/grupos para la vista de selección */
export const listaFichas = [
  {
    codigo: "2847621",
    programa: "Análisis y Desarrollo de Software",
    jornada: "Mañana",
    aprendices: 32,
    trimestres: 6,
    trimestreActual: 4,
    estado: "ACTIVO",
    instructorLider: "Carlos Pérez",
    alertas: 6,
  },
  {
    codigo: "2068574",
    programa: "Redes y Comunicación de Datos",
    jornada: "Tarde",
    aprendices: 28,
    trimestres: 4,
    trimestreActual: 2,
    estado: "SUSPENDIDO",
    instructorLider: "María Gómez",
    alertas: 3,
  },
  {
    codigo: "3064975",
    programa: "Contabilidad y Finanzas",
    jornada: "Mañana",
    aprendices: 19,
    trimestres: 3,
    trimestreActual: 3,
    estado: "CERRADO",
    instructorLider: "Juan Rodríguez",
    alertas: 0,
  },
];

/* ============================================================
   Datos por ficha para GrupoDetalle (DetalleGrupo.jsx)
   Indexado por código de ficha
   ============================================================ */
export const groupDetailData = {
  "2847621": {
    code: "2847621",
    program: "Análisis y Desarrollo de Software",
    shift: "Mañana",
    trimestres: 6,
    area: "Tecnología",
    instructorLider: "Carlos Pérez",
    status: "Activo",

    kpis: {
      aprendices: 32,
      alertas: 6,
      observaciones: 3,
      inasistencias: 12,
    },

    trainingStatus: [
      { name: "En formación",  value: 24, color: "#35c759" },
      { name: "Condicionado",  value: 5,  color: "#ffb020" },
      { name: "Aplazado",      value: 2,  color: "#4c8dff" },
      { name: "Cancelado",     value: 1,  color: "#ff5f57" },
    ],

    attendance: {
      items: [
        { name: "Presente",     value: 78, color: "#35c759" },
        { name: "Tarde",        value: 9,  color: "#ffb020" },
        { name: "Inasistente",  value: 8,  color: "#ff5f57" },
        { name: "Justificada",  value: 5,  color: "#4c8dff" },
      ],
    },

    apprentices: [
      { id: 1, name: "Carlos Méndez",  document: "1020345678", status: "En formación", alerts: 2, absences: 4, risk: "Alto"  },
      { id: 2, name: "Laura Ríos",     document: "1020456789", status: "Condicionado",  alerts: 3, absences: 7, risk: "Alto"  },
      { id: 3, name: "Andrés Torres",  document: "1020567890", status: "En formación", alerts: 0, absences: 1, risk: "Bajo"  },
      { id: 4, name: "Sofía Jiménez",  document: "1020678901", status: "En formación", alerts: 0, absences: 0, risk: "Bajo"  },
      { id: 5, name: "Mario Castillo", document: "1020789012", status: "Condicionado",  alerts: 1, absences: 5, risk: "Medio" },
      { id: 6, name: "Ana Vargas",     document: "1020890123", status: "En formación", alerts: 0, absences: 0, risk: "Bajo"  },
    ],

    alerts: [
      { apprentice: "Carlos Méndez",  detail: "3 inasistencias consecutivas",  severity: "Grave",    source: "Asistencia",   time: "Hace 2 horas" },
      { apprentice: "Laura Ríos",     detail: "Bajo rendimiento académico",    severity: "Moderada", source: "Seguimiento",  time: "Hace 5 horas" },
      { apprentice: "Mario Castillo", detail: "Solicitud de aplazamiento",     severity: "Moderada", source: "Coordinación", time: "Hace 1 día"   },
      { apprentice: "Laura Ríos",     detail: "Documentación incompleta",      severity: "Leve",     source: "Secretaría",   time: "Hace 2 días"  },
      { apprentice: "Carlos Méndez",  detail: "Situación socioeconómica",      severity: "Grave",    source: "Bienestar",    time: "Hace 3 días"  },
      { apprentice: "Mario Castillo", detail: "Sin entrega de evidencias",      severity: "Leve",     source: "Instructor",   time: "Hace 4 días"  },
    ],
  },

  "2068574": {
    code: "2068574",
    program: "Redes y Comunicación de Datos",
    shift: "Tarde",
    trimestres: 4,
    area: "Tecnología",
    instructorLider: "María Gómez",
    status: "Suspendido",

    kpis: {
      aprendices: 28,
      alertas: 3,
      observaciones: 2,
      inasistencias: 8,
    },

    trainingStatus: [
      { name: "En formación", value: 20, color: "#35c759" },
      { name: "Condicionado", value: 4,  color: "#ffb020" },
      { name: "Aplazado",     value: 3,  color: "#4c8dff" },
      { name: "Cancelado",    value: 1,  color: "#ff5f57" },
    ],

    attendance: {
      items: [
        { name: "Presente",    value: 72, color: "#35c759" },
        { name: "Tarde",       value: 12, color: "#ffb020" },
        { name: "Inasistente", value: 11, color: "#ff5f57" },
        { name: "Justificada", value: 5,  color: "#4c8dff" },
      ],
    },

    apprentices: [
      { id: 1, name: "Andrés Torres",  document: "1020567890", status: "En formación", alerts: 1, absences: 2, risk: "Medio" },
      { id: 2, name: "Sofía Jiménez",  document: "1020678901", status: "Condicionado",  alerts: 2, absences: 6, risk: "Alto"  },
      { id: 3, name: "Pedro Salcedo",  document: "1020901234", status: "En formación", alerts: 0, absences: 0, risk: "Bajo"  },
      { id: 4, name: "Valentina Cruz", document: "1021012345", status: "En formación", alerts: 0, absences: 1, risk: "Bajo"  },
    ],

    alerts: [
      { apprentice: "Sofía Jiménez",  detail: "Documentación incompleta",    severity: "Leve",     source: "Secretaría",  time: "Hace 2 días" },
      { apprentice: "Andrés Torres",  detail: "Situación económica crítica", severity: "Critica",  source: "Bienestar",   time: "Ayer"        },
      { apprentice: "Sofía Jiménez",  detail: "Bajo rendimiento",            severity: "Moderada", source: "Seguimiento", time: "Hace 3 días" },
    ],
  },

  "3064975": {
    code: "3064975",
    program: "Contabilidad y Finanzas",
    shift: "Mañana",
    trimestres: 3,
    area: "Gestión Empresarial",
    instructorLider: "Juan Rodríguez",
    status: "Cerrado",

    kpis: {
      aprendices: 19,
      alertas: 0,
      observaciones: 1,
      inasistencias: 2,
    },

    trainingStatus: [
      { name: "Certificado",  value: 16, color: "#8b5cf6" },
      { name: "Aplazado",     value: 2,  color: "#4c8dff" },
      { name: "Cancelado",    value: 1,  color: "#ff5f57" },
    ],

    attendance: {
      items: [
        { name: "Presente",    value: 92, color: "#35c759" },
        { name: "Tarde",       value: 4,  color: "#ffb020" },
        { name: "Inasistente", value: 3,  color: "#ff5f57" },
        { name: "Justificada", value: 1,  color: "#4c8dff" },
      ],
    },

    apprentices: [
      { id: 1, name: "Gloria Patiño",   document: "1021123456", status: "Certificado", alerts: 0, absences: 0, risk: "Bajo"  },
      { id: 2, name: "Camilo Vargas",   document: "1021234567", status: "Certificado", alerts: 0, absences: 1, risk: "Bajo"  },
      { id: 3, name: "Natalia López",   document: "1021345678", status: "Aplazado",    alerts: 0, absences: 2, risk: "Medio" },
    ],

    alerts: [],
  },
};
