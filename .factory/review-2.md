# Scan cards before DAM import — strict review 2

**Work order:** `camera-ingest-preflight-review-2`  
**Verdict:** **PASS**  
**Findings:** 0  
**Untested public claims:** 0  
**Implementation reviewed:** `cda621b15d037f896501de60f136eec7ebf3cca3`  
**Documentation SHA:** `0bc8952415b8a968abdbd4fe632ce90f2312489d`  
**Starting review SHA:** `65358602a8551fbd5db1fcca2a2bd6f7a26b3f18`  
**Live URL:** <https://camera-ingest-preflight.sociobot.in/>  
**Date:** 2026-09-06

## Job, audience, and first action

The product scans camera cards before a DAM import. It is for 360° and
mixed-camera photographers who need import risks before the DAM sees a card.
The first action is **Try it with sample data**.

Fresh 1440 × 900 desktop and 390 × 844 phone contexts showed all three without
scrolling. Their lowest first-screen action edges were 668 px and 477 px,
respectively. Neither page overflowed horizontally, and both loaded without
console or page errors. Desktop Enter and a phone tap each opened `/demo/`.

## One-click sample and isolation

The sample immediately rendered the bundled four-file CLI report: 4 files,
0 ready, 3 review, and 1 reject. The persistent banner read **Demo — sample
data, nothing is saved**, with **Reset demo** and **Start for real**.

Before entry, the review seeded a real-license key and a real saved-layout key.
The demo did not read or change them, hid the paid workspace, made no
cross-origin request, and exposed no file picker. After selecting another
profile, **Reset demo** restored PhotoPrism and the exact 4 / 0 / 3 / 1 result.

## Declared claims

A new `git clone --no-local` began without `node_modules`. Every exact command
in `.factory/claims.json` ran in manifest order. The first command installed
the locked npm prerequisites; all 25 commands passed, with one exact tagged
test per claim.

| Claim group | Result |
| --- | --- |
| `sample-scan`, `demo-sandbox`, `local-demo-privacy`, `offline-reload` | PASS |
| `read-only-scan`, `gps-redaction`, `gps-inclusion`, `local-cli-privacy`, `pasted-report-privacy` | PASS |
| `format-decisions`, `embedded-preview`, `projection-hints`, `orientation-validation`, `camera-metadata` | PASS |
| `duplicate-detection`, `sha256-report`, `json-csv-exit-codes`, `report-contract` | PASS |
| `license-verification`, `license-daily-check`, `license-revocation`, `checkout-start` | PASS |
| `migration-brief`, `paid-layouts`, `open-source` | PASS |

The live landing page, demo, privacy and terms pages, README, CLI help, and
dynamic status/error copy were cross-checked against the manifest. No extra
claim-like sentence was found. There are zero untested public claims. Full
command output is in `/work/.evidence/review-2-claims.log`.

## CLI, package, and recovery paths

- `npm test` passed 12 Rust tests and 36 Chromium tests.
- `npm run typecheck`, `cargo fmt --all -- --check`,
  `cargo clippy --all-targets --all-features -- -D warnings`, `npm run build`,
  and `cargo package --locked` passed. The site was produced at `dist/site/`.
- The package contained 14 files and was 17.6 KiB compressed. A clean consumer
  installed the packaged crate with `cargo install --locked`.
- The installed CLI's `--help` documented `scan`, `demo`, JSON behavior,
  read-only handling, and privacy. Its real `demo --profile photoprism` made a
  new temporary card and JSON report, returned the documented findings exit
  code 1, and reported 4 / 0 / 3 / 1 with GPS coordinates excluded.
- A separate clean consumer ran the landing page's documented
  `cargo install --git` path from GitHub and received version `0.1.0`.
- Normal, invalid, boundary, and recovery coverage includes ready and finding
  scans, a missing folder, an invalid profile, empty input, exact report-output
  exclusion, repeated JSON/CSV export, symlink exclusion, the 24 MiB preview
  boundary, EXIF orientations 1–9, GPS opt-in, malformed license input,
  revoked licenses, and saved-layout reload/delete.
- A short restored license stayed focused, was marked `aria-invalid`, and
  announced the complete-token instruction. A corrected invalid token reached
  the clear inactive-license state without unlocking paid controls.

## Live browser, accessibility, privacy, and performance

- The full suite passed 36/36 against the production hostname. It includes
  desktop and phone layouts, Axe 4.13, keyboard focus, demo touch targets,
  route metadata, privacy isolation, license recovery, offline reload, and the
  designed 404.
- `/opt/fleet/lib/verify-url.sh` passed in 734 ms: HTTP 200, useful title,
  `lang=en`, one h1, main landmark, image alternatives, named buttons, and no
  console or page errors.
- Axe reported zero serious or critical violations. All 15 visible interactive
  targets on the phone demo were at least 44 × 44 CSS px. A full Tab cycle had
  no trap. The skip link moved focus to `main`.
- With reduced motion requested, tested animation and transition durations
  were effectively instant and transforms were removed. At simulated 200%
  text size, home and demo retained their primary controls, banner, report,
  reset action, and no horizontal overflow.
