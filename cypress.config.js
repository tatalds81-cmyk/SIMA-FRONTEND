import { defineConfig } from "cypress";

export default defineConfig({
  projectId:"s9yctf",
  allowCypressEnv:false,
  video:true,
  videosFolder: "cypress/videos",
  videoCompression: 32,

  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on,config){
      return config;
    },
    specPattern: "cypress/e2e/**/*.cy.js",
    excludeSpecPattern: [
      "cypress/e2e/1-getting-started/**",
      "cypress/e2e/2-advanced-examples/**",
    ],
  },
});
