# Scan cards before DAM import — verification 8

**Work order:** `camera-ingest-preflight-verify-8`  
**Verdict:** **PASS**  
**Findings:** 0  
**Untested public claims:** 0  
**Implementation reviewed:** `cda621b15d037f896501de60f136eec7ebf3cca3`  
**Documentation SHA:** `0bc8952415b8a968abdbd4fe632ce90f2312489d`  
**Live URL:** <https://camera-ingest-preflight.sociobot.in/>  
**Date:** 2026-09-06

## Job, audience, and first action

The product scans camera cards before a DAM import. It is for 360° and
mixed-camera photographers who need import risks before the DAM sees a card.
The first action is **Try it with sample data**.

Fresh 1440 × 900 desktop and 390 × 844 phone contexts showed all three before
scrolling. Keyboard Enter on that action opened `/demo/`. The persistent
**Demo — sample data, nothing is saved** label appeared, the real bundled
report showed four rows and 0 ready / 3 review / 1 reject, and **Reset demo**
restored the same result. Both contexts had no console errors.

## Candidate and live runtime

The live document identifies documentation build `0bc8952415b8`. That is the
later report/documentation commit, not a product-code change. The implementation
candidate is `cda621b`.

A clean build of `cda621b` byte-matched the live main and legal JavaScript,
CSS, demo fixture, blueprint and social images, favicon, and touch icon. Home,
demo, privacy, terms, and 404 documents matched after normalizing only the
build-ID meta value. The service worker matched after normalizing its
content-derived cache name, which necessarily changes with the later document
stamp. The live runtime therefore represents the reviewed implementation.

## Clean claims and local gates

A `git clone --no-local` at documentation SHA `0bc8952` started without
`node_modules`. The first exact claim command performed its documented locked
`npm ci` bootstrap. All 25 exact commands from `.factory/claims.json` passed:

| Claims | Result |
| --- | --- |
| `sample-scan`, `demo-sandbox`, `read-only-scan`, `gps-redaction`, `format-decisions` | PASS |
| `embedded-preview`, `projection-hints`, `orientation-validation`, `duplicate-detection`, `camera-metadata` | PASS |
| `gps-inclusion`, `report-contract`, `sha256-report`, `local-cli-privacy`, `json-csv-exit-codes` | PASS |
| `local-demo-privacy`, `offline-reload`, `license-verification`, `license-daily-check`, `migration-brief` | PASS |
| `paid-layouts`, `license-revocation`, `checkout-start`, `pasted-report-privacy`, `open-source` | PASS |

The required gates also passed from that clone:

- `npm test`: 12 Rust tests and 36 Chromium tests passed.
- `npm run typecheck`, `cargo fmt --all -- --check`, and `cargo clippy --all-targets --all-features -- -D warnings` passed.
- `npm run build` produced the optimized CLI and `dist/site/`.
- `cargo package --locked` passed verification: 14 files, 58.0 KiB unpacked and 17.6 KiB compressed.

The packaged crate was extracted and installed with `cargo install --locked`
into a separate empty consumer root. Its installed `--help` described `scan`
and `demo`. `demo --profile photoprism` made its temporary four-file sample
and report, printed 0 ready / 3 review / 1 reject, and returned the documented
findings exit code 1.

The release-binary finding from review 1 is fixed. The live install surface
offers `cargo install --git` and **View source code**; it has no release-binary
link or promise. The new `open-source` claim and install-options regression
passed, so the public install path is both available and tested.

## Live browser, accessibility, and privacy

- Full production Playwright: 36 of 36 passed, including desktop and phone,
  keyboard and focus, reduced motion, demo isolation, reset, offline reload,
  invalid-license recovery, legal routes, 404, and the source-install path.
- `/opt/fleet/lib/verify-url.sh` passed in 615 ms: correct title and `lang`,
  one h1, main landmark, image alternatives, named buttons, and zero browser
  console or page errors.
- Axe 4.13 integration ran in the full suite for desktop/phone sample and legal
  pages with zero serious or critical violations.
- The demo uses the bundled CLI fixture. It made same-origin-only requests,
  did not expose a file input, and the demo claim proved it did not read real
  license or saved-layout storage. Offline reload remained interactive.
- Home, demo, privacy, and terms returned 200 with distinct titles and one h1;
  unknown routes returned the styled HTTP 404. `robots.txt` and `sitemap.xml`
  returned 200.
- Live headers include CSP, HSTS, Permissions-Policy, `nosniff`, and strict
  referrer policy. Hashed JS and the blueprint image have one-year immutable
  cache headers. The main JS is 13.35 KiB and CSS is 17.53 KiB uncompressed.
- Lighthouse 13.4 mobile recorded performance 100, accessibility 100, and
  best practices 100 (FCP 1.0 s, LCP 1.2 s, TBT 0 ms, CLS 0, 96 KiB transfer).
  Its robots audit could not fetch `robots.txt` after a browser-tab crash, but
  an independent live request returned the valid file; this is not a product
  finding.

This static CLI product has no product backend, tenant state, SQLite database,
health endpoint, restart persistence, or product rate-limit endpoint. Those
backend-only checks do not apply.

## External checkout

`https://api.sociobot.in/api/v1/products/camera-ingest-preflight/checkout`
returned the specified deliberate HTTP 404 body (`enabled factory product`).
This is the unregistered external billing state named in the work order, not a
broken product route or a defect.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Verification 1: headers, cache, offline reload, typecheck, skip target, touch target | Fixed; current live header checks, offline test, typecheck, keyboard test, and phone test pass. |
| Verification 2: generated reports scanned as card inputs | Fixed; repeated JSON/CSV export regressions and report-contract claim pass. |
| Verification 3: license verdict was not token-bound; wordmark name | Fixed; token-bound license claim and accessible-name checks pass. |
| Verification 4: candidate identity, first screen, demo, routes, metadata | Fixed; current parity and fresh browser checks pass. |
| Verification 5: claim coverage and demo controls | Fixed; all 25 claims, reset, isolation, and touch controls pass. |
| Verification 6: clean claim bootstrap and checkout | Bootstrap passes; checkout 404 remains expected external state. |
| Review 1: unavailable release binaries promised publicly | Fixed; copy removed the promise and source-install regression passes. |

## Decision

**PASS — zero findings at every severity and zero untested public claims.**