- A dedicated fresh context installed the service worker, went offline, and
  reloaded the complete four-row demo without console errors. Missing script
  requests did not receive an HTML fallback.
- Demo and pasted-report paths made no cross-origin report or file requests.
  The CLI has no telemetry or network client. No third-party script or font is
  loaded.
- Lighthouse mobile scored 100 performance, 100 accessibility, 100 best
  practices, and 100 SEO. FCP was 976 ms, LCP 1.20 s, TBT 0 ms, CLS 0, and
  total transfer 97,889 bytes. Main JS is 13.35 KiB and primary CSS is
  17.53 KiB uncompressed.

## Routes, links, policy, and expected 404

Home, demo, privacy, and terms returned HTTP 200 with route-specific titles
and one h1. A missing URL returned the product's designed HTTP 404 page with a
working route home. `robots.txt` and `sitemap.xml` returned 200.

Every internal link and anchor resolved. The GitHub source and report-contract
links returned 200. The Sociobot checkout returned the assignment's deliberate
HTTP 404 body for an unregistered enabled factory product. This is the stated
expected billing condition, not a broken product page or failed local user
path. The product still exposes the exact hosted-checkout URL and the existing
license restore path.

CSP, HSTS, Permissions-Policy, `nosniff`, and strict-origin referrer policy
were present. Hashed JS/CSS and the main images used one-year immutable cache
headers. This product is a static site plus local CLI, so tenant isolation,
SQLite restart persistence, backend health, and product-backend 429 checks do
not apply. The Sociobot billing API is an external platform dependency, not
this product's backend.

## Candidate and live runtime

The live documents identify build `0bc8952415b8`, the later documentation
build. Between implementation `cda621b` and starting review SHA `6535860`,
only `README.md`, `.factory/handoff.md`, and `.factory/verification-8.md`
changed. The README change only replaced the misleading phrase “release CLI”
with “optimized CLI.”

All five live hashed JS/CSS files, the CLI-derived demo fixture, blueprint,
social card, favicon, touch icon, robots file, and sitemap byte-matched the
clean local build. Home, demo, privacy, terms, and 404 documents matched after
normalizing only the build-ID meta value. The service worker matched after
normalizing its content-derived cache name. The live runtime therefore is the
reviewed implementation.

## Earlier findings and current disposition

| Earlier finding | Current evidence and disposition |
| --- | --- |
| Verification 1: first offline reload failed | Fixed. Fresh online registration followed by offline reload rendered all four rows without errors. |
| Verification 1: response policy and immutable caching were absent | Fixed. Live policy headers and one-year immutable asset headers are present. |
| Verification 1: independent typecheck failed | Fixed. `npm run typecheck` passes from the clean clone. |
| Verification 1: skip focus and phone wordmark touch size | Fixed. Focus transfers to `main`; the wordmark and all visible phone-demo targets meet 44 px. |
| Verification 2: saved reports poisoned later scans | Fixed. Exact-destination and repeated JSON/CSV regression tests pass. |
| Verification 3: cached verdict was not token-bound | Fixed. Returned/restored token and token-bound cache claims pass. |
| Verification 3: paid migration set had no deliverable | Fixed. PhotoPrism/Lightroom briefs, print/download, layouts, and revocation paths pass. |
| Verification 3: wordmark accessible-name mismatch | Fixed. Current accessible-name assertion and Axe checks pass. |
| Verification 4: requested candidate did not exist or match live | Fixed. Candidate exists, later commits are documentation-only, and runtime parity is proven above. |
| Verification 4: cold first screen omitted the audience | Fixed. Both fresh viewports show job, named audience, and first action before scrolling. |
| Verification 4: demo sandbox was absent and contradicted the CLI | Fixed. `/demo/` is isolated and its report/transcript exactly match the bundled CLI. |
| Verification 4/5/6: new checkout returned 404 | Expected external state under this work order. The exact link and restore path pass; the deliberate HTTP 404 is not a defect. |
| Verification 4: routes and metadata were incomplete | Fixed. Required routes, titles, metadata, sitemap, robots, and designed 404 pass. |
| Verification 4/5: visible promises lacked claim tests | Fixed. All 25 current claims pass, and the fresh public-copy audit found no unlisted claim. |
| Verification 5: demo banner controls were below 44 px | Fixed. Desktop and phone target measurements pass. |
| Verification 6: first exact claim command failed on a clean clone | Fixed. The first command installed locked dependencies and passed. |
| Review 1: unavailable release binaries were promised and untested | Fixed. Public copy offers source installation only; GitHub install succeeded and the regression forbids release-binary wording. |

## Missed-leverage check

No obvious import, export, sync, or assisted step is missing from the brief.
The CLI already exports JSON and CSV and the paid browser tool makes migration
briefs from those local reports. Adding model inference would not improve the
deterministic metadata checks and would weaken the product's local-first
privacy boundary.

## Decision

**PASS — zero findings of every severity and zero untested public claims.**

Primary evidence is stored under `/work/.evidence/`, including the claim log,
local gates, consumer installs, live Playwright run, fresh-browser JSON and
screenshots, route/link crawl, runtime parity, URL check, accessibility smoke,
text-resize check, and Lighthouse JSON.
