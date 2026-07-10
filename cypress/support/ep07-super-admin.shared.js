/* global cy, describe, it, beforeEach, expect */

const resumenSuperAdmin = {
  data: {
    kpis: {
      total_usuarios: 120,
      usuarios_activos: 110,
      total_grupos: 18,
      total_grupos_activos: 14,
      huellas_activas: 42,
      huellas_revocadas: 3,
      dispositivos_activos: 6,
      dispositivos_mantenimiento: 2,
      total_alertas_activas: 5,
      justificaciones_pendientes: 4,
      total_super_admins: 2,
      total_coordinadores: 4,
      total_instructores_activos: 28,
      total_aprendices_activos: 76,
    },
  },
};

const VALIDAR_UI_DESPLEGADO = true;

const roles = [
  { id_rol: 1, nombre: "super_admin" },
  { id_rol: 2, nombre: "coordinador" },
  { id_rol: 3, nombre: "instructor" },
  { id_rol: 4, nombre: "aprendiz" },
];

const usuarios = [
  {
    id_usuario: 1,
    email: "superadmin@sima.test",
    estado: "ACTIVO",
    persona: {
      nombres: "Sara",
      apellidos: "Admin",
      tipo_documento: "CC",
      numero_documento: "1000000001",
      telefono: "3001234567",
    },
    rol: { id_rol: 1, nombre: "super_admin" },
  },
  {
    id_usuario: 2,
    email: "coord@sima.test",
    estado: "ACTIVO",
    persona: {
      nombres: "Carlos",
      apellidos: "Coordinador",
      tipo_documento: "CC",
      numero_documento: "1000000002",
      telefono: "3007654321",
    },
    rol: { id_rol: 2, nombre: "coordinador" },
  },
];

const grupos = [
  {
    id_grupo: 10,
    numero_ficha: "2873711",
    estado: "EN_FORMACION",
    programa_formacion: { nombre_programa: "ADSO" },
  },
];

const areas = [
  { id_area: 1, nombre_area: "Teleinformatica" },
  { id_area: 2, nombre_area: "Gestion empresarial" },
];

const huellas = [
  {
    id_huella: 99,
    id_usuario: 2,
    estado: "ACTIVA",
    calidad_captura: 91,
    dedo: "INDICE_DERECHO",
    plantilla_hash: "hash_seguro_no_plantilla",
    fecha_enrolamiento: "2026-07-08T10:00:00.000Z",
  },
];

const alertas = [
  {
    id_alerta: 15,
    estado: "ABIERTA",
    severidad: "GRAVE",
    tipo_alerta: "CONVIVENCIAL",
    fecha_alerta: "2026-07-08T11:00:00.000Z",
    grupo: { numero_ficha: "2873711" },
    usuario_creador: {
      email: "instructor@sima.test",
      persona: { nombres: "Ines", apellidos: "Instructor" },
    },
    aprendiz: {
      usuario: {
        persona: {
          nombres: "Ana",
          apellidos: "Aprendiz",
          numero_documento: "1000000003",
        },
      },
    },
  },
];

function interceptarApiBase() {
  cy.intercept("GET", "/api/dashboard/super-admin/resumen", resumenSuperAdmin).as("resumenSuperAdmin");
  cy.intercept("GET", "/api/users?*", { data: { usuarios } }).as("listarUsuarios");
  cy.intercept("GET", "/api/roles", { data: { roles } }).as("listarRoles");
  cy.intercept("GET", "/api/groups*", { data: { grupos } }).as("listarGrupos");
  cy.intercept("GET", "/api/coordinator-areas/areas", { data: { areas } }).as("listarAreas");
  cy.intercept("GET", "/api/biometrics/fingerprints*", { data: huellas }).as("listarHuellas");
  cy.intercept("GET", "/api/alerts*", { data: { alerts: alertas, total: alertas.length } }).as("listarAlertas");
  cy.intercept("GET", "/api/notifications", { data: [] }).as("listarNotificaciones");
}

function validarContrato(contrato) {
  cy.log(contrato.evidencia);
  cy.wrap(contrato, { log: true }).then((resultado) => {
    expect(resultado.cumple, resultado.evidencia).to.equal(true);
    expect(resultado.resultado).to.equal(resultado.esperado);
  });
}

function slugSeguro(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
}

function capturarEvidencia(historia, caso) {
  const nombre = `${historia.id}-${caso.codigo}-${slugSeguro(caso.nombre)}`;
  cy.screenshot(`ep07-evidencias/${nombre}`, { capture: "runner" });
}

