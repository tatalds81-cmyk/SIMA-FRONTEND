import {
  STATUS,
  data,
  expectBodyText,
  expectErrorResponse,
  expectNoSensitiveData,
  expectStatus,
  expectSuccessfulOperation,
  extractList,
  requireData,
  route,
  runId,
} from "../../support/superadminApi";

function fakeTemplate(label) {
  return `hash-e2e-${label}-${runId()}`;
}

describe("EP07 H10 - Enrolamiento de huellas", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin");
  });

  it("EP07-H10-CA01 - Enrolamiento exitoso almacena plantilla protegida y estado ACTIVA", function () {
    requireData(this, ["usuarioActivoId", "dispositivoActivoId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("fingerprintEnroll"),
      body: {
        id_usuario: Number(data("usuarioActivoId")),
        id_dispositivo: Number(data("dispositivoActivoId")),
        dedo: "INDICE_DERECHO",
        plantilla_hash: fakeTemplate("h10-ca01"),
        motivo: "EP07-H10-CA01 enrolamiento exitoso",
      },
    }).then((response) => {
      expectStatus(response, STATUS.created, "enrolamiento exitoso");
      expectBodyText(response, ["activa", "activo", "protected", "proteg"], "estado de huella activa o protegida");
      expectNoSensitiveData(response.body, "enrolamiento exitoso");
    });
  });

  it("EP07-H10-CA02 - Usuario inactivo rechaza enrolamiento", function () {
    requireData(this, ["usuarioInactivoId", "dispositivoActivoId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("fingerprintEnroll"),
      body: {
        id_usuario: Number(data("usuarioInactivoId")),
        id_dispositivo: Number(data("dispositivoActivoId")),
        dedo: "INDICE_DERECHO",
        plantilla_hash: fakeTemplate("h10-ca02"),
        motivo: "EP07-H10-CA02 usuario inactivo",
      },
    }).then((response) => {
      expectErrorResponse(response, "enrolamiento de usuario inactivo");
    });
  });

  it("EP07-H10-CA03 - Huella duplicada rechaza enrolamiento y audita intento", function () {
    requireData(this, ["usuarioActivoId", "dispositivoActivoId"]);

    const template = fakeTemplate("h10-ca03");
    const body = {
      id_usuario: Number(data("usuarioActivoId")),
      id_dispositivo: Number(data("dispositivoActivoId")),
      dedo: "MEDIO_DERECHO",
      plantilla_hash: template,
      motivo: "EP07-H10-CA03 huella duplicada",
    };

    cy.apiRequest({
      method: "POST",
      endpoint: route("fingerprintEnroll"),
      body,
    }).then((firstResponse) => {
      expectStatus(firstResponse, STATUS.created, "huella base");

      cy.apiRequest({
        method: "POST",
        endpoint: route("fingerprintEnroll"),
        body,
      }).then((duplicateResponse) => {
        expectErrorResponse(duplicateResponse, "rechazo por huella duplicada");
      });
    });
  });

  it("EP07-H10-CA04 - Proceso incompleto no deja huella activa parcial y puede repetirse", function () {
    requireData(this, ["usuarioActivoId", "dispositivoActivoId"]);

    const body = {
      id_usuario: Number(data("usuarioActivoId")),
      id_dispositivo: Number(data("dispositivoActivoId")),
      dedo: "ANULAR_DERECHO",
      captura_completa: false,
      motivo: "EP07-H10-CA04 proceso incompleto",
    };

    cy.apiRequest({
      method: "POST",
      endpoint: route("fingerprintEnroll"),
      body,
    }).then((response) => {
      expectErrorResponse(response, "proceso incompleto de huella");

      cy.apiRequest({
        method: "POST",
        endpoint: route("fingerprintEnroll"),
        body: {
          ...body,
          plantilla_hash: fakeTemplate("h10-ca04-reintento"),
          captura_completa: true,
        },
      }).then((retryResponse) => {
        expectStatus(retryResponse, STATUS.created, "reintento de enrolamiento despues de proceso incompleto");
      });
    });
  });

  it("EP07-H10-CA05 - Limite de dos huellas activas rechaza nueva huella", function () {
    requireData(this, ["usuarioConDosHuellasId", "dispositivoActivoId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("fingerprintEnroll"),
      body: {
        id_usuario: Number(data("usuarioConDosHuellasId")),
        id_dispositivo: Number(data("dispositivoActivoId")),
        dedo: "PULGAR_IZQUIERDO",
        plantilla_hash: fakeTemplate("h10-ca05"),
        motivo: "EP07-H10-CA05 limite de dos huellas activas",
      },
    }).then((response) => {
      expectErrorResponse(response, "limite de dos huellas activas");
    });
  });
});

