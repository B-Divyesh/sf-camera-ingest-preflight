# Verification report 6 — FAIL

**Work order:** `camera-ingest-preflight-verify-6`  
**Candidate:** `07e7842349417cad7d3d9aaedaaf53755f51551d` (`07e7842`)  
**Live URL:** <https://camera-ingest-preflight.sociobot.in/>  
**Date:** 2026-09-01

## Decision

**FAIL — do not accept this candidate.**

The core CLI, sample demo, installed claim suite, live static deployment,
accessibility baseline, privacy behavior, offline behavior, and performance all
work. Two release requirements remain incomplete:

1. Every claim command failed when run first from the clean clone, as the work
   order required, because `vite` was unavailable until `npm ci` was run.
2. The researched brief specifies a paid migration set, but new purchases are
   unavailable and the product checkout returns HTTP 404.

No product source was modified during verification.

## Mandatory first checks

### Claims from the clean clone

`.factory/claims.json` exists and contains 25 claims. Each exact `test` command
was run in manifest order before dependency installation. All 25 exited 127
during `npm run build:site` with `sh: 1: vite: not found`; no browser assertion
ran. Under the work order's rule that any failing claim test blocks release,
this is a P1 finding.

After `npm ci`, all 25 exact commands were run again independently and passed,
one focused Playwright test per command:

| Claims | Installed result |
| --- | --- |
| `sample-scan`, `demo-sandbox`, `read-only-scan`, `gps-redaction`, `format-decisions` | PASS |
| `embedded-preview`, `projection-hints`, `orientation-validation`, `duplicate-detection`, `camera-metadata` | PASS |
| `gps-inclusion`, `report-contract`, `sha256-report`, `local-cli-privacy`, `json-csv-exit-codes` | PASS |
| `local-demo-privacy`, `offline-reload`, `license-verification`, `license-daily-check`, `migration-brief` | PASS |
| `paid-layouts`, `license-revocation`, `checkout-status`, `pasted-report-privacy`, `open-source` | PASS |

The claims-contract regression confirms every manifest ID has exactly one
matching `@claim:<id>` test. Review of the homepage and README found the
retained product promises represented by the claim set.

### Cold first read

**PASS.** On a fresh 1440 × 900 browser context, the first screen states:

- What it does: “Scan cards before DAM import.”
- Who it is for: “For 360° and mixed-camera photographers who need import
  risks before a DAM sees the card.”
- What to do first: **Try it with sample data**.

The primary action is within the initial viewport. One click renders four
sample rows with 0 ready, 3 review, and 1 reject. The same screen lists Local,
Read-only, GPS-redacted, and Open source. There were no console or page errors.

## Candidate and live identity

- Clean checkout HEAD was exactly
  `07e7842349417cad7d3d9aaedaaf53755f51551d`.
- The live page exposes build ID `07e784234941`.
- Nineteen public build artifacts were downloaded and matched `dist/site`
  byte-for-byte, including documents, hashed assets, images, the fixture, and
  service worker.
- `staticwebapp.config.json` returned 404, as expected for deployment
  configuration rather than public content.
- The live browser suite passed all 35 tests against the production hostname.

The live observations therefore apply to the candidate.

## Clean gates and package checks

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 23 packages, 0 audit findings |
| `npm test` | PASS — 12 Rust tests and 35 Chromium tests |
| `npm run typecheck` | PASS |
| `cargo fmt --all -- --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm run build` | PASS — release binary and `dist/site/` produced |
| `cargo package --locked` | PASS — 14 files, 57.8 KiB unpacked / 17.6 KiB compressed |

The packaged crate installed into an isolated Cargo root with `--locked`.
`--help` names both commands and explains profiles, privacy, output, and exit
behavior. `demo --profile photoprism` created a new temporary sample card and
report, then returned the documented exit 1 with 4 files: 0 ready, 3 review,
1 reject.

A clean consumer generated its own lockfile, compiled the packaged library
with `--locked`, and called `scan`, `needs_review`, `Profile`, and
`ScanOptions`. It returned schema 1.0, four files, review required, and GPS
coordinates excluded.

## CLI end-to-end checks

- A two-file card with equal bytes and different names produced two review
  rows and one full-digest duplicate link. A filename containing a comma was
  correctly quoted in CSV.
- JSON schema 1.0 and CSV were both created. The external symlink was omitted.
- SHA-256 values for the source files were unchanged before and after scanning.
- Default JSON reported GPS presence with no coordinates.
- Missing input, an unknown profile, and a directory used as an output path
  each returned exit 2 with specific guidance.
- A corrected rerun produced a complete report and the expected exit 1 for
  review findings.
- The installed demo and claim fixtures cover supported, version-sensitive,
  unknown, and rejected formats; the 24 MiB preview boundary; projection
  evidence; orientations 1–9; complete, partial, absent, and garbled camera
  identity; exact GPS opt-in; and report-destination exclusion.

