import { test, expect } from "@playwright/test";

// All tests run against the served host-app/dist/ which is built by the
// webServer command in playwright.config.ts before the suite starts.

test("platform config is embedded in HTML", async ({ page }) => {
  await page.goto("/");

  const configText = await page.locator("#__platform__").textContent();
  const config = JSON.parse(configText!);

  expect(config.routes["/"]).toBe("@acme/fe.mfe-b@1.0.0");
  expect(config.packages).toHaveProperty("@acme/fe.mfe-a");
  expect(config.packages).toHaveProperty("@acme/fe.mfe-b");
  expect(config.packages).toHaveProperty("@acme/fe.devtools");

  const mfeA = config.packages["@acme/fe.mfe-a"].versions["1.0.0"];
  expect(mfeA.url).toMatch(/mfe-a/);

  const mfeB = config.packages["@acme/fe.mfe-b"].versions["1.0.0"];
  expect(mfeB.deps["@acme/fe.mfe-a"]).toMatch(/^\^/);
});

test("runtime injects import maps for route dependencies", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("#app > *");

  const allSpecifiers = await page.evaluate(() => {
    const maps = Array.from(document.querySelectorAll('script[type="importmap"]'));
    return maps.flatMap((s) =>
      Object.keys((JSON.parse(s.textContent || "{}").imports ?? {}) as Record<string, string>)
    );
  });

  expect(allSpecifiers).toContain("@acme/fe.mfe-b");
  expect(allSpecifiers).toContain("@acme/fe.mfe-a");
});

test("mfe-b renders and composes mfe-a in #app", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#app")).toContainText("mfe-b wraps mfe-a:");
  await expect(page.locator("#app")).toContainText("mfe-a says: Hello, Shell User!");
});

test("devtools overlay is mounted with toggle button", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("#__devtools__", { state: "attached" });

  await expect(page.locator("#__devtools__ button").first()).toBeVisible();
});

test("platform:overrides URL param stores in sessionStorage and is stripped", async ({ page }) => {
  const overrides = {
    "@acme/fe.mfe-a": "http://localhost:3000/uploads/mfe-a/1.0.0/index.js",
  };
  const qs = new URLSearchParams({ "platform:overrides": JSON.stringify(overrides) });

  await page.goto(`/?${qs}`);
  await page.waitForFunction(() => !location.search.includes("platform:overrides"));

  expect(page.url()).not.toContain("platform:overrides");

  const stored = await page.evaluate(() => sessionStorage.getItem("platform:overrides"));
  expect(JSON.parse(stored!)).toEqual(overrides);
});

test("platform:clear-overrides strips sessionStorage and removes URL param", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    sessionStorage.setItem(
      "platform:overrides",
      JSON.stringify({ "@acme/fe.mfe-a": "http://custom.example" })
    );
  });

  await page.goto("/?platform:clear-overrides");
  await page.waitForFunction(() => !location.search.includes("platform:clear-overrides"));

  expect(page.url()).not.toContain("platform:clear-overrides");

  const stored = await page.evaluate(() => sessionStorage.getItem("platform:overrides"));
  expect(stored).toBeNull();
});
