# Verification report — FAIL

**Work order:** `camera-ingest-preflight-verify-1`  
**Candidate:** `2c654d33aef25271ea84db08cc35157ba2188322` (`2c654d3`)  
**Live URL:** https://camera-ingest-preflight.sociobot.in/  
**Date:** 2026-08-28

## Decision

**FAIL — do not release this candidate.** The CLI itself and normal online site flow work, but the deployed product fails the required response-policy/caching checks and the PWA fails a first offline reload. These are fresh checks against the candidate and live URL, not a prior deployment report.

## Provenance and parity

- Fresh detached clean clone of the GitHub repository checked out exactly to `2c654d33aef25271ea84db08cc35157ba2188322`; initial worktree was clean.
- Live `/` is byte-identical to the candidate production build: both SHA-256 `d3dc3378ad3e27a3c1bf23ccebda35fdecb010d785e6a9a5012e84868836884c` (12,115 bytes).
- Live `/sw.js` is byte-identical to the candidate production build: both SHA-256 `daa8d102718f1cc0bc0188e13e64db28a4aead9e4c92df264a8b6eebca51ebd6` (956 bytes).
- The live document references the same `main-BVTuv62g.js`, `styles-CVyHdHkI.js`, and `styles-Gv1woqk0.css` assets as the candidate. The live findings therefore apply to this candidate deployment.

## Checks that passed

| Check | Evidence |
| --- | --- |
| Clean install | `npm ci`: 23 packages audited, 0 vulnerabilities. |
| Repository tests | `npm test`: 7 Rust unit tests and 4 Playwright tests passed. |
| Exact production build | `npm run build` passed; release CLI and `dist/site/` produced. |
| Rust quality | `cargo fmt --check` and `cargo clippy --all-targets --all-features -- -D warnings` passed. |
| Package | `cargo package --allow-dirty --no-verify` passed: 9 files, 47.5 KiB unpacked / 14.5 KiB crate. |
| Consumer install | Unpacked the `.crate`, ran `cargo install --path` into a clean consumer root, then exercised the installed binary. |
| CLI end to end | A mixed-card fixture correctly reported a proprietary `.insv` and unknown `.xyz` as rejected, RAW preview/camera risks as review, equirectangular GPano clue, duplicate SHA-256 content, and ignored a symlink. JSON and CSV emitted; JSON to stdout was valid. Exit codes were 1 for findings and 2 for invalid profile/missing folder. |
| GPS privacy | Valid EXIF fixture: default JSON had `present: true`, `redacted: true`, and no coordinates; `--include-gps` deliberately emitted 37.808333/-122.404167. |
| Online browser | Local production preview and live URL: title, `lang=en`, one `<main>`, one `<h1>`, demo (4 rows), invalid-license recovery, and no console/page errors passed. No outbound request occurred before a license is supplied. A mocked valid return token was stored, URL-stripped, unlocked, then removed by Forget. |
| Responsive/accessibility | Desktop and 390×844 mobile had no horizontal overflow; primary install/demo controls worked. Axe found zero serious/critical issues locally and live. The skip link had a visible 3 px focus outline. Reduced-motion demo completed in 153 ms without the scan animation. |
| Performance/budgets | Mobile Lighthouse against production preview: Performance 100, Accessibility 100; FCP 0.3 s, LCP 0.3 s, CLS 0, TBT 0 ms. Build assets: JS 6,219 bytes total, CSS 13,373 bytes total, no webfonts, hero WebP 81,048 bytes — within budgets. |

## Defects

### P1 — PWA first offline reload is broken

**Reproduction:** In a fresh Chromium context, open the built site online, wait for `navigator.serviceWorker.ready`, go offline, then reload. The cached HTML is served, but the service worker does not precache the hashed JS/CSS assets. For missing asset requests it returns the cached `/` HTML fallback. Chromium reports twice:

```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html".
```

The static `<h1>` remains visible, but the application module does not load, so the scan demo, license controls, and offline behavior are not usable. This violates the requested PWA offline-reload check.

### P1 — live deployment drops required response policies and immutable caching

`site/public/_headers` declares CSP, Permissions-Policy, `nosniff`, Referrer-Policy, and immutable caching for `/assets/*` and the hero image. Fresh `curl -I` checks on live `/`, JS, CSS, image, `sw.js`, `/privacy/`, and `/terms/` show:

- no `Content-Security-Policy` header;
- no `Permissions-Policy` header;
- every checked asset has only `cache-control: public, must-revalidate, max-age=30`, including fingerprinted JS/CSS and the WebP, rather than the declared one-year immutable policy.

The host does provide HSTS, `Referrer-Policy`, and `X-Content-Type-Options`, but this does not satisfy the candidate's declared browser-policy or caching contract. The missing CSP also removes the intended restriction of browser connections to same-origin plus Sociobot’s API.

### P2 — independent TypeScript check cannot run cleanly

`npx tsc --noEmit` fails in the clean checkout:

```
vite.config.ts(2,25): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
vite.config.ts(13,23): error TS2304: Cannot find name '__dirname'.
```

`package.json` includes TypeScript and a `tsconfig.json`, but lacks the Node type dependency/configuration needed by the Vite config. Vite build still passes because it transpiles without this type-check gate.

### P2 — keyboard skip target and mobile wordmark target need improvement

Activating “Skip to main content” scrolls to `<main>` but leaves focus on the skip link because `<main>` is not programmatically focusable. At 390 px the clickable `.wordmark` measures 28 px high, below the 44 px touch-target baseline. No serious/critical axe issue was reported, but both are accessibility/usability gaps.

## Required remediation and re-verification

1. Precache the actual built JS/CSS (or use a safe navigation-only fallback); never answer an asset fetch with the HTML shell. Re-test a *first* offline reload in a fresh browser profile and update behavior after a service-worker version change.
2. Configure the production host to honor the header policy or otherwise serve equivalent CSP, Permissions-Policy, and long-lived immutable cache headers. Verify with `curl -I` against the live URL.
3. Make `npx tsc --noEmit` pass from a clean clone and add it as an explicit check script.
4. Make the main skip destination focusable and raise the wordmark hit target to at least 44×44 px.

No product code was modified during verification.
