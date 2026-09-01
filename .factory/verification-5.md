# Verification report 5 — FAIL

**Work order:** `camera-ingest-preflight-verify-5`  
**Candidate:** `32ed081700a9afa621450e114da2ee8f3d44c005` (`32ed081`)  
**Live URL:** <https://camera-ingest-preflight.sociobot.in/>  
**Date:** 2026-09-01

## Decision

**FAIL — do not accept this candidate.**

The candidate and live deployment match, the CLI works end to end, all 14
declared claim tests pass after the documented install, and the static site is
fast, private by default, and usable offline. Release remains blocked because
the visible $29 purchase link returns HTTP 404. The claims manifest also omits
several promises made on the landing page and in the README. One touch-target
defect remains in the demo banner.

No product code was modified during verification.

## Mandatory first checks

### Claims

`.factory/claims.json` exists with 14 entries. Its commands were the first
product commands attempted from the clean candidate. Before dependency
installation, each stopped at `vite: not found`. After the required `npm ci`,
every command was rerun exactly as declared and passed:

| Claim | Result |
| --- | --- |
| `sample-scan` | PASS — one focused Playwright test |
| `demo-sandbox` | PASS — one focused Playwright test |
| `read-only-scan` | PASS — one focused Playwright test |
| `gps-redaction` | PASS — one focused Playwright test |
| `sha256-report` | PASS — one focused Playwright test |
| `local-cli-privacy` | PASS — one focused Playwright test |
| `json-csv-exit-codes` | PASS — one focused Playwright test |
| `local-demo-privacy` | PASS — one focused Playwright test |
| `offline-reload` | PASS — one focused Playwright test |
| `license-verification` | PASS — one focused Playwright test |
| `license-daily-check` | PASS — one focused Playwright test |
| `migration-brief` | PASS — one focused Playwright test |
| `pasted-report-privacy` | PASS — one focused Playwright test |
| `open-source` | PASS — one focused Playwright test |

Each manifest ID occurs exactly once as `@claim:<id>` in the test suite. Claim
coverage is nevertheless incomplete; see P1 below.

### Cold first read

**PASS.** A fresh 1440 × 900 profile showed:

- What it does: “Scan cards before DAM import.”
- Who it is for: “For 360° and mixed-camera photographers…”
- What to do first: **Try it with sample data**.

The action is visible on the first screen and loads the four-file result in one
click. The cold load returned 200, made five same-origin requests, and had no
console or page errors.

## Candidate and deployment identity

- The checkout was clean and exactly at `32ed081700a9afa621450e114da2ee8f3d44c005`.
- The live page contains build ID `32ed081700a9`.
- Local and live SHA-256 values match for `/`, `/demo/`, `/privacy/`,
  `/terms/`, `/404.html`, `/sw.js`, `/demo-fixtures.json`, both product images,
  favicon, Apple touch icon, and all five hashed JS/CSS assets.
- Local and live `/` both hash to
  `285f5341b9b282aa8da73f48f30ab1bf56a2f402510530154c77fb2af3ca34ce`.
- `staticwebapp.config.json` correctly is not publicly served; it returns 404.

The live findings therefore apply to this candidate.

## Clean gates, build, and package

| Check | Fresh result |
| --- | --- |
| `npm ci` | PASS — 23 packages, 0 vulnerabilities |
| `npm test` | PASS — 11 Rust tests and 22 Chromium tests |
| `npm run typecheck` | PASS |
| `cargo fmt --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm run build` | PASS — release binary and `dist/site/` produced |
| `cargo package` | PASS — 14 files, 57.2 KiB unpacked / 17.3 KiB compressed |
| Live Playwright suite | PASS — all 22 tests against production |
| Factory `verify-url.sh` | PASS — 565 ms, correct semantics, zero errors |

The packaged crate installed into an empty Cargo root. Its `--help` was useful
and `demo --profile photoprism` created a temporary sample card and report,
then returned the expected exit 1 for 0 ready, 3 review, 1 reject. A separate
consumer compiled and called the packaged `scan`, `needs_review`, `Profile`,
and `ScanOptions` API. A second consumer run with `--locked` also passed.

## CLI end-to-end evidence

- The bundled card reports 4 files: 0 ready, 3 review, 1 reject. The CLI and
  published web fixture match after temporary path/time normalization.
- An independently generated EXIF TIFF reported Canon / EOS R, orientation 6
  as “rotated 90°,” a 2:1 equirectangular hint, and GPS presence.
- Default JSON omitted coordinates and marked GPS redacted. Explicit
  `--include-gps` returned `37.80833333333333`, `-122.40416666666667`.
