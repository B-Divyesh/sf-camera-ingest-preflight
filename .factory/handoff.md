# Camera Ingest Preflight — repair handoff

## Release status

Repair of `a8473f6aaf17144f3b4894fa1ef261bbbb762474` is complete. This repair preserves the Rust CLI and the Vite static-site deployment class.

## Fixed release blockers

- The service worker now precaches the built JS and CSS and falls back to the app shell only for navigations; an unavailable asset rejects rather than returning HTML.
- The precache cache name is derived from release content. A new worker therefore gets a fresh cache during an update instead of mixing its files with a previous shell cache.
- Cache lookup intentionally ignores `Vary` for immutable same-origin assets, so a module request can reuse the `cache.addAll` response while offline.
- The regression suite now uses a production `vite preview`, not the development server (which correctly serves the unexpanded service-worker template).
- The existing Azure Static Web Apps configuration carries CSP, Permissions-Policy, nosniff, referrer policy, and immutable caching for hashed assets and the hero; its assertions remain in browser tests.
- The preceding repair's TypeScript, skip-link focus, and 44 px wordmark changes remain included.

## Verification

Clean release command completed on 2026-08-28:

```sh
npm ci
npm test
npm run typecheck
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package
```

- `npm ci`: 23 packages, 0 vulnerabilities.
- `npm test`: 7 Rust tests and 7 production-browser Playwright tests passed. Browser coverage includes desktop, 390×844 mobile serious/critical axe checks, keyboard skip focus, legal pages, production offline reload, asset-fallback rejection, and deployment-policy configuration.
- `npm run typecheck`, `npm run build`, `cargo fmt --check`, `cargo clippy --all-targets --all-features -- -D warnings`, and `cargo package` passed.
- Package output: `target/package/camera-ingest-preflight-0.1.0.crate` (about 15 KB). It is ready for factory publishing; it was not published.
- Local mobile Lighthouse (Chrome 145, production preview): Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.5 s, LCP 1.5 s, TBT 0 ms, CLS 0.
- Final built assets: main JS 5.37 KB, shared CSS 12.98 KB, hero WebP 81 KB; no remote fonts or scripts.

## Deploy and live checks

- Deployed `dist/site/` to Azure Static Web Apps with `/opt/fleet/lib/deploy-static.sh camera-ingest-preflight dist/site`; deployment ID `28ebe66f-f0f7-4665-b3c7-42df93e4946d` completed successfully.
- Live URL: `https://camera-ingest-preflight.sociobot.in/`. The live HTML SHA-256 is `5af727b6b007e7c92f97ca57f3ef4cee16310d10811d90958d65aa3cbdc5b77a`, byte-identical to `dist/site/index.html`.
- `/opt/fleet/lib/verify-url.sh` passed: 200 response, title, `lang=en`, one h1/main, zero missing image alts, zero console/page errors, and 642 ms load measurement.
- Live 390×844 fresh-profile check passed: service worker controlled the page; offline reload remained interactive; sample scan rendered; axe reported zero serious/critical issues; console errors were zero.
- Live `/` returns CSP, Permissions-Policy, nosniff, and referrer policy. Fingerprinted JS returns `Cache-Control: public, max-age=31536000, immutable` plus the same browser policies.

## Known limitations

- Proprietary `.insp`/`.insv` originals remain honestly flagged for vendor conversion; the CLI does not decode or stitch them.
- RAW preview discovery is bounded to the first 24 MiB and container-specific 360 metadata is intentionally conservative.
- Checkout/verification needs a factory-issued Sociobot license token; the free scanner and exports never depend on it.
