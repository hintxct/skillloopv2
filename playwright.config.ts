import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const production = process.env.PLAYWRIGHT_PRODUCTION === "true";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    channel:
      process.env.PLAYWRIGHT_CHANNEL ||
      (process.platform === "win32" &&
      existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
        ? "chrome"
        : undefined),
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: "list",
  webServer: {
    command: production ? "npm start" : "npm run dev",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: !production && !process.env.CI,
    timeout: 120000,
  },
});
