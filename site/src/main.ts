import "./styles.css";

const slug = "camera-ingest-preflight";
const apiBase = "https://api.sociobot.in/api/v1";
const licenseKey = `sb_license:${slug}`;
const verdictKey = `sb_license_verdict:${slug}`;
const layoutKey = `sb_migration_layouts:${slug}`;
const day = 86_400_000;
const pageUrl = new URL(window.location.href);
const demoMode = pageUrl.pathname === "/demo" || pageUrl.pathname === "/demo/" || pageUrl.searchParams.get("demo") === "1";

type Verdict = { valid: boolean; reason?: string; checkedAt: number; tokenFingerprint: string };
type MigrationTarget = "photoprism" | "lightroom";
type DemoProfile = MigrationTarget | "generic";
type SavedLayout = { id: string; name: string; target: MigrationTarget; order: "priority" | "format"; savedAt: number };
type ReportFile = {
  path?: string;
  extension?: string;
  embedded_preview?: string;
  support?: { status?: string; reason?: string };
  findings?: Array<{ code?: string; message?: string; severity?: string }>;
  projection?: { kind?: string };
  camera?: { status?: string; make?: string | null; model?: string | null };
};
type MigrationReport = {
  root?: string;
  profile?: string;
  privacy?: { gps_coordinates_included?: boolean };
  summary: { files_scanned: number; ready: number; review: number; rejected: number; duplicate_files?: number; gps_files?: number };
  files: ReportFile[];
};
type DemoFixture = { report: MigrationReport; transcript: string };
type DemoFixtures = Record<DemoProfile, DemoFixture>;

let fixturePromise: Promise<DemoFixtures> | undefined;

function byId<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing #${id}`);
  return value as T;
}

function demoFixtures(): Promise<DemoFixtures> {
  fixturePromise ??= fetch("/demo-fixtures.json", { cache: "force-cache" }).then(async (response) => {
    if (!response.ok) throw new Error("demo fixture unavailable");
    return response.json() as Promise<DemoFixtures>;
  });
  return fixturePromise;
}

function fileVerdict(file: ReportFile): { label: string; className: string } {
  const findings = file.findings ?? [];
  if (file.support?.status === "rejected" || findings.some((finding) => finding.severity === "error")) return { label: "REJECT", className: "fault" };
  if (file.support?.status === "review" || findings.some((finding) => finding.severity === "warning")) return { label: "REVIEW", className: "warn" };
  return { label: "READY", className: "pass" };
}

function previewLabel(value?: string): string {
  return value === "not_applicable" ? "n/a" : value ? value.replaceAll("_", " ") : "unknown";
}

function cameraLabel(file: ReportFile): string {
  const camera = file.camera;
  if (!camera || camera.status === "not_applicable") return "n/a";
  if (camera.status === "missing") return "Missing";
  return [camera.make, camera.model].filter(Boolean).join(" ") || camera.status || "unknown";
}

function renderRows(report: MigrationReport): void {
  const body = byId<HTMLTableSectionElement>("report-body");
  body.replaceChildren(...report.files.map((file) => {
    const verdict = fileVerdict(file);
    const finding = (file.findings ?? []).find((item) => item.severity === "error" || item.severity === "warning")?.message
      ?? file.support?.reason ?? "No finding.";
    const tr = document.createElement("tr");
    const values = [
      `<span class="status ${verdict.className}">${verdict.label}</span>`,
      `<strong>${file.path ?? "Unnamed file"}</strong><small>${(file.extension ?? "unknown").toUpperCase()}</small>`,
      previewLabel(file.embedded_preview), file.projection?.kind ?? "unknown", cameraLabel(file), finding
    ];
    const labels = ["Verdict", "Original", "Preview", "Projection", "Camera", "Finding"];
    values.forEach((value, index) => {
      const td = document.createElement("td");
      td.dataset.label = labels[index];
      td.innerHTML = value;
      tr.append(td);
    });
    return tr;
  }));
}

function renderSummary(report: MigrationReport, profile: string): void {
  byId("report-profile").textContent = profile.toUpperCase();
  byId("summary-files").textContent = String(report.summary.files_scanned);
  byId("summary-ready").textContent = String(report.summary.ready);
  byId("summary-review").textContent = String(report.summary.review);
  byId("summary-reject").textContent = String(report.summary.rejected);
  byId("gps-file-count").textContent = String(report.summary.gps_files ?? 0);
}

