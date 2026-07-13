export const STATUS = {
  ok: [200, 201, 202, 204],
  created: [200, 201],
  rejected: [400, 401, 403, 404, 409, 422, 423],
  unauthorized: [401, 403],
  conflict: [400, 409, 422],
};

export const DEFAULT_ROUTES = {
  authLogin: "/api/auth/login",
  authMe: "/api/auth/me",
  superAdminProvisioning: "/api/super-admin/provisioning",
  users: "/api/users",
  userById: "/api/users/:id",
  userStatus: "/api/users/:id/status",
  userResetPassword: "/api/users/:id/reset-password",
  userAudit: "/api/users/:id/audit",
  roles: "/api/roles",
  groups: "/api/groups",
  coordinatorAreas: "/api/coordinator-areas/areas",
  coordinatorAssignment: "/api/coordinator-areas/assign",
  globalApprenticeAssignment: "/api/super-admin/apprentices/group-assignment",
  academicOperation: "/api/super-admin/academic-operations",
  alerts: "/api/alerts",
  alertStatus: "/api/alerts/:id/status",
  observations: "/api/observations",
  observationAnnul: "/api/super-admin/observations/:id/annul",
  auditLogs: "/api/audit-logs",
  devices: "/api/biometrics/devices",
  deviceById: "/api/biometrics/devices/:id",
  deviceEvents: "/api/biometrics/devices/events",
  deviceReplace: "/api/biometrics/devices/:id/replace",
  incidents: "/api/biometrics/incidents",
  incidentRecovery: "/api/biometrics/incidents/:id/recover",
  fingerprints: "/api/biometrics/fingerprints",
  fingerprintEnroll: "/api/biometrics/fingerprints/enroll",
  fingerprintRevoke: "/api/biometrics/fingerprints/:id/revoke",
  fingerprintReplace: "/api/biometrics/fingerprints/:id/replace",
  enrollments: "/api/biometrics/enrollments",
  fingerprintAttempts: "/api/biometrics/fingerprint-attempts",
  manualAttendance: "/api/attendance/manual",
  qrAttendance: "/api/attendance/qr",
};

export function route(name, params = {}) {
  const configured = Cypress.env("routes") || {};
  let value = configured[name] || DEFAULT_ROUTES[name];

  if (!value) {
    throw new Error(`No existe una ruta configurada para ${name}.`);
  }

  Object.entries(params).forEach(([key, paramValue]) => {
    value = value.replace(`:${key}`, encodeURIComponent(paramValue));
  });

  return value;
}

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;

  const base = String(Cypress.env("apiUrl") || "")
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${base}${normalizedPath}`;
}

export function data(key, fallback = undefined) {
  const allData = Cypress.env("superAdminData") || {};
  return allData[key] ?? fallback;
}

export function requireData(ctx, keys) {
  const missing = keys.filter((key) => data(key) === undefined || data(key) === "");

  if (missing.length > 0) {
    Cypress.log({
      name: "skip",
      message: `Faltan datos de cypress.env.json: ${missing.join(", ")}`,
    });
    ctx.skip();
  }
}

export function runId() {
  return Cypress.env("runId") || `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function uniqueDocument() {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.replace(/\D/g, "").slice(-8);
  return `97${suffix}`;
}

export function uniquePhone() {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.replace(/\D/g, "").slice(-9);
  return `3${suffix}`;
}

export function uniqueEmail(label) {
  return `sima.e2e.${label}.${runId()}.${Math.floor(Math.random() * 10000)}@misena.edu.co`;
}

export function makeUserPayload(roleId, label, overrides = {}) {
  const document = overrides.numero_documento || uniqueDocument();

  return {
    email: uniqueEmail(label),
    id_rol: Number(roleId),
    tipo_documento: "CC",
    numero_documento: document,
    nombres: "Cypress",
    apellidos: label.replace(/[-_]/g, " "),
    telefono: uniquePhone(),
    ...overrides,
  };
}

