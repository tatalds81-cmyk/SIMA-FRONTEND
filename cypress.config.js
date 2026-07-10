import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,
  video: true,
  videosFolder: "cypress/videos",
  videoCompression: 32,

  e2e: {
    baseUrl: "https://sima-frontend-orpin.vercel.app",
    specPattern: "cypress/e2e/**/*.cy.js",
    excludeSpecPattern: [
      "cypress/e2e/1-getting-started/**",
      "cypress/e2e/2-advanced-examples/**",
    ],
  },
});