- Orientation 9 produced `orientation_invalid` and exit 1.
- A duplicate pair with a quoted/comma filename produced two rejects and one
  duplicate. JSON stdout remained valid under `--quiet`.
- A symlink to an external file was omitted. Source SHA-256 stayed unchanged.
- JSON and CSV saved inside the card were excluded on repeated runs; the ready
  card stayed at exit 0 with two scanned inputs.
- Empty input returned exit 1 with a next step. Missing folder, file-as-root,
  invalid profile, and directory-as-output returned exit 2 with clear errors.
  Corrected reruns succeeded.

## Live UI, accessibility, privacy, and PWA

- Desktop 1440 × 900 and mobile 390 × 844 have no horizontal page overflow.
- Axe 4.13 reports zero serious/critical findings on demo and legal pages at
  desktop and mobile sizes.
- Keyboard traversal reaches all visible controls without a trap. Focus uses a
  visible 3 px cyan outline. The skip link moves focus to main.
- Reduced motion hides the scan line and limits other motion to 0.01 ms.
- Short licenses and malformed reports receive specific guidance,
  `aria-invalid`, and focus. Correcting both inputs recovers normally.
- A fresh worker controlled the page with cache
  `camera-preflight-shell-3c3a8ee9ca97`. `registration.update()` completed.
  The same context reloaded offline with all four rows and no errors.
- Initial load and the complete sample flow made only same-origin requests.
  No analytics, remote font, third-party script, upload control, or unexpected
  browser request was observed.
- Responses include CSP, HSTS, Permissions-Policy, `nosniff`, and strict-origin
  referrer policy. Documents and `sw.js` revalidate after 30 seconds. Hashed
  assets use one-year immutable caching; ETag revalidation returned 304. An
  unknown route returns the designed page with HTTP 404.
- License verification returned an invalid verdict with 200 and
  `Cache-Control: no-store`. A fresh client received 30 allowed responses;
  request 31 returned 429 with `Retry-After: 4` and
  `X-RateLimit-After: 4`.
- No sign-in exists, so the Entra requirement is not applicable. The product
  has no own server-side data store or API.

## Performance and metadata

- Lighthouse 13.4.1 mobile: Performance 99, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 130 ms, CLS 0, 95 KiB transfer.
  INP is not produced by this lab navigation.
- Built assets total about 14.2 KB JS and 17.6 KB CSS uncompressed. The hero is
  81,048 bytes and there are no webfonts. All stated budgets pass.
- Home, demo, privacy, and terms have route-specific titles, one h1, language,
  canonical/social metadata, and landmarks. `robots.txt` and `sitemap.xml`
  cover every public route. The blueprint visual system matches the documented
  product-specific design and original-asset provenance.

## Defects

### P1 — advertised paid purchase is unavailable

The visible **Buy migration set — $29** link points to:

`https://api.sociobot.in/api/v1/products/camera-ingest-preflight/checkout`

Fresh GET result:

```text
HTTP/2 404
{"error":"enabled factory product","status":404}
```

The page and terms promise a one-time $29 migration set, but a visitor cannot
purchase it. Mocked restore, token binding, daily caching, brief generation,
printing, download, and local layout flows pass; they do not make the purchase
available.

### P1 — claims manifest omits visible scanner promises

The supplied claims policy requires every reliance claim in
`.factory/claims.json` with one matching claim test. The manifest omits
prominent homepage and README promises for:

- Generic, PhotoPrism, and Lightroom format decisions;
- embedded-preview detection;
- GPano, 2:1, and filename projection hints;
- EXIF orientation validation;
- duplicate detection;
- missing, partial, or garbled camera identity detection;
- coordinate inclusion with `--include-gps`;
- complete exit 0/1/2 meanings, versioned report schema, bounded reads, and
  exact report-destination exclusion;
- saved migration layouts and refund-driven license revocation.

Some have ordinary unit/regression coverage or independent QA, but that does
not satisfy the required manifest/tag contract. For example,
`gps-redaction` tests omission only, not the separate public promise that
`--include-gps` emits coordinates.

### P2 — demo banner controls are below the touch-target baseline

At 1440 px and 390 px, **Reset demo** and **Start for real** render at about
40.8 px high. The required baseline is 44 px. Both remain keyboard accessible
with visible focus, and all other measured visible controls meet the target.

## Re-verification required

1. Enable the production Sociobot product so the checkout URL redirects to the
   hosted checkout.
2. Add claim entries and exactly one tagged observable test for every retained
   promise, or remove the unsupported copy.
3. Raise both demo-banner controls to at least 44 px in both viewports.
4. Repeat claim commands, clean gates, parity, paid endpoint, mobile
   accessibility, privacy logging, and offline update/reload checks.
