import {
  STATUS,
  createUser,
  data,
  expectBodyText,
  expectErrorResponse,
  expectNoSensitiveData,
  expectStatus,
  expectSuccessfulOperation,
  extractList,
  getEntityId,
  requireData,
  route,
  runId,
} from "../../support/superadminApi";

describe("EP07 H07 - Auditoria de operaciones privilegiadas", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin");
  });

  it("EP07-H07-CA01 - Operacion exitosa registra responsable, accion, entidad, valores, motivo, fecha y resultado", () => {
    const motivo = `EP07-H07-CA01 auditoria exitosa ${runId()}`;

    createUser("coordinador", "h07 ca01", { motivo }).then(() => {
      cy.apiRequest({
        method: "GET",
        endpoint: route("auditLogs"),
        qs: { q: motivo, limit: 20 },
      }).then((response) => {
        expectSuccessfulOperation(response, "consulta auditoria de operacion exitosa");
        const text = JSON.stringify(response.body || {}).toLowerCase();
        ["respons", "accion", "entidad", "motivo", "fecha", "exitos"].forEach((word) => {
          expect(text, `auditoria contiene ${word}`).to.include(word);
        });
      });
    });
  });

  it("EP07-H07-CA02 - Operacion fallida registra intento, causa y resultado fallido", () => {
    const motivo = `EP07-H07-CA02 auditoria fallida ${runId()}`;

    createUser("coordinador", "h07 ca02", { motivo }).then(({ body }) => {
      cy.apiRequest({
        method: "POST",
        endpoint: route("users"),
        body: {
          ...body,
          motivo,
        },
      }).then((duplicateResponse) => {
        expectErrorResponse(duplicateResponse, "operacion fallida por duplicado");

        cy.apiRequest({
          method: "GET",
          endpoint: route("auditLogs"),
          qs: { q: motivo, limit: 20 },
        }).then((auditResponse) => {
          expectSuccessfulOperation(auditResponse, "consulta auditoria de operacion fallida");
          expectBodyText(auditResponse, ["fall", "error", "causa", "duplic", "intento"], "auditoria de fallo");
        });
      });
    });
  });

  it("EP07-H07-CA03 - Auditoria no muestra secretos ni plantillas biometricas", () => {
    cy.apiRequest({
      method: "GET",
      endpoint: route("auditLogs"),
      qs: { limit: 50 },
    }).then((response) => {
      expectSuccessfulOperation(response, "consulta de auditoria sin secretos");
      expectNoSensitiveData(response.body, "auditoria");
    });
  });
});

describe("EP07 H08 - Dispositivos biometricos", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin");
  });

  it("EP07-H08-CA01 - Registro exitoso asocia dispositivo unico a ambiente valido en estado ACTIVO", function () {
    requireData(this, ["ambienteValidoId"]);

    const serial = `BIO-${runId()}-${Math.floor(Math.random() * 1000)}`;

    cy.apiRequest({
      method: "POST",
      endpoint: route("devices"),
      body: {
        serial,
        codigo_dispositivo: serial,
        id_ambiente: Number(data("ambienteValidoId")),
        estado: "ACTIVO",
        motivo: "EP07-H08-CA01 registro de dispositivo",
      },
    }).then((response) => {
      expectStatus(response, STATUS.created, "registro de dispositivo unico");
    });
  });

  it("EP07-H08-CA02 - Dispositivo duplicado rechaza el registro", function () {
    requireData(this, ["ambienteValidoId"]);

    const serial = `BIO-DUP-${runId()}-${Math.floor(Math.random() * 1000)}`;
    const body = {
      serial,
      codigo_dispositivo: serial,
      id_ambiente: Number(data("ambienteValidoId")),
      estado: "ACTIVO",
      motivo: "EP07-H08-CA02 registro base",
    };

    cy.apiRequest({
      method: "POST",
      endpoint: route("devices"),
      body,
    }).then((firstResponse) => {
      expectStatus(firstResponse, STATUS.created, "dispositivo base");

      cy.apiRequest({
        method: "POST",
        endpoint: route("devices"),
        body: {
          ...body,
          motivo: "EP07-H08-CA02 duplicado",
        },
      }).then((duplicateResponse) => {
        expectErrorResponse(duplicateResponse, "rechazo de dispositivo duplicado");
      });
    });
  });

  it("EP07-H08-CA03 - Dispositivo INACTIVO o MANTENIMIENTO rechaza eventos de enrolamiento o asistencia", function () {
    requireData(this, ["dispositivoMantenimientoId", "usuarioActivoId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("deviceEvents"),
      body: {
        id_dispositivo: Number(data("dispositivoMantenimientoId")),
        id_usuario: Number(data("usuarioActivoId")),
        tipo_evento: "ENROLAMIENTO",
        motivo: "EP07-H08-CA03 evento no permitido por estado de dispositivo",
      },
    }).then((response) => {
      expectErrorResponse(response, "evento con dispositivo inactivo o en mantenimiento");
    });
  });

  it("EP07-H08-CA04 - Reemplazo conserva historial del anterior y activa nuevo dispositivo", function () {
    requireData(this, ["dispositivoActivoId", "ambienteValidoId"]);

    const serial = `BIO-REP-${runId()}-${Math.floor(Math.random() * 1000)}`;

    cy.apiRequest({
      method: "POST",
      endpoint: route("deviceReplace", { id: data("dispositivoActivoId") }),
      body: {
        nuevo_dispositivo: {
          serial,
          codigo_dispositivo: serial,
          id_ambiente: Number(data("ambienteValidoId")),
          estado: "ACTIVO",
        },
        motivo: "EP07-H08-CA04 reemplazo controlado de dispositivo",
      },
    }).then((response) => {
      expectSuccessfulOperation(response, "reemplazo de dispositivo");
      expectBodyText(response, ["historial", "anterior", "activo", "reemplaz"], "historial de reemplazo");
    });
  });
});

