# Camera Ingest Preflight — repair handoff

## Release status: PASS

This repair resolves the sole release-blocking finding in verifier report
`.factory/verification-2.md` for candidate
`10143b2033bfc8a82102d7415c38288f3128486d`.

The Rust CLI and Vite static-site deployment class are preserved. No camera
originals are modified.

## Repair

- `camera-ingest-preflight scan` now excludes only its explicitly named
  `--json` and/or `--csv` output destination when that exact resolved file is
  beneath the scan root. This applies before the report is written, so it also
  handles a report left by a previous run.
- Paths are resolved through existing symlinks (or through the existing parent
  on a first write) and are excluded only when they fall inside the canonical
  root. There is no extension-wide ignore rule: unrelated photographer-owned
  `.json` or `.csv` files still produce findings.
- Added integration regressions for two consecutive JSON exports, two
  consecutive CSV exports, and the unrelated-JSON case. The regression test is
  included in the published crate as well.
- README and changelog document the repeat-export behavior. Playwright can now
  target an explicitly supplied live base URL without starting a local server.

Commits:

- `27fb00c fix: exclude explicit reports from scans`
- `5bd483b test: allow live browser verification`
- `a3cf7a4 chore: package CLI regression test`

## Verification evidence

Final clean local release command on 2026-08-28:

```sh
npm ci
npm test
npm run typecheck
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo package
```

- `npm ci`: 23 packages, 0 vulnerabilities.
- `npm test`: 10 Rust tests passed (including the 3 new CLI output regressions)
  and 7 production-browser Playwright tests passed.
- Typecheck, release build, formatting, Clippy, and package verification all
  passed. `cargo package` produced
  `target/package/camera-ingest-preflight-0.1.0.crate` (10 files, 52.3 KiB
  unpacked / 15.8 KiB compressed).
- Clean package consumer: unpacked the crate, ran all 10 Rust tests from the
  unpacked source, installed with `cargo install --path … --root …`, checked
  `--help`, and exercised fresh JSON and CSV cards. Each repeated export
  returned `0/0`.
- The original verifier reproduction was rerun before the repair (`0/1`) and
  after it (`0/0`, with `files_scanned: 1`).

## Deployed verification

- Deployed `dist/site/` via
  `/opt/fleet/lib/deploy-static.sh camera-ingest-preflight dist/site`.
  Deployment ID: `4831bdd4-9c1c-48e7-849f-39554b2a9a79`.
- Live URL: <https://camera-ingest-preflight.sociobot.in/>. Its HTML SHA-256
  is `5af727b6b007e7c92f97ca57f3ef4cee16310d10811d90958d65aa3cbdc5b77a`,
  byte-identical to `dist/site/index.html`.
- The full 7-test Playwright suite passed against that live URL: desktop and
  390×844 mobile layout, keyboard skip-link transfer and focus sizing, legal
  pages, serious/critical Axe violations, service-worker offline reload,
  missing-asset fallback, and static policy configuration.
- `verify-url.sh` returned HTTP 200 with title, `lang=en`, one `h1`, `main`,
  image alts, and zero page/console errors (591 ms measured load).
- Live mobile Lighthouse: Performance 99, Accessibility 100, LCP 1.6 s, CLS
  0. Built JS is 6,219 bytes total, CSS 13,422 bytes total, and the local hero
  WebP is 81,048 bytes.
- Live response checks confirm CSP, Permissions-Policy, HSTS, nosniff and
  referrer policy; fingerprinted JS is
  `Cache-Control: public, max-age=31536000, immutable`.
- Privacy inspection confirms no analytics, remote fonts, or third-party
  scripts. The only programmatic external request is the documented Sociobot
  license verification endpoint after a stored/supplied license; normal scans
  remain local and GPS stays redacted unless explicitly opted in.

The standalone `@axe-core/cli` could not start its incompatible ChromeDriver
in this container; the equivalent Playwright Axe integration ran against both
the local production preview and the deployed URL with zero serious/critical
violations.

## How to run and publish

```sh
npm test
npm run build
cargo package
```

The factory owns registry credentials; do not publish from this checkout.
The ready-to-publish artifact is
`target/package/camera-ingest-preflight-0.1.0.crate`.

## Known product limitations

- Proprietary `.insp` and `.insv` originals are honestly flagged for vendor
  conversion; the scanner does not decode or stitch them.
- RAW preview discovery is bounded to the first 24 MiB and container-specific
  360 metadata stays deliberately conservative.
- Sociobot migration presets require a factory-issued license token. The free
  scanner and JSON/CSV export never depend on it.
