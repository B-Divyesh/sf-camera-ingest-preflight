# Camera Ingest Preflight — repair handoff

## Release status: repaired; checkout registration remains operator-owned

This repair addresses every product-QA finding in
`.factory/verification-5.md` for candidate
`32ed081700a9afa621450e114da2ee8f3d44c005` and the controller's expanded
claims requirement.

The shared checkout cannot be repaired from this repository. A fresh public
GET on 2026-09-01 returned HTTP 404 with
`{"error":"enabled factory product","status":404}`. The site no longer
offers that broken link. It says new purchases are temporarily unavailable,
keeps the planned $29 price honest, and retains existing-license restore.
Product registration is the only known operator follow-up.

## Repairs delivered

- Registered and tested every retained format, embedded-preview, projection,
  orientation, duplicate, camera metadata, GPS, report-contract, paid-layout,
  revocation, and checkout-status claim. `.factory/claims.json` now contains
  25 entries with exactly one matching `@claim:<id>` test each.
- Added real CLI-driven fixtures for Generic, PhotoPrism, and Lightroom format
  decisions; previews inside and beyond the 24 MiB inspection boundary; GPano,
  2:1, and filename projection evidence; EXIF orientation 1–9; full-file
  duplicate hashes; camera metadata states; explicit GPS coordinates; schema
  1.0, exit 0/1/2, and exact report-destination exclusion.
- Fixed a root scanner defect found by the new camera claim: control bytes are
  escaped by the EXIF reader as literal `\xNN`, so garbled make/model values
  were previously marked complete. The scanner now detects raw, replacement,
  `\u{...}`, and escaped-byte forms.
- Split paid coverage into brief generation/export, persistent saved layouts,
  and refund/revocation reconciliation. Layout tests save, reload, apply, and
  delete destination/order settings. Revocation tests age a cached valid
  verdict, return `reason: "revoked"`, and prove the workspace locks.
- Replaced the live 404 checkout action with an unavailable status and an
  operable restore control. Homepage, terms, README, and license errors no
  longer tell visitors to buy through a broken link.
- Raised both demo-banner actions from about 40.8 px to 44.8 px. Playwright
  measures Reset demo at 106.7 × 44.8 px and Start for real at 111.1 × 44.8 px
  at both 1440 × 900 and 390 × 844.
- Made `/privacy/` and `/terms/` main landmarks focusable and added keyboard
  skip-link regression coverage. Updated the landing-page sentence and
  terminology audit in `.factory/copy-audit.md`.

## Exact regressions

- `@regression:claims-contract` compares all manifest IDs with source tags,
  requires one occurrence each, and pins the controller-required categories.
- `@claim:checkout-status` proves the unavailable notice, absence of the known
  broken checkout URL, honest terms, and existing-license restore.
- `@regression:demo-banner-touch-targets` measures both controls at desktop and
  390 px mobile.
- `@claim:camera-metadata` reaches the real CLI with complete, missing,
  partial, and control-byte TIFF metadata. A Rust unit regression covers the
  EXIF display escaping that caused the defect.
- `@claim:report-contract` observes schema fields, all three exit meanings, and
  exact output exclusion while an unrelated JSON file remains scanned.

## Verification evidence

Clean verification began with `cargo clean` and `npm ci` on 2026-09-01:

```sh
npm ci
npm test
npm run typecheck
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo package
```

- `npm ci`: 23 packages, 0 vulnerabilities.
- `npm test`: 12 Rust unit/integration tests and 35 Chromium tests passed.
- All 25 commands in `.factory/claims.json` were then run individually and
  passed.
- TypeScript, Rust formatting, and strict Clippy passed.
- Production build produced `dist/site/`; initial JS is 14.2 KiB and CSS is
  17.8 KiB uncompressed, with no webfonts.
- `cargo package --allow-dirty` verified 14 files, 57.9 KiB unpacked and 17.6
  KiB compressed. The clean committed tree should use `cargo package` without
  that development-only flag.
- The packaged crate installed with `--locked` into an isolated Cargo root.
  Its help rendered correctly and bundled demo returned expected exit 1 with
  4 files: 0 ready, 3 review, 1 reject.
- A fresh locked consumer compiled and ran the packaged public `scan`,
  `needs_review`, `Profile`, and `ScanOptions` API.
- `/opt/fleet/lib/verify-url.sh` passed locally in 531 ms: correct title,
  `lang=en`, one h1, main landmark, all image alternatives, labeled buttons,
  and zero console errors.
- Axe runs in the Playwright suite found zero serious or critical issues on
  demo and legal routes. Desktop and 390 px layouts have no horizontal
  overflow. Keyboard skip links, form errors, demo reset, license restore, and
  focus states passed.
- A dedicated fresh browser context registered the versioned service worker,
  rejected a missing asset without an HTML MIME fallback, went offline,
  reloaded, and rendered all four sample rows with no console errors.
- Browser privacy tests recorded only same-origin requests during demo and
  pasted-report flows. Demo mode never reads real license/layout keys. Static
  policy tests cover CSP, Permissions-Policy, `nosniff`, immutable assets, and
  the real 404 response override.
- Lighthouse 13.4.1 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.0 s, LCP 1.5 s, TBT 0 ms, CLS 0. INP is not produced by
  this lab navigation.

## Deploy and verify

Build after the final commit so the HTML build ID matches `git rev-parse
--short=12 HEAD`, then deploy only this product:

```sh
npm run build
/opt/fleet/lib/deploy-static.sh camera-ingest-preflight dist/site
```

Verify the public build ID, `/`, `/demo/`, legal pages, 404 response, security
headers, immutable hashed assets, offline reload, privacy request log, desktop,
390 px mobile, keyboard, Axe, and the complete Playwright suite against
`https://camera-ingest-preflight.sociobot.in`.

## Known gap and next step

New purchases remain unavailable until the factory registers and enables
`camera-ingest-preflight` in the Sociobot billing engine. Do not change or
inspect shared billing services from this repository. After operator
registration, restore the standard hosted checkout link, update the status
copy and its claim test, then verify that the public endpoint redirects rather
than returning 404.
