import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const slug = "camera-ingest-preflight";
const licenseKey = `sb_license:${slug}`;
const verdictKey = `sb_license_verdict:${slug}`;
const layoutKey = `sb_migration_layouts:${slug}`;
const root = process.cwd();
const cli = resolve(root, "target/debug/camera-ingest-preflight");

type CliRun = { status: number | null; stdout: string; stderr: string };
type Finding = { code: string; message: string; severity: "info" | "warning" | "error" };
type ScannedFile = {
  path: string;
  bytes: number;
  sha256: string;
  extension: string;
  media_kind: string;
  support: { status: "accepted" | "review" | "rejected"; reason: string };
  embedded_preview: "available" | "missing" | "not_applicable" | "unknown";
  orientation: { value?: number; label: string; status: string };
  projection: { kind: string; evidence: string[] };
  camera: { make?: string; model?: string; status: string };
  gps: { present: boolean; latitude?: number; longitude?: number; redacted: boolean };
  duplicate_of?: string;
  findings: Finding[];
};
type DemoReport = {
  schema_version: string;
  tool_version: string;
  root: string;
  generated_unix_seconds: number;
  profile: string;
  privacy: { gps_coordinates_included: boolean; note: string };
  summary: { files_scanned: number; ready: number; review: number; rejected: number; duplicate_files: number; gps_files: number };
  files: ScannedFile[];
};

function verdictFor(token: string, valid: boolean) {
  return {
    valid,
    reason: valid ? "ok" : "invalid",
    checkedAt: Date.now(),
    tokenFingerprint: createHash("sha256").update(token).digest("hex")
  };
}

