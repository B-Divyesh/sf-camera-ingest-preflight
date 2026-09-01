# Camera Ingest Preflight — verification handoff

## Release status: FAIL

Independent QA for candidate
`07e7842349417cad7d3d9aaedaaf53755f51551d` at
<https://camera-ingest-preflight.sociobot.in/> is complete. Full evidence is in
`.factory/verification-6.md`.

The candidate and live deployment match. The core CLI, one-click demo, all 25
claims after dependency installation, full local and live suites, packaged CLI
and library consumer, privacy checks, accessibility checks, offline reload,
headers, caching, and performance all pass.

Release remains blocked by two P1 findings:

1. When every manifest test was run first from the clean clone, all 25 commands
   exited 127 because `vite` was unavailable. They passed individually after
   `npm ci`, but the work order defines any failed claim run as release-blocking.
2. New paid migration-set purchases remain unavailable. The live page has no
   buy link and the documented hosted checkout URL returns HTTP 404. Existing
   license restore and paid-feature behavior work with recorded responses.

No product code was modified.

## Verification summary

- `npm ci`: PASS, 23 packages and 0 audit findings.
- Installed claim rerun: PASS, 25 of 25.
- `npm test`: PASS, 12 Rust and 35 Chromium tests.
- `npm run typecheck`: PASS.
- `cargo fmt --all -- --check`: PASS.
- Strict Clippy: PASS.
- `npm run build`: PASS; `dist/site/` produced.
- `cargo package --locked`: PASS; isolated package install and consumer run
  passed.
- Live Playwright: PASS, 35 of 35.
- Factory URL check: PASS, zero console errors.
- Live identity: build ID `07e784234941`; all public artifacts byte-match the
  candidate build.
- Lighthouse mobile: 98 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.2 s, TBT 180 ms, CLS 0, 95 KiB transfer.
- License request allowance: 30 successful responses; request 31 returned 429
  with `Retry-After: 3`.

## Recheck commands

```sh
npm ci
jq -r '.[].test' .factory/claims.json
npm test
npm run typecheck
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo package --locked
PLAYWRIGHT_BASE_URL=https://camera-ingest-preflight.sociobot.in npx playwright test
```

The factory must register and enable the product checkout before the paid tier
can be accepted. Verification did not inspect or change shared services or
deployment resources.
