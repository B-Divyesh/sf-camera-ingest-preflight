import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "site/public/demo-fixtures.json");
const profiles = ["generic", "photoprism", "lightroom"];

function runBundledDemo(profile) {
  let stdout = "";
  try {
    stdout = execFileSync("cargo", ["run", "--quiet", "--", "demo", "--profile", profile], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    // A demo with review findings deliberately exits 1. Any other exit still
    // leaves its stderr attached so a failed fixture build is actionable.
    if (error.status !== 1 || !error.stdout) throw error;
    stdout = error.stdout;
  }
  const folder = stdout.match(/^DEMO   sample card and JSON report → (.+)$/m)?.[1];
  if (!folder) throw new Error(`Bundled ${profile} demo did not announce its report folder.`);
  return { folder, stdout };
}

const fixtures = {};
for (const profile of profiles) {
  const { folder, stdout } = runBundledDemo(profile);
  const report = JSON.parse(await readFile(resolve(folder, "preflight-demo.json"), "utf8"));
  // The source card is the real bundled CLI fixture. Remove only values that
  // are deliberately different on every run so the checked-in demo is stable.
  report.root = "<temporary demo folder>/card";
  report.generated_unix_seconds = 0;
  fixtures[profile] = {
    report,
    transcript: stdout.replaceAll(folder, "<temporary demo folder>")
  };
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(fixtures, null, 2)}\n`);
console.log(`Wrote CLI-derived demo fixture: ${output}`);