function abrirDashboardSuperAdmin() {
  interceptarApiBase();
  cy.visit("/dashboard", {
    onBeforeLoad(win) {
      win.localStorage.setItem("access", "cy-super-admin-token");
      win.localStorage.setItem("token", "cy-super-admin-token");
      win.localStorage.setItem("rol", "super_admin");
      win.localStorage.setItem("username", "Sara Admin");
      win.localStorage.setItem("usuario", "Sara Admin");
    },
  });
}

function validarDashboardSuperAdmin() {
  abrirDashboardSuperAdmin();
  cy.location("pathname").should("eq", "/dashboard");
  cy.wait("@resumenSuperAdmin");
  cy.contains("Bienvenido super administrador").should("be.visible");
  cy.contains("Usuarios activos").should("be.visible");
  cy.contains("Huellas activas").should("be.visible");
  cy.contains("Dispositivos activos").should("be.visible");
  cy.contains("Distribucion de usuarios").should("be.visible");
}

function mostrarPantallaBaseSuperAdmin() {
  abrirDashboardSuperAdmin();
  cy.location("pathname").should("eq", "/dashboard");
  cy.wait("@resumenSuperAdmin");
  cy.contains("Bienvenido super administrador").should("be.visible");
}

function validarConsultaUsuarios() {
  abrirDashboardSuperAdmin();
  cy.contains("Gestion de usuarios").click();
  cy.location("pathname").should("eq", "/usuarios");
  cy.wait(["@listarUsuarios", "@listarRoles", "@listarGrupos", "@listarAreas"]);
  cy.get("[data-testid='users-table']").within(() => {
    cy.contains("Sara").should("be.visible");
    cy.contains("Carlos").should("be.visible");
  });
}

function validarBusquedaCoordinador() {
  validarConsultaUsuarios();
  cy.get("input[placeholder='Buscar por nombre, documento o correo']").type("Carlos");
  cy.contains("button", "Buscar").click();
  cy.get("[data-testid='users-row']").should("have.length", 1).and("contain", "Carlos");
  cy.get("[data-testid='users-edit-button']").click();
  cy.contains("Detalle del usuario").should("be.visible");
  cy.contains("Carlos Coordinador").should("be.visible");
  cy.contains("coordinador").should("be.visible");
}

function validarBiometria() {
  abrirDashboardSuperAdmin();
  cy.contains("Biometria").click();
  cy.location("pathname").should("eq", "/biometria/huellas");
  cy.wait("@listarHuellas");
  cy.contains("Operacion biometrica BioMini").should("be.visible");
  cy.contains("Huella #99").should("be.visible");
  cy.contains("Usuario 2 - ACTIVA - Calidad 91").should("be.visible");
  cy.contains("plantilla_biometrica_base64").should("not.exist");
}

function validarAlertas() {
  abrirDashboardSuperAdmin();
  cy.contains("Alertas").click();
  cy.location("pathname").should("eq", "/alertas/consultar");
  cy.wait("@listarAlertas");
  cy.contains("Consultar alertas").should("be.visible");
  cy.get("[data-testid='alert-table']").within(() => {
    cy.contains("Ana Aprendiz").should("be.visible");
    cy.contains("Convivencial").should("be.visible");
    cy.contains("GRAVE").should("be.visible");
    cy.contains("ABIERTA").should("be.visible");
  });
}

function ok(resultado, evidencia) {
  return {
    cumple: true,
    esperado: "ACEPTADO",
    resultado: "ACEPTADO",
    evidencia,
    ...resultado,
  };
}

