/* global cy, describe, it, Cypress */

const usuarios = [
  {
    id_usuario: 1,
    email: "coordinador@sima.test",
    estado: "ACTIVO",
    rol: { id_rol: 2, nombre: "coordinador" },
    persona: {
      nombres: "Camila",
      apellidos: "Rojas",
      tipo_documento: "CC",
      numero_documento: "1001001001",
      telefono: "3001112233",
    },
  },
  {
    id_usuario: 2,
    email: "instructor@sima.test",
    estado: "ACTIVO",
    id_instructor: 11,
    rol: { id_rol: 3, nombre: "instructor" },
    persona: {
      nombres: "Andres",
      apellidos: "Lopez",
      tipo_documento: "CC",
      numero_documento: "1002003004",
      telefono: "3004445566",
    },
    instructor: { id_instructor: 11 },
  },
  {
    id_usuario: 3,
    email: "aprendiz@sima.test",
    estado: "ACTIVO",
    rol: { id_rol: 4, nombre: "aprendiz" },
    persona: {
      nombres: "Laura",
      apellidos: "Martinez",
      tipo_documento: "TI",
      numero_documento: "1020304050",
      telefono: "3012223344",
    },
  },
];

const grupos = [
  {
    id: 101,
    id_grupo: 101,
    numero_ficha: "2875412",
    numero_grupo: "2875412",
    codigo: "2875412",
    programa: "Analisis y Desarrollo de Software",
    nombre_programa: "Analisis y Desarrollo de Software",
    jornada: "MANANA",
    estado: "ACTIVO",
    fecha_inicio: "2026-01-20",
    fecha_fin: "2027-01-20",
    etapa: "Lectiva",
    instructor_lider: {
      id_instructor: 11,
      usuario: usuarios[1],
    },
    instructor_lider_nombre: "Andres Lopez",
    aprendices_count: 3,
  },
  {
    id: 102,
    id_grupo: 102,
    numero_ficha: "2875413",
    numero_grupo: "2875413",
    codigo: "2875413",
    programa: "Gestion de Redes de Datos",
    nombre_programa: "Gestion de Redes de Datos",
    jornada: "TARDE",
    estado: "ACTIVO",
    fecha_inicio: "2026-02-01",
    fecha_fin: "2027-02-01",
    instructor_lider: {
      id_instructor: 11,
      usuario: usuarios[1],
    },
    instructor_lider_nombre: "Andres Lopez",
    aprendices_count: 2,
  },
];

const aprendices = [
  {
    id: 201,
    id_aprendiz: 201,
    id_usuario: 3,
    estado: "ACTIVO",
    ficha: "2875412",
    grupo: grupos[0],
    usuario: usuarios[2],
    asistencia: 86,
    inasistencias: 2,
  },
  {
    id: 202,
    id_aprendiz: 202,
    id_usuario: 4,
    estado: "ACTIVO",
    ficha: "2875412",
    usuario: {
      id_usuario: 4,
      email: "miguel@sima.test",
      persona: {
        nombres: "Miguel",
        apellidos: "Torres",
        tipo_documento: "TI",
        numero_documento: "1020304051",
        telefono: "3015556677",
      },
    },
    asistencia: 93,
    inasistencias: 1,
  },
];

const sesiones = [
  {
    id: 301,
    id_sesion_formacion: 301,
    id_grupo: 101,
    grupo: grupos[0],
    estado: "ABIERTA",
    fecha: "2026-07-09",
    fecha_sesion: "2026-07-09",
    hora_inicio: "08:00",
    hora_fin: "12:00",
    ambiente: "Aula 204",
    competencia: { nombre: "Desarrollar aplicaciones web" },
  },
];

const asistencias = [
  {
    id: 401,
    id_asistencia: 401,
    id_aprendiz: 201,
    aprendiz: aprendices[0],
    estado: "PRESENTE",
    metodo_registro: "QR",
    hora_registro: "08:03",
  },
  {
    id: 402,
    id_asistencia: 402,
    id_aprendiz: 202,
    aprendiz: aprendices[1],
    estado: "TARDE",
    metodo_registro: "HUELLA",
    hora_registro: "08:18",
  },
];

