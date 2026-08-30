# Camera Ingest Preflight — repair handoff

## Release status: BLOCKED by factory billing

This repair resolves the repository and static-deployment findings in
independent report `.factory/verification-4.md` for candidate
`7ace603c935d7fe91ad5bce494a76a7596e56dfa`.

The repaired application commit is `80a03bdb1111b5d420b5b87ef9e0ed14cf4d96e9`
(`fix: ship isolated CLI-backed demo and site routes`), pushed to `origin/main`
and deployed as Static Web Apps deployment
`91a70575-1729-469f-8826-9b32bd4cdf17`.

The release cannot be marked pass until the factory registers the paid product
with the Sociobot billing service. The visible $29 checkout remains the
contract-required Sociobot URL, but the factory API is globally returning HTTP
503 during this repair. Before the outage, the verifier captured its separate
HTTP 404 `enabled factory product` registration failure. There is no billing
registration utility or billing credential in this checkout; no payment
provider has been added or substituted.

## Repair delivered

- The first screen now identifies the intended audience: “For 360° and
  mixed-camera photographers …”. The primary first action is **Try it with
  sample data**.
- `/demo`, `/demo/`, and `?demo=1` now enter an isolated, resettable demo. A
  persistent **Demo — sample data, nothing is saved** banner includes **Reset
  demo** and **Start for real**. Demo mode does not read or write real license
  or saved-layout storage.
- `scripts/generate-demo-fixture.mjs` runs the real bundled CLI demo for
  Generic, PhotoPrism, and Lightroom at site build time. The published report
  and terminal transcript therefore contain the real 4-file result: 0 ready,
  3 review, 1 reject. The web sample no longer invents camera metadata or
  contradicts the CLI.
- The CLI-derived fixture is precached with the shell and the same fixture is
  used by the paid migration workspace sample.
- Added complete claims coverage for sample parity, demo isolation, read-only
  operation, GPS redaction, SHA-256, JSON/CSV and exit behavior, local CLI
  privacy, offline reload, license verification/cache interval, migration
  briefs, pasted-report privacy, and MIT source availability.
- Added a real `/404.html`, HTTP 404 response override, `/demo` route rewrite,
  canonical/OG/Twitter/Apple-touch metadata, a 1200 × 630 product social card,
  a build identity stamp, sitemap entry, and Param Factory footer attribution.

## Exact regressions

- `@regression:cli-web-sample-parity` runs
  `camera-ingest-preflight demo --profile photoprism`, normalizes only its
  temporary path/timestamp, and compares the full JSON report plus terminal
  transcript with `site/public/demo-fixtures.json`.
- `@claim:sample-scan` opens `/demo` and asserts all four rows and exact
  0/3/1 counts.
- `@claim:demo-sandbox` seeds real browser storage, then proves `?demo=1`
  never reads it, has banner controls, and makes same-origin-only requests.
- `@claim:json-csv-exit-codes`, `@claim:sha256-report`,
  `@claim:read-only-scan`, and `@claim:gps-redaction` exercise the real CLI.
- `@claim:license-daily-check`, token-replacement regression coverage, and
  `@claim:pasted-report-privacy` cover the verifier's entitlement and privacy
  paths.

## Verification evidence

Clean verification after `cargo clean` and `npm ci` on 2026-08-30:

```sh
npm test
npm run typecheck
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo package
```

- `npm ci`: 23 packages, 0 vulnerabilities.
- `npm test`: 11 Rust unit/integration tests and 22 Chromium production-site
  tests passed.
- Every command in `.factory/claims.json` maps to exactly one tagged test; the
  complete suite passed from the clean install.
- Typecheck, format, strict Clippy, release CLI build, and Vite build passed.
- `cargo package` passed verification: 14 files, 57.2 KiB unpacked / 17.3 KiB
  compressed.
- A clean `cargo install --path target/package/camera-ingest-preflight-0.1.0
  --root target/isolated-install` installed the packaged CLI; its help and
  bundled demo worked. The installed demo returned its expected exit 1 with
  4 files, 0 ready, 3 review, and 1 reject.
- A fresh consumer project compiled and ran the packaged public `scan`,
  `needs_review`, `Profile`, and `ScanOptions` API against the bundled card.
- Local desktop and 390 × 844 checks found four demo rows, working keyboard
  reset control, no horizontal overflow, and no console errors. The repository
  Axe integration found no serious or critical violations.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4179/` passed: one h1, one
  main, `lang=en`, all image alt text, labeled buttons, and zero console errors.
- Fresh service-worker registration was controlling and `registration.update()`
  completed. Its cache precaches `/demo-fixtures.json`; the dedicated offline
  test reloads `?demo=1` and renders all four rows with networking disabled.
- Local Lighthouse 13.4.1 mobile: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.9 s, LCP 1.5 s, TBT 0 ms, CLS 0, 96 KiB transfer.

## Deployment and live evidence

- Deployed with `/opt/fleet/lib/deploy-static.sh camera-ingest-preflight
  dist/site` to <https://camera-ingest-preflight.sociobot.in/>.
- Live `index.html` SHA-256 is
  `e0d20d9c00179d2776a8715112ec39c36d80135bc9c1249f2675bdca0004c6d1`,
  byte-identical to the deployed `dist/site/index.html`. The live build meta
  identity is `80a03bdb1111`.
- Live `/demo`, `/demo/`, `?demo=1`, legal pages, assets, and social metadata
  returned 200. A missing route returned the designed `404.html` with HTTP 404.
- `verify-url.sh` passed live in 609 ms with title, language, one h1, main,
  image alternatives, labeled controls, and no console errors.
- All 22 Playwright tests passed against the live hostname, including desktop,
  390 px mobile, keyboard skip/reset, Axe, privacy requests, isolated demo,
  service-worker offline reload, legal pages, 404 config, and metadata.
- Live headers include CSP as a response header (including only the documented
  Sociobot API connection), HSTS, `nosniff`, referrer policy, and permissions
  policy. Fingerprinted JS uses a one-year immutable cache and conditional
  revalidation returned HTTP 304.
- Live Lighthouse 13.4.1 mobile: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 30 ms, CLS 0, 95 KiB transfer.

## Required factory follow-up

Register `camera-ingest-preflight` at the Sociobot billing API with the
documented one-time $29 migration set, product return URL
`https://camera-ingest-preflight.sociobot.in/`, and the normal checkout URL:

```text
https://api.sociobot.in/api/v1/products/camera-ingest-preflight/checkout
```

When the API is healthy, verify it redirects to hosted checkout (not 404/503),
then run `npx playwright test` against the live site once more. No other known
repository or deployment gap remains.
