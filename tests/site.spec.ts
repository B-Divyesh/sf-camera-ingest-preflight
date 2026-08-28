import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("home has core semantics, working demo, and no serious accessibility violations", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page).toHaveTitle(/Camera Ingest Preflight/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("img:not([alt])")).toHaveCount(0);
  await page.getByRole("button", { name: "Run sample scan" }).first().click();
  await expect(page.getByText("Vendor conversion needed")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  expect(errors).toEqual([]);
});

for (const path of ["/privacy/", "/terms/"]) {
  test(`${path} is semantic and accessible`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  });
}

test("mobile layout keeps the primary action and report operable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const install = page.getByRole("link", { name: "Install the scanner" });
  await expect(install).toBeVisible();
  await page.getByRole("button", { name: "Run sample scan" }).first().click();
  await expect(page.getByText("DCIM/RICOH_001.JPG")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("skip link transfers keyboard focus to main and the mobile wordmark is touch sized", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await skip.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  const box = await page.getByRole("link", { name: "Camera Ingest Preflight home" }).boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test("production worker precaches executable assets and offline reload stays interactive", async ({ page }) => {
  const worker = readFileSync(resolve(process.cwd(), "dist/site/sw.js"), "utf8");
  expect(worker).not.toContain("__PRECACHE_MANIFEST__");

  await page.goto("/");
  const executableAssets = await page.locator('script[type="module"][src], link[rel="stylesheet"][href]').evaluateAll((elements) => elements
    .map((element) => new URL(element.getAttribute("src") ?? element.getAttribute("href") ?? "", window.location.href).pathname)
    .filter((path) => path.startsWith("/assets/")));
  for (const asset of executableAssets) expect(worker).toContain(JSON.stringify(asset));

  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.context().setOffline(true);

  const missingAsset = await page.evaluate(() => fetch("/assets/missing-regression.js")
    .then(async (response) => ({ resolved: true, body: await response.text() }))
    .catch(() => ({ resolved: false, body: "" })));
  expect(missingAsset.resolved).toBe(false);
  expect(missingAsset.body).not.toContain("<!doctype html");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Run sample scan" }).first().click();
  await expect(page.getByText("Vendor conversion needed")).toBeVisible();
});

test("Azure static deployment config preserves response policies and immutable assets", () => {
  const config = JSON.parse(readFileSync(resolve(process.cwd(), "dist/site/staticwebapp.config.json"), "utf8")) as {
    globalHeaders: Record<string, string>;
    routes: Array<{ route: string; headers: Record<string, string> }>;
  };
  expect(config.globalHeaders["Content-Security-Policy"]).toContain("default-src 'self'");
  expect(config.globalHeaders["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
  expect(config.globalHeaders["X-Content-Type-Options"]).toBe("nosniff");
  expect(config.routes).toEqual(expect.arrayContaining([
    { route: "/assets/*", headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
    { route: "/camera-blueprint.webp", headers: { "Cache-Control": "public, max-age=31536000, immutable" } }
  ]));
});
