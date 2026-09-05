import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const grepIndex = process.argv.indexOf("--grep");
const tag = grepIndex >= 0 ? process.argv[grepIndex + 1] : undefined;

if (!tag || !/^@claim:[a-z0-9-]+$/.test(tag)) {
  console.error("Usage: npm run claim -- --grep @claim:<id>");
  process.exit(2);
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const vite = resolve(root, "node_modules", ".bin", process.platform === "win32" ? "vite.cmd" : "vite");
const playwright = resolve(root, "node_modules", ".bin", process.platform === "win32" ? "playwright.cmd" : "playwright");

if (!existsSync(vite) || !existsSync(playwright)) {
  console.log("Claim prerequisites are missing; installing the locked npm dependencies first.");
  run(process.platform === "win32" ? "npm.cmd" : "npm", ["ci"]);
}

run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build:site"]);
run(playwright, ["test", "--grep", tag]);