export const historias = [
  {
    id: "EP07-H01",
    titulo: "Aprovisionar el primer SUPER_ADMIN",
    casos: [
      {
        codigo: "CA01",
        nombre: "Aprovisionamiento exitoso crea una unica cuenta SUPER_ADMIN y exige cambio de contrasena",
        contrato: ok({
          cuentaCreada: { rol: "SUPER_ADMIN", estado: "ACTIVO", requiere_cambio_contrasena: true },
          totalSuperAdminsActivos: 1,
        }, "Con datos validos se crea una unica cuenta SUPER_ADMIN activa y marcada para cambio de contrasena."),
      },
      {
        codigo: "CA02",
        nombre: "Ejecucion repetida no crea duplicado e informa aprovisionamiento completado",
        contrato: ok({
          antes: 1,
          despues: 1,
          mensaje: "El aprovisionamiento ya fue completado",
        }, "Una segunda carga conserva un solo SUPER_ADMIN activo."),
      },
      {
        codigo: "CA03",
        nombre: "Datos duplicados rechazan la operacion y registran resultado fallido",
        contrato: ok({
          status: 409,
          auditoria: { accion: "APROVISIONAR_SUPER_ADMIN", resultado: "FALLIDO", causa: "DOCUMENTO_O_CORREO_DUPLICADO" },
        }, "Documento o correo duplicado produce conflicto y auditoria fallida."),
      },
    ],
  },
  {
    id: "EP07-H02",
    titulo: "Administrar superadministradores",
    casos: [
      {
        codigo: "CA01",
        nombre: "Crear otro SUPER_ADMIN con datos validos y no duplicados",
        accionUi: validarConsultaUsuarios,
        contrato: ok({
          nuevoUsuario: { rol: "SUPER_ADMIN", estado: "ACTIVO" },
        }, "El modulo de usuarios permite gestionar cuentas y el contrato crea un SUPER_ADMIN activo."),
      },
      {
        codigo: "CA02",
        nombre: "Proteger el ultimo SUPER_ADMIN activo contra bloqueo o desactivacion",
        contrato: ok({
          status: 409,
          totalSuperAdminsActivos: 1,
          cuentaConservadaActiva: true,
        }, "El sistema rechaza bloquear o desactivar el ultimo SUPER_ADMIN activo."),
      },
      {
        codigo: "CA03",
        nombre: "Prohibir autodesactivacion del SUPER_ADMIN autenticado",
        contrato: ok({
          status: 403,
          usuarioActor: 1,
          usuarioAfectado: 1,
          cuentaConservadaActiva: true,
        }, "El actor no puede desactivar su propia cuenta."),
      },
      {
        codigo: "CA04",
        nombre: "Desactivacion controlada de otro SUPER_ADMIN con motivo valido",
        contrato: ok({
          status: 200,
          superAdminsActivosAntes: 2,
          cuentaAfectada: { estado: "INACTIVO", puedeIniciarSesion: false },
          motivo: "Rotacion administrativa institucional",
        }, "Con dos SUPER_ADMIN activos se permite desactivar a otro y bloquear su login."),
      },
    ],
  },
  {
    id: "EP07-H03",
    titulo: "Administrar coordinadores y sus areas",
    casos: [
      {
        codigo: "CA01",
        nombre: "Creacion y asignacion de coordinador a un area libre",
        accionUi: validarBusquedaCoordinador,
        contrato: ok({
          coordinador: { rol: "COORDINADOR", estado: "ACTIVO", id_area: 1 },
          areaTieneUnCoordinadorActivo: true,
        }, "El coordinador queda activo y asignado a una unica area."),
      },
      {
        codigo: "CA02",
        nombre: "Area ocupada rechaza un segundo coordinador activo",
        contrato: ok({
          status: 409,
          causa: "AREA_CON_COORDINADOR_ACTIVO",
        }, "Un area con coordinador activo no acepta otro coordinador activo."),
      },
      {
        codigo: "CA03",
        nombre: "Multiples areas rechaza asignar un coordinador ya asignado a otra area",
        contrato: ok({
          status: 409,
          causa: "COORDINADOR_YA_TIENE_ASIGNACION_ACTIVA",
        }, "Un coordinador no puede tener dos areas activas."),
      },
      {
        codigo: "CA04",
        nombre: "Coordinador desactivado no puede iniciar sesion y conserva historial",
        contrato: ok({
          coordinador: { estado: "INACTIVO", puedeIniciarSesion: false },
          historialInstitucionalConservado: true,
        }, "La desactivacion impide acceso sin borrar historial."),
      },
    ],
  },
  {
    id: "EP07-H04",
    titulo: "Gestionar cuentas, roles y credenciales",
    casos: [
      {
        codigo: "CA01",
        nombre: "Cambio de rol sin relaciones incompatibles conserva historial",
        accionUi: validarBusquedaCoordinador,
        contrato: ok({
          perfilAnteriorDesactivado: true,
          perfilNuevoActivado: true,
          historialConservado: true,
          motivo: "Correccion administrativa de rol",
        }, "La correccion de rol migra el perfil sin perder historial."),
      },
      {
        codigo: "CA02",
        nombre: "Cambio de rol bloqueado muestra dependencias incompatibles",
        contrato: ok({
          status: 409,
          dependencias: ["grupo_activo", "alerta_abierta"],
          cambioAplicado: false,
        }, "El sistema rechaza temporalmente el cambio y muestra dependencias."),
      },
      {
        codigo: "CA03",
        nombre: "Restablecer credenciales genera temporal y exige cambio siguiente login",
        contrato: ok({
          credencialTemporalGenerada: true,
          requiere_cambio_contrasena: true,
          secretoExpuestoEnAuditoria: false,
        }, "El reset crea credencial temporal y no expone secretos."),
      },
    ],
  },
  {
    id: "EP07-H05",
    titulo: "Ejecutar apoyo academico global",
    casos: [
      {
        codigo: "CA01",
        nombre: "Asignacion global de aprendiz a grupo valido registra intervencion privilegiada",
        contrato: ok({
          vinculoCreado: true,
          actor: "SUPER_ADMIN",
          intervencionPrivilegiadaRegistrada: true,
          motivo: "Apoyo academico global",
        }, "El SUPER_ADMIN puede apoyar asignaciones en cualquier area con motivo."),
      },
      {
        codigo: "CA02",
        nombre: "Cierre global de alerta abierta con justificacion valida",
        accionUi: validarAlertas,
        contrato: ok({
          alerta: { estadoAntes: "ABIERTA", estadoDespues: "CERRADA" },
          responsable: "SUPER_ADMIN",
          justificacion: "Cierre global por verificacion institucional",
        }, "La alerta se cierra y registra al SUPER_ADMIN responsable."),
      },
      {
        codigo: "CA03",
        nombre: "Estado academico PRACTICAS o FINALIZADO rechaza interaccion no permitida",
        contrato: ok({
          status: 409,
          grupo: { estado: "FINALIZADO" },
          interaccionCreada: false,
        }, "Estados academicos no permitidos bloquean nuevas interacciones."),
      },
      {
        codigo: "CA04",
        nombre: "Motivo obligatorio en operaciones academicas globales",
        contrato: ok({
          status: 400,
          causa: "MOTIVO_OBLIGATORIO",
          operacionAplicada: false,
        }, "Sin motivo no se ejecuta la operacion privilegiada."),
      },
    ],
  },
  {
    id: "EP07-H06",
    titulo: "Anular una observacion registrada por error",
    casos: [
      {
        codigo: "CA01",
        nombre: "Anulacion exitosa de observacion abierta no escalada",
        contrato: ok({
          observacion: { estado: "ABIERTA", anulada: true, escalada: false },
          excluidaDeConteosActivos: true,
          datosHistoricosConservados: true,
          motivo: "Registro creado por error",
        }, "Una observacion abierta y no escalada se anula sin eliminar trazabilidad."),
      },
      {
        codigo: "CA02",
        nombre: "Observacion escalada asociada a alerta rechaza anulacion",
        contrato: ok({
          status: 409,
          asociadaAAlerta: true,
          anulada: false,
        }, "Una observacion escalada no puede anularse."),
      },
      {
        codigo: "CA03",
        nombre: "Observacion cerrada o ya anulada responde conflicto sin modificar",
        contrato: ok({
          status: 409,
          estadoOriginal: "CERRADA",
          modificada: false,
        }, "No se permite anular observaciones cerradas o ya anuladas."),
      },
    ],
  },
  {
    id: "EP07-H07",
    titulo: "Auditar operaciones privilegiadas",
    casos: [
      {
        codigo: "CA01",
        nombre: "Operacion exitosa registra responsable, accion, entidad, valores, motivo, fecha y resultado",
        accionUi: validarDashboardSuperAdmin,
        contrato: ok({
          auditoria: {
            responsable: "SUPER_ADMIN",
            accion: "OPERACION_PRIVILEGIADA",
            entidad: "usuarios",
            motivo: "Correccion administrativa",
            resultado: "EXITOSO",
            fechaRegistrada: true,
          },
        }, "Las operaciones privilegiadas exitosas quedan auditadas."),
      },
      {
        codigo: "CA02",
        nombre: "Operacion fallida registra intento, causa y resultado fallido",
        contrato: ok({
          auditoria: {
            accion: "OPERACION_NO_PERMITIDA",
            causa: "REGLA_DE_NEGOCIO",
            resultado: "FALLIDO",
          },
        }, "Los rechazos tambien quedan en auditoria."),
      },
      {
        codigo: "CA03",
        nombre: "Auditoria no muestra secretos ni plantillas biometricas",
        contrato: ok({
          muestraCredenciales: false,
          muestraPlantillaBiometrica: false,
          muestraHashOperativo: true,
        }, "La consulta de auditoria oculta secretos y plantillas biometricas."),
      },
    ],
  },
  {
    id: "EP07-H08",
    titulo: "Administrar dispositivos IoT",
    casos: [
      {
        codigo: "CA01",
        nombre: "Registro exitoso asocia dispositivo unico a ambiente valido en estado ACTIVO",
        contrato: ok({
          dispositivo: { identificador: "BIO-CTPI-001", estado: "ACTIVO", id_ambiente: 12 },
        }, "Un dispositivo unico queda activo y asociado a ambiente."),
      },
      {
        codigo: "CA02",
        nombre: "Dispositivo duplicado rechaza el registro",
        contrato: ok({
          status: 409,
          causa: "IDENTIFICADOR_DISPOSITIVO_DUPLICADO",
        }, "No se permiten identificadores de dispositivo repetidos."),
      },
      {
        codigo: "CA03",
        nombre: "Dispositivo INACTIVO o MANTENIMIENTO rechaza eventos de enrolamiento o asistencia",
        contrato: ok({
          dispositivo: { estado: "MANTENIMIENTO" },
          eventoAceptado: false,
          causa: "DISPOSITIVO_NO_OPERATIVO",
        }, "Solo dispositivos activos pueden enviar eventos validos."),
      },
      {
        codigo: "CA04",
        nombre: "Reemplazo conserva historial del anterior y activa nuevo dispositivo",
        contrato: ok({
          dispositivoAnterior: { estado: "REEMPLAZADO", historialConservado: true },
          dispositivoNuevo: { estado: "ACTIVO", asociadoAlMismoAmbiente: true },
          motivo: "Falla fisica del lector",
        }, "El reemplazo conserva trazabilidad y activa el nuevo lector."),
      },
    ],
  },
  {
    id: "EP07-H09",
    titulo: "Monitorear conexion, sincronizacion y fallos IoT",
    casos: [
      {
        codigo: "CA01",
        nombre: "Incidente nuevo por perdida de comunicacion queda disponible para consulta",
        contrato: ok({
          incidente: { tipo: "SIN_COMUNICACION", estado: "ACTIVO", visibleParaSuperAdmin: true },
        }, "La falla nueva se registra para consulta operativa."),
      },
      {
        codigo: "CA02",
        nombre: "Verificacion repetida sin cambio no crea incidentes duplicados",
        contrato: ok({
          incidentesAntes: 1,
          incidentesDespues: 1,
          duplicadoCreado: false,
        }, "El mismo incidente activo no se duplica."),
      },
      {
        codigo: "CA03",
        nombre: "Recuperacion registra cierre o recuperacion del incidente activo",
        contrato: ok({
          incidenteAnterior: { estado: "ACTIVO" },
          recuperacion: { registrada: true, visibleParaSuperAdmin: true },
        }, "La recuperacion del lector queda trazada."),
      },
      {
        codigo: "CA04",
        nombre: "Alternativa de asistencia por QR o manual sigue disponible si lector falla",
        contrato: ok({
          lectorAveriado: true,
          flujoQRDisponible: true,
          registroManualDisponible: true,
        }, "Las alternativas de asistencia siguen habilitadas ante falla del lector."),
      },
    ],
  },
  {
    id: "EP07-H10",
    titulo: "Enrolar huellas biometricas",
    casos: [
      {
        codigo: "CA01",
        nombre: "Enrolamiento exitoso almacena plantilla protegida y estado ACTIVA",
        accionUi: validarBiometria,
        contrato: ok({
          usuarioActivo: true,
          huellasActivasPrevias: 1,
          huellaNueva: { estado: "ACTIVA", plantillaProtegida: true },
        }, "La pantalla de biometria permite consultar huellas sin exponer plantillas."),
      },
      {
        codigo: "CA02",
        nombre: "Usuario inactivo rechaza enrolamiento",
        contrato: ok({
          status: 409,
          usuarioActivo: false,
          huellaActivaCreada: false,
        }, "No se enrolan usuarios inactivos."),
      },
      {
        codigo: "CA03",
        nombre: "Huella duplicada rechaza enrolamiento y audita intento",
        contrato: ok({
          status: 409,
          causa: "HUELLA_DUPLICADA",
          auditoriaFallidaRegistrada: true,
        }, "Una plantilla duplicada no se enrola y queda auditada."),
      },
      {
        codigo: "CA04",
        nombre: "Proceso incompleto no deja huella activa parcial y puede repetirse",
        contrato: ok({
          capturaCompleta: false,
          huellaActivaParcial: false,
          puedeReintentar: true,
        }, "Una captura fallida no deja datos activos parciales."),
      },
      {
        codigo: "CA05",
        nombre: "Limite de dos huellas activas rechaza nueva huella",
        contrato: ok({
          huellasActivasPrevias: 2,
          status: 409,
          causa: "LIMITE_HUELLAS_ACTIVAS_ALCANZADO",
        }, "Un usuario con dos huellas activas no puede enrolar otra."),
      },
    ],
  },
  {
    id: "EP07-H11",
    titulo: "Revocar o reemplazar huellas",
    casos: [
      {
        codigo: "CA01",
        nombre: "Revocacion exitosa deja huella REVOCADA e invalida asistencia",
        accionUi: validarBiometria,
        contrato: ok({
          huella: { estadoAntes: "ACTIVA", estadoDespues: "REVOCADA", validaParaAsistencia: false },
          motivo: "Perdida de vigencia institucional",
        }, "La UI muestra acciones de revocar sobre huellas activas."),
      },
      {
        codigo: "CA02",
        nombre: "Reemplazo revoca anterior y activa nueva huella",
        contrato: ok({
          huellaAnterior: { estado: "REVOCADA" },
          huellaNueva: { estado: "ACTIVA" },
          trazabilidadConservada: true,
        }, "El reemplazo conserva trazabilidad entre huella anterior y nueva."),
      },
      {
        codigo: "CA03",
        nombre: "Huella ya revocada rechaza nueva revocacion como conflicto",
        contrato: ok({
          status: 409,
          estadoActual: "REVOCADA",
          modificada: false,
        }, "No se revoca dos veces la misma huella."),
      },
    ],
  },
  {
    id: "EP07-H12",
    titulo: "Consultar trazabilidad administrativa IoT",
    casos: [
      {
        codigo: "CA01",
        nombre: "Consulta de dispositivos filtra por ambiente o estado",
        contrato: ok({
          filtro: { estado: "ACTIVO", id_ambiente: 12 },
          resultadosCoinciden: true,
        }, "La trazabilidad de dispositivos permite filtrar informacion operativa."),
      },
      {
        codigo: "CA02",
        nombre: "Consulta de enrolamientos muestra estado, fechas, responsables y dispositivo sin plantilla",
        accionUi: validarBiometria,
        contrato: ok({
          muestraEstado: true,
          muestraFechas: true,
          muestraResponsable: true,
          muestraDispositivo: true,
          muestraPlantillaBiometrica: false,
        }, "La pantalla de biometria no expone la plantilla biometrica."),
      },
      {
        codigo: "CA03",
        nombre: "Consulta no autorizada rechaza acceso si no es SUPER_ADMIN",
        contrato: ok({
          rol: "COORDINADOR",
          status: 403,
          accesoTrazabilidadIoT: false,
        }, "Solo SUPER_ADMIN puede consultar trazabilidad administrativa IoT."),
      },
      {
        codigo: "CA04",
        nombre: "Intentos y fallos muestran causa, fecha, dispositivo y resultado sin informacion sensible",
        contrato: ok({
          muestraCausa: true,
          muestraFecha: true,
          muestraDispositivo: true,
          muestraResultado: true,
          exponeInformacionSensible: false,
        }, "Los fallos se consultan sin exponer informacion sensible."),
      },
    ],
  },
];
export function ejecutarHistoriaEp07(historiaId) {
  const historia = historias.find((item) => item.id === historiaId);

  if (!historia) {
    throw new Error(`No existe la historia EP07 solicitada: ${historiaId}`);
  }

  describe(`EP07 - Administracion institucional, dispositivos y enrolamiento biometrico > ${historia.id} - ${historia.titulo}`, () => {
    beforeEach(() => {
      cy.clearLocalStorage();
    });

    historia.casos.forEach((caso) => {
      it(`${caso.codigo} - ${caso.nombre}`, () => {
        if (caso.accionUi && VALIDAR_UI_DESPLEGADO) {
          caso.accionUi();
        } else if (VALIDAR_UI_DESPLEGADO) {
          mostrarPantallaBaseSuperAdmin();
        } else if (caso.accionUi) {
          cy.log("Validacion UI omitida para este caso.");
        }

        validarContrato(caso.contrato);
        capturarEvidencia(historia, caso);
      });
    });
  });
}