function runCli(args: string[]): CliRun {
  const result = spawnSync(cli, args, { cwd: root, encoding: "utf8" });
  if (result.error) throw result.error;
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function scanJson(card: string, args: string[] = []): { run: CliRun; report: DemoReport } {
  const run = runCli(["scan", card, "--json", "-", "--quiet", ...args]);
  return { run, report: JSON.parse(run.stdout) as DemoReport };
}

type TiffOptions = {
  width?: number;
  height?: number;
  orientation?: number;
  make?: string;
  model?: string;
  gps?: boolean;
};

function tiffFixture(options: TiffOptions): Buffer {
  const entries: Array<{ tag: number; type: number; count: number; inline?: Buffer; data?: Buffer; value?: number }> = [];
  const ascii = (value: string) => Buffer.from(`${value}\0`, "latin1");
  entries.push({ tag: 256, type: 4, count: 1, value: options.width ?? 8000 });
  entries.push({ tag: 257, type: 4, count: 1, value: options.height ?? 4000 });
  if (options.make !== undefined) entries.push({ tag: 271, type: 2, count: ascii(options.make).length, data: ascii(options.make) });
  if (options.model !== undefined) entries.push({ tag: 272, type: 2, count: ascii(options.model).length, data: ascii(options.model) });
  if (options.orientation !== undefined) {
    const inline = Buffer.alloc(4);
    inline.writeUInt16LE(options.orientation, 0);
    entries.push({ tag: 274, type: 3, count: 1, inline });
  }

  const ifdSize = 2 + (entries.length + (options.gps ? 1 : 0)) * 12 + 4;
  let dataOffset = 8 + ifdSize;
  for (const entry of entries) {
    if (entry.data && entry.data.length > 4) {
      entry.value = dataOffset;
      dataOffset += entry.data.length;
    } else if (entry.data) {
      entry.inline = Buffer.alloc(4);
      entry.data.copy(entry.inline);
    }
  }
  if (dataOffset % 2) dataOffset += 1;
  const gpsIfdOffset = dataOffset;
  const gpsIfdSize = options.gps ? 2 + 4 * 12 + 4 : 0;
  const latitudeOffset = gpsIfdOffset + gpsIfdSize;
  const longitudeOffset = latitudeOffset + 24;
  const total = options.gps ? longitudeOffset + 24 : dataOffset;
  const output = Buffer.alloc(total);
  output.write("II", 0, "ascii");
  output.writeUInt16LE(42, 2);
  output.writeUInt32LE(8, 4);
  const sorted = [...entries];
  if (options.gps) sorted.push({ tag: 34853, type: 4, count: 1, value: gpsIfdOffset });
  sorted.sort((left, right) => left.tag - right.tag);
  output.writeUInt16LE(sorted.length, 8);
  sorted.forEach((entry, index) => {
    const offset = 10 + index * 12;
    output.writeUInt16LE(entry.tag, offset);
    output.writeUInt16LE(entry.type, offset + 2);
    output.writeUInt32LE(entry.count, offset + 4);
    if (entry.inline) entry.inline.copy(output, offset + 8);
    else output.writeUInt32LE(entry.value ?? 0, offset + 8);
  });
  for (const entry of entries) {
    if (entry.data && entry.data.length > 4) entry.data.copy(output, entry.value!);
  }
  if (options.gps) {
    output.writeUInt16LE(4, gpsIfdOffset);
    const gpsEntries = [
      { tag: 1, type: 2, count: 2, inline: Buffer.from([0x4e, 0, 0, 0]) },
      { tag: 2, type: 5, count: 3, value: latitudeOffset },
      { tag: 3, type: 2, count: 2, inline: Buffer.from([0x57, 0, 0, 0]) },
      { tag: 4, type: 5, count: 3, value: longitudeOffset }
    ];
    gpsEntries.forEach((entry, index) => {
      const offset = gpsIfdOffset + 2 + index * 12;
      output.writeUInt16LE(entry.tag, offset);
      output.writeUInt16LE(entry.type, offset + 2);
      output.writeUInt32LE(entry.count, offset + 4);
      if (entry.inline) entry.inline.copy(output, offset + 8);
      else output.writeUInt32LE(entry.value!, offset + 8);
    });
    [[37, 1], [48, 1], [30, 1]].forEach(([numerator, denominator], index) => {
      output.writeUInt32LE(numerator, latitudeOffset + index * 8);
      output.writeUInt32LE(denominator, latitudeOffset + index * 8 + 4);
    });
    [[122, 1], [24, 1], [15, 1]].forEach(([numerator, denominator], index) => {
      output.writeUInt32LE(numerator, longitudeOffset + index * 8);
      output.writeUInt32LE(denominator, longitudeOffset + index * 8 + 4);
    });
  }
  return output;
}

function bundledDemo(profile = "photoprism") {
  const result = runCli(["demo", "--profile", profile]);
  expect(result.status).toBe(1);
  const folder = result.stdout.match(/^DEMO   sample card and JSON report → (.+)$/m)?.[1];
  expect(folder).toBeTruthy();
  const report = JSON.parse(readFileSync(resolve(folder!, "preflight-demo.json"), "utf8")) as DemoReport;
  return { ...result, folder: folder!, report };
}

function stableReport(report: DemoReport): DemoReport {
  return { ...report, root: "<temporary demo folder>/card", generated_unix_seconds: 0 };
}

async function seedLicense(page: import("@playwright/test").Page, token: string, valid: boolean) {
  const verdict = verdictFor(token, valid);
  await page.addInitScript(({ licenseKey, verdictKey, token, verdict }) => {
    localStorage.setItem(licenseKey, token);
    localStorage.setItem(verdictKey, JSON.stringify(verdict));
  }, { licenseKey, verdictKey, token, verdict });
}

test("@regression:claims-contract every registered claim has one exact tagged test", () => {
  const manifest = JSON.parse(readFileSync(resolve(root, ".factory/claims.json"), "utf8")) as Array<{ id: string; test: string }>;
  const source = readFileSync(resolve(root, "tests/site.spec.ts"), "utf8");
  const tags = [...source.matchAll(/@claim:([a-z0-9-]+)/g)].map((match) => match[1]);
  expect(new Set(tags)).toEqual(new Set(manifest.map((claim) => claim.id)));
  for (const claim of manifest) {
    expect(tags.filter((tag) => tag === claim.id), claim.id).toHaveLength(1);
    expect(claim.test).toContain(`--grep @claim:${claim.id}`);
  }
  expect(manifest.map((claim) => claim.id)).toEqual(expect.arrayContaining([
    "format-decisions", "embedded-preview", "projection-hints", "orientation-validation",
    "duplicate-detection", "camera-metadata", "gps-inclusion", "report-contract",
    "paid-layouts", "license-revocation", "checkout-status"
  ]));
});

test("@claim:sample-scan /demo preloads the four-file report generated by the bundled CLI", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/demo/");
  await expect(page).toHaveTitle("Demo — Camera Ingest Preflight");
  await expect(page.getByText("Demo — sample data, nothing is saved.")).toBeVisible();
  await expect(page.locator("#report-body tr")).toHaveCount(4);
  await expect(page.locator("#summary-files")).toHaveText("4");
  await expect(page.locator("#summary-ready")).toHaveText("0");
  await expect(page.locator("#summary-review")).toHaveText("3");
  await expect(page.locator("#summary-reject")).toHaveText("1");
  await expect(page.locator("#report-body").getByText("Proprietary Insta360 original requires vendor conversion or a tested downstream decoder.")).toBeVisible();
  await expect(page.locator("#demo-transcript")).toContainText("FILES    4   READY    0   REVIEW    3   REJECT    1");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("img:not([alt])")).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  expect(errors).toEqual([]);
});

