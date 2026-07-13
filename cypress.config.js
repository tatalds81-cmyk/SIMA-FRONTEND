import { defineConfig } from "cypress";

const appUrl = process.env.CYPRESS_APP_URL || "http://localhost:5173";
const apiUrl = (process.env.CYPRESS_API_URL || process.env.VITE_API_URL || "http://localhost:3000")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export default defineConfig({
  projectId: "s9yctf",
  video: true,
  videosFolder: "cypress/videos",
  videoCompression: 32,
  e2e: {
    baseUrl: appUrl,
    specPattern: "cypress/e2e/**/*.cy.js",
    excludeSpecPattern: [
      "cypress/e2e/1-getting-started/**",
      "cypress/e2e/2-advanced-examples/**",
    ],
    supportFile: "cypress/support/e2e.js",
    screenshotOnRunFailure: true,
    env: {
      apiUrl,
    },
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
