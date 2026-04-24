// ============================================================
// DATOS MOCK - Dashboard Coordinador SIMA
// NOTA: Estos datos son temporales. Serán reemplazados por
// consumo real de endpoints cuando estén disponibles en el backend.
// ============================================================

export const coordinatorDashboardData = {
  summaryCards: [
    {
      title: "Aprendices activos",
      value: 32,
      tag: "+3 hoy",
      accent: "green",
    },
    {
      title: "Grupos activos",
      value: 6,
      tag: "6 grupos",
      accent: "blue",
    },
    {
      title: "Alertas activas",
      value: 18,
      tag: "4 criticas",
      accent: "red",
    },
    {
      title: "Observaciones abiertas",
      value: 9,
      tag: "abiertas",
      accent: "yellow",
    },
    {
      title: "Inasistencias válidas",
      value: 32,
      tag: "este mes",
      accent: "orange",
    },
  ],

  // ── Aprendices: Activos / Inactivos ─────────────────────────
  apprenticeStatus: {
    activos: {
      total: 32,
      enFormacion: 28,
      condicionado: 4,
    },
    inactivos: {
      total: 30,
      aplazados: 7,
      cancelados: 4,
      certificados: 19,
    },
    // Para la gráfica donut según filtro
    activosChart: [
      { label: "En formación", value: 28, color: "#35c759" },
      { label: "Condicionado", value: 4, color: "#ffb020" },
    ],
    inactivosChart: [
      { label: "Aplazado", value: 7, color: "#4c8dff" },
      { label: "Cancelado", value: 4, color: "#ff5f57" },
      { label: "Certificado", value: 19, color: "#8b5cf6" },
    ],
  },

  // ── Asistencia filtrable: Día / Semana / Mes ─────────────────
  attendance: {
    dia: {
      label: "Hoy",
      items: [
        { label: "Presente", value: 89, color: "#35c759" },
        { label: "Tarde", value: 12, color: "#ffb020" },
        { label: "Inasistente", value: 8, color: "#ff5f57" },
        { label: "Justificada", value: 6, color: "#4c8dff" },
      ],
    },
    semana: {
      label: "Esta semana",
      items: [
        { label: "Presente", value: 74, color: "#35c759" },
        { label: "Tarde", value: 11, color: "#ffb020" },
        { label: "Inasistente", value: 9, color: "#ff5f57" },
        { label: "Justificada", value: 6, color: "#4c8dff" },
      ],
    },
    mes: {
      label: "Este mes",
      items: [
        { label: "Presente", value: 62, color: "#35c759" },
        { label: "Tarde", value: 13, color: "#ffb020" },
        { label: "Inasistente", value: 7, color: "#ff5f57" },
        { label: "Justificada", value: 18, color: "#4c8dff" },
      ],
    },
  },

  // ── Alertas recientes ────────────────────────────────────────
  recentAlerts: [
    {
      apprentice: "Juan P.",
      detail: "3 inasistencias consecutivas",
      group: "Ficha 2847621 - ADSO / Mañana",
      time: "Hoy 08:30 am",
      source: "Automática",
      severity: "Critica",
    },
    {
      apprentice: "Sara R.",
      detail: "Observaciones recurrentes",
      group: "Ficha 2068574 - Redes / Tarde",
      time: "Ayer 02:15 pm",
      source: "Automática",
      severity: "Grave",
    },
    {
      apprentice: "Carlos M.",
      detail: "Alerta manual instructor",
      group: "Ficha 3854698 - Multimedia / Noche",
      time: "22/04",
      source: "Manual",
      severity: "Moderada",
    },
  ],
};

// ============================================================
// DATOS DE LA FICHA DESTACADA
// Se muestra en el dashboard principal como tarjeta detallada
// ============================================================
export const fichaDestacada = {
  codigo: "2847621",
  programa: "Análisis y Desarrollo de Software",
  nivel: "Tecnólogo",
  jornada: "Mañana",
  area: "Tecnología",
  instructorLider: "Carlos Pérez",
  status: "Activo",

  // Línea de tiempo
  fechaInicio: "2023-02-13",
  fechaFin: "2025-05-30",
  fechaInicioEtapaProductiva: "2025-01-15",
  trimestres: 6,
  trimestreActual: 5,

  // Aprendices
  totalAprendices: 24,
  aprendicesActivos: 19,
  aprendicesInactivos: 5,
  aprendicesCondicionados: 3,
  aprendicesAplazados: 2,

  // Asistencia (porcentajes del mes)
  asistencia: {
    presente: 71,
    tarde: 10,
    inasistente: 8,
    justificada: 11,
  },

  // KPIs rápidos
  alertasActivas: 4,
  observacionesAbiertas: 2,
  inasistenciasEsteMes: 7,
};