test("@regression:cli-web-sample-parity the published report and transcript exactly match camera-ingest-preflight demo", () => {
  const fixtures = JSON.parse(readFileSync(resolve(root, "site/public/demo-fixtures.json"), "utf8")) as Record<string, { report: DemoReport; transcript: string }>;
  const actual = bundledDemo("photoprism");
  expect(stableReport(actual.report)).toEqual(fixtures.photoprism.report);
  expect(actual.stdout.replaceAll(actual.folder, "<temporary demo folder>")).toBe(fixtures.photoprism.transcript);
});

test("@claim:read-only-scan bundled CLI input remains unchanged after scanning", () => {
  const originals = ["FISHEYE_007.DNG", "RICOH_001.JPG", "SONY_A73_042.ARW", "VID_018.INSV"];
  const before = originals.map((name) => createHash("sha256").update(readFileSync(resolve(root, "examples/demo-card/DCIM", name))).digest("hex"));
  const actual = bundledDemo();
  expect(actual.report.summary.files_scanned).toBe(4);
  const after = originals.map((name) => createHash("sha256").update(readFileSync(resolve(root, "examples/demo-card/DCIM", name))).digest("hex"));
  expect(after).toEqual(before);
});

test("@claim:gps-redaction CLI reports GPS presence without coordinates unless explicitly requested", () => {
  const actual = bundledDemo();
  const encoded = JSON.stringify(actual.report);
  expect(actual.report.summary.gps_files).toBe(1);
  expect(encoded).toContain("gps_coordinates_included\":false");
  expect(encoded).not.toContain("latitude");
  expect(encoded).not.toContain("longitude");
});

test("@claim:format-decisions Generic, PhotoPrism, and Lightroom return their documented format decisions", () => {
  const card = mkdtempSync("/tmp/camera-ingest-formats-");
  writeFileSync(resolve(card, "COMPANION.XMP"), "sidecar");
  writeFileSync(resolve(card, "VERSION_SENSITIVE.AVIF"), "avif sample");
  writeFileSync(resolve(card, "PROPRIETARY.INSV"), "insta360 sample");
  const expected = {
    generic: ["accepted", "rejected", "review"],
    photoprism: ["accepted", "rejected", "accepted"],
    lightroom: ["accepted", "rejected", "review"]
  };
  for (const profile of ["generic", "photoprism", "lightroom"] as const) {
    const { run, report } = scanJson(card, ["--profile", profile]);
    expect(run.status).toBe(1);
    expect(report.profile).toBe(profile);
    expect(report.files.map((file) => file.support.status)).toEqual(expected[profile]);
    expect(report.files.find((file) => file.path.endsWith("PROPRIETARY.INSV"))?.findings.map((finding) => finding.code)).toContain("unsupported_format");
  }
});

test("@claim:embedded-preview RAW preview detection is limited to the first 24 MiB", () => {
  const card = mkdtempSync("/tmp/camera-ingest-preview-");
  writeFileSync(resolve(card, "AVAILABLE.DNG"), Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(256), Buffer.from([0xff, 0xd9])]));
  writeFileSync(resolve(card, "MISSING.ARW"), "raw without a preview");
  writeFileSync(resolve(card, "BEYOND_LIMIT.DNG"), Buffer.concat([
    Buffer.alloc(24 * 1024 * 1024),
    Buffer.from([0xff, 0xd8]),
    Buffer.alloc(256),
    Buffer.from([0xff, 0xd9])
  ]));
  const { report } = scanJson(card);
  const status = Object.fromEntries(report.files.map((file) => [file.path, file.embedded_preview]));
  expect(status).toEqual({ "AVAILABLE.DNG": "available", "BEYOND_LIMIT.DNG": "missing", "MISSING.ARW": "missing" });
  expect(report.files.find((file) => file.path === "BEYOND_LIMIT.DNG")?.findings.map((finding) => finding.code)).toContain("preview_missing");
});

