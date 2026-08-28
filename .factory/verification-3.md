# Verification report 3 — FAIL

**Work order:** `camera-ingest-preflight-verify-3`  
**Candidate:** `b4c5e69b28f62a7e682b5019fcd27298c5242c62` (`b4c5e69`)  
**Live URL:** <https://camera-ingest-preflight.sociobot.in/>  
**Date:** 2026-08-28

## Decision

**FAIL — do not accept this candidate.**

The core CLI, clean build/package, static deployment, offline behavior, privacy
defaults, and repaired repeated-report workflow pass. Fresh verification found
two high-severity paid-product defects: cached entitlement is not bound to the
license token, allowing a newly supplied invalid token to inherit an old valid
verdict without contacting the verification API; and a successful unlock does
not provide any of the advertised $29 migration-set features. The latest
Lighthouse/Axe audit also reports one serious accessible-name mismatch.

No product code was modified. Only this report and `.factory/handoff.md` were
changed.

## Provenance and candidate/deployment identity

- Cloned `https://github.com/B-Divyesh/sf-camera-ingest-preflight.git` into a
  fresh temporary directory and checked out detached commit
  `b4c5e69b28f62a7e682b5019fcd27298c5242c62`. The checkout was clean before and
  after all verification commands.
- `origin/main` and the requested candidate were the same commit before the QA
  report commit.
- Built the candidate with its exact production command, `npm run build`.
- Live `/` is byte-identical to `dist/site/index.html`, SHA-256
  `5af727b6b007e7c92f97ca57f3ef4cee16310d10811d90958d65aa3cbdc5b77a`.
- Live `/sw.js`, hero image, favicon, legal HTML, and every referenced JS/CSS
  asset are also byte-identical to the candidate build. Examples:
  - `/sw.js`: `4458891b85afecad6df571d1c8d863a9d49898b43186cd1deffe57b2374c146a`
  - `/assets/main-C9l8qmiz.js`: `4ec5d7d3bf60693b1c5ef01f3acf0893902dc69b2975c14c0072fe1aa49e2e17`
  - `/assets/styles-BOfa0L6u.css`: `73aff4151f6c377df70570a9f7a3ac598de4de98ca08d87c108ce677b7cfda8a`
  - `/camera-blueprint.webp`: `7567a89c7143bbebb93a607657a80df630f0e3cb382fc11afb5634f31545bd34`

The live defects below therefore apply to this candidate, not to an older
deployment.

## Clean install, gates, build, and package

| Check | Fresh result |
| --- | --- |
| Install | `npm ci` passed: 23 packages installed, 0 vulnerabilities. |
| Repository suite | `npm test` passed: 5 library unit tests, 2 CLI unit tests, 3 CLI integration tests, and 7 production-browser Playwright tests. |
| Type check | `npm run typecheck` passed. |
| Rust format/lint | `cargo fmt --check` and `cargo clippy --all-targets --all-features -- -D warnings` passed. |
| Exact release build | `npm run build` passed and produced the optimized CLI plus `dist/site/`. |
| Package | `cargo package` passed verification: 10 files, 52.3 KiB unpacked / 15.8 KiB compressed (`16,139` bytes). |
| Clean package consumer | Extracted the `.crate`, ran its 10 Rust tests with `--locked`, installed it into a new Cargo root, and exercised the installed binary. |
| Public Rust API | A separate clean consumer compiled and called `scan`, `needs_review`, `Profile`, and `ScanOptions`; it returned schema `1.0` as documented by the types. |

The installed release executable was 1,023,008 bytes. `--help`, `scan --help`,
and `--version` were useful, non-interactive, and reported version `0.1.0`.

## CLI end-to-end evidence

Independent fixtures were used in addition to repository tests.

- A recursive mixed-card fixture contained rendered JPEG, ARW, DNG, INSV,
  unknown, nested XMP, duplicate bytes, punctuation/quotes in a filename, a
  GPano marker, a GPS marker, and an external symlink. The installed package
  scanned 7 regular files and did not follow the symlink. It reported `ready: 1`,
  `review: 4`, `rejected: 2`, `duplicate_files: 2`, and `gps_files: 1`, exiting
  `1` as required.
- It rejected INSV with `unsupported_format`, rejected the unknown extension,
  flagged missing RAW previews and camera identity, identified fisheye and
  equirectangular hints, emitted stable SHA-256 hashes, and linked duplicate
  content to the first relative path.
- JSON printed to stdout under `--json - --quiet` parsed cleanly with `jq` and
  contained no human progress text. CSV contained all 7 rows and correctly
  escaped `copy,"one".XMP` as `"copy,""one"".XMP"`.
- A generated, valid EXIF TIFF containing Canon / EOS R, orientation `6`, 8000
  × 4000 dimensions, and GPS at 37°48′30″ N / 122°24′15″ W was import-ready
  (`0`). The default JSON reported GPS presence with `redacted: true` and no
  latitude/longitude keys. Only `--include-gps` emitted
  `37.80833333333333, -122.40416666666667`; orientation was `rotated 90°`,
  camera status was complete, and the 2:1 projection hint was equirectangular.
- A boundary EXIF fixture with orientation `9` and only a make produced
  `orientation_invalid` and `camera_partial`, exiting `1`.
- A ready XMP-only card exported JSON and CSV inside the scan root twice. Both
  passes exited `0`; each second report still had exactly one scanned file.
  This independently confirms the defect from verification report 2 is fixed.
- The original mixed fixture's byte sizes and mtimes were identical before and
  after scanning. Symlinks remained untouched.