const alertas = [
  {
    id: 501,
    id_alerta: 501,
    id_grupo: 101,
    id_aprendiz: 201,
    grupo: grupos[0],
    aprendiz: aprendices[0],
    tipo_alerta: "ASISTENCIAL",
    severidad: "MODERADA",
    estado: "ABIERTA",
    origen: "SISTEMA",
    descripcion: "Tres llegadas tarde en la semana.",
    fecha_alerta: "2026-07-08T09:00:00.000Z",
    usuario_creador: usuarios[1],
  },
  {
    id: 502,
    id_alerta: 502,
    id_grupo: 101,
    id_aprendiz: 202,
    grupo: grupos[0],
    aprendiz: aprendices[1],
    tipo_alerta: "OBSERVACIONES_RECURRENTES",
    severidad: "GRAVE",
    estado: "ABIERTA",
    origen: "MANUAL",
    descripcion: "Observaciones recurrentes de convivencia.",
    fecha_alerta: "2026-07-07T10:30:00.000Z",
    usuario_creador: usuarios[1],
  },
];

const observaciones = [
  {
    id: 601,
    id_observacion: 601,
    id_aprendiz: 201,
    aprendiz: aprendices[0],
    tipo_observacion: "Academica",
    severidad: "MODERADA",
    estado: "ABIERTA",
    descripcion: "Debe reforzar entregas pendientes del sprint.",
    fecha_observacion: "2026-07-08",
    createdAt: "2026-07-08T14:00:00.000Z",
  },
];

function payload(data) {
  return { success: true, data };
}

function nombreCompleto(usuario) {
  const persona = usuario.persona || {};
  return `${persona.nombres || ""} ${persona.apellidos || ""}`.trim();
}