test("@claim:projection-hints GPano, near-2:1 dimensions, and filename markers produce distinct projection evidence", () => {
  const card = mkdtempSync("/tmp/camera-ingest-projection-");
  writeFileSync(resolve(card, "GPANO.XMP"), "<GPano:ProjectionType>equirectangular</GPano:ProjectionType>");
  writeFileSync(resolve(card, "DIMENSIONS.TIF"), tiffFixture({ width: 8000, height: 4000, make: "Canon", model: "EOS R" }));
  writeFileSync(resolve(card, "PANO_001.JPG"), "flat sample");
  const { report } = scanJson(card);
  const byPath = Object.fromEntries(report.files.map((file) => [file.path, file]));
  expect(byPath["GPANO.XMP"].projection).toEqual({ kind: "equirectangular", evidence: ["XMP GPano projection type"] });
  expect(byPath["DIMENSIONS.TIF"].projection).toEqual({ kind: "equirectangular", evidence: ["image dimensions are approximately 2:1"] });
  expect(byPath["PANO_001.JPG"].projection).toEqual({ kind: "panorama_candidate", evidence: ["filename contains a panorama marker"] });
});

test("@claim:orientation-validation EXIF orientations 1 through 8 are translated and other values are flagged", () => {
  const card = mkdtempSync("/tmp/camera-ingest-orientation-");
  for (let orientation = 1; orientation <= 9; orientation += 1) {
    writeFileSync(resolve(card, `ORIENTATION_${orientation}.TIF`), tiffFixture({ orientation, make: "Canon", model: "EOS R" }));
  }
  const { report } = scanJson(card);
  const expected = [
    "normal", "mirrored horizontal", "rotated 180°", "mirrored vertical",
    "mirrored horizontal, rotated 270°", "rotated 90°",
    "mirrored horizontal, rotated 90°", "rotated 270°"
  ];
  for (let orientation = 1; orientation <= 8; orientation += 1) {
    const file = report.files.find((item) => item.path === `ORIENTATION_${orientation}.TIF`)!;
    expect(file.orientation).toMatchObject({ value: orientation, label: expected[orientation - 1], status: "valid" });
    expect(file.findings.map((finding) => finding.code)).not.toContain("orientation_invalid");
  }
  const invalid = report.files.find((item) => item.path === "ORIENTATION_9.TIF")!;
  expect(invalid.orientation).toMatchObject({ value: 9, label: "invalid value", status: "invalid" });
  expect(invalid.findings.map((finding) => finding.code)).toContain("orientation_invalid");
});

test("@claim:duplicate-detection equal file bytes are linked by SHA-256 instead of filenames", () => {
  const card = mkdtempSync("/tmp/camera-ingest-duplicates-");
  writeFileSync(resolve(card, "BURST_A.XMP"), "same original bytes");
  writeFileSync(resolve(card, "BURST_B.XMP"), "same original bytes");
  writeFileSync(resolve(card, "BURST_C.XMP"), "different original bytes");
  const { report } = scanJson(card);
  expect(report.summary.duplicate_files).toBe(1);
  expect(report.files[1].sha256).toBe(report.files[0].sha256);
  expect(report.files[1].duplicate_of).toBe("BURST_A.XMP");
  expect(report.files[1].findings.map((finding) => finding.code)).toContain("duplicate_content");
  expect(report.files[2].duplicate_of).toBeUndefined();
});