- Empty folder: exit `1` with “No files found. Check the mount path or insert a
  card…” in human mode. Invalid profile, missing folder, file-as-root,
  unreadable input (run as uid 65534), and unwritable report parent each exited
  `2` with a specific stderr message. Users can correct the input and rerun.

## Live web, accessibility, privacy, and offline evidence

- `/opt/fleet/lib/verify-url.sh` passed live: HTTP 200, title, `lang=en`, one
  `h1`, one `main`, no missing image alts, no page/console errors, and a 697 ms
  measured load.
- The repository's 7 Playwright tests also passed directly against the live
  URL, including desktop, 390×844 mobile, legal pages, skip focus transfer,
  production offline reload, and its Axe 4.10 serious/critical filter.
- Independent desktop (1440×900) and mobile (390×844) runs found no console or
  page errors, failed responses, horizontal overflow, sub-44 px visible
  controls, or ordinary-load/demo cross-origin requests. Both layouts rendered
  all four sample rows. Keyboard activation worked; the skip link moved focus
  to `main`, and controls had a visible 3 px cyan focus outline.
- At 200% root text size, desktop and mobile retained their viewport width with
  no detected clipped visible leaf text. The only intentionally clipped text
  was the visually hidden table caption.
- With `prefers-reduced-motion: reduce`, the scan line computed to `display:
  none` and the sample result appeared in 38 ms instead of waiting for the
  animated pass.
- A fresh service-worker-controlled profile reloaded offline with no errors,
  displayed the offline notice, and remained interactive. An independent local
  old-release/new-release simulation changed the content-derived cache,
  activated the new worker, removed the old cache after activation, and still
  reloaded interactively offline.
- Source and runtime inspection found no analytics, telemetry, remote fonts,
  third-party scripts, or camera-file upload path. Normal load and demo made no
  cross-origin requests. The only programmatic external request is license
  verification after a token is supplied. The real invalid-token endpoint
  returned `{ "valid": false, "reason": "invalid" }`, `Cache-Control:
  no-store`, and the expected origin-specific CORS header.
- Live HTML, legal pages, service worker, JS, CSS, and image responses carry
  CSP, Permissions-Policy, Referrer-Policy, `nosniff`, and HSTS. Fingerprinted
  JS/CSS and the hero use `public, max-age=31536000, immutable`; conditional
  requests returned 304. HTML and the worker use 30-second revalidation.
- Built homepage JS is 6,079 bytes total; CSS is 12,981 bytes; there are no font
  files; the hero WebP is 81,048 bytes. All are well inside the contract.
- Live mobile Lighthouse 13.4.1: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 1.1 s, LCP 1.2 s, TBT 50 ms, CLS 0.
- Key palette contrast calculations ranged from 7.86:1 to 11.90:1. The product
  has a documented, product-specific blueprint visual system and original-asset
  provenance in `.factory/design.md`.

## Defects

### P1 — a new license token inherits an unrelated cached verdict

The daily verdict cache contains only `{ valid, reason, checkedAt }`; it is not
associated with the token that was verified. The return-URL path saves the new
token and calls non-forced verification, which accepts any fresh cached verdict.

Fresh reproduction against live:

1. Seed local storage with `OLD_VALID_TOKEN` and a fresh valid verdict.
2. Navigate to `/?license=NEW_INVALID_TOKEN_456`.
3. Intercept the Sociobot endpoint with an invalid response so any attempted
   request is observable.

Observed: the query token was stripped, `NEW_INVALID_TOKEN_456` replaced the
stored token, **zero verification requests occurred**, and the paid view became
visible with “License verified on this device.” An old invalid verdict can
likewise prevent a newly returned valid token from being checked until the
cache expires.

Impact: entitlement can be incorrectly granted to a revoked, wrong-product, or
invented token for up to a day, and legitimate checkout recovery can be
incorrectly denied. Bind the cached verdict to the exact token (preferably a
non-reversible token fingerprint), invalidate it whenever the token changes,
and always verify a newly returned/pasted token before caching its verdict.

### P1 — the advertised paid migration set has no deliverable

The page offers a $29 checkout for “printable PhotoPrism and Lightroom triage
briefs, saved report presets, and format-specific handoff notes.” A fresh mocked
valid Sociobot response made exactly one verify request and unlocked the live
view. The complete unlocked content was only:

> PRESET DRAWER / UNLOCKED — Migration set is active. Preset layouts are stored
> locally on this browser. The free CLI remains unchanged. Forget license on
> this device.

There is no preset selector, report input, generator, print/download action,
saved layout, guidance content, or shipped asset/API for the promised product.
Repository-wide searches for the advertised feature names found only marketing
copy and license-state UI. Charging for this would provide no purchased
functionality. Implement the described migration set end to end, or remove the
checkout and paid-feature claims until it exists.

### P2 — latest Axe reports a serious accessible-name mismatch

Lighthouse 13.4.1's Axe audit reports `label-content-name-mismatch` (impact:
`serious`, WCAG 2.1 A 2.5.3) on the home wordmark. Its visible text is
“CAMERA / PREFLIGHT”, while `aria-label="Camera Ingest Preflight home"` does
not contain that visible label, which impairs speech-input activation. The
repository's older Axe 4.10.2 integration reports zero serious/critical issues,
which explains why its gate passed. Use an accessible name that contains the
visible words in the same order.

## Re-verification required

1. Bind cached license verdicts to one token and test valid→invalid and
   invalid→valid token replacement, returned-query tokens, restore, offline
   optimistic unlock, expiry/revocation, and Forget.
2. Ship and exercise the paid migration deliverables, or remove the ability to
   buy them and all claims that they are available.
3. Correct the wordmark accessible name and run a current Axe/Lighthouse audit.
4. Repeat the clean package/install/API/CLI checks and byte-level live parity
   check after repair.