describe("EP07 H09 - Incidentes de lector biometrico", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin");
  });

  it("EP07-H09-CA01 - Incidente nuevo por perdida de comunicacion queda disponible para consulta", function () {
    requireData(this, ["dispositivoActivoId"]);

    const referencia = `EP07-H09-CA01-${runId()}`;

    cy.apiRequest({
      method: "POST",
      endpoint: route("incidents"),
      body: {
        id_dispositivo: Number(data("dispositivoActivoId")),
        tipo_incidente: "PERDIDA_COMUNICACION",
        referencia,
        motivo: "EP07-H09-CA01 incidente por perdida de comunicacion",
      },
    }).then((response) => {
      expectStatus(response, STATUS.created, "crear incidente por perdida de comunicacion");

      cy.apiRequest({
        method: "GET",
        endpoint: route("incidents"),
        qs: { q: referencia, limit: 10 },
      }).then((queryResponse) => {
        expectSuccessfulOperation(queryResponse, "consulta de incidente creado");
        expect(extractList(queryResponse).length, "incidente consultable").to.be.greaterThan(0);
      });
    });
  });

  it("EP07-H09-CA02 - Verificacion repetida sin cambio no crea incidentes duplicados", function () {
    requireData(this, ["dispositivoActivoId"]);

    const referencia = `EP07-H09-CA02-${runId()}`;
    const body = {
      id_dispositivo: Number(data("dispositivoActivoId")),
      tipo_incidente: "PERDIDA_COMUNICACION",
      referencia,
      motivo: "EP07-H09-CA02 verificacion repetida",
    };

    cy.apiRequest({
      method: "POST",
      endpoint: route("incidents"),
      body,
    }).then((firstResponse) => {
      expectStatus(firstResponse, STATUS.created, "incidente base");

      cy.apiRequest({
        method: "POST",
        endpoint: route("incidents"),
        body,
      }).then((secondResponse) => {
        expectStatus(secondResponse, [200, 202, 409], "incidente repetido sin duplicar");
      });

      cy.apiRequest({
        method: "GET",
        endpoint: route("incidents"),
        qs: { q: referencia, limit: 20 },
      }).then((queryResponse) => {
        expectSuccessfulOperation(queryResponse, "consulta de incidentes repetidos");
        expect(extractList(queryResponse).length, "no duplica incidentes activos").to.be.at.most(1);
      });
    });
  });

  it("EP07-H09-CA03 - Recuperacion registra cierre o recuperacion del incidente activo", function () {
    requireData(this, ["dispositivoActivoId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("incidents"),
      body: {
        id_dispositivo: Number(data("dispositivoActivoId")),
        tipo_incidente: "PERDIDA_COMUNICACION",
        referencia: `EP07-H09-CA03-${runId()}`,
        motivo: "EP07-H09-CA03 incidente previo a recuperacion",
      },
    }).then((incidentResponse) => {
      expectStatus(incidentResponse, STATUS.created, "incidente activo para recuperar");
      const incidentId = getEntityId(incidentResponse.body?.data || incidentResponse.body, ["id_incidente", "id"]);

      cy.apiRequest({
        method: "PATCH",
        endpoint: route("incidentRecovery", { id: incidentId }),
        body: {
          motivo: "EP07-H09-CA03 recuperacion de comunicacion",
        },
      }).then((recoveryResponse) => {
        expectSuccessfulOperation(recoveryResponse, "recuperacion del incidente activo");
        expectBodyText(recoveryResponse, ["cerr", "recuper", "resuelt"], "estado de recuperacion");
      });
    });
  });

  it("EP07-H09-CA04 - Alternativa de asistencia por QR o manual sigue disponible si lector falla", function () {
    requireData(this, ["aprendizActivoId", "grupoActivoId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("manualAttendance"),
      body: {
        id_aprendiz: Number(data("aprendizActivoId")),
        id_grupo: Number(data("grupoActivoId")),
        estado: "PRESENTE",
        motivo: "EP07-H09-CA04 asistencia manual por falla de lector",
      },
    }).then((response) => {
      expectSuccessfulOperation(response, "alternativa de asistencia manual o QR");
    });
  });
});
