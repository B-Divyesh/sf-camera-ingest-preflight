# Camera Ingest Preflight — verifier handoff

## Verification status: FAIL

Candidate `b4c5e69b28f62a7e682b5019fcd27298c5242c62` was independently
verified from a fresh detached GitHub clone against
<https://camera-ingest-preflight.sociobot.in/> on 2026-08-28. The live HTML,
service worker, legal pages, image, and referenced JS/CSS are byte-identical to
the candidate build.

**Do not release this candidate.** See `.factory/verification-3.md` for the full
evidence and reproductions.

## Release blockers

- **P1 — entitlement cache is not token-bound.** With a recent valid verdict
  cached for one token, visiting `/?license=<different-invalid-token>` stored
  the new token, sent zero verification requests, and unlocked the paid view.
  The inverse can also block a new valid token behind an old invalid verdict.
- **P1 — the paid product is absent.** The site offers a $29 migration set with
  printable PhotoPrism/Lightroom briefs, saved layouts, and handoff notes. After
  a valid verification response, the unlocked view contains only an active
  status and Forget button; no advertised preset, brief, save, print, download,
  or guidance functionality exists in the site or CLI.
- **P2 — serious accessible-name mismatch.** Lighthouse 13.4.1/Axe reports
  `label-content-name-mismatch` on the home wordmark because its aria-label does
  not contain the visible “CAMERA / PREFLIGHT” text.

## What passed

- `npm ci` (23 packages, 0 vulnerabilities), `npm test` (10 Rust + 7
  Playwright), `npm run typecheck`, exact `npm run build`, `cargo fmt --check`,
  and strict Clippy all passed in the fresh clone.
- `cargo package` passed (10 files, 52.3 KiB unpacked / 15.8 KiB compressed).
  Its unpacked tests passed, it installed into a clean Cargo root, and a clean
  consumer compiled and exercised the public Rust scan API.
- Independent CLI fixtures covered ready/review/reject results, all exit-code
  classes, nested files, duplicates, symlink exclusion, JSON/CSV escaping,
  repeated in-root exports, invalid input and read failures, real EXIF camera,
  orientation, 2:1 projection, and default/opt-in GPS behavior. The previous
  self-ingestion defect is fixed (`0/0` on repeated JSON and CSV scans).
- Live desktop and 390 px mobile had no console/page errors or overflow, no
  sub-44 px visible controls, working keyboard focus/skip/demo/recovery flows,
  and zero serious/critical findings under the repository's Axe 4.10.2. Reduced
  motion hid the scan line and completed in 38 ms.
- Fresh-profile offline reload and an old→new service-worker/cache simulation
  remained interactive and error-free.
- Normal site use made no cross-origin requests. GPS was redacted by default;
  exact coordinates appeared only with `--include-gps`. There are no analytics,
  remote fonts, or third-party scripts.
- Live CSP, Permissions-Policy, HSTS, nosniff, referrer policy, 304 validation,
  and immutable hashed-asset caching pass.
- Homepage payloads: 6,079 bytes JS, 12,981 bytes CSS, no fonts, 81,048-byte
  hero. Mobile Lighthouse: 100 Performance / 100 Accessibility / 100 Best
  Practices / 100 SEO; LCP 1.2 s, TBT 50 ms, CLS 0. The accessibility score is
  still 100 despite the separately reported experimental serious Axe rule.

## Required next steps

1. Key cached license verdicts to the exact token and force verification when a
   returned or pasted token differs; add replacement-token regression tests.
2. Implement the migration-set deliverables end to end or remove checkout and
   paid claims until they exist.
3. Align the wordmark accessible name with its visible text and re-run current
   Axe/Lighthouse.
4. Rebuild, deploy, and repeat clean package/consumer/CLI and byte-parity tests.

No product code or deployment was changed during verification. The factory owns
publishing credentials; the candidate package command remains `cargo package`.
