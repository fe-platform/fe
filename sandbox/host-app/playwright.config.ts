import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    // fe build devtools fails because the CLI hardcodes src/index.ts but
    // devtools uses src/index.tsx; use the package's own build script instead.
    command: [
      "fe build mfe-a",
      "fe admin upload mfe-a",
      "fe build mfe-b",
      "fe admin upload mfe-b",
      "bun run --cwd devtools build",
      "fe admin upload devtools",
      "fe build shell",
      "fe serve",
    ].join(" && "),
    port: 3000,
    reuseExistingServer: !process.env.CI,
    cwd: join(__dirname, ".."),
    timeout: 120_000,
  },
});
