import {
  STATUS,
  data,
  expectErrorResponse,
  expectStatus,
  expectSuccessfulOperation,
  requireData,
  route,
} from "../../support/superadminApi";

describe("EP07 H05 - Operaciones academicas globales", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin");
  });

  it("EP07-H05-CA01 - Asignacion global de aprendiz a grupo valido registra intervencion privilegiada", function () {
    requireData(this, ["aprendizActivoId", "grupoDestinoId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("globalApprenticeAssignment"),
      body: {
        id_aprendiz: Number(data("aprendizActivoId")),
        id_grupo: Number(data("grupoDestinoId")),
        motivo: "EP07-H05-CA01 asignacion global de prueba",
      },
    }).then((response) => {
      expectSuccessfulOperation(response, "asignacion global de aprendiz");
    });
  });

  it("EP07-H05-CA02 - Cierre global de alerta abierta con justificacion valida", function () {
    requireData(this, ["alertaAbiertaId"]);

    cy.apiRequest({
      method: "PATCH",
      endpoint: route("alertStatus", { id: data("alertaAbiertaId") }),
      body: {
        estado: "CERRADA",
        justificacion_cierre: "EP07-H05-CA02 cierre global con justificacion valida",
        motivo: "EP07-H05-CA02 cierre por super admin",
      },
    }).then((response) => {
      expectSuccessfulOperation(response, "cierre global de alerta abierta");
    });
  });

  it("EP07-H05-CA03 - Estado academico PRACTICAS o FINALIZADO rechaza interaccion no permitida", function () {
    requireData(this, ["aprendizPracticasId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("academicOperation"),
      body: {
        tipo_operacion: "INTERVENCION_GLOBAL",
        id_aprendiz: Number(data("aprendizPracticasId")),
        motivo: "EP07-H05-CA03 operacion no permitida por estado academico",
      },
    }).then((response) => {
      expectErrorResponse(response, "rechazo por estado academico no permitido");
    });
  });

  it("EP07-H05-CA04 - Motivo obligatorio en operaciones academicas globales", function () {
    requireData(this, ["aprendizActivoId", "grupoActivoId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("academicOperation"),
      body: {
        tipo_operacion: "INTERVENCION_GLOBAL",
        id_aprendiz: Number(data("aprendizActivoId")),
        id_grupo: Number(data("grupoActivoId")),
      },
    }).then((response) => {
      expectStatus(response, STATUS.conflict, "motivo obligatorio");
    });
  });
});

describe("EP07 H06 - Anulacion de observaciones", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin");
  });

  it("EP07-H06-CA01 - Anulacion exitosa de observacion abierta no escalada", function () {
    requireData(this, ["observacionAbiertaId"]);

    cy.apiRequest({
      method: "PATCH",
      endpoint: route("observationAnnul", { id: data("observacionAbiertaId") }),
      body: {
        motivo: "EP07-H06-CA01 anulacion de observacion abierta en QA",
      },
    }).then((response) => {
      expectSuccessfulOperation(response, "anulacion de observacion abierta");
    });
  });

  it("EP07-H06-CA02 - Observacion escalada asociada a alerta rechaza anulacion", function () {
    requireData(this, ["observacionEscaladaId"]);

    cy.apiRequest({
      method: "PATCH",
      endpoint: route("observationAnnul", { id: data("observacionEscaladaId") }),
      body: {
        motivo: "EP07-H06-CA02 anulacion no permitida por alerta asociada",
      },
    }).then((response) => {
      expectErrorResponse(response, "observacion escalada no anulable");
    });
  });

  it("EP07-H06-CA03 - Observacion cerrada o ya anulada responde conflicto sin modificar", function () {
    requireData(this, ["observacionCerradaId"]);

    cy.apiRequest({
      method: "PATCH",
      endpoint: route("observationAnnul", { id: data("observacionCerradaId") }),
      body: {
        motivo: "EP07-H06-CA03 anulacion repetida o cerrada",
      },
    }).then((response) => {
      expectErrorResponse(response, "observacion cerrada o ya anulada");
    });
  });
});
