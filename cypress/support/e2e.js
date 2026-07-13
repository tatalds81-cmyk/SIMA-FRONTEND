import "./commands";

afterEach(function () {
  if (this.currentTest.state === "passed") {
    cy.screenshot(this.currentTest.fullTitle(), { capture: "runner" });
  }
});
