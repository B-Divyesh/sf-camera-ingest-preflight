import { defineConfig } from "vite";
import type { Plugin } from "vite";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const siteOutDir = resolve(__dirname, "dist/site");

function prebuiltServiceWorker(): Plugin {
  return {
    name: "precache-built-site-shell",
    apply: "build",
    async writeBundle() {
      const workerPath = resolve(siteOutDir, "sw.js");
      const assetDir = resolve(siteOutDir, "assets");
      const assets = (await readdir(assetDir, { withFileTypes: true }))
        .filter((entry) => entry.isFile())
        .map((entry) => `/assets/${entry.name}`)
        .sort();
      const shell = ["/", "/privacy/", "/terms/", "/camera-blueprint.webp", "/favicon.svg", ...assets];
      const worker = await readFile(workerPath, "utf8");

      if (!worker.includes("__PRECACHE_MANIFEST__")) {
        throw new Error("Service worker precache manifest placeholder is missing");
      }

      await writeFile(workerPath, worker.replace("__PRECACHE_MANIFEST__", JSON.stringify(shell)));
    }
  };
}

export default defineConfig({
  root: "site",
  plugins: [prebuiltServiceWorker()],
  build: {
    outDir: siteOutDir,
    emptyOutDir: true,
    target: "es2022",
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "site/index.html"),
        privacy: resolve(__dirname, "site/privacy/index.html"),
        terms: resolve(__dirname, "site/terms/index.html")
      }
    }
  }
});