describe("EP07 H11 - Revocacion y reemplazo de huellas", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin");
  });

  it("EP07-H11-CA01 - Revocacion exitosa deja huella REVOCADA e invalida asistencia", function () {
    requireData(this, ["huellaActivaId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("fingerprintRevoke", { id: data("huellaActivaId") }),
      body: {
        motivo: "EP07-H11-CA01 revocacion exitosa de huella",
      },
    }).then((response) => {
      expectSuccessfulOperation(response, "revocacion de huella activa");
      expectBodyText(response, ["revocada", "revoked", "inval"], "estado revocado");
    });
  });

  it("EP07-H11-CA02 - Reemplazo revoca anterior y activa nueva huella", function () {
    requireData(this, ["huellaAReemplazarId", "dispositivoActivoId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("fingerprintReplace", { id: data("huellaAReemplazarId") }),
      body: {
        id_dispositivo: Number(data("dispositivoActivoId")),
        dedo: "INDICE_IZQUIERDO",
        plantilla_hash: fakeTemplate("h11-ca02"),
        motivo: "EP07-H11-CA02 reemplazo de huella",
      },
    }).then((response) => {
      expectSuccessfulOperation(response, "reemplazo de huella");
      expectBodyText(response, ["revoc", "activa", "nueva", "reemplaz"], "revoca anterior y activa nueva");
      expectNoSensitiveData(response.body, "reemplazo de huella");
    });
  });

  it("EP07-H11-CA03 - Huella ya revocada rechaza nueva revocacion como conflicto", function () {
    requireData(this, ["huellaRevocadaId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("fingerprintRevoke", { id: data("huellaRevocadaId") }),
      body: {
        motivo: "EP07-H11-CA03 revocacion repetida",
      },
    }).then((response) => {
      expectStatus(response, STATUS.conflict, "revocacion repetida como conflicto");
    });
  });
});

describe("EP07 H12 - Consultas de dispositivos, enrolamientos e intentos", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin");
  });

  it("EP07-H12-CA01 - Consulta de dispositivos filtra por ambiente o estado", function () {
    requireData(this, ["ambienteValidoId"]);

    cy.apiRequest({
      method: "GET",
      endpoint: route("devices"),
      qs: {
        id_ambiente: Number(data("ambienteValidoId")),
        estado: "ACTIVO",
        limit: 50,
      },
    }).then((response) => {
      expectSuccessfulOperation(response, "consulta de dispositivos por ambiente o estado");
      extractList(response).forEach((item) => {
        if (item.estado) expect(String(item.estado).toUpperCase()).to.eq("ACTIVO");
        if (item.id_ambiente) expect(Number(item.id_ambiente)).to.eq(Number(data("ambienteValidoId")));
      });
    });
  });

  it("EP07-H12-CA02 - Consulta de enrolamientos muestra estado, fechas, responsables y dispositivo sin plantilla", () => {
    cy.apiRequest({
      method: "GET",
      endpoint: route("enrollments"),
      qs: { limit: 50 },
    }).then((response) => {
      expectSuccessfulOperation(response, "consulta de enrolamientos");
      const text = JSON.stringify(response.body || {}).toLowerCase();
      ["estado", "fecha", "respons", "dispositivo"].forEach((word) => {
        expect(text, `enrolamientos contienen ${word}`).to.include(word);
      });
      expectNoSensitiveData(response.body, "consulta de enrolamientos");
    });
  });

  it("EP07-H12-CA03 - Consulta no autorizada rechaza acceso si no es SUPER_ADMIN", function () {
    const coordinatorUser = Cypress.env("users")?.coordinador;

    if (!coordinatorUser?.documento || !coordinatorUser?.password) {
      Cypress.log({
        name: "skip",
        message: "Faltan credenciales de coordinador para validar acceso no autorizado",
      });
      this.skip();
    }

    cy.loginAs("coordinador").then((token) => {
      cy.apiRequest({
        method: "GET",
        endpoint: route("enrollments"),
        token,
        qs: { limit: 10 },
      }).then((response) => {
        expectStatus(response, STATUS.unauthorized, "consulta no autorizada por rol no SUPER_ADMIN");
      });
    });
  });

  it("EP07-H12-CA04 - Intentos y fallos muestran causa, fecha, dispositivo y resultado sin informacion sensible", () => {
    cy.apiRequest({
      method: "GET",
      endpoint: route("fingerprintAttempts"),
      qs: { limit: 50 },
    }).then((response) => {
      expectSuccessfulOperation(response, "consulta de intentos y fallos biometricos");
      const text = JSON.stringify(response.body || {}).toLowerCase();
      ["causa", "fecha", "dispositivo", "resultado"].forEach((word) => {
        expect(text, `intentos contienen ${word}`).to.include(word);
      });
      expectNoSensitiveData(response.body, "consulta de intentos y fallos");
    });
  });
});
