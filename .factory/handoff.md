# Camera Ingest Preflight — verification handoff

## FAIL — release blocked

Independent verification on 2026-08-28 tested candidate `2c654d33aef25271ea84db08cc35157ba2188322` and https://camera-ingest-preflight.sociobot.in/.

The live HTML and service worker are byte-identical to the candidate build, so the results are conclusive for this deployment. Do **not** release until the P1 defects in [verification.md](verification.md) are fixed and reverified:

- First offline reload breaks module loading: the service worker returns cached HTML for missing JS/CSS requests.
- Production drops the declared CSP and Permissions-Policy headers and serves hashed assets/hero at only `max-age=30`, not immutable caching.

The independent TypeScript check also fails in a clean clone due to missing Node typings. Accessibility follow-ups: the skip link does not move focus into main, and the mobile wordmark is only 28 px high.

## Verification evidence

- Clean clone at the exact candidate; `npm ci` passed with 0 audit vulnerabilities.
- `npm test` passed: 7 Rust tests + 4 Playwright tests.
- `npm run build`, `cargo fmt --check`, `cargo clippy --all-targets --all-features -- -D warnings`, and `cargo package` passed.
- Clean-consumer installation from the packaged crate succeeded; normal, invalid, boundary, duplicate, symlink, GPano, JSON/CSV, and GPS-redaction paths were exercised.
- Local production preview and the live URL passed online desktop/390px browser flows, console/page-error checks, serious/critical axe checks, and reduced-motion behavior. Mobile Lighthouse scored Performance 100 and Accessibility 100; bundles are within budget.
- Live `curl -I` header checks and a fresh-browser offline reload produced the release blockers above.

## How to reproduce after remediation

```sh
npm ci
npm test
npm run build
npx tsc --noEmit
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package
```

Then use a production preview and a fresh Chromium profile: visit once online, wait for the service worker, set offline, and reload. Check live headers for `Content-Security-Policy`, `Permissions-Policy`, and immutable cache policy on hashed assets. Full commands, results, and severity are in `.factory/verification.md`.

---

# Original build handoff (superseded by FAIL verification)

Build completed 2026-08-28 for work order `camera-ingest-preflight-build-1`.

## What shipped

- Rust 0.1.0 single-binary CLI with a helpful `scan` command, documented exit codes, and no interactive prompts.
- Read-only recursive walk that does not follow symlinks and SHA-256 hashes every regular file.
- Generic, PhotoPrism, and Lightroom compatibility profiles.
- Rendered image, RAW, video, sidecar, and unknown-format classification.
- Bounded RAW embedded-JPEG preview detection.
- EXIF orientation parsing, camera make/model completeness and garbling checks, GPS presence, optional GPS coordinate output, and default coordinate redaction.
- GPano XMP, near-2:1 dimension, fisheye, and panorama filename projection hints.
- Duplicate-content detection and structured findings.
- Human terminal report plus versioned JSON and CSV exports.
- Blueprint drafting-sheet product site with original 80 KB WebP hero, responsive 390 px layout, interactive fixed-data report demo, offline/error/empty/loading states, install docs, privacy, and terms.
- Sociobot paid-unlock contract for the optional $29 migration set: hosted buy link, returned-token capture, local storage, once-daily verification cache, optimistic offline state, invalid-license lock, paste-to-restore, and forget-device control. No product ID is hardcoded and no core scan/export/safety/accessibility capability is gated.
- Offline shell service worker, immutable asset cache headers, CSP, robots, and sitemap.

## Run and verify

```sh
npm install
npm test
npm run build
cargo package
```

- `npm test`: passed — 7 Rust unit tests and 4 Chromium/Playwright tests.
- Playwright exercises the report demo, 390 × 844 responsive layout, semantic landmarks, one-h1 rule, alt text, console errors, and axe; zero serious or critical axe violations.
- `npm run build`: passed. It builds the release binary and static site.
- Static deployment root: `dist/site/`; `dist/site/index.html` is present.
- `cargo package`: passed; 9-file crate, 47.5 KB unpacked / 14.5 KB compressed. Ready for factory publishing; nothing was published here.
- Real CLI smoke test against `site/public`: produced schema `1.0` JSON with a non-zero review exit, file hashes, structured support findings, and GPS redaction.
- `npm audit --omit=dev`: 0 vulnerabilities.

## Lighthouse-class measurement

Measured against the production Vite preview using Lighthouse 13.4.1 mobile defaults and headless Chromium:

| Category / metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| First Contentful Paint | 1.0 s |
| Largest Contentful Paint | 1.5 s |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0 |

Static budgets: main JS 5,368 bytes; shared CSS 12,932 bytes; hero WebP 81,048 bytes; no webfonts. These are comfortably below the 200 KB JS, 50 KB CSS, 120 KB font, and 300 KB hero budgets.

## Design provenance

The visual thesis and exact generation prompt are in `.factory/design.md`. The final asset is `site/public/camera-blueprint.webp`, generated with `/opt/fleet/lib/gen-image.sh` using the factory `factory-image` deployment, then converted locally from PNG to WebP. The intermediate PNG was intentionally not shipped. All other marks and diagrams are original HTML/CSS.

## Known gaps and next steps

- Proprietary `.insp` and `.insv` originals are deliberately reported as requiring vendor conversion or a separately tested decoder. No proprietary codec is bundled, and the CLI does not stitch or develop media.
- RAW preview detection searches the first 24 MiB for a complete embedded JPEG. A vendor that places its preview later will receive a conservative `missing` finding.
- Container-specific 360 metadata outside documented EXIF/XMP is not guessed. Beta cards should be used to tune profiles toward the brief's 95% detection target.
- License checkout and successful verification require the factory to register the product and issue a real token. The UI and request contract are implemented, while purchase settlement cannot be completed locally.
- The factory should build and attach OS/architecture release binaries; this worker did not publish crates, releases, DNS, or infrastructure.
