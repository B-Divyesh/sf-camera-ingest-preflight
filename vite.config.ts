import { defineConfig } from "vite";
import type { Plugin } from "vite";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const siteOutDir = resolve(__dirname, "dist/site");
const buildId = process.env.BUILD_ID ?? (() => {
  try { return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { cwd: __dirname, encoding: "utf8" }).trim(); }
  catch { return "local"; }
})();

function buildIdentity(): Plugin {
  return {
    name: "stamp-build-identity",
    transformIndexHtml(html) {
      return html.replaceAll("__BUILD_ID__", buildId);
    }
  };
}

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
      const shell = [
        "/", "/demo/", "/privacy/", "/terms/", "/404.html",
        "/camera-blueprint.webp", "/social-card.webp", "/favicon.svg", "/apple-touch-icon.png",
        "/demo-fixtures.json", ...assets
      ];
      const worker = await readFile(workerPath, "utf8");

      if (!worker.includes("__PRECACHE_MANIFEST__") || !worker.includes("__CACHE_NAME__")) {
        throw new Error("Service worker build placeholders are missing");
      }

      // A unique cache makes an update atomic: the new worker never fills a
      // previous release's shell cache with responses intercepted by that old worker.
      const revision = createHash("sha256");
      for (const path of shell) {
        const relative = path === "/" ? "index.html" : path.endsWith("/") ? `${path.slice(1)}index.html` : path.slice(1);
        revision.update(await readFile(resolve(siteOutDir, relative)));
      }
      const cacheName = `camera-preflight-shell-${revision.digest("hex").slice(0, 12)}`;
      await writeFile(workerPath, worker
        .replace("__CACHE_NAME__", cacheName)
        .replace("__PRECACHE_MANIFEST__", JSON.stringify(shell)));
    }
  };
}

function demoDocument(): Plugin {
  return {
    name: "render-demo-from-landing-document",
    enforce: "pre",
    async transformIndexHtml(html, context) {
      if (!context.filename?.endsWith("site/demo/index.html")) return html;
      const landing = await readFile(resolve(__dirname, "site/index.html"), "utf8");
      const body = landing.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1];
      if (!body) throw new Error("Could not read the landing-page body for /demo/.");
      return html.replace("<!--APP_BODY-->", body);
    }
  };
}

export default defineConfig({
  root: "site",
  plugins: [demoDocument(), buildIdentity(), prebuiltServiceWorker()],
  build: {
    outDir: siteOutDir,
    emptyOutDir: true,
    target: "es2022",
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "site/index.html"),
        demo: resolve(__dirname, "site/demo/index.html"),
        privacy: resolve(__dirname, "site/privacy/index.html"),
        terms: resolve(__dirname, "site/terms/index.html"),
        notFound: resolve(__dirname, "site/404.html")
      }
    }
  }
});