async function runDemo(): Promise<void> {
  const shell = document.querySelector<HTMLElement>(".report-shell");
  const profile = byId<HTMLSelectElement>("profile").value as DemoProfile;
  if (!shell) return;
  byId("report-empty").hidden = true;
  byId("report-error").hidden = true;
  byId("report-results").hidden = true;
  byId("report-loading").hidden = false;
  shell.setAttribute("aria-busy", "true");
  document.querySelector("#demo")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  const reveal = async () => {
    try {
      const fixture = (await demoFixtures())[profile];
      renderRows(fixture.report);
      renderSummary(fixture.report, profile);
      byId("demo-transcript").textContent = fixture.transcript;
      byId("report-loading").hidden = true;
      byId("report-results").hidden = false;
    } catch {
      byId("report-loading").hidden = true;
      byId("report-error").hidden = false;
    } finally {
      shell.setAttribute("aria-busy", "false");
    }
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || demoMode) await reveal();
  else window.setTimeout(() => void reveal(), 650);
}

document.querySelectorAll<HTMLButtonElement>("[data-run-demo]").forEach((button) => button.addEventListener("click", () => void runDemo()));

document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const command = button.dataset.copy ?? "";
    try {
      await navigator.clipboard.writeText(command);
      byId("copy-status").textContent = "Install command copied.";
      button.textContent = "Copied";
    } catch {
      byId("copy-status").textContent = `Copy unavailable. Select this command: ${command}`;
    }
  });
});

async function fingerprintToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

async function cachedVerdict(token: string): Promise<Verdict | null> {
  try {
    const value = JSON.parse(localStorage.getItem(verdictKey) ?? "null") as Verdict | null;
    if (!value || typeof value.checkedAt !== "number" || typeof value.tokenFingerprint !== "string") {
      // Verdicts from releases before token binding are never safe to reuse.
      localStorage.removeItem(verdictKey);
      return null;
    }
    return value.tokenFingerprint === await fingerprintToken(token) ? value : null;
  } catch {
    localStorage.removeItem(verdictKey);
    return null;
  }
}

function storeLicense(token: string): void {
  const previous = localStorage.getItem(licenseKey);
  localStorage.setItem(licenseKey, token);
  if (previous !== token) localStorage.removeItem(verdictKey);
}

function showLicense(valid: boolean, message = ""): void {
  byId("locked-view").hidden = valid;
  byId("unlocked-view").hidden = !valid;
  byId("license-message").textContent = message;
}