// ============================================================
// DATOS DETALLADOS POR FICHA - Vista de detalle
// ============================================================
export const groupDetailData = {
  "2847621": {
    code: "2847621",
    program: "Análisis y Desarrollo de Software",
    shift: "Mañana",
    trimestres: 6,
    trimestreActual: 5,
    status: "Activo",
    instructorLider: "Carlos Pérez",
    area: "Tecnología",
    fechaInicio: "2023-02-13",
    fechaFin: "2025-05-30",
    fechaInicioEtapaProductiva: "2025-01-15",
    kpis: { aprendices: 24, alertas: 4, observaciones: 2, inasistencias: 7 },
    attendance: {
      items: [
        { label: "Presente", value: 71, color: "#35c759" },
        { label: "Tarde", value: 10, color: "#ffb020" },
        { label: "Inasistente", value: 8, color: "#ff5f57" },
        { label: "Justificada", value: 11, color: "#4c8dff" },
      ],
    },
    trainingStatus: [
      { label: "En formación", value: 18, color: "#35c759" },
      { label: "Condicionado", value: 3, color: "#ffb020" },
      { label: "Aplazado", value: 2, color: "#4c8dff" },
      { label: "Cancelado", value: 1, color: "#ff5f57" },
    ],
    apprentices: [
      { id: 1, name: "Juan Pérez", document: "1098765432", status: "Condicionado", alerts: 2, absences: 5, risk: "Alto" },
      { id: 2, name: "María López", document: "1087654321", status: "En formación", alerts: 0, absences: 1, risk: "Bajo" },
      { id: 3, name: "Andrés García", document: "1076543210", status: "En formación", alerts: 1, absences: 2, risk: "Medio" },
      { id: 4, name: "Laura Martínez", document: "1065432109", status: "Aplazado", alerts: 1, absences: 3, risk: "Medio" },
      { id: 5, name: "Pedro Ruiz", document: "1054321098", status: "En formación", alerts: 0, absences: 0, risk: "Bajo" },
      { id: 6, name: "Sofía Torres", document: "1043210987", status: "En formación", alerts: 0, absences: 1, risk: "Bajo" },
    ],
    alerts: [
      { apprentice: "Juan Pérez", detail: "3 inasistencias consecutivas", severity: "Critica", source: "Automática", time: "Hoy 08:30 am" },
      { apprentice: "Andrés García", detail: "Bajo rendimiento académico", severity: "Moderada", source: "Manual", time: "Ayer 10:00 am" },
      { apprentice: "Laura Martínez", detail: "Observación disciplinaria", severity: "Grave", source: "Manual", time: "20/04" },
      { apprentice: "Juan Pérez", detail: "Llegada tarde reiterada", severity: "Leve", source: "Automática", time: "19/04" },
    ],
  },
  "2068574": {
    code: "2068574",
    program: "Redes y Datos",
    shift: "Tarde",
    trimestres: 4,
    trimestreActual: 3,
    status: "Activo",
    instructorLider: "María Gómez",
    area: "Tecnología",
    fechaInicio: "2023-08-07",
    fechaFin: "2025-06-20",
    fechaInicioEtapaProductiva: "2025-03-10",
    kpis: { aprendices: 30, alertas: 3, observaciones: 2, inasistencias: 5 },
    attendance: {
      items: [
        { label: "Presente", value: 68, color: "#35c759" },
        { label: "Tarde", value: 15, color: "#ffb020" },
        { label: "Inasistente", value: 5, color: "#ff5f57" },
        { label: "Justificada", value: 12, color: "#4c8dff" },
      ],
    },
    trainingStatus: [
      { label: "En formación", value: 25, color: "#35c759" },
      { label: "Condicionado", value: 3, color: "#ffb020" },
      { label: "Aplazado", value: 1, color: "#4c8dff" },
      { label: "Cancelado", value: 1, color: "#ff5f57" },
    ],
    apprentices: [
      { id: 1, name: "Sara Rojas", document: "1098001122", status: "En formación", alerts: 1, absences: 3, risk: "Medio" },
      { id: 2, name: "Diego Morales", document: "1097002233", status: "Condicionado", alerts: 1, absences: 2, risk: "Medio" },
      { id: 3, name: "Valentina Cruz", document: "1096003344", status: "En formación", alerts: 0, absences: 0, risk: "Bajo" },
      { id: 4, name: "Camilo Herrera", document: "1095004455", status: "En formación", alerts: 1, absences: 1, risk: "Bajo" },
      { id: 5, name: "Isabella Díaz", document: "1094005566", status: "En formación", alerts: 0, absences: 0, risk: "Bajo" },
    ],
    alerts: [
      { apprentice: "Sara Rojas", detail: "Observaciones recurrentes", severity: "Grave", source: "Automática", time: "Ayer 02:15 pm" },
      { apprentice: "Diego Morales", detail: "2 inasistencias sin justificar", severity: "Moderada", source: "Automática", time: "21/04" },
      { apprentice: "Camilo Herrera", detail: "Alerta académica leve", severity: "Leve", source: "Manual", time: "20/04" },
    ],
  },
  "3854698": {
    code: "3854698",
    program: "Multimedia",
    shift: "Noche",
    trimestres: 5,
    trimestreActual: 4,
    status: "Suspendido",
    instructorLider: "Luis Torres",
    area: "Diseño",
    fechaInicio: "2022-11-14",
    fechaFin: "2024-12-06",
    fechaInicioEtapaProductiva: "2024-09-02",
    kpis: { aprendices: 25, alertas: 5, observaciones: 3, inasistencias: 6 },
    attendance: {
      items: [
        { label: "Presente", value: 55, color: "#35c759" },
        { label: "Tarde", value: 18, color: "#ffb020" },
        { label: "Inasistente", value: 12, color: "#ff5f57" },
        { label: "Justificada", value: 15, color: "#4c8dff" },
      ],
    },
    trainingStatus: [
      { label: "En formación", value: 18, color: "#35c759" },
      { label: "Condicionado", value: 4, color: "#ffb020" },
      { label: "Aplazado", value: 2, color: "#4c8dff" },
      { label: "Cancelado", value: 1, color: "#ff5f57" },
    ],
    apprentices: [
      { id: 1, name: "Carlos Moreno", document: "1088112233", status: "Aplazado", alerts: 1, absences: 2, risk: "Medio" },
      { id: 2, name: "Daniela Ríos", document: "1087223344", status: "Condicionado", alerts: 2, absences: 4, risk: "Alto" },
      { id: 3, name: "Felipe Vargas", document: "1086334455", status: "En formación", alerts: 0, absences: 1, risk: "Bajo" },
      { id: 4, name: "Natalia Pardo", document: "1085445566", status: "En formación", alerts: 1, absences: 0, risk: "Bajo" },
    ],
    alerts: [
      { apprentice: "Carlos Moreno", detail: "Alerta manual del instructor", severity: "Moderada", source: "Manual", time: "22/04" },
      { apprentice: "Daniela Ríos", detail: "4 inasistencias este mes", severity: "Critica", source: "Automática", time: "21/04" },
      { apprentice: "Daniela Ríos", detail: "Bajo rendimiento", severity: "Grave", source: "Manual", time: "20/04" },
      { apprentice: "Natalia Pardo", detail: "Observación de comportamiento", severity: "Leve", source: "Manual", time: "19/04" },
      { apprentice: "Felipe Vargas", detail: "Llegada tarde", severity: "Leve", source: "Automática", time: "18/04" },
    ],
  },
  "3064975": {
    code: "3064975",
    program: "Contabilidad",
    shift: "Mañana",
    trimestres: 3,
    trimestreActual: 3,
    status: "Cerrado",
    instructorLider: "Ana Rodríguez",
    area: "Administrativa",
    fechaInicio: "2022-02-07",
    fechaFin: "2023-11-24",
    fechaInicioEtapaProductiva: "2023-08-14",
    kpis: { aprendices: 19, alertas: 1, observaciones: 1, inasistencias: 2 },
    attendance: {
      items: [
        { label: "Presente", value: 82, color: "#35c759" },
        { label: "Tarde", value: 8, color: "#ffb020" },
        { label: "Inasistente", value: 3, color: "#ff5f57" },
        { label: "Justificada", value: 7, color: "#4c8dff" },
      ],
    },
    trainingStatus: [
      { label: "En formación", value: 0, color: "#35c759" },
      { label: "Condicionado", value: 0, color: "#ffb020" },
      { label: "Aplazado", value: 0, color: "#4c8dff" },
      { label: "Cancelado", value: 1, color: "#ff5f57" },
      { label: "Certificado", value: 18, color: "#8b5cf6" },
    ],
    apprentices: [
      { id: 1, name: "Juliana Ospina", document: "1078556677", status: "Certificado", alerts: 0, absences: 0, risk: "Bajo" },
      { id: 2, name: "Esteban Muñoz", document: "1077667788", status: "Certificado", alerts: 0, absences: 1, risk: "Bajo" },
      { id: 3, name: "Paola Restrepo", document: "1076778899", status: "Cancelado", alerts: 1, absences: 2, risk: "Medio" },
    ],
    alerts: [
      { apprentice: "Paola Restrepo", detail: "Cancelación de matrícula", severity: "Grave", source: "Manual", time: "15/03" },
    ],
  },
};
