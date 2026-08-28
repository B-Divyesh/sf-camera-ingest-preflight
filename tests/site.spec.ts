import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