function instalarIntercepts() {
  cy.intercept("POST", "/api/auth/login", (req) => {
    if (req.body?.password === "mal") {
      req.reply({ statusCode: 401, body: { message: "Usuario o contrasena incorrectos." } });
      return;
    }

    req.reply({
      body: payload({
        access: "cy-token",
        user: usuarios[0],
      }),
    });
  });

  cy.intercept("GET", "/api/auth/me", payload(usuarios[0]));
  cy.intercept("GET", "/api/dashboard/super-admin/resumen", payload({
    kpis: {
      total_usuarios: 48,
      usuarios_activos: 44,
      total_grupos: 12,
      total_grupos_activos: 10,
      huellas_activas: 31,
      huellas_revocadas: 3,
      dispositivos_activos: 5,
      dispositivos_mantenimiento: 1,
      total_alertas_activas: 8,
      justificaciones_pendientes: 4,
      total_super_admins: 2,
      total_coordinadores: 4,
      total_instructores_activos: 16,
      total_aprendices_activos: 26,
    },
  }));
  cy.intercept("GET", "/api/profile/overview", payload({
    ...usuarios[0],
    rol: "Coordinador",
    informacion_rol: {
      areas_asignadas: ["Teleinformatica"],
      fichas_activas: ["2875412", "2875413"],
    },
  }));
  cy.intercept("PUT", "/api/profile/overview", payload({ usuario: usuarios[0] }));
  cy.intercept("GET", "/api/roles", payload({ roles: [
    { id_rol: 1, nombre: "super_admin" },
    { id_rol: 2, nombre: "coordinador" },
    { id_rol: 3, nombre: "instructor" },
    { id_rol: 4, nombre: "aprendiz" },
  ] }));
  cy.intercept("GET", "/api/coordinator-areas/areas", payload({ areas: [
    { id_area: 1, nombre: "Teleinformatica" },
    { id_area: 2, nombre: "Software" },
  ] }));
  cy.intercept("GET", "/api/formative-programs*", payload({ programas: [
    { id_programa: 1, nombre_programa: "Analisis y Desarrollo de Software", nombre: "Analisis y Desarrollo de Software" },
  ] }));
  cy.intercept("GET", "/api/users?*", payload({ usuarios, total: usuarios.length }));
  cy.intercept("GET", "/api/users", payload({ usuarios, total: usuarios.length }));
  cy.intercept("POST", "/api/users", payload({ usuario: usuarios[0] }));
  cy.intercept("PUT", "/api/users/*", payload({ usuario: usuarios[0] }));
  cy.intercept("DELETE", "/api/users/*", payload({ ok: true }));
  cy.intercept("GET", "/api/instructors*", payload({ instructores: [{ id_instructor: 11, usuario: usuarios[1] }] }));
  cy.intercept("GET", "/api/groups/verificar-ficha/*", payload({ disponible: true }));
  cy.intercept("GET", "/api/groups?*", payload({ grupos, total: grupos.length }));
  cy.intercept("GET", "/api/groups", payload({ grupos, total: grupos.length }));
  cy.intercept("GET", "/api/groups/101", payload({ grupo: grupos[0], ...grupos[0] }));
  cy.intercept("POST", "/api/groups", payload({ grupo: grupos[0] }));
  cy.intercept("PATCH", "/api/groups/*", payload({ grupo: grupos[0] }));
  cy.intercept("PUT", "/api/groups/*", payload({ grupo: grupos[0] }));
  cy.intercept("GET", "/api/apprentices/grupos-activos", payload(grupos));
  cy.intercept("GET", "/api/apprentices/grupo/101*", payload({ aprendices, total: aprendices.length, grupo: grupos[0] }));
  cy.intercept("GET", "/api/apprentices/grupo/*", payload({ aprendices, total: aprendices.length, grupo: grupos[0] }));
  cy.intercept("POST", "/api/apprentices/registro", payload({ aprendiz: aprendices[0] }));
  cy.intercept("POST", "/api/apprentices/registro-masivo", payload({ message: "Carga masiva procesada correctamente." }));
  cy.intercept("GET", "/api/educational-schedules/catalogs*", payload({
    opciones: {
      trimestres: [{ id_grupo_trimestre: 1, nombre: "Trimestre 1" }],
      competencias: [{ id_competencia: 1, nombre: "Desarrollar aplicaciones web" }],
    },
  }));
  cy.intercept("GET", "/api/educational-schedules*", payload({ horarios: [
    { id_horario: 1, dia_semana: "LUNES", hora_inicio: "08:00", hora_fin: "12:00", ambiente: "Aula 204", competencia: { nombre: "Desarrollar aplicaciones web" } },
    { id_horario: 2, dia_semana: "MIERCOLES", hora_inicio: "08:00", hora_fin: "12:00", ambiente: "Aula 205", competencia: { nombre: "Bases de datos" } },
  ] }));
  cy.intercept("GET", "/api/educational-sessions/*/attendances*", payload({ sesion: sesiones[0], asistencias }));
  cy.intercept("GET", "/api/educational-sessions*", payload({ sesiones, total: sesiones.length }));
  cy.intercept("POST", "/api/educational-sessions/*/qr", payload({ qr: "https://sima.test/asistencia/301", token: "qr-demo" }));
  cy.intercept("PATCH", "/api/educational-sessions/*", payload({ sesion: sesiones[0] }));
  cy.intercept("POST", "/api/attendances/manual", payload({ asistencia: asistencias[0] }));
  cy.intercept("PATCH", "/api/attendances/*", payload({ asistencia: asistencias[0] }));
  cy.intercept("GET", "/api/alerts*", payload({ alerts: alertas, alertas, total: alertas.length }));
  cy.intercept("POST", "/api/alerts/manual", payload(alertas[0]));
  cy.intercept("GET", "/api/observations/group/*", payload({ observaciones, total: observaciones.length }));
  cy.intercept("GET", "/api/observations/apprentice/*", payload({ observaciones, total: observaciones.length }));
  cy.intercept("GET", "/api/observations*", payload({ observaciones, total: observaciones.length }));
  cy.intercept("POST", "/api/observations", payload({ observacion: observaciones[0] }));
  cy.intercept("PUT", "/api/observations/*", payload({ observacion: observaciones[0] }));
  cy.intercept("GET", "/api/notifications*", payload({ notificaciones: [
    { id: 1, titulo: "Nueva alerta", mensaje: "Alerta asistencial pendiente.", tipo: "ALERTA", leida: false, fecha: "2026-07-09" },
  ] }));
  cy.intercept("GET", "/api/biometrics/fingerprints*", payload({ huellas: [
    { id_huella: 1, id_usuario: 2, dedo: "Indice derecho", estado: "ACTIVA", fecha_enrolamiento: "2026-07-08" },
  ] }));
  cy.intercept("POST", "/api/biometrics/fingerprints/enroll", payload({ id_huella: 2 }));
}

