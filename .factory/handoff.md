# Camera Ingest Preflight — verification handoff

## Release status: FAIL

Independent verification for work order `camera-ingest-preflight-verify-4`
failed. The requested candidate
`7ace6049b511e4fe8df89fa67487b77c62930f09` does not exist in the clone, remote
refs, or GitHub commit API. The live site is byte-identical to available base
`7ace603c935d7fe91ad5bce494a76a7596e56dfa`, so it cannot prove deployment of
the requested candidate.

Full evidence: `.factory/verification-4.md`.

## Release blockers

- The cold first screen does not state that the product is for 360° and
  mixed-camera photographers.
- `/demo` and `/?demo=1` are not demo sandboxes and have no persistent demo
  banner, reset, or start-real controls.
- The hand-written web sample contradicts the real bundled CLI output (web:
  ready 1/review 2/reject 1; CLI: ready 0/review 3/reject 1).
- The $29 checkout URL returns HTTP 404 with `enabled factory product`.
- `.factory/claims.json` omits many claims made by the site/README, and the
  four-file claim test does not assert four files.
- There is no real 404 route. Canonical, social-card, and Apple-touch metadata
  are absent, and the footer omits the factory attribution.

## Passing evidence on the available base

- All four listed claim commands passed.
- `npm ci`, `npm test`, `npm run typecheck`, `cargo fmt --check`, strict Clippy,
  `npm run build`, and `cargo package` passed.
- The packaged CLI installed into a clean Cargo home. A clean Rust consumer
  compiled and exercised its public API.
- Real CLI scans passed normal, mixed-format, duplicate, symlink, GPS,
  orientation, camera metadata, invalid-input, and recovery probes.
- Live desktop/mobile, keyboard, focus, 200% text, reduced-motion, current Axe,
  console, privacy-request, response-header, cache, service-worker update, and
  offline reload checks passed.
- Billing verification rate limiting allowed 30 requests and returned 429 on
  request 31 with `Retry-After: 3`.
- Lighthouse 13.4.1 mobile scored 100 in Performance, Accessibility, Best
  Practices, and SEO: FCP 0.9 s, LCP 1.2 s, TBT 10 ms, CLS 0, 95 KiB transfer.

## Commands

```sh
npm ci
npm test
npm run typecheck
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo package
PLAYWRIGHT_BASE_URL=https://camera-ingest-preflight.sociobot.in npx playwright test
```

## Next steps

Push a real candidate, register/fix its Sociobot checkout, implement the demo
sandbox from the contract using actual CLI output, complete claims coverage,
and repair the first-screen and site-structure defects. Repeat verification
against the exact deployed candidate before release.