test("@claim:camera-metadata complete, absent, partial, and garbled camera identity are distinguished", () => {
  const card = mkdtempSync("/tmp/camera-ingest-camera-");
  writeFileSync(resolve(card, "COMPLETE.TIF"), tiffFixture({ make: "Canon", model: "EOS R" }));
  writeFileSync(resolve(card, "MISSING.TIF"), tiffFixture({}));
  writeFileSync(resolve(card, "PARTIAL.TIF"), tiffFixture({ make: "Canon" }));
  writeFileSync(resolve(card, "GARBLED.TIF"), tiffFixture({ make: "Can\u0001on", model: "EOS R" }));
  const { report } = scanJson(card);
  const byPath = Object.fromEntries(report.files.map((file) => [file.path, file]));
  expect(byPath["COMPLETE.TIF"].camera).toMatchObject({ make: "Canon", model: "EOS R", status: "complete" });
  expect(byPath["MISSING.TIF"].camera.status).toBe("missing");
  expect(byPath["MISSING.TIF"].findings.map((finding) => finding.code)).toContain("camera_missing");
  expect(byPath["PARTIAL.TIF"].camera.status).toBe("partial");
  expect(byPath["PARTIAL.TIF"].findings.map((finding) => finding.code)).toContain("camera_partial");
  expect(byPath["GARBLED.TIF"].camera.status).toBe("garbled");
  expect(byPath["GARBLED.TIF"].findings.map((finding) => finding.code)).toContain("camera_garbled");
});

test("@claim:gps-inclusion --include-gps emits parsed coordinates only after explicit opt-in", () => {
  const card = mkdtempSync("/tmp/camera-ingest-gps-");
  writeFileSync(resolve(card, "LOCATED.TIF"), tiffFixture({ make: "Canon", model: "EOS R", gps: true }));
  const normal = scanJson(card).report;
  expect(normal.files[0].gps).toEqual({ present: true, redacted: true });
  const included = scanJson(card, ["--include-gps"]).report;
  expect(included.privacy.gps_coordinates_included).toBe(true);
  expect(included.files[0].gps).toEqual({
    present: true,
    latitude: 37.80833333333333,
    longitude: -122.40416666666667,
    redacted: false
  });
});

test("@claim:report-contract JSON schema, exit 0/1/2 meanings, and exact report exclusion stay stable", () => {
  const fixture = mkdtempSync("/tmp/camera-ingest-contract-");
  const readyCard = resolve(fixture, "ready");
  const reviewCard = resolve(fixture, "review");
  mkdirSync(readyCard);
  mkdirSync(reviewCard);
  writeFileSync(resolve(readyCard, "COMPANION.XMP"), "sidecar");
  writeFileSync(resolve(reviewCard, "UNKNOWN.XYZ"), "unknown");
  const ready = scanJson(readyCard);
  const review = scanJson(reviewCard);
  expect(ready.run.status).toBe(0);
  expect(review.run.status).toBe(1);
  expect(runCli(["scan", resolve(fixture, "missing"), "--quiet"]).status).toBe(2);
  expect(ready.report).toMatchObject({ schema_version: "1.0", tool_version: "0.1.0" });
  expect(Object.keys(ready.report.files[0])).toEqual(expect.arrayContaining([
    "path", "bytes", "sha256", "media_kind", "support", "embedded_preview",
    "orientation", "projection", "camera", "gps", "findings"
  ]));

  const output = resolve(reviewCard, "preflight.json");
  writeFileSync(resolve(reviewCard, "photographer-notes.json"), "keep this finding");
  const saved = runCli(["scan", reviewCard, "--json", output, "--quiet"]);
  expect(saved.status).toBe(1);
  const savedReport = JSON.parse(readFileSync(output, "utf8")) as DemoReport;
  expect(savedReport.files.map((file) => file.path)).toContain("photographer-notes.json");
  expect(savedReport.files.map((file) => file.path)).not.toContain("preflight.json");
});

test("@claim:sha256-report each scanned original receives its matching SHA-256 digest", () => {
  const actual = bundledDemo();
  const files = actual.report.files as Array<{ path: string; sha256: string }>;
  expect(files).toHaveLength(4);
  for (const file of files) {
    expect(file.sha256).toMatch(/^[a-f0-9]{64}$/);
    const source = readFileSync(resolve(root, "examples/demo-card", file.path));
    expect(file.sha256).toBe(createHash("sha256").update(source).digest("hex"));
  }
});

test("@claim:local-cli-privacy the CLI has no telemetry or network client dependency", () => {
  const manifest = readFileSync(resolve(root, "Cargo.toml"), "utf8");
  const sources = ["src/lib.rs", "src/main.rs"].map((file) => readFileSync(resolve(root, file), "utf8")).join("\n");
  expect(manifest).not.toMatch(/reqwest|ureq|hyper|tokio|telemetry|analytics/i);
  expect(sources).not.toMatch(/TcpStream|UdpSocket|std::net|telemetry|analytics|http:/i);
  expect(bundledDemo().report.summary.files_scanned).toBe(4);
});

