const { defineConfig, devices } = require("@playwright/test");

const baseURL = "http://127.0.0.1:3001";
const apiURL = "http://127.0.0.1:5001";
const testDatabase = "mongodb://127.0.0.1:27017/kidora_e2e";

module.exports = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run start --workspace=@kidora/backend",
      url: `${apiURL}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: "development",
        PORT: "5001",
        FRONTEND_URL: baseURL,
        JWT_SECRET: "playwright-e2e-only-secret-that-is-at-least-32-characters",
        MONGODB_URI: testDatabase,
      },
    },
    {
      command: "npm run start --workspace=@kidora/frontend -- --port 3001 --strictPort",
      url: baseURL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { VITE_API_PROXY_TARGET: apiURL },
    },
  ],
});
