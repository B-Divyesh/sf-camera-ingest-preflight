# Camera Ingest Preflight — build handoff

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
