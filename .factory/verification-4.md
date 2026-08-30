# Verification report 4 — FAIL

**Work order:** `camera-ingest-preflight-verify-4`

**Requested candidate:** `7ace6049b511e4fe8df89fa67487b77c62930f09`

**Reproducible repository tip:** `7ace603c935d7fe91ad5bce494a76a7596e56dfa`

**Live URL:** <https://camera-ingest-preflight.sociobot.in/>

**Date:** 2026-08-30

## Decision

**FAIL — do not release this candidate.**

The requested candidate is not present locally, on `origin/main`, or through
GitHub's commit API. The live deployment is byte-identical to the available
base commit instead. Independent QA also found release-blocking first-read,
demo, claims, and paid-checkout defects.

No product code was changed during verification. Only this report and the
handoff were updated.

## Candidate and deployment identity

- The supplied clean clone started at `7ace603c935d7fe91ad5bce494a76a7596e56dfa`.
- `git fetch origin 7ace6049b511e4fe8df89fa67487b77c62930f09`
  failed with `upload-pack: not our ref`.
- `git ls-remote origin` advertised only `7ace603…` for `HEAD` and `main`.
- GitHub's commit API returned HTTP 422: `No commit found for SHA`.
- Freshly built base output and live output were byte-identical for `/`,
  `/sw.js`, the hero, favicon, legal pages, and referenced JS/CSS. Live `/`
  and local `dist/site/index.html` both hash to
  `44df40a54bbfbd0d46eea519a3bd5de3e80e20bf46c26f775127b43c1c9d84f9`.
- Therefore the live site is proven to match base `7ace603…`, not the requested
  candidate. There is no candidate artifact from which to run or reproduce a
  release.

## Mandatory first checks

### Claims

`.factory/claims.json` exists. After the candidate checkout failed, every
listed command was run verbatim against the only reproducible tip, before the
rest of QA:

| Claim | Result on `7ace603…` |
| --- | --- |
| `sample-scan` | PASS — 1 Playwright test |
| `offline-reload` | PASS — 1 Playwright test |
| `local-demo-privacy` | PASS — 1 Playwright test |
| `migration-brief` | PASS — 1 Playwright test |

Each claim tag occurs exactly once. These passes cannot validate the missing
candidate. The claims contract itself is also incomplete; see defects.

### Cold first read at 390 × 844

The first screen says:

> Know what will break before you import.

> Scan a camera card for unsupported originals, preview risks, 360° clues,
> orientation, duplicates, camera names, and GPS risk. It never changes a file.

Visible actions are **Install the scanner** and **Run sample scan**. The sample
action works in one click and renders four rows. A cold visitor can understand
the job and what to click, but the screen never states that it is for 360° and
mixed-camera photographers. The required “for whom” answer is absent, so the
explicit first-read gate fails.

## Clean repository, build, package, and consumer checks

| Check | Result on `7ace603…` |
| --- | --- |
| `npm ci` | PASS — 23 packages, 0 vulnerabilities |
| Four exact claim commands | PASS — 4 focused tests |
| `npm test` | PASS — 11 Rust tests and 12 Playwright tests |
| `npm run typecheck` | PASS |
| `cargo fmt --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm run build` | PASS — release binary and `dist/site/` |
| `cargo package` | PASS — 14 files, 56.7 KiB unpacked / 17.1 KiB compressed |
| Clean package install | PASS — installed into an isolated Cargo home |
| Clean public-API consumer | PASS — compiled and called `scan`, `needs_review`, `Profile`, and `ScanOptions` |

The packaged CLI reported version `0.1.0`; `--help` and `demo --profile
photoprism` worked. The demo created a temporary four-file card and JSON report
and exited 1 because findings require review.

## CLI end-to-end evidence

- The shipped card scanned as 4 files: ready 0, review 3, reject 1. INSV was
  rejected, RAW preview/camera problems were reported, and GPS presence was
  redacted.
- Original hashes were unchanged after scanning. An external symlink was not
  followed and remained a symlink.
- JSON and CSV exports were valid. JSON stdout under `--quiet` contained no
  progress text.
- A six-file mixed fixture detected one byte duplicate, rejected an unknown
  `.BIN`, and correctly CSV-escaped `copy,"one".BIN`.
- A generated EXIF TIFF reported Canon / EOS R, orientation 6 as `rotated 90°`,
  a 2:1 equirectangular hint, and GPS presence without coordinates. With
  `--include-gps`, it emitted `37.80833333333333, -122.40416666666667`.
  Orientation 9 was flagged `orientation_invalid`.
- Missing folder, file-as-root, bad profile, unreadable input, and unwritable
  output returned exit 2 with specific errors. An empty card returned exit 1
  with a corrective message. A valid rerun recovered normally.

## Live web, accessibility, privacy, and performance

- The repository's 12 Playwright tests passed against the live host.
- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, 747 ms load, title,
  `lang=en`, one h1, one main, all image alts, labeled buttons, and no console
  errors.
- Independent desktop 1440 × 900 and mobile 390 × 844 runs found no horizontal
  overflow, sub-44 px visible controls, request failures, console/page errors,
  or serious/critical Axe 4.13 findings.
