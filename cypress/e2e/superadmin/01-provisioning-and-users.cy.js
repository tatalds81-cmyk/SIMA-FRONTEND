import {
  STATUS,
  createUser,
  data,
  expectBodyText,
  expectErrorResponse,
  expectStatus,
  expectSuccessfulOperation,
  extractList,
  getEntityId,
  makeProvisioningPayload,
  makeUserPayload,
  requireData,
  route,
} from "../../support/superadminApi";

describe("EP07 H01 - Aprovisionamiento SUPER_ADMIN", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin");
  });

  it("EP07-H01-CA01 - Aprovisionamiento exitoso crea una unica cuenta SUPER_ADMIN y exige cambio de contrasena", () => {
    const body = makeProvisioningPayload("h01-ca01");

    cy.apiRequest({
      method: "POST",
      endpoint: route("superAdminProvisioning"),
      body,
    }).then((response) => {
      expectStatus(response, STATUS.created, "aprovisionamiento inicial");
      expectBodyText(response, ["super", "admin", "password", "contrasena", "cambio", "change"], "aprovisionamiento exige cambio");
    });
  });

  it("EP07-H01-CA02 - Ejecucion repetida no crea duplicado e informa aprovisionamiento completado", () => {
    const body = makeProvisioningPayload("h01-ca02");

    cy.apiRequest({
      method: "POST",
      endpoint: route("superAdminProvisioning"),
      body,
    }).then((firstResponse) => {
      expectStatus(firstResponse, STATUS.created, "primer aprovisionamiento");

      cy.apiRequest({
        method: "POST",
        endpoint: route("superAdminProvisioning"),
        body,
      }).then((secondResponse) => {
        expectStatus(secondResponse, [200, 201, 202, 409], "aprovisionamiento repetido");
        expectBodyText(secondResponse, ["complet", "existe", "duplic", "aprovision"], "mensaje de aprovisionamiento repetido");
      });

      cy.apiRequest({
        method: "GET",
        endpoint: route("users"),
        qs: { q: body.numero_documento, limit: 100 },
      }).then((listResponse) => {
        expectSuccessfulOperation(listResponse, "consulta de usuario aprovisionado");
        const matches = extractList(listResponse).filter((item) => {
          const document = item.persona?.numero_documento || item.numero_documento;
          return String(document) === String(body.numero_documento);
        });
        expect(matches.length, "no debe crear usuarios duplicados").to.be.at.most(1);
      });
    });
  });

  it("EP07-H01-CA03 - Datos duplicados rechazan la operacion y registran resultado fallido", () => {
    const body = makeProvisioningPayload("h01-ca03");

    cy.apiRequest({
      method: "POST",
      endpoint: route("superAdminProvisioning"),
      body,
    }).then((firstResponse) => {
      expectStatus(firstResponse, STATUS.created, "aprovisionamiento base");

      cy.apiRequest({
        method: "POST",
        endpoint: route("users"),
        body,
      }).then((duplicateResponse) => {
        expectErrorResponse(duplicateResponse, "rechazo por datos duplicados");
      });
    });
  });
});

describe("EP07 H02 - Administracion de SUPER_ADMIN", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin");
  });

  it("EP07-H02-CA01 - Crear otro SUPER_ADMIN con datos validos y no duplicados", () => {
    createUser("super_admin", "h02 ca01").then(({ user }) => {
      const userId = getEntityId(user);
      expect(userId, "id del nuevo SUPER_ADMIN").to.exist;
    });
  });

  it("EP07-H02-CA02 - Proteger el ultimo SUPER_ADMIN activo contra bloqueo o desactivacion", function () {
    requireData(this, ["lastSuperAdminId"]);

    cy.apiRequest({
      method: "PATCH",
      endpoint: route("userStatus", { id: data("lastSuperAdminId") }),
      body: {
        estado: "INACTIVO",
        motivo: "EP07-H02-CA02 intento de proteger ultimo SUPER_ADMIN",
      },
    }).then((response) => {
      expectErrorResponse(response, "proteccion del ultimo SUPER_ADMIN activo");
    });
  });

  it("EP07-H02-CA03 - Prohibir autodesactivacion del SUPER_ADMIN autenticado", function () {
    requireData(this, ["currentSuperAdminId"]);

    cy.apiRequest({
      method: "PATCH",
      endpoint: route("userStatus", { id: data("currentSuperAdminId") }),
      body: {
        estado: "INACTIVO",
        motivo: "EP07-H02-CA03 intento de autodesactivacion",
      },
    }).then((response) => {
      expectErrorResponse(response, "autodesactivacion del SUPER_ADMIN autenticado");
    });
  });

  it("EP07-H02-CA04 - Desactivacion controlada de otro SUPER_ADMIN con motivo valido", () => {
    createUser("super_admin", "h02 ca04").then(({ user }) => {
      const userId = getEntityId(user);

      cy.apiRequest({
        method: "PATCH",
        endpoint: route("userStatus", { id: userId }),
        body: {
          estado: "INACTIVO",
          motivo: "EP07-H02-CA04 desactivacion controlada en QA",
        },
      }).then((response) => {
        expectSuccessfulOperation(response, "desactivacion controlada de otro SUPER_ADMIN");
      });
    });
  });
});