function sesionComo(usuario, rol) {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.localStorage.setItem("access", "cy-token");
    win.localStorage.setItem("token", "cy-token");
    win.localStorage.setItem("rol", rol);
    win.localStorage.setItem("username", nombreCompleto(usuario));
    win.localStorage.setItem("usuario", nombreCompleto(usuario));
    win.localStorage.setItem("user_email", usuario.email);
    win.localStorage.setItem("user_documento", usuario.persona.numero_documento);
    win.localStorage.setItem("user_data", JSON.stringify(usuario));
    if (usuario.id_instructor) win.localStorage.setItem("id_instructor", String(usuario.id_instructor));
  });
}

function visitarConSesion(path, usuario, rol) {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem("access", "cy-token");
      win.localStorage.setItem("token", "cy-token");
      win.localStorage.setItem("rol", rol);
      win.localStorage.setItem("username", nombreCompleto(usuario));
      win.localStorage.setItem("usuario", nombreCompleto(usuario));
      win.localStorage.setItem("user_email", usuario.email);
      win.localStorage.setItem("user_documento", usuario.persona.numero_documento);
      win.localStorage.setItem("user_data", JSON.stringify(usuario));
      if (usuario.id_instructor) win.localStorage.setItem("id_instructor", String(usuario.id_instructor));
    },
  });
}

function screenshot(nombre) {
  cy.wait(500);
  cy.screenshot(nombre, { capture: "viewport", overwrite: true });
}

function clickTexto(texto) {
  cy.contains("button", texto, { matchCase: false }).click({ force: true });
}

