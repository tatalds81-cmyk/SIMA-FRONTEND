/* global cy, describe, it */

describe("SIMA smoke", () => {
  it("redirecciona al login cuando no hay sesion", () => {
    cy.clearLocalStorage();
    cy.visit("/");
    cy.location("pathname").should("eq", "/login");
    cy.contains("Iniciar sesion").should("be.visible");
  });
});