describe("EP07 H03 y H04 - Coordinadores, roles y credenciales", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin");
  });

  it("EP07-H03-CA01 - Creacion y asignacion de coordinador a un area libre", function () {
    const areaId = data("areaLibreIdH03CA01", data("areaLibreId"));

    if (!areaId) this.skip();

    createUser("coordinador", "h03 ca01", {
      id_area: Number(areaId),
    }).then(({ user }) => {
      expect(getEntityId(user), "coordinador creado").to.exist;
    });
  });

  it("EP07-H03-CA02 - Area ocupada rechaza un segundo coordinador activo", function () {
    requireData(this, ["areaOcupadaId"]);

    cy.apiRequest({
      method: "GET",
      endpoint: route("roles"),
      qs: { limit: 100 },
    }).then((rolesResponse) => {
      const role = extractList(rolesResponse).find((item) => {
        const name = String(item.nombre || item.name || "").toLowerCase().replace(/[\s-]+/g, "_");
        return name === "coordinador";
      });
      expect(role, "rol coordinador").to.exist;

      cy.apiRequest({
        method: "POST",
        endpoint: route("users"),
        body: makeUserPayload(role.id_rol || role.id, "h03 ca02 duplicado", {
          id_area: Number(data("areaOcupadaId")),
          motivo: "EP07-H03-CA02 segundo coordinador en area ocupada",
        }),
      }).then((response) => {
        expectErrorResponse(response, "segundo coordinador en area ocupada");
      });
    });
  });

  it("EP07-H03-CA03 - Multiples areas rechaza asignar un coordinador ya asignado a otra area", function () {
    requireData(this, ["coordinadorAsignadoId", "areaOcupadaId"]);

    cy.apiRequest({
      method: "POST",
      endpoint: route("coordinatorAssignment"),
      body: {
        id_usuario: Number(data("coordinadorAsignadoId")),
        id_area: Number(data("areaOcupadaId")),
        motivo: "EP07-H03-CA03 reasignacion no permitida",
      },
    }).then((response) => {
      expectErrorResponse(response, "coordinador ya asignado a otra area");
    });
  });

  it("EP07-H03-CA04 - Coordinador desactivado no puede iniciar sesion y conserva historial", function () {
    const areaId = data("areaLibreIdH03CA04", data("areaLibreId"));

    if (!areaId) this.skip();

    createUser("coordinador", "h03 ca04", {
      id_area: Number(areaId),
    }).then(({ body, user }) => {
      const userId = getEntityId(user);

      cy.apiRequest({
        method: "PATCH",
        endpoint: route("userStatus", { id: userId }),
        body: {
          estado: "INACTIVO",
          motivo: "EP07-H03-CA04 desactivar coordinador de prueba",
        },
      }).then((statusResponse) => {
        expectSuccessfulOperation(statusResponse, "desactivar coordinador");

        cy.apiRequest({
          method: "POST",
          endpoint: route("authLogin"),
          token: null,
          body: {
            numero_documento: body.numero_documento,
            documento: body.numero_documento,
            password: body.numero_documento,
          },
        }).then((loginResponse) => {
          expectStatus(loginResponse, STATUS.rejected, "login de coordinador desactivado");
        });

        cy.apiRequest({
          method: "GET",
          endpoint: route("userAudit", { id: userId }),
        }).then((auditResponse) => {
          expectSuccessfulOperation(auditResponse, "historial del coordinador desactivado");
        });
      });
    });
  });

  it("EP07-H04-CA01 - Cambio de rol sin relaciones incompatibles conserva historial", () => {
    createUser("instructor", "h04 ca01").then(({ body, user }) => {
      const userId = getEntityId(user);

      cy.apiRequest({
        method: "GET",
        endpoint: route("roles"),
        qs: { limit: 100 },
      }).then((rolesResponse) => {
        const role = extractList(rolesResponse).find((item) => {
          const name = String(item.nombre || item.name || "").toLowerCase();
          return name === "coordinador";
        });
        expect(role, "rol coordinador").to.exist;

        cy.apiRequest({
          method: "PUT",
          endpoint: route("userById", { id: userId }),
          body: {
            ...body,
            id_rol: role.id_rol || role.id,
            motivo: "EP07-H04-CA01 cambio de rol permitido",
          },
        }).then((response) => {
          expectSuccessfulOperation(response, "cambio de rol permitido");
        });
      });
    });
  });

  it("EP07-H04-CA02 - Cambio de rol bloqueado muestra dependencias incompatibles", function () {
    requireData(this, ["usuarioConDependenciasId"]);

    cy.apiRequest({
      method: "PUT",
      endpoint: route("userById", { id: data("usuarioConDependenciasId") }),
      body: {
        id_rol: data("rolDestinoIncompatibleId", 1),
        motivo: "EP07-H04-CA02 cambio con dependencias incompatibles",
      },
    }).then((response) => {
      expectErrorResponse(response, "cambio de rol bloqueado por dependencias");
    });
  });

  it("EP07-H04-CA03 - Restablecer credenciales genera temporal y exige cambio siguiente login", () => {
    createUser("instructor", "h04 ca03").then(({ user }) => {
      const userId = getEntityId(user);

      cy.apiRequest({
        method: "POST",
        endpoint: route("userResetPassword", { id: userId }),
        body: {
          motivo: "EP07-H04-CA03 restablecimiento de credenciales",
        },
      }).then((response) => {
        expectSuccessfulOperation(response, "restablecer credenciales");
        expectBodyText(response, ["temporal", "password", "contrasena", "cambio", "change"], "credencial temporal exige cambio");
      });
    });
  });
});