export function makeProvisioningPayload(label = "bootstrap", overrides = {}) {
  const document = overrides.numero_documento || uniqueDocument();

  return {
    email: uniqueEmail(label),
    tipo_documento: "CC",
    numero_documento: document,
    nombres: "Super",
    apellidos: "Admin Cypress",
    password: `Temp.${document}`,
    ...overrides,
  };
}

export function payload(response) {
  const body = response?.body ?? response;
  return body?.data ?? body;
}

export function extractList(value) {
  const target = value?.body ?? value;

  if (Array.isArray(target)) return target;
  if (!target || typeof target !== "object") return [];

  const keys = [
    "usuarios",
    "users",
    "roles",
    "grupos",
    "groups",
    "areas",
    "alerts",
    "alertas",
    "observaciones",
    "observations",
    "devices",
    "dispositivos",
    "incidents",
    "incidentes",
    "fingerprints",
    "huellas",
    "enrollments",
    "enrolamientos",
    "attempts",
    "intentos",
    "items",
    "results",
  ];

  for (const key of keys) {
    if (Array.isArray(target[key])) return target[key];
  }

  if (target.data && target.data !== target) {
    return extractList(target.data);
  }

  return [];
}

export function expectStatus(response, allowed, context) {
  expect(response.status, `${context}: ${JSON.stringify(response.body)}`).to.be.oneOf(allowed);
}

export function expectErrorResponse(response, context) {
  expectStatus(response, STATUS.rejected, context);
  const text = JSON.stringify(response.body || {});
  expect(text.length, `${context}: debe retornar detalle del error`).to.be.greaterThan(2);
}

export function expectSuccessfulOperation(response, context) {
  expectStatus(response, STATUS.ok, context);
}

export function expectBodyText(response, words, context) {
  const text = JSON.stringify(response.body || {}).toLowerCase();
  const found = words.some((word) => text.includes(String(word).toLowerCase()));
  expect(found, `${context}: ${text}`).to.eq(true);
}

export function expectNoSensitiveData(value, context = "respuesta") {
  const forbidden = /(password|contrasena|secret|access_token|refresh_token|plantilla|template)/i;
  const allowedMask = /^(|\*+|x+|redacted|\[redacted\]|null)$/i;

  function visit(target, path = []) {
    if (target === null || target === undefined) return;
    if (Array.isArray(target)) {
      target.forEach((item, index) => visit(item, path.concat(index)));
      return;
    }
    if (typeof target !== "object") return;

    Object.entries(target).forEach(([key, value]) => {
      const currentPath = path.concat(key);

      if (forbidden.test(key) && typeof value !== "object") {
        expect(String(value), `${context} contiene ${currentPath.join(".")}`).to.match(allowedMask);
      }

      visit(value, currentPath);
    });
  }

  visit(value);
}

export function findRoleId(roleName) {
  return cy.apiRequest({
    method: "GET",
    endpoint: route("roles"),
    qs: { limit: 100 },
  }).then((response) => {
    expectSuccessfulOperation(response, `consulta de rol ${roleName}`);

    const normalized = String(roleName).toLowerCase().replace(/[\s-]+/g, "_");
    const role = extractList(response).find((item) => {
      const name = String(item.nombre || item.name || item.role || "").toLowerCase().replace(/[\s-]+/g, "_");
      return name === normalized;
    });

    expect(role, `rol ${roleName}`).to.exist;
    return role.id_rol || role.id;
  });
}

export function createUser(roleName, label, overrides = {}) {
  return findRoleId(roleName).then((roleId) => {
    const body = makeUserPayload(roleId, label, overrides);
    return cy.apiRequest({
      method: "POST",
      endpoint: route("users"),
      body,
    }).then((response) => {
      expectStatus(response, STATUS.created, `crear usuario ${label}`);
      return {
        response,
        body,
        user: payload(response),
      };
    });
  });
}

export function getEntityId(value, keys = ["id", "id_usuario", "id_dispositivo", "id_huella", "id_incidente"]) {
  for (const key of keys) {
    if (value?.[key] !== undefined && value?.[key] !== null) return value[key];
  }
  return undefined;
}