describe("Capturas principales SIMA", () => {
  beforeEach(() => {
    instalarIntercepts();
    cy.viewport(1440, 950);
  });

  it("genera capturas obligatorias", () => {
    cy.clearLocalStorage();
    cy.visit("/login");
    cy.contains("Iniciar sesion").should("be.visible");
    screenshot("01 Login");

    cy.get("#login-user").type("1001001001");
    cy.get("#login-password").type("mal");
    clickTexto("Iniciar sesion");
    cy.contains("incorrectos").should("be.visible");
    screenshot("06 Error credenciales");

    clickTexto("Olvidaste tu contraseña?");
    cy.contains("Recuperar contrasena").should("be.visible");
    screenshot("07 Recuperacion contrasena");

    visitarConSesion("/dashboard", usuarios[0], "coordinador");
    cy.contains("Camila Rojas").should("be.visible");
    screenshot("02 Despues de iniciar sesion");
    screenshot("03 Menu principal navegacion");

    cy.get(".profile-section").click();
    cy.contains("Mi perfil").should("be.visible");
    screenshot("05 Cerrar sesion");

    cy.contains("Mi perfil").click();
    cy.contains("Informacion personal").should("be.visible");
    screenshot("04 Perfil usuario");
  });

  it("genera capturas coordinador", () => {
    visitarConSesion("/dashboard", usuarios[0], "coordinador");
    cy.contains("Camila Rojas").should("be.visible");
    screenshot("08 Dashboard coordinador");

    visitarConSesion("/usuarios", usuarios[0], "coordinador");
    cy.contains("Gestion de usuarios").should("be.visible");
    screenshot("09 Lista usuarios");
    cy.get("[data-testid='users-create-button']").click();
    cy.contains("Crear usuario").should("be.visible");
    screenshot("10 Crear usuario");
    visitarConSesion("/usuarios", usuarios[0], "coordinador");
    cy.contains("Gestion de usuarios").should("be.visible");
    cy.get("[data-testid='users-edit-button']").first().click();
    cy.contains("Editar").click();
    screenshot("11 Editar desactivar usuario");

    visitarConSesion("/fichas", usuarios[0], "coordinador");
    cy.contains("Gestion de grupos").should("be.visible");
    screenshot("12 Lista grupos formativos");
    clickTexto("Crear grupo");
    cy.contains("Crear grupo").should("be.visible");
    screenshot("13 Crear grupo formativo");

    visitarConSesion("/fichas/101", usuarios[0], "coordinador");
    cy.contains("Analisis y Desarrollo de Software").should("be.visible");
    screenshot("14 Detalle grupo");
    visitarConSesion("/fichas", usuarios[0], "coordinador");
    clickTexto("Crear grupo");
    cy.contains("Instructor lider").should("be.visible");
    screenshot("15 Asignar instructor lider");

    visitarConSesion("/aprendices", usuarios[0], "coordinador");
    cy.contains("Gestion de aprendices").should("be.visible");
    screenshot("16 Lista aprendices por grupo");
    clickTexto("Registrar aprendiz");
    cy.contains("Registrar aprendiz").should("be.visible");
    screenshot("17 Registrar aprendiz individual");
    visitarConSesion("/aprendices", usuarios[0], "coordinador");
    cy.contains("Gestion de aprendices").should("be.visible");
    clickTexto("Carga masiva");
    cy.contains("Carga de archivo").should("be.visible");
    screenshot("18 Carga masiva aprendices Excel");

    visitarConSesion("/aprendices", usuarios[0], "coordinador");
    cy.contains("Gestion de aprendices").should("be.visible");
    cy.get("[title='Ver detalle']").first().click({ force: true });
    cy.contains("Laura Martinez").should("be.visible");
    screenshot("19 Detalle aprendiz");
    clickTexto("Editar");
    screenshot("20 Editar desactivar aprendiz");
  });

  it("genera capturas instructor", () => {
    visitarConSesion("/instructor/dashboard", usuarios[1], "instructor");
    cy.contains("Bienvenido instructor").should("be.visible");
    screenshot("21 Dashboard instructor");
    screenshot("24 Horario formativo");

    visitarConSesion("/instructor/grupos", usuarios[1], "instructor");
    cy.contains("Mis grupos").should("be.visible");
    screenshot("22 Mis grupos asignados");
    cy.get("[title='Ver detalle']").first().click({ force: true });
    cy.contains("Analisis y Desarrollo de Software").should("be.visible");
    screenshot("23 Detalle grupo instructor");

    visitarConSesion("/instructor/grupos", usuarios[1], "instructor");
    cy.get("[title='Asignar horario']").first().click({ force: true });
    cy.contains("Horario").should("be.visible");
    screenshot("25 Crear horario instructor");

    visitarConSesion("/instructor/asistencia", usuarios[1], "instructor");
    cy.contains("Control de Asistencia").should("be.visible");
    screenshot("26 Registrar asistencia");

    visitarConSesion("/instructor/grupos/101/asistencias", usuarios[1], "instructor");
    cy.contains("Historial de asistencia").should("be.visible");
    screenshot("27 Consultar asistencia");

    visitarConSesion("/instructor/aprendices", usuarios[1], "instructor");
    cy.contains("Gestion de aprendices").should("be.visible");
    screenshot("28 Lista aprendices instructor");

    visitarConSesion("/instructor/observaciones", usuarios[1], "instructor");
    cy.contains("Gestión de observaciones").should("be.visible");
    screenshot("29 Consultar observaciones");
    clickTexto("Registrar observación");
    cy.contains("Registrar observación").should("be.visible");
    screenshot("30 Registrar observacion");

    visitarConSesion("/alertas/consultar", usuarios[1], "instructor");
    cy.contains("Consultar alertas").should("be.visible");
    screenshot("31 Consultar alertas");
    clickTexto("Nueva alerta manual");
    cy.contains("Crear alerta manual").should("be.visible");
    screenshot("32 Crear alerta");
  });

  it("genera capturas superadministrador", () => {
    visitarConSesion("/dashboard", { ...usuarios[0], rol: { id_rol: 1, nombre: "super_admin" } }, "super_admin");
    cy.contains("Bienvenido super administrador").should("be.visible");
    screenshot("33 Panel superadministrador");

    visitarConSesion("/usuarios", { ...usuarios[0], rol: { id_rol: 1, nombre: "super_admin" } }, "super_admin");
    cy.contains("Gestion de usuarios").should("be.visible");
    screenshot("34 Gestion coordinadores roles credenciales");

    visitarConSesion("/biometria/huellas", { ...usuarios[0], rol: { id_rol: 1, nombre: "super_admin" } }, "super_admin");
    cy.contains("Operacion biometrica").should("be.visible");
    screenshot("35 Dispositivos IoT enrolamiento biometrico");

    visitarConSesion("/alertas/consultar", { ...usuarios[0], rol: { id_rol: 1, nombre: "super_admin" } }, "super_admin");
    cy.contains("Consultar alertas").should("be.visible");
    screenshot("36 Trazabilidad auditoria alertas");
  });

  it.skip("captura movil de referencia", () => {
    cy.viewport(390, 844);
    cy.clearLocalStorage();
    cy.visit("/login");
    cy.contains("Iniciar sesion").should("be.visible");
    screenshot("37 Pantalla movil referencia");
  });
});
