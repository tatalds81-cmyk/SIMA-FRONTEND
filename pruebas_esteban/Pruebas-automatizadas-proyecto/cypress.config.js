const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: false,
  screenshotsFolder: "cypress/test-results/screenshots",

  e2e: {
    baseUrl: "http://127.0.0.1:5173",
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
