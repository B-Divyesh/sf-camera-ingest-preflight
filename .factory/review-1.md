# Scan cards before DAM import — review 1

**Work order:** `camera-ingest-preflight-review-1`  
**Implementation reviewed:** `1cced20b57a33415cd5ae1e60b5679d5875daeea`  
**Repository documentation SHA:** `bb72d7d0818873f875a3c24247ba5fee57a483ea`  
**Live documentation build ID:** `bf5a40e9239c`  
**Live URL:** <https://camera-ingest-preflight.sociobot.in/>  
**Date:** 2026-09-05

## Verdict

**FAIL — 1 finding and 1 untested public claim.**

The scanner, sample demo, installed package, and all 25 declared claim commands
passed. The public installation copy also promises release binaries that do not
exist and that promise has no entry in `.factory/claims.json`. This prevents a
PASS under the claims contract.

## First screen and sample

Fresh desktop (1440 × 900) and phone (390 × 844) browser contexts showed the
following before scrolling:

- Job: **Scan cards before DAM import.**
- Audience: 360° and mixed-camera photographers who need import risks before a
  DAM sees the card.
- First action: **Try it with sample data**.

All three were above the viewport in both contexts. The focused primary action
opened `/demo/` with Enter. The persistent **Demo — sample data, nothing is
saved** banner remained visible. The report had four realistic rows and counts
of 0 ready, 3 review, and 1 reject. **Reset demo** restored that same result.
Seeded real license, verdict, and saved-layout keys remained unchanged in demo
mode; direct demo and reset traffic was same-origin only. The sample mode had
no horizontal overflow or console/page errors.

## Finding

### P2 — Release binaries are promised but unavailable and untested

The landing page's Install section links to the repository as **“Source and
release binaries.”** The README also says, “The factory publishes release
binaries separately.” A visitor can reasonably rely on this as an available
installation option.

The linked GitHub repository has no release tags (`git ls-remote --tags` gave
zero results), its Releases page says **“There aren’t any releases here,”** and
GitHub's `releases/latest` endpoint returned HTTP 404. The source repository is
available and `cargo install --git` is a valid source-install path, but there
is no published release binary to download.

`.factory/claims.json` has `open-source`, which checks only the MIT license and
homepage source link. It has no claim or observable test for release binary
availability. This is one unlisted, false public claim; the claim count is
therefore not complete.

**Required correction:** publish actual release assets and add a claim test, or
remove “release binaries” from the landing link and README until assets exist.

## Declared claims from a clean checkout

A new `git clone --no-local` was detached at implementation `1cced20` with no
`node_modules`. The first exact claim command installed the locked npm
prerequisite through the documented runner. Every exact command listed in
`.factory/claims.json` then passed:

| Claim IDs | Result |
| --- | --- |
| `sample-scan`, `demo-sandbox`, `read-only-scan`, `gps-redaction`, `format-decisions` | PASS |
| `embedded-preview`, `projection-hints`, `orientation-validation`, `duplicate-detection`, `camera-metadata` | PASS |
| `gps-inclusion`, `report-contract`, `sha256-report`, `local-cli-privacy`, `json-csv-exit-codes` | PASS |
| `local-demo-privacy`, `offline-reload`, `license-verification`, `license-daily-check`, `migration-brief` | PASS |
| `paid-layouts`, `license-revocation`, `checkout-start`, `pasted-report-privacy`, `open-source` | PASS |

The missing release-binary promise is outside that 25-claim manifest, so the
declared commands passing does not make the public claims complete.

## CLI, normal, invalid, boundary, and recovery checks

- `npm test` passed: 12 Rust tests and 35 Chromium tests.
- `npm run typecheck`, `cargo fmt --all -- --check`, `cargo clippy --all-targets --all-features -- -D warnings`, `npm run build`, and `cargo package --locked` passed.
- A clean consumer installed the packaged crate. `--help` described `scan` and
  `demo`; `demo --profile photoprism` made a temporary four-file card and JSON
  report, showed 0/3/1, and exited 1 as documented.
- Claim coverage exercised normal scans, invalid folders/profiles, report
  destination boundaries, symlink exclusion, JSON/CSV output, recovery after
  a saved report, metadata, duplicate, GPS, embedded-preview, and format
  profile paths.
- On live, a short restored-license token was marked `aria-invalid`, announced
  “Paste the complete license token from your receipt,” and retained focus.
  A corrected invalid token reached the clear inactive-license recovery state.

## Accessibility, privacy, offline, routes, and policies

- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, 740 ms, correct title,
  `lang=en`, one h1, main landmark, image alternatives, named buttons, and no
  console or page errors.
- Live Playwright axe 4.13 checks found zero serious or critical violations in
  desktop and phone demo contexts. Keyboard, visible focus, phone layout, and
  reduced-motion demo rendering passed.
- In a dedicated fresh browser context, `/demo/` registered its service worker;
  after going offline, reload rendered all four rows and 0/3/1 with no errors.
- Home, demo, privacy, and terms returned HTTP 200 with route-specific titles
  and one h1. An unknown URL returned the designed HTTP 404 page with a route
  back. `robots.txt` and `sitemap.xml` returned 200.
- Product links returned 200 except the specified external checkout endpoint.
  Its HTTP 404 response `{"error":"enabled factory product","status":404}` is
  the assignment's expected unregistered billing state, not a product defect.
- CSP, HSTS, Permissions-Policy, `nosniff`, and strict-origin referrer policy
  were present. The static site and local CLI have no product backend, tenant,
  database, or restart state; backend tenant and health checks do not apply.

## Candidate and live comparison

The live runtime assets `main-BK59mv39.js`, `styles-2YF0X4So.js`, and
`styles-Ch-9H8FD.css` byte-match a local `1cced20` build. The demo fixture,
blueprint, social card, and favicon also byte-match. Home, demo, privacy,
terms, and 404 HTML match after normalizing the later documentation build ID.
The service worker differs only in its cache version for that later build.

## Earlier findings

| Earlier report | Current disposition |
| --- | --- |
| Verification 1: response policy, caching, offline reload, typecheck, skip focus, touch target | Fixed; current policy, offline, clean checks, keyboard/focus, and phone checks pass. |
| Verification 2: exported reports were scanned as inputs | Fixed; boundary claim and Rust regression tests pass. |
| Verification 3: cached verdict was not token-bound; wordmark name | Fixed; token-bound verification claim and current accessibility checks pass. |
| Verification 4: candidate identity, first screen, real demo, routes, metadata | Fixed; runtime parity, first-screen, CLI-derived demo, and route checks pass. |
| Verification 5: missing scanner claims and short demo controls | Fixed for the listed scanner claims and controls; this review found the separate unlisted release-binary promise. |
| Verification 6: clean first claim command; checkout availability | Clean bootstrap now passes. The checkout 404 remains expected by this assignment. |

## Untested claims

1. **Release binaries are available** — public landing-link and README promise;
   no manifest claim/test exists, and no release is published.
