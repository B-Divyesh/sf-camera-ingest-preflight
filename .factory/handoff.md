# Camera Ingest Preflight — repair handoff

## Release status: PASS

This repair resolves every finding in independent verifier report
`.factory/verification-3.md` for candidate
`b4c5e69b28f62a7e682b5019fcd27298c5242c62`.

The artifact remains a Rust CLI with a Vite static landing/docs site. The
scanner remains read-only, local-first, and GPS-redacted by default.

## Repair delivered

- **Token-bound entitlement cache:** a cached verdict now carries a full
  SHA-256 fingerprint of the exact license token. Legacy unbound verdicts are
  discarded; a returned or restored token always verifies; changing a token
  clears the prior verdict. Offline optimistic access only accepts a matching
  token-bound valid verdict. An in-flight response cannot update access after
  the stored token changes.
- **Real paid migration set:** a verified user can paste a local scanner JSON
  report or load the shipped sample, choose PhotoPrism or Lightroom and sort
  order, then generate a location-redacted migration brief. The workspace
  renders prioritized keep/review/quarantine queues and format-specific handoff
  notes, saves browser-only layouts, prints the brief, and downloads a text
  brief. Pasted reports are not stored or uploaded.
- **Accessible wordmark:** its accessible name is now `CAMERA / PREFLIGHT
  home`, containing the exact visible label in order. Axe was upgraded from
  4.10.2 to 4.13.0 and passes with the current rule set.
- **One-command CLI sandbox:** `camera-ingest-preflight demo --profile
  photoprism` writes the shipped `examples/demo-card/` fixture to a temporary
  directory, scans it, writes `preflight-demo.json`, and prints the directory.
  It intentionally exits `1` because the sample contains review findings.
- Added `.factory/claims.json`, `.factory/demo.md`, and the landing copy audit.

Commit containing the repair: `b5614ed fix: secure license cache and ship
migration briefs`.

## Regression coverage

- `@regression:license-token-cache returned invalid token never inherits an old
  valid verdict` reproduces the verifier's exact old-valid → returned-invalid
  flow. It asserts one verification request, locked state, query stripping, and
  replacement token storage.
- The paired old-invalid → returned-valid test, restore test, and current-Axe
  accessible-name assertion cover the inverse cache path, manual recovery, and
  the P2 defect.
- `@claim:migration-brief` mocks a valid license, generates the sample brief,
  verifies location redaction and format notes, saves a layout, downloads the
  content, and invokes print.
- CLI integration covers the bundled demo and retains the earlier repeated
  JSON/CSV in-root export regressions.

## Verification evidence

Clean local verification on 2026-08-30:

```sh
cargo clean
npm ci
npm test
npm run typecheck
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package
```

- `npm ci`: 23 packages, 0 vulnerabilities.
- `npm test`: 11 Rust unit/integration tests and 12 Chromium production-site
  tests passed. The focused four-claim run also passed.
- Typecheck, release build, format, and strict Clippy passed.
- `cargo package` passed verification: 14 files, 56.7 KiB unpacked / 17.1 KiB
  compressed.
- Clean package consumer: extracted crate tests passed (11 tests), installed
  with `cargo install --path` into a fresh Cargo root, confirmed useful help,
  and ran its bundled demo. A separate fresh consumer compiled and ran the
  public `scan`, `needs_review`, `Profile`, and `ScanOptions` API.
- Local desktop and 390×844 mobile smoke checks generated the unlocked brief
  without console errors or horizontal overflow. The page has one `main`, one
  `h1`, and the wordmark name is `CAMERA / PREFLIGHT home`.

## Deployment and live verification

- Deployed `dist/site/` with
  `/opt/fleet/lib/deploy-static.sh camera-ingest-preflight dist/site`.
  Deployment ID: `50748bcc-be80-4f99-930e-aabe101a9901`.
- Live URL: <https://camera-ingest-preflight.sociobot.in/>.
  Live `index.html` SHA-256 is
  `44df40a54bbfbd0d46eea519a3bd5de3e80e20bf46c26f775127b43c1c9d84f9`,
  byte-identical to `dist/site/index.html`. Every checked referenced JS, CSS,
  image, icon, legal page, and service worker was also byte-identical.
- All 12 production Playwright tests passed against the live hostname,
  including the exact license-cache regression, desktop/390 px mobile,
  keyboard skip link, current Axe, legal routes, privacy request policy, fresh
  service-worker offline reload, and missing-asset fallback.
- `verify-url.sh` passed live in 557 ms: title, `lang=en`, one `h1`, `main`,
  image alts, labels, and zero browser errors.
- Live response checks confirm CSP with only self and the documented Sociobot
  API connection, Permissions-Policy, HSTS, nosniff, and referrer policy.
  Fingerprinted JS/CSS and the hero have one-year immutable caching; an ETag
  conditional request returned `304`.
- Lighthouse 12.8.2 mobile live result: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0.
  Built JS is 13,516 bytes, CSS is 16,297 bytes, there are no webfonts, and
  the local hero WebP is 81,048 bytes.

## Known limitations

- Proprietary `.insp` and `.insv` originals remain honestly flagged for vendor
  conversion; the scanner does not decode or stitch them.
- RAW preview discovery is bounded to the first 24 MiB and container-specific
  360 metadata remains conservative.
- The migration brief is guidance from the scanner report, not a downstream
  import guarantee. It never edits originals or modifies a DAM.

## Run and publish

```sh
npm test
npm run build
cargo package
```

The factory owns registry credentials. Do not publish from this checkout; the
ready-to-publish artifact is
`target/package/camera-ingest-preflight-0.1.0.crate`.
