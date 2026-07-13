Cypress.Commands.add('loginComo', (documento, password) => {
  cy.visit('/login');
  cy.get('#login-user').clear().type(documento);
  cy.get('#login-password').clear().type(password);
  cy.contains('button', 'Iniciar sesion').click();
  cy.url().should('not.include', '/login');
});
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
/* global Cypress, cy */

const superAdminUser = {
  id_usuario: 1,
  email: "superadmin@sima.test",
  rol: { id_rol: 1, nombre: "super_admin" },
  persona: {
    nombres: "Sara",
    apellidos: "Admin",
    tipo_documento: "CC",
    numero_documento: "1000000001",
    telefono: "3001234567",
  },
};

// -- This is a parent command --
Cypress.Commands.add("loginAsSuperAdmin", () => {
  cy.window().then((win) => {
    win.localStorage.setItem("access", "cy-super-admin-token");
    win.localStorage.setItem("token", "cy-super-admin-token");
    win.localStorage.setItem("rol", "super_admin");
    win.localStorage.setItem("username", "Sara Admin");
    win.localStorage.setItem("usuario", "Sara Admin");
    win.localStorage.setItem("user_email", superAdminUser.email);
    win.localStorage.setItem("user_documento", superAdminUser.persona.numero_documento);
    win.localStorage.setItem("user_data", JSON.stringify(superAdminUser));
  });
});
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
