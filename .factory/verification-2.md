# Verification report 2 — FAIL

**Work order:** `camera-ingest-preflight-verify-2`  
**Candidate:** `10143b2033bfc8a82102d7415c38288f3128486d` (`10143b2`)  
**Live URL:** <https://camera-ingest-preflight.sociobot.in/>  
**Date:** 2026-08-28

## Decision

**FAIL — do not accept this candidate until the P2 self-ingestion defect is corrected.**

The earlier production-only failures are fixed in this deployment: the live site has the declared browser policies and immutable asset caching, and a fresh-profile offline reload is interactive. However, the CLI's own JSON or CSV export is treated as an unsupported input on a later scan when it is saved inside the card folder. This can turn an import-ready card into a false rejection, so the exportable-report portion of the core job is not reliable end to end.

No product code was modified during verification. Only this report and the handoff were changed.

## Provenance and live parity

- Created a fresh detached clone from `/work/repo`, checked out precisely to the candidate, and confirmed an initially clean worktree.
- Built that clone with the exact production command. Live `/` is byte-identical to `dist/site/index.html`: SHA-256 `5af727b6b007e7c92f97ca57f3ef4cee16310d10811d90958d65aa3cbdc5b77a`.
- The live service worker, hero image, favicon, and all three document-referenced assets are byte-identical to the build:
  - `/sw.js` `4458891b85afecad6df571d1c8d863a9a49898b43186cd1deffe57b2374c146a`
  - `/assets/main-C9l8qmiz.js` `4ec5d7d3bf60693b1c5ef01f3acf0893902dc69b2975c14c0072fe1aa49e2e17`
  - `/assets/styles-BOfa0L6u.css` `73aff4151f6c377df70570a9f7a3ac598de4de98ca08d87c108ce677b7cfda8a`
  - `/assets/styles-Buo4gY3A.js` `d2a32840421496e872ade591618d2fa5c33797605d1aec04301717e5a90757d0`
- Therefore the live browser findings apply to the candidate, rather than to an unrelated deployment.

## Checks passed

| Area | Fresh evidence |
| --- | --- |
| Install and repository gates | `npm ci` installed 23 packages with 0 vulnerabilities. `npm test` passed: 7 Rust tests and all 7 production-browser Playwright tests. `npm run typecheck`, `npm run build`, `cargo fmt --check`, and `cargo clippy --all-targets --all-features -- -D warnings` all passed. |
| Exact production/package build | `npm run build` produced `dist/site/` and the release binary. `cargo package` passed: 9 files, 47.5 KiB unpacked / 14.5 KiB compressed. |
| Clean consumer | Extracted the crate and ran `cargo install --path <unpacked> --root <clean-root>`. The installed 1,011,808-byte binary had useful `--help`; it emitted valid JSON to stdout and JSON/CSV files. Exit codes were `0` for help and a ready card, `1` for findings/empty card, and `2` for an invalid profile or missing folder. |
| CLI normal and failure paths | A mixed-card fixture correctly rejected `.insv` and unknown `.xyz`, identified an `.dng` panorama filename clue and missing preview, found duplicate SHA-256 bytes, retained an accepted `.xmp`, and did not follow a symlink. It scanned 6 regular files, not the symlink. |
| GPS privacy and metadata | A hand-built valid EXIF fixture with Canon/EOS R and 37°48′30″ N, 122°24′15″ W reported complete camera metadata. The normal report had `gps.present: true`, `redacted: true`, and no coordinates. `--include-gps` emitted `37.80833333333333` and `-122.40416666666667` only after explicit opt-in. |
| Live functional/browser | The homepage title, `lang=en`, one `h1`, one `main`, image alts, sample report, legal pages, invalid return-token recovery, keyboard restore/verify/forget flow, and desktop/mobile use all worked. `verify-url.sh` against live returned 200, zero page/console errors, and a 654 ms measured load. |
| Accessibility | Axe found zero serious/critical violations on live desktop and 390×844 mobile. There was no horizontal mobile overflow. Keyboard Tab gave the skip link, wordmark, and nav a visible cyan 3 px focus ring; Skip transferred focus to `main`. The 390 px wordmark measured 182.97×44 px. Reduced motion suppressed the scan line and completed the demo in 190 ms. |
| PWA | In a fresh live context, after service-worker control, offline reload remained interactive and had zero console/page errors. A temporary query-versioned worker registration changed the active script URL and retained control, exercising update/activation; the production worker also has a content-derived cache name plus `skipWaiting` and `clients.claim`. |
| Privacy/network | No outbound browser request occurred on initial load or sample scan. Source inspection found no analytics, tracking, remote fonts, or third-party scripts; runtime network is same-origin until a license is supplied. License tokens/verdicts are localStorage-only, and the sole programmatic external request is the documented Sociobot verification endpoint after a supplied token. |
| Response policy/caching | Live `/`, `/privacy/`, `/terms/`, and `/sw.js` have CSP, Permissions-Policy, nosniff, referrer policy, and HSTS. Fingerprinted JS/CSS and `/camera-blueprint.webp` return `Cache-Control: public, max-age=31536000, immutable`. The CSP confines `connect-src` to self and `https://api.sociobot.in`. |
| Budget/performance | Built JS totals 6,219 bytes; CSS 13,422 bytes; no webfonts; hero WebP 81,048 bytes. Live mobile Lighthouse 13.4 retry: Performance 100, Accessibility 100, LCP 1.2 s, CLS 0. |

## Defects

### P2 — a report saved inside the scanned folder poisons the next scan

**Reproduction:**

1. Create a card directory containing only `IMG_0001.XMP` (a supported, ready sidecar).
2. Run `camera-ingest-preflight scan <card> --json <card>/preflight.json --quiet`.
3. This first scan exits `0`.
4. Run the exact same command again.

**Observed:** the second run exits `1`. Its output contains two files: `IMG_0001.XMP` as accepted and the tool-generated `preflight.json` as rejected with `unsupported_format`; summary is `files_scanned: 2`, `ready: 1`, `rejected: 1`.

The same ready-card first/second sequence with `--csv <card>/preflight.csv` also changed from exit `0` to `1` and reported `preflight.csv` as rejected `unsupported_format`.

**Impact:** Report export is part of the core job. Saving a report alongside a card—an ordinary and undocumented-as-invalid invocation—causes a later preflight to create a false reject. The scanner must avoid treating its explicitly requested output path(s) as original media on future runs, or document/enforce an output location outside the root. The former is the safer product behavior. Add regression coverage for JSON and CSV paths below the scan root.

## Re-verification required

1. Exclude the explicit `--json` and `--csv` destinations when they resolve below the scan root, including files created by prior runs, without broadly hiding unrelated user files.
2. Add tests demonstrating that a ready card remains exit `0` across repeated JSON and CSV export runs.
3. Re-run the clean commands and the live parity/offline checks above.
