import "./styles.css";

const slug = "camera-ingest-preflight";
const apiBase = "https://api.sociobot.in/api/v1";
const licenseKey = `sb_license:${slug}`;
const verdictKey = `sb_license_verdict:${slug}`;
const day = 86_400_000;

type Verdict = { valid: boolean; reason?: string; checkedAt: number };
type SampleRow = { verdict: string; className: string; file: string; format: string; preview: string; projection: string; camera: string; finding: string };

const samples: Record<string, SampleRow[]> = {
  photoprism: [
    { verdict: "READY", className: "pass", file: "DCIM/RICOH_001.JPG", format: "JPG", preview: "n/a", projection: "Equirect.", camera: "RICOH THETA Z1", finding: "GPano tag found" },
    { verdict: "REVIEW", className: "warn", file: "DCIM/SONY_A73_042.ARW", format: "ARW", preview: "Missing", projection: "Unknown", camera: "SONY ILCE-7M3", finding: "No JPEG preview" },
    { verdict: "REJECT", className: "fault", file: "DCIM/VID_018.INSV", format: "INSV", preview: "n/a", projection: "Candidate", camera: "n/a", finding: "Vendor conversion needed" },
    { verdict: "REVIEW", className: "warn", file: "DCIM/FISHEYE_007.DNG", format: "DNG", preview: "Available", projection: "Fisheye", camera: "Make only", finding: "Camera model missing" }
  ],
  lightroom: [],
  generic: []
};
samples.lightroom = samples.photoprism.map((row) => row.file.endsWith(".ARW") ? { ...row, verdict: "READY", className: "pass", finding: "Accepted RAW + preview risk" } : row);
samples.generic = samples.photoprism.map((row) => row.file.endsWith(".DNG") ? { ...row, finding: "Verify fisheye handling" } : row);

function byId<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing #${id}`);
  return value as T;
}

function renderRows(profile: string): void {
  const body = byId<HTMLTableSectionElement>("report-body");
  const rows = samples[profile] ?? samples.photoprism;
  body.replaceChildren(...rows.map((row) => {
    const tr = document.createElement("tr");
    const values = [
      `<span class="status ${row.className}">${row.verdict}</span>`,
      `<strong>${row.file}</strong><small>${row.format}</small>`,
      row.preview, row.projection, row.camera, row.finding
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

function runDemo(): void {
  const shell = document.querySelector<HTMLElement>(".report-shell");
  const profile = byId<HTMLSelectElement>("profile").value;
  if (!shell) return;
  byId("report-empty").hidden = true;
  byId("report-error").hidden = true;
  byId("report-results").hidden = true;
  byId("report-loading").hidden = false;
  shell.setAttribute("aria-busy", "true");
  document.querySelector("#demo")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  window.setTimeout(() => {
    try {
      renderRows(profile);
      byId("report-profile").textContent = profile.toUpperCase();
      byId("report-loading").hidden = true;
      byId("report-results").hidden = false;
    } catch {
      byId("report-loading").hidden = true;
      byId("report-error").hidden = false;
    } finally {
      shell.setAttribute("aria-busy", "false");
    }
  }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650);
}

document.querySelectorAll<HTMLButtonElement>("[data-run-demo]").forEach((button) => button.addEventListener("click", runDemo));

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

function cachedVerdict(): Verdict | null {
  try {
    const value = JSON.parse(localStorage.getItem(verdictKey) ?? "null") as Verdict | null;
    return value && typeof value.checkedAt === "number" ? value : null;
  } catch { return null; }
}

function showLicense(valid: boolean, message = ""): void {
  byId("locked-view").hidden = valid;
  byId("unlocked-view").hidden = !valid;
  byId("license-message").textContent = message;
}

async function verifyLicense(token: string, force = false): Promise<void> {
  const cached = cachedVerdict();
  if (!force && cached && Date.now() - cached.checkedAt < day) {
    showLicense(cached.valid, cached.valid ? "License verified on this device." : "License no longer active. You can restore another token or buy again.");
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
    const verdict: Verdict = { valid: result.valid, reason: result.reason, checkedAt: Date.now() };
    localStorage.setItem(verdictKey, JSON.stringify(verdict));
    showLicense(result.valid, result.valid ? "License verified. Migration set unlocked." : "License no longer active. Check the token or buy a new license.");
  } catch {
    showLicense(Boolean(cached?.valid), "License check is temporarily unavailable. Try again; the free scanner is unaffected.");
  }
}

function acceptReturnedLicense(): string | null {
  const url = new URL(window.location.href);
  const returned = url.searchParams.get("license");
  if (!returned) return localStorage.getItem(licenseKey);
  localStorage.setItem(licenseKey, returned);
  url.searchParams.delete("license");
  history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  return returned;
}

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
  localStorage.setItem(licenseKey, token);
  void verifyLicense(token, true);
});

byId("forget-license").addEventListener("click", () => {
  localStorage.removeItem(licenseKey);
  localStorage.removeItem(verdictKey);
  showLicense(false, "License removed from this device.");
});

function updateNetwork(): void {
  byId("offline-notice").hidden = navigator.onLine;
}
window.addEventListener("online", updateNetwork);
window.addEventListener("offline", updateNetwork);
byId("retry-network").addEventListener("click", () => {
  updateNetwork();
  const token = localStorage.getItem(licenseKey);
  if (token && navigator.onLine) void verifyLicense(token, true);
});
updateNetwork();

const token = acceptReturnedLicense();
const cached = cachedVerdict();
if (cached?.valid) showLicense(true, "License restored from the last verified check.");
if (token) void verifyLicense(token);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => void navigator.serviceWorker.register("/sw.js"));
}
