import { defineConfig } from "cypress";

const appUrl = process.env.CYPRESS_APP_URL || "http://localhost:5173";
const apiUrl = (process.env.CYPRESS_API_URL || process.env.VITE_API_URL || "http://localhost:3000")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export default defineConfig({
  e2e: {
    baseUrl: appUrl,
    specPattern: "cypress/e2e/**/*.cy.{js,jsx}",
    supportFile: "cypress/support/e2e.js",
    screenshotOnRunFailure: true,
    video: false,
    env: {
      apiUrl,
    },
    setupNodeEvents() {},
  },
});