- Keyboard traversal reaches the skip link, wordmark, install action, demo,
  profile selector, copy control, paid controls, and links. Each tested element
  had a visible 3 px cyan focus outline. The skip link transfers focus to main.
- At 200% root text size, desktop and mobile retained viewport width; only
  intentionally screen-reader-only table structures and the focusable,
  horizontally scrollable command block overflowed their own boxes.
- Reduced motion removed animations and reduced transitions to effectively
  instant values; the sample result appeared in 362 ms.
- A fresh service worker controlled the page with cache
  `camera-preflight-shell-930338f3cdb0`; `registration.update()` completed, and
  an offline reload still ran the sample without errors.
- Normal load plus sample use made only same-origin requests. There are no
  analytics, remote fonts, third-party scripts, or file input. The only normal
  cross-origin runtime request is the explicit license verification call.
- Live response headers include CSP as a response header, HSTS, nosniff,
  Referrer-Policy, and Permissions-Policy. Hashed JS/CSS and the hero use a
  one-year immutable cache. An ETag revalidation returned 304.
- The verification endpoint returned an invalid verdict with `Cache-Control:
  no-store` and origin-specific CORS. A fresh burst allowed 30 requests; the
  31st returned 429 with `Retry-After: 3` and `X-RateLimit-After: 3`.
- Lighthouse 13.4.1 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 10 ms, CLS 0; total transfer 95 KiB.
- Initial homepage JS is 14,227 bytes raw (5,520 bytes gzip), initial CSS is
  16,297 bytes raw (4,404 bytes gzip), the hero is 81,048 bytes, and there are
  no webfonts. Budgets pass.
- No sign-in exists, so the Entra requirement is not applicable. There is no
  product backend other than the external Sociobot billing calls.

## Defects

### P0 — requested candidate does not exist and is not deployed

There is no object or remote ref for `7ace6049…`; GitHub also reports that no
commit exists for the SHA. Live bytes match base `7ace603…`. The candidate
cannot be independently built, tested, compared, or released.

### P1 — cold first screen omits the intended user

The first screen describes a camera-card scan but never says it is for 360° and
mixed-camera photographers. This fails the work order's automatic first-read
gate. Make the audience explicit in the first supporting sentence. The sample
action is one click, but its label is “Run sample scan” rather than the standard
“Try it with sample data.”

### P1 — required demo sandbox is absent and the web sample contradicts the CLI

Both `/demo` and `/?demo=1` show the normal unopened homepage. Neither preloads
sample results nor supplies the required persistent “Demo — sample data,
nothing is saved” banner, **Reset demo**, or **Start for real** controls. `/demo`
also retains the home title.

For a CLI, the landing demo must be a recording/output of the real binary using
the shipped sample. Instead, the page uses hand-written records in
`site/src/main.ts`. They contradict the actual `camera-ingest-preflight demo`
result: the page says ready 1/review 2/reject 1 while the binary says ready
0/review 3/reject 1. The page invents RICOH and Sony camera names and an
available DNG preview that the bundled files do not contain.

### P1 — advertised paid checkout is unavailable

The visible **Buy migration set — $29** link returns HTTP 404 from
`https://api.sociobot.in/api/v1/products/camera-ingest-preflight/checkout` with
`{"error":"enabled factory product","status":404}`. A customer cannot buy the
advertised tier. Restore and mocked unlocked flows work, but they do not repair
the missing production checkout.

### P1 — claims manifest does not cover product promises

The landing page, legal pages, and README make many reliance claims absent from
`.factory/claims.json`, including read-only scanning, local/no-network CLI
operation, GPS redaction and explicit inclusion, symlink handling, exit codes,
SHA-256 behavior, no telemetry, once-daily license verification, pasted-report
privacy, JSON/CSV export, and open-source status. The claims policy explicitly
makes unlisted claims a failed review.

The `sample-scan` claim is quantitative (“four-file”), but its tagged test only
asserts that one finding becomes visible. It never asserts four rows or the
summary count, and it runs `/` rather than a real demo entry point. The observed
four-row result passes independently, but the required claim test is not an
adequate assertion of its declared claim.

### P2 — mandatory site routes and metadata are incomplete

- Arbitrary missing paths and `/404.html` return the homepage with HTTP 200;
  there is no designed 404 route.
- Homepage and legal pages lack canonical links, Open Graph/Twitter metadata,
  the required 1200 × 630 product image reference, and Apple-touch icon.
- `sitemap.xml` lists only home/privacy/terms and cannot list the absent demo.
- Footers omit “Built by Param Factory,” and legal-page navigation is not the
  consistent primary navigation required by the site contract.

## Re-verification required

1. Push an actual candidate commit and deploy that exact build with a visible
   build identity.
2. Repair and register the production Sociobot checkout.
3. Add a real isolated demo URL/mode and make the site presentation derive from
   the shipped CLI demo output.
4. Fix the first-screen audience copy and complete every claims entry/test.
5. Add the 404 behavior and required metadata, then repeat clean, live, paid,
   offline, accessibility, privacy, and parity verification.
