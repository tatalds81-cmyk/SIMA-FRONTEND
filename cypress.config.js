
import { defineConfig } from "cypress";

export default defineConfig({
  projectId:"s9yctf",
    e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
