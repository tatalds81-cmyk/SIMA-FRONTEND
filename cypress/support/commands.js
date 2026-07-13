import { apiUrl, route, STATUS, expectStatus } from "./superadminApi";

function credentials(role) {
  const users = Cypress.env("users") || {};
  const user = users[role] || {};

  return {
    documento: user.documento || Cypress.env(`${role}Documento`),
    password: user.password || Cypress.env(`${role}Password`),
  };
}

function tokenFrom(response) {
  return (
    response.body?.data?.access ||
    response.body?.data?.token ||
    response.body?.data?.access_token ||
    response.body?.data?.user?.token ||
    response.body?.access ||
    response.body?.token
  );
}

Cypress.Commands.add("loginAs", (role = "superAdmin") => {
  const envToken = Cypress.env(`${role}Token`);
  if (envToken) return cy.wrap(envToken, { log: false });

  const user = credentials(role);

  if (!user.documento || !user.password) {
    throw new Error(`Faltan credenciales para ${role} en cypress.env.json.`);
  }

  return cy.request({
    method: "POST",
    url: apiUrl(route("authLogin")),
    failOnStatusCode: false,
    body: {
      numero_documento: user.documento,
      documento: user.documento,
      password: user.password,
    },
  }).then((response) => {
    expectStatus(response, STATUS.created, `login ${role}`);

    const token = tokenFrom(response);
    expect(token, `token ${role}`).to.be.a("string").and.not.be.empty;

    Cypress.env(`${role}Token`, token);
    return token;
  });
});

Cypress.Commands.add("apiRequest", ({ method = "GET", endpoint, body, qs, headers = {}, token, failOnStatusCode = false }) => {
  const accessToken = token === null ? null : token || Cypress.env("superAdminToken");
  const authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  return cy.request({
    method,
    url: apiUrl(endpoint),
    failOnStatusCode,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
    qs,
    body,
  });
});