async function verifyLicense(token: string, force = false): Promise<void> {
  const cached = await cachedVerdict(token);
  if (!force && cached && Date.now() - cached.checkedAt < day) {
    showLicense(cached.valid, cached.valid ? "License verified on this device." : "License no longer active. Restore another token; new purchases are temporarily unavailable.");
    return;
  }
  if (!navigator.onLine) {
    showLicense(Boolean(cached?.valid), cached?.valid ? "Using the last verified license while offline." : "Connect to verify this license. The free scanner remains available.");
    return;
  }
  byId("license-message").textContent = "Verifying license…";
  try {
    const response = await fetch(`${apiBase}/products/${slug}/verify?license=${encodeURIComponent(token)}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("verification service unavailable");
    const result = await response.json() as { valid: boolean; reason?: string };
    if (localStorage.getItem(licenseKey) !== token) return;
    const verdict: Verdict = { valid: result.valid, reason: result.reason, checkedAt: Date.now(), tokenFingerprint: await fingerprintToken(token) };
    localStorage.setItem(verdictKey, JSON.stringify(verdict));
    showLicense(result.valid, result.valid ? "License verified. Migration set unlocked." : "License no longer active. Check the token or restore another license.");
  } catch {
    if (localStorage.getItem(licenseKey) !== token) return;
    showLicense(Boolean(cached?.valid), "License check is temporarily unavailable. Try again; the free scanner is unaffected.");
  }
}

function acceptReturnedLicense(): { token: string | null; force: boolean } {
  const url = new URL(window.location.href);
  const returned = url.searchParams.get("license");
  if (!returned) return { token: localStorage.getItem(licenseKey), force: false };
  storeLicense(returned);
  url.searchParams.delete("license");
  history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  // Checkout returns and manual restores must be reconciled immediately; a
  // daily verdict for another token must never decide this token's access.
  return { token: returned, force: true };
}

function updateNetwork(): void {
  byId("offline-notice").hidden = navigator.onLine;
}

function initializeLicense(): void {
  document.querySelector<HTMLButtonElement>(".restore-toggle")?.addEventListener("click", (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    const form = byId<HTMLFormElement>("restore-form");
    form.hidden = !form.hidden;
    button.setAttribute("aria-expanded", String(!form.hidden));
    if (!form.hidden) byId<HTMLInputElement>("license-token").focus();
  });

  byId<HTMLFormElement>("restore-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = byId<HTMLInputElement>("license-token");
    const token = input.value.trim();
    if (token.length < 8) {
      byId("license-message").textContent = "Paste the complete license token from your receipt.";
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    input.removeAttribute("aria-invalid");
    storeLicense(token);
    void verifyLicense(token, true);
  });

  byId("forget-license").addEventListener("click", () => {
    localStorage.removeItem(licenseKey);
    localStorage.removeItem(verdictKey);
    showLicense(false, "License removed from this device.");
  });

  window.addEventListener("online", updateNetwork);
  window.addEventListener("offline", updateNetwork);
  byId("retry-network").addEventListener("click", () => {
    updateNetwork();
    const token = localStorage.getItem(licenseKey);
    if (token && navigator.onLine) void verifyLicense(token, true);
  });
  updateNetwork();

  const returnedLicense = acceptReturnedLicense();
  if (returnedLicense.token) void verifyLicense(returnedLicense.token, returnedLicense.force);
}

function migrationTargetLabel(target: MigrationTarget): string {
  return target === "photoprism" ? "PhotoPrism" : "Lightroom";
}

function readLayouts(): SavedLayout[] {
  try {
    const value = JSON.parse(localStorage.getItem(layoutKey) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((layout): layout is SavedLayout => Boolean(
      layout && typeof layout === "object" &&
      typeof (layout as SavedLayout).id === "string" &&
      typeof (layout as SavedLayout).name === "string" &&
      ((layout as SavedLayout).target === "photoprism" || (layout as SavedLayout).target === "lightroom") &&
      ((layout as SavedLayout).order === "priority" || (layout as SavedLayout).order === "format")
    ));
  } catch { return []; }
}

function writeLayouts(layouts: SavedLayout[]): void {
  localStorage.setItem(layoutKey, JSON.stringify(layouts));
}

function setMigrationStatus(message: string, error = false): void {
  const status = byId("migration-status");
  status.textContent = message;
  status.classList.toggle("status-error", error);
}

function renderLayouts(selectedId = ""): void {
  const select = byId<HTMLSelectElement>("saved-layout-list");
  const layouts = readLayouts();
  select.replaceChildren();
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = layouts.length ? "Choose a saved layout" : "No saved layouts";
  select.append(empty);
  for (const layout of layouts) {
    const option = document.createElement("option");
    option.value = layout.id;
    option.textContent = `${layout.name} — ${migrationTargetLabel(layout.target)}`;
    option.selected = layout.id === selectedId;
    select.append(option);
  }
}

function reportFromInput(): MigrationReport | null {
  const input = byId<HTMLTextAreaElement>("migration-report");
  try {
    const report = JSON.parse(input.value) as Partial<MigrationReport>;
    const summary = report.summary;
    if (!summary || !Array.isArray(report.files) || ![summary.files_scanned, summary.ready, summary.review, summary.rejected].every((value) => typeof value === "number" && value >= 0)) {
      throw new Error("invalid report");
    }
    return report as MigrationReport;
  } catch {
    input.setAttribute("aria-invalid", "true");
    setMigrationStatus("Paste a Camera Ingest Preflight JSON report with summary and files arrays, then generate again.", true);
    return null;
  }
}

function noteForFile(file: ReportFile, target: MigrationTarget): string {
  const extension = (file.extension || "unknown").toUpperCase();
  const codes = new Set((file.findings ?? []).map((finding) => finding.code));
  const destination = migrationTargetLabel(target);
  if (codes.has("unsupported_format") || extension === "INSV") {
    return `${extension}: convert with the vendor application, keep the original, then rescan before ${destination} import.`;
  }
  if (codes.has("preview_missing")) {
    return `${extension}: keep the original and test preview handling in a small ${destination} import before the full card.`;
  }
  if (codes.has("orientation_invalid")) {
    return `${extension}: check orientation in a small ${destination} import; do not overwrite the original from this brief.`;
  }
  if (file.projection?.kind && !["flat", "unknown"].includes(file.projection.kind)) {
    return `${extension}: keep the ${file.projection.kind} projection note with this file for the ${destination} handoff.`;
  }
  if (file.camera?.status === "partial" || file.camera?.status === "missing") {
    return `${extension}: retain the camera metadata warning with the ${destination} handoff.`;
  }
  return `${extension}: retain the original and its scanner result with the ${destination} handoff.`;
}

function briefLines(report: MigrationReport, target: MigrationTarget, order: "priority" | "format"): string[] {
  const destination = migrationTargetLabel(target);
  const summary = report.summary;
  const rejects = report.files.filter((file) => file.support?.status === "rejected");
  const reviews = report.files.filter((file) => file.support?.status === "review" || (file.findings ?? []).some((finding) => finding.severity === "warning"));
  const ready = report.files.filter((file) => !rejects.includes(file) && !reviews.includes(file));
  const lines = [
    `${destination} migration brief`,
    `Source profile: ${report.profile ?? "not recorded"}`,
    `Files scanned: ${summary.files_scanned}; ready: ${summary.ready}; review: ${summary.review}; reject: ${summary.rejected}.`,
    "Exact GPS coordinates are not included in this brief.",
    "",
    "Priority queue"
  ];
  lines.push(`Quarantine before import (${rejects.length}): ${rejects.map((file) => file.path ?? "unnamed file").join(", ") || "none"}.`);
  lines.push(`Review in a small test import (${reviews.length}): ${reviews.map((file) => file.path ?? "unnamed file").join(", ") || "none"}.`);
  lines.push(`Keep with the planned import (${ready.length}): ${ready.map((file) => file.path ?? "unnamed file").join(", ") || "none"}.`);
  lines.push("", "Format-specific handoff notes");
  const files = order === "format"
    ? [...report.files].sort((left, right) => (left.extension ?? "").localeCompare(right.extension ?? "") || (left.path ?? "").localeCompare(right.path ?? ""))
    : [...rejects, ...reviews, ...ready];
  const uniqueNotes = [...new Set(files.map((file) => noteForFile(file, target)))];
  lines.push(...uniqueNotes.map((note) => `- ${note}`));
  return lines;
}

function appendTextElement(parent: HTMLElement, tag: string, text: string): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = text;
  parent.append(element);
  return element;
}

function generateMigrationBrief(): void {
  const report = reportFromInput();
  if (!report) return;
  const input = byId<HTMLTextAreaElement>("migration-report");
  input.removeAttribute("aria-invalid");
  const target = byId<HTMLSelectElement>("migration-target").value as MigrationTarget;
  const order = byId<HTMLSelectElement>("brief-order").value as "priority" | "format";
  const lines = briefLines(report, target, order);
  const output = byId("brief-output");
  output.replaceChildren();
  output.hidden = false;
  const documentTitle = appendTextElement(output, "h4", `${migrationTargetLabel(target)} migration brief`);
  documentTitle.id = "brief-title";
  output.setAttribute("aria-labelledby", documentTitle.id);
  appendTextElement(output, "p", `Source profile: ${report.profile ?? "not recorded"}. ${report.summary.files_scanned} files scanned.`);
  const stats = document.createElement("dl");
  stats.className = "brief-stats";
  for (const [label, value, className] of [["Ready", report.summary.ready, "pass"], ["Review", report.summary.review, "warn"], ["Reject", report.summary.rejected, "fault"]] as const) {
    const row = document.createElement("div");
    appendTextElement(row, "dt", label);
    const count = appendTextElement(row, "dd", String(value));
    count.className = className;
    stats.append(row);
  }
  output.append(stats);
  appendTextElement(output, "p", "Exact GPS coordinates are not included in this brief.").className = "brief-privacy";
  if (report.privacy?.gps_coordinates_included) appendTextElement(output, "p", "The source report contains exact GPS coordinates. This brief omits them; keep the source report private.").className = "privacy-warning";
  appendTextElement(output, "h5", "Priority queue");
  const queue = document.createElement("ol");
  for (const line of lines.slice(6, 9)) appendTextElement(queue, "li", line);
  output.append(queue);
  appendTextElement(output, "h5", "Format-specific handoff notes");
  const notes = document.createElement("ul");
  for (const line of lines.slice(11)) appendTextElement(notes, "li", line.replace(/^- /, ""));
  output.append(notes);
  appendTextElement(output, "p", "This brief is local-only. It names actions to check, not changes to make to originals.").className = "brief-privacy";
  byId("brief-export").hidden = false;
  output.dataset.text = lines.join("\n");
  setMigrationStatus("Migration brief generated. Print it, download it, or save this layout.");
  output.focus();
}

function saveLayout(): void {
  const nameInput = byId<HTMLInputElement>("layout-name");
  const name = nameInput.value.trim();
  if (name.length < 2) {
    nameInput.setAttribute("aria-invalid", "true");
    setMigrationStatus("Name the layout with at least two characters before saving.", true);
    nameInput.focus();
    return;
  }
  nameInput.removeAttribute("aria-invalid");
  const layout: SavedLayout = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    target: byId<HTMLSelectElement>("migration-target").value as MigrationTarget,
    order: byId<HTMLSelectElement>("brief-order").value as "priority" | "format",
    savedAt: Date.now()
  };
  const layouts = readLayouts().filter((existing) => existing.name.toLocaleLowerCase() !== name.toLocaleLowerCase());
  layouts.unshift(layout);
  writeLayouts(layouts.slice(0, 12));
  nameInput.value = "";
  renderLayouts(layout.id);
  setMigrationStatus(`Saved ${name} on this browser.`);
}

function loadLayout(): void {
  const id = byId<HTMLSelectElement>("saved-layout-list").value;
  const layout = readLayouts().find((item) => item.id === id);
  if (!layout) {
    setMigrationStatus("Choose a saved layout first.", true);
    return;
  }
  byId<HTMLSelectElement>("migration-target").value = layout.target;
  byId<HTMLSelectElement>("brief-order").value = layout.order;
  setMigrationStatus(`Loaded ${layout.name}. Your pasted report stays in this browser.`);
}

function deleteLayout(): void {
  const id = byId<HTMLSelectElement>("saved-layout-list").value;
  if (!id) {
    setMigrationStatus("Choose a saved layout to delete.", true);
    return;
  }
  const layout = readLayouts().find((item) => item.id === id);
  writeLayouts(readLayouts().filter((item) => item.id !== id));
  renderLayouts();
  setMigrationStatus(layout ? `Deleted ${layout.name}.` : "Deleted saved layout.");
}

function initializeMigrationWorkspace(): void {
  renderLayouts();
  byId("load-sample-report").addEventListener("click", () => {
    void demoFixtures().then((fixtures) => {
      byId<HTMLTextAreaElement>("migration-report").value = JSON.stringify(fixtures.photoprism.report, null, 2);
      generateMigrationBrief();
    }).catch(() => setMigrationStatus("The bundled sample report could not load. Try again.", true));
  });
  byId("generate-brief").addEventListener("click", generateMigrationBrief);
  byId("save-layout").addEventListener("click", saveLayout);
  byId("load-layout").addEventListener("click", loadLayout);
  byId("delete-layout").addEventListener("click", deleteLayout);
  byId("print-brief").addEventListener("click", () => window.print());
  byId("download-brief").addEventListener("click", () => {
    const output = byId("brief-output");
    const blob = new Blob([output.dataset.text ?? ""], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "camera-ingest-migration-brief.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
  });
}

function initializeDemoMode(): void {
  if (!demoMode) return;
  document.body.classList.add("demo-mode");
  document.title = "Demo — Camera Ingest Preflight";
  byId("demo-banner").hidden = false;
  byId("migration").hidden = true;
  byId("reset-demo").addEventListener("click", () => {
    byId<HTMLSelectElement>("profile").value = "photoprism";
    void runDemo();
  });
  void runDemo();
}

if (!demoMode) {
  initializeLicense();
  initializeMigrationWorkspace();
} else {
  updateNetwork();
}
initializeDemoMode();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => void navigator.serviceWorker.register("/sw.js"));
}
