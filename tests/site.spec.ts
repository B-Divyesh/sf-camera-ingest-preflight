import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const slug = "camera-ingest-preflight";
const licenseKey = `sb_license:${slug}`;
const verdictKey = `sb_license_verdict:${slug}`;

function verdictFor(token: string, valid: boolean) {
  return {
    valid,
    reason: valid ? "ok" : "invalid",
    checkedAt: Date.now(),
    tokenFingerprint: createHash("sha256").update(token).digest("hex")
  };
}

async function seedLicense(page: import("@playwright/test").Page, token: string, valid: boolean) {
  const verdict = verdictFor(token, valid);
  await page.addInitScript(({ licenseKey, verdictKey, token, verdict }) => {
    localStorage.setItem(licenseKey, token);
    localStorage.setItem(verdictKey, JSON.stringify(verdict));
  }, { licenseKey, verdictKey, token, verdict });
}

test("@claim:sample-scan home has core semantics, working demo, and no serious accessibility violations", async ({ page }) => {
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
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
});

test("skip link transfers keyboard focus to main and the mobile wordmark is touch sized", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await skip.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  const wordmark = page.getByRole("link", { name: "CAMERA / PREFLIGHT home" });
  await expect(wordmark).toHaveAccessibleName("CAMERA / PREFLIGHT home");
  const box = await wordmark.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test("@claim:offline-reload production worker precaches executable assets and offline reload stays interactive", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const worker = readFileSync(resolve(process.cwd(), "dist/site/sw.js"), "utf8");
  expect(worker).not.toContain("__PRECACHE_MANIFEST__");
  expect(worker).not.toContain("__CACHE_NAME__");
  expect(worker).toMatch(/const cacheName = "camera-preflight-shell-[a-f0-9]{12}"/);

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

  // The deliberately missing asset above is expected to produce a browser
  // network error. The reload itself must stay clean.
  errors.length = 0;
  await page.reload({ waitUntil: "domcontentloaded" });
  expect(errors).toEqual([]);
  await page.getByRole("button", { name: "Run sample scan" }).first().click();
  await expect(page.getByText("Vendor conversion needed")).toBeVisible();
  await context.close();
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

test("@regression:license-token-cache returned invalid token never inherits an old valid verdict", async ({ page }) => {
  const oldToken = "OLD_VALID_TOKEN";
  const replacement = "NEW_INVALID_TOKEN_456";
  await seedLicense(page, oldToken, true);
  let requests = 0;
  await page.route("**/api/v1/products/camera-ingest-preflight/verify?license=*", async (route) => {
    requests += 1;
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ valid: false, reason: "invalid" }) });
  });

  await page.goto(`/?license=${replacement}`);
  await expect(page.getByText("License no longer active. Check the token or buy a new license.")).toBeVisible();
  expect(requests).toBe(1);
  await expect(page.locator("#unlocked-view")).toBeHidden();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), licenseKey)).toBe(replacement);
  expect(new URL(page.url()).searchParams.has("license")).toBe(false);
});

test("@regression:license-token-cache returned valid token replaces an old invalid verdict", async ({ page }) => {
  const oldToken = "OLD_INVALID_TOKEN";
  const replacement = "NEW_VALID_TOKEN_456";
  await seedLicense(page, oldToken, false);
  let requests = 0;
  await page.route("**/api/v1/products/camera-ingest-preflight/verify?license=*", async (route) => {
    requests += 1;
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok" }) });
  });

  await page.goto(`/?license=${replacement}`);
  await expect(page.getByText("License verified. Migration set unlocked.")).toBeVisible();
  expect(requests).toBe(1);
  await expect(page.locator("#unlocked-view")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create a migration brief" })).toBeVisible();
});

test("@claim:migration-brief a verified license generates, saves, prints, and downloads a local migration brief", async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => { document.documentElement.dataset.printedMigrationBrief = "true"; };
  });
  await page.route("**/api/v1/products/camera-ingest-preflight/verify?license=*", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok" }) });
  });
  await page.goto("/?license=VALID_MIGRATION_TOKEN");
  await expect(page.locator("#unlocked-view")).toBeVisible();

  await page.getByRole("button", { name: "Load sample report" }).click();
  const brief = page.locator("#brief-output");
  await expect(brief.getByRole("heading", { name: "PhotoPrism migration brief" })).toBeVisible();
  await expect(brief.getByText("Format-specific handoff notes")).toBeVisible();
  await expect(brief).toContainText("Exact GPS coordinates are not included in this brief.");

  await page.getByLabel("Layout name").fill("PhotoPrism card triage");
  await page.getByRole("button", { name: "Save layout" }).click();
  await expect(page.getByText("Saved PhotoPrism card triage on this browser.")).toBeVisible();
  await expect(page.getByLabel("Saved layouts")).toContainText("PhotoPrism card triage — PhotoPrism");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download text brief" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("camera-ingest-migration-brief.txt");
  expect(await download.createReadStream().then(async (stream) => {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString("utf8");
  })).toContain("PhotoPrism migration brief");

  await page.getByRole("button", { name: "Print brief" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.printedMigrationBrief)).toBe("true");
});

test("@regression:license-token-cache restore forces verification and offline state only trusts the matching token", async ({ page }) => {
  await page.route("**/api/v1/products/camera-ingest-preflight/verify?license=*", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok" }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Have a license? Restore it" }).click();
  await page.getByLabel("License token").fill("RESTORED_VALID_TOKEN");
  await page.getByRole("button", { name: "Verify license" }).click();
  await expect(page.locator("#unlocked-view")).toBeVisible();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), licenseKey)).toBe("RESTORED_VALID_TOKEN");
});

test("@claim:local-demo-privacy sample demo keeps its records in the page", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await page.getByRole("button", { name: "Run sample scan" }).first().click();
  await expect(page.getByText("Vendor conversion needed")).toBeVisible();
  const origin = new URL(page.url()).origin;
  expect(requests.filter((url) => new URL(url).origin !== origin)).toEqual([]);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});