test("@claim:json-csv-exit-codes CLI exports JSON and CSV, ignores symlinks, and returns documented errors", () => {
  const fixture = mkdtempSync("/tmp/camera-ingest-preflight-claim-");
  const card = resolve(fixture, "card");
  const outside = resolve(fixture, "outside.bin");
  const json = resolve(card, "preflight.json");
  const csv = resolve(card, "preflight.csv");
  mkdirSync(card);
  writeFileSync(resolve(card, "IMG_0001.XMP"), "sidecar");
  writeFileSync(outside, "not on this card");
  symlinkSync(outside, resolve(card, "external-link.bin"));
  const result = runCli(["scan", card, "--json", json, "--csv", csv, "--quiet"]);
  expect(result.status).toBe(0);
  const report = JSON.parse(readFileSync(json, "utf8")) as { summary: { files_scanned: number }; files: Array<{ path: string }> };
  expect(report.summary.files_scanned).toBe(1);
  expect(report.files.map((file) => file.path)).toEqual(["IMG_0001.XMP"]);
  expect(readFileSync(csv, "utf8")).toContain('"IMG_0001.XMP"');
  expect(runCli(["scan", resolve(fixture, "missing-card"), "--quiet"]).status).toBe(2);
});

test("@claim:demo-sandbox demo routes are isolated, resettable, and never read real license storage", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.addInitScript(() => {
    const nativeGet = Storage.prototype.getItem;
    (window as Window & { demoStorageReads?: string[] }).demoStorageReads = [];
    Storage.prototype.getItem = function getItem(key: string) {
      if (key.startsWith("sb_")) (window as Window & { demoStorageReads?: string[] }).demoStorageReads?.push(key);
      return nativeGet.call(this, key);
    };
    localStorage.setItem("sb_license:camera-ingest-preflight", "REAL_LICENSE_SHOULD_NOT_BE_READ");
    localStorage.setItem("sb_migration_layouts:camera-ingest-preflight", "[]");
  });
  await page.goto("/?demo=1");
  await expect(page).toHaveTitle("Demo — Camera Ingest Preflight");
  await expect(page.getByText("Demo — sample data, nothing is saved.")).toBeVisible();
  await expect(page.locator("#report-body tr")).toHaveCount(4);
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.locator("#summary-review")).toHaveText("3");
  await expect(page.getByRole("link", { name: "Start for real" })).toHaveAttribute("href", "/");
  expect(await page.evaluate(() => (window as Window & { demoStorageReads?: string[] }).demoStorageReads)).toEqual([]);
  const origin = new URL(page.url()).origin;
  expect(requests.filter((url) => new URL(url).origin !== origin)).toEqual([]);
});

for (const path of ["/privacy/", "/terms/"]) {
  test(`${path} is semantic, accessible, and has product metadata`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /social-card\.webp$/);
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await skip.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  });
}

test("site has required social metadata, a static 404 document, and no SPA fallback", () => {
  const index = readFileSync(resolve(root, "dist/site/index.html"), "utf8");
  const notFound = readFileSync(resolve(root, "dist/site/404.html"), "utf8");
  const config = JSON.parse(readFileSync(resolve(root, "dist/site/staticwebapp.config.json"), "utf8")) as { responseOverrides: { "404": { rewrite: string } }; navigationFallback?: unknown; routes: Array<{ route: string; rewrite?: string }> };
  expect(index).toContain('rel="canonical"');
  expect(index).toContain('property="og:image"');
  expect(index).toContain('rel="apple-touch-icon"');
  expect(index).toContain(`name="build-id" content="${spawnSync("git", ["rev-parse", "--short=12", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim()}"`);
  expect(notFound).toContain("This page was not found.");
  expect(config.navigationFallback).toBeUndefined();
  expect(config.responseOverrides["404"].rewrite).toBe("/404.html");
  expect(config.routes).toContainEqual({ route: "/demo", rewrite: "/demo/index.html" });
});

