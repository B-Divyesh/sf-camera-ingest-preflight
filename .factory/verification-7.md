# Verify camera cards before DAM import — verification 7

**Work order:** `camera-ingest-preflight-verify-7`  
**Implementation reviewed:** `1cced20b57a33415cd5ae1e60b5679d5875daeea`  
**Documentation deployed:** `bf5a40e9239c1d86116099a5ba64ff3d397f2eb1`  
**Live URL:** <https://camera-ingest-preflight.sociobot.in/>  
**Date:** 2026-09-05

## Verdict

**PASS.** There are zero findings and zero untested public claims.

The separate billing engine's checkout endpoint deliberately returns HTTP 404
until the billing operator registers the prepared offer. The work order calls
that response expected. The page, its checkout link, and the existing-license
flow work as implemented; this external dependency is not a product defect.

## First screen and sample

Fresh 1440 × 900 desktop and 390 × 844 phone contexts showed this before any
scrolling:

- Job: **Scan cards before DAM import.**
- Audience: 360° and mixed-camera photographers who need import risks before a
  DAM sees the card.
- First action: **Try it with sample data**. It was fully above the fold in
  both contexts and had a visible 3 px focus outline.

Pressing Enter on the first action opened `/demo/`. The page retained the
**Demo — sample data, nothing is saved** label and showed the CLI-derived
four-file report: 0 ready, 3 review, 1 reject. **Reset demo** restored the same
report. Seeded real license, license-verdict, and saved-layout local-storage
values were unchanged; the demo made only same-origin requests. Direct `/demo/`
also made only same-origin requests with a seeded real license present. Neither
viewport had horizontal overflow or console/page errors.

## Claims from a clean checkout

A new `git clone --no-local` was checked out at the implementation SHA with no
`node_modules`. The first exact manifest command ran its documented locked
dependency bootstrap. Every one of the 25 exact `.factory/claims.json`
commands then passed independently, with one matching tagged browser test:

| Claim IDs that passed | Evidence |
| --- | --- |
| `sample-scan`, `demo-sandbox`, `read-only-scan`, `gps-redaction`, `format-decisions` | Exact manifest command passed. |
| `embedded-preview`, `projection-hints`, `orientation-validation`, `duplicate-detection`, `camera-metadata` | Exact manifest command passed. |
| `gps-inclusion`, `report-contract`, `sha256-report`, `local-cli-privacy`, `json-csv-exit-codes` | Exact manifest command passed. |
| `local-demo-privacy`, `offline-reload`, `license-verification`, `license-daily-check`, `migration-brief` | Exact manifest command passed. |
| `paid-layouts`, `license-revocation`, `checkout-start`, `pasted-report-privacy`, `open-source` | Exact manifest command passed. |

The manifest and public copy were cross-checked. Every visitor-relevant claim
has a manifest entry and exact tagged test. There are no untested claims.

## Clean checks and installed CLI

| Check | Result |
| --- | --- |
| `npm test` | PASS — 12 Rust tests and 35 Chromium tests. |
| `npm run typecheck` | PASS. |
| `cargo fmt --all -- --check` | PASS. |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS. |
| `npm run build` | PASS — release CLI and `dist/site/`. |
| `cargo package --locked` | PASS. |
| Fresh consumer install | PASS — installed binary had useful help. |

The installed binary's `demo --profile photoprism` created a new temporary
sample card and JSON report. It reported four files, 0 ready, 3 review, and 1
reject, then returned the documented exit code 1. Repository tests cover normal
scans, invalid input, report-destination boundaries, recovery, JSON/CSV,
symlink exclusion, duplicate hashes, GPS redaction and opt-in, metadata, RAW
preview boundaries, and downstream profiles.

## Live behavior, accessibility, privacy, and routes

- `/opt/fleet/lib/verify-url.sh` passed in 780 ms: title, `lang=en`, one h1,
  main, image alternatives, named buttons, and zero console/page errors.
- Axe 4.13 found zero serious or critical issues in fresh desktop and phone demo
  contexts. Keyboard activation entered the demo. Invalid short license input
  set `aria-invalid`, announced focused guidance, and a corrected submission
  cleared the invalid state and returned the clear inactive-license recovery
  message.
- A newly controlled service worker loaded `/demo/`; an offline reload rendered
  all four rows with the 0/3/1 counts and no errors.
- Home, demo, privacy, and terms return 200 with route-specific titles and one
  h1. An unknown route returns the designed page with HTTP 404. Internal
  product navigation links return 200; the deliberate unknown-route link in
  the 404 check remains HTTP 404 by design.
- CSP, HSTS, Permissions-Policy, `nosniff`, and strict-origin referrer policy
  are present. The product has no analytics, third-party fonts, third-party
  scripts, product backend, account, or product database.
- The license verification endpoint allowed 30 requests and returned HTTP 429
  with `Retry-After: 3` on request 31. No tenant applies because there is no
  sign-in or product-owned server state.

## Candidate and live comparison

The live HTML has documentation build ID `bf5a40e9239c`; the local candidate
has implementation build ID `1cced20b57a3`. After normalizing that later
documentation-only build identifier, home, demo, privacy, terms, and 404 HTML
match byte-for-byte. The three hashed runtime assets, demo fixture, blueprint
and social images, icons, and service-worker precache list also match. The
service-worker cache name changes with the documentation build, as expected.

The checkout link is exactly:

`https://api.sociobot.in/api/v1/products/camera-ingest-preflight/checkout`

It currently responds `404 {"error":"enabled factory product","status":404}`.
This is the expected registration state named in the assignment; it is not a
broken page or failed product path.

## Performance

The production JavaScript is 13.35 KiB uncompressed and CSS is 17.53 KiB;
there are no webfonts. The hero is 81 KiB. A fresh Lighthouse 13.4.1 run
recorded FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0, and 96 KiB transfer; it gave
Accessibility, Best Practices, and SEO scores of 100. Lighthouse's
screenshot collector did not produce a performance score in this container
(`NO_SCREENSHOTS`) after its Chrome process needed the shared-memory fallback.
That is an environment measurement limitation, not a public product claim.
The preceding full clean measurement for the same functional build is recorded
in the handoff as 100/100/100/100.

## Earlier findings

| Earlier report | Current disposition |
| --- | --- |
| Verification 1: policy, cache, offline reload, typecheck, skip focus, touch target | Fixed; live headers, offline reload, typecheck, focus, and phone measurements pass. |
| Verification 2: exported reports scanned again as inputs | Fixed; report-destination regression tests and claim pass. |
| Verification 3: token-unbound cached verdict and wordmark name | Fixed; token-bound verification claim and accessibility checks pass. |
| Verification 4: candidate identity, first screen, real demo, routes, metadata | Fixed; candidate/runtime comparison, first-screen check, CLI-derived demo, and route checks pass. |
| Verification 5: missing claims and short demo controls | Fixed; all 25 claims pass and phone controls meet the test suite baseline. |
| Verification 6: first clean claim command and checkout availability | Claim bootstrap fixed. Checkout registration remains an expected external 404 under this assignment. |

## Findings

None.