## Live UI and accessibility

- `/opt/fleet/lib/verify-url.sh` passed in 678 ms: correct title, `lang=en`, one
  h1, main landmark, all image alternatives, labeled buttons, and zero errors.
- Axe 4.13 found zero serious or critical issues on the demo and legal pages at
  desktop and mobile sizes.
- Desktop 1440 × 900 and mobile 390 × 844 had no horizontal page overflow.
- Every visible interactive element measured on the 390 px page met the
  44 × 44 px minimum. Demo banner controls measured 106.7 × 44.8 px and
  111.1 × 44.8 px; the primary action measured 342 × 48.8 px.
- Keyboard traversal reached the skip link, header links, and primary button.
  Focus used a visible 3 px cyan outline. Enter activated the sample and
  rendered all four rows.
- With reduced motion requested, the scan line was not displayed and its
  duration was reduced to 0.01 ms.
- A short license token received plain guidance, `aria-invalid=true`, and
  focus. A complete recorded token recovered to the unlocked state. Malformed
  report input received specific guidance and `aria-invalid=true`; loading the
  sample cleared the invalid state and generated the brief.
- The inspected pages had no dialogs or custom widgets requiring additional
  dialog focus handling. Status and error feedback use live regions.

## Privacy, headers, routing, and offline behavior

- A cold load and complete sample action made six requests, all to
  `camera-ingest-preflight.sociobot.in`. No analytics, remote font, remote
  script, visitor-file upload, console error, or page error was observed.
- The demo isolation test seeded real license and layout keys, confirmed none
  were read, reset the sample, and confirmed same-origin-only requests.
- The CLI manifest and scanner source contain no network or telemetry client;
  scanning is local and read-only.
- Live documents send CSP, HSTS, Permissions-Policy, `nosniff`, and a
  strict-origin referrer policy. The CSP permits only self-hosted runtime
  resources plus the documented Sociobot license connection.
- Documents and `sw.js` revalidate after 30 seconds. Hashed assets and product
  images use one-year immutable caching. Conditional asset revalidation
  returned 304.
- All same-origin links found across home, demo, privacy, terms, and 404
  documents returned 200. An unknown route returned the designed document with
  HTTP 404.
- A fresh service worker completed `registration.update()`. The same context
  then went offline, reloaded `/demo/`, and rendered all four rows without
  console errors.
- License verification allowed 30 requests from one client in the observed
  window. Request 31 returned 429 with `Retry-After: 3` and
  `X-RateLimit-After: 3`.
- No sign-in exists, so the Entra tenant check does not apply. The product has
  no product-owned server API, database, or persistence service.

## Performance and assets

- Lighthouse 13.4.1 mobile completed without a runtime error: Performance 98,
  Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.2 s,
  TBT 180 ms, CLS 0, and 95 KiB transferred. A lab navigation does not provide
  INP.
- Production JavaScript totals 14,180 bytes and CSS totals 17,789 bytes
  uncompressed. The hero image is 81,048 bytes. No webfonts are shipped.
- Home, demo, privacy, and terms use route-specific titles, one h1, canonical
  and social metadata, and landmarks. `robots.txt`, `sitemap.xml`, the favicon,
  Apple touch icon, and 1200 × 630 social card are present.
- The blueprint field-sheet identity matches `.factory/design.md`, including
  palette, type, spacing, interaction, motion, and original asset provenance.

## Findings

### P1 — claim commands do not run first from the clean clone

All 25 exact `.factory/claims.json` commands returned exit 127 before their
assertions because the repository had no installed `vite` executable. They all
pass after `npm ci`, but the work order explicitly makes a failed first claim
run release-blocking.

Expected result: the prescribed first claim commands run successfully from the
clean verification state, or the accepted verification procedure explicitly
installs the locked dependencies before those commands.

### P1 — new migration-set purchases are unavailable

The researched brief specifies a one-time paid migration report set. The live
site instead states that new purchases are unavailable and provides no buy
link. A fresh request to the documented checkout URL returned:

```text
HTTP/2 404
{"error":"enabled factory product","status":404}
```

Existing-license restore, token-bound verdicts, daily checks, revocation,
brief generation, printing, download, and saved layouts pass. A new customer
still cannot obtain the paid feature.

Expected result: register and enable `camera-ingest-preflight` in the Sociobot
billing engine, restore the standard hosted checkout link, and confirm its
redirect and return-token flow.

## Re-verification

1. Resolve the clean-clone claim-test prerequisite and rerun every exact claim
   command as the first verification step.
2. Complete product checkout registration and confirm a new purchase can start.
3. Repeat build identity, live browser, privacy, request allowance, offline,
   mobile accessibility, and performance checks.