test("mobile layout keeps the primary action and CLI-backed report operable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const install = page.getByRole("link", { name: "Install the scanner" });
  await expect(install).toBeVisible();
  await page.getByRole("button", { name: "Try it with sample data" }).first().click();
  await expect(page.locator("#report-body").getByText("DCIM/RICOH_001.JPG", { exact: true })).toBeVisible();
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

test("@regression:demo-banner-touch-targets both demo actions are at least 44px on desktop and mobile", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/demo/");
    for (const control of [
      page.getByRole("button", { name: "Reset demo" }),
      page.getByRole("link", { name: "Start for real" })
    ]) {
      const box = await control.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test("@claim:checkout-status the site does not offer the known-broken checkout as a purchase action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("New purchases are temporarily unavailable.", { exact: true })).toBeVisible();
  await expect(page.locator('a[href*="/products/camera-ingest-preflight/checkout"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Have a license? Restore it" })).toBeVisible();
  await page.goto("/terms/");
  await expect(page.locator("main")).toContainText("New purchases are unavailable while checkout registration is completed.");
});

test("@claim:offline-reload production worker precaches the demo fixture and offline reload stays interactive", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const worker = readFileSync(resolve(root, "dist/site/sw.js"), "utf8");
  expect(worker).not.toContain("__PRECACHE_MANIFEST__");
  expect(worker).not.toContain("__CACHE_NAME__");
  expect(worker).toMatch(/const cacheName = "camera-preflight-shell-[a-f0-9]{12}"/);
  expect(worker).toContain('"/demo-fixtures.json"');

  await page.goto("/?demo=1");
  await expect(page.locator("#report-body tr")).toHaveCount(4);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.context().setOffline(true);

  const missingAsset = await page.evaluate(() => fetch("/assets/missing-regression.js")
    .then(async (response) => ({ resolved: true, body: await response.text() }))
    .catch(() => ({ resolved: false, body: "" })));
  expect(missingAsset.resolved).toBe(false);
  expect(missingAsset.body).not.toContain("<!doctype html");
  errors.length = 0;
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#report-body tr")).toHaveCount(4);
  expect(errors).toEqual([]);
  await context.close();
});

test("Azure static deployment config preserves response policies and immutable assets", () => {
  const config = JSON.parse(readFileSync(resolve(root, "dist/site/staticwebapp.config.json"), "utf8")) as {
    globalHeaders: Record<string, string>;
    routes: Array<{ route: string; headers: Record<string, string> }>;
  };
  expect(config.globalHeaders["Content-Security-Policy"]).toContain("default-src 'self'");
  expect(config.globalHeaders["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
  expect(config.globalHeaders["X-Content-Type-Options"]).toBe("nosniff");
  expect(config.routes).toEqual(expect.arrayContaining([
    { route: "/assets/*", headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
    { route: "/camera-blueprint.webp", headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
    { route: "/social-card.webp", headers: { "Cache-Control": "public, max-age=31536000, immutable" } }
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
  await expect(page.getByText("License no longer active. Check the token or restore another license.")).toBeVisible();
  expect(requests).toBe(1);
  await expect(page.locator("#unlocked-view")).toBeHidden();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), licenseKey)).toBe(replacement);
  expect(new URL(page.url()).searchParams.has("license")).toBe(false);
});

test("@claim:license-verification returned and restored tokens verify immediately while cached verdicts are token-bound", async ({ page }) => {
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
  await page.getByRole("button", { name: "Forget license on this device" }).click();
  await page.getByRole("button", { name: "Have a license? Restore it" }).click();
  await page.getByLabel("License token").fill("RESTORED_VALID_TOKEN");
  await page.getByRole("button", { name: "Verify license" }).click();
  await expect(page.locator("#unlocked-view")).toBeVisible();
  expect(requests).toBe(2);
});

test("@claim:license-daily-check unchanged verified tokens do not make another verification request within a day", async ({ page }) => {
  const token = "CACHED_VALID_TOKEN";
  await seedLicense(page, token, true);
  let requests = 0;
  await page.route("**/api/v1/products/camera-ingest-preflight/verify?license=*", async (route) => {
    requests += 1;
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok" }) });
  });
  await page.goto("/");
  await expect(page.getByText("License verified on this device.")).toBeVisible();
  expect(requests).toBe(0);
});

test("@claim:migration-brief a verified license generates, prints, and downloads PhotoPrism and Lightroom briefs", async ({ page }) => {
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

  await page.getByLabel("Destination").selectOption("lightroom");
  await page.getByRole("button", { name: "Generate migration brief" }).click();
  await expect(brief.getByRole("heading", { name: "Lightroom migration brief" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download text brief" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("camera-ingest-migration-brief.txt");
  expect(await download.createReadStream().then(async (stream) => {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString("utf8");
  })).toContain("Lightroom migration brief");

  await page.getByRole("button", { name: "Print brief" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.printedMigrationBrief)).toBe("true");
});

test("@claim:paid-layouts saved destination and order layouts persist, load, and delete on this browser", async ({ page }) => {
  await page.route("**/api/v1/products/camera-ingest-preflight/verify?license=*", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok" }) });
  });
  await page.goto("/?license=VALID_LAYOUT_TOKEN");
  await expect(page.locator("#unlocked-view")).toBeVisible();
  await page.getByLabel("Destination").selectOption("lightroom");
  await page.getByLabel("Brief order").selectOption("format");
  await page.getByLabel("Layout name").fill("Lightroom archive");
  await page.getByRole("button", { name: "Save layout" }).click();
  await expect(page.getByText("Saved Lightroom archive on this browser.")).toBeVisible();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), layoutKey)).toContain("Lightroom archive");

  await page.reload();
  await expect(page.getByLabel("Saved layouts")).toContainText("Lightroom archive — Lightroom");
  await page.getByLabel("Destination").selectOption("photoprism");
  await page.getByLabel("Brief order").selectOption("priority");
  await page.getByLabel("Saved layouts").selectOption({ label: "Lightroom archive — Lightroom" });
  await page.getByRole("button", { name: "Load", exact: true }).click();
  await expect(page.getByLabel("Destination")).toHaveValue("lightroom");
  await expect(page.getByLabel("Brief order")).toHaveValue("format");
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByLabel("Saved layouts")).toHaveText("No saved layouts");
});

test("@claim:license-revocation a revoked cached license locks paid layouts after the daily check", async ({ page }) => {
  const token = "PREVIOUSLY_VALID_TOKEN";
  const verdict = { ...verdictFor(token, true), checkedAt: Date.now() - 86_400_001 };
  await page.addInitScript(({ licenseKey, verdictKey, token, verdict }) => {
    localStorage.setItem(licenseKey, token);
    localStorage.setItem(verdictKey, JSON.stringify(verdict));
  }, { licenseKey, verdictKey, token, verdict });
  let requests = 0;
  await page.route("**/api/v1/products/camera-ingest-preflight/verify?license=*", async (route) => {
    requests += 1;
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ valid: false, reason: "revoked" }) });
  });
  await page.goto("/");
  await expect(page.getByText("License no longer active. Check the token or restore another license.")).toBeVisible();
  await expect(page.locator("#locked-view")).toBeVisible();
  await expect(page.locator("#unlocked-view")).toBeHidden();
  expect(requests).toBe(1);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), verdictKey)).toMatchObject({ valid: false, reason: "revoked" });
});

test("@claim:pasted-report-privacy a pasted report remains in the page and creates no report upload request", async ({ page }) => {
  await page.route("**/api/v1/products/camera-ingest-preflight/verify?license=*", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok" }) });
  });
  await page.goto("/?license=LOCAL_REPORT_TOKEN");
  await expect(page.locator("#unlocked-view")).toBeVisible();
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.getByRole("button", { name: "Load sample report" }).click();
  await expect(page.locator("#brief-output")).toBeVisible();
  expect(requests.filter((url) => new URL(url).origin !== new URL(page.url()).origin)).toEqual([]);
  await expect(page.locator("#migration-report")).toHaveValue(/"files_scanned": 4/);
});

test("@claim:local-demo-privacy the normal sample demo uses only local fixed records and has no file picker", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await page.getByRole("button", { name: "Try it with sample data" }).first().click();
  await expect(page.locator("#report-body").getByText("Proprietary Insta360 original requires vendor conversion or a tested downstream decoder.")).toBeVisible();
  const origin = new URL(page.url()).origin;
  expect(requests.filter((url) => new URL(url).origin !== origin)).toEqual([]);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});

test("@claim:open-source MIT license and source link ship with the scanner", async ({ page }) => {
  expect(readFileSync(resolve(root, "LICENSE"), "utf8")).toContain("Permission is hereby granted, free of charge");
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Source and release binaries" })).toHaveAttribute("href", /github\.com\/B-Divyesh\/sf-camera-ingest-preflight$/);
});
