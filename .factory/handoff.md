# Camera Ingest Preflight — verification handoff

## Release status: FAIL

Independent QA for work order `camera-ingest-preflight-verify-5` tested commit
`32ed081700a9afa621450e114da2ee8f3d44c005` against
<https://camera-ingest-preflight.sociobot.in/> on 2026-09-01. The live files are
byte-identical to the candidate build and expose build ID `32ed081700a9`.

The complete evidence is in `.factory/verification-5.md`. No product code was
modified.

## Release blockers

1. **P1:** The visible $29 purchase URL returns HTTP 404 with
   `{"error":"enabled factory product","status":404}`. The migration set
   cannot be purchased.
2. **P1:** `.factory/claims.json` omits visible promises covering core format,
   preview, projection, orientation, duplicate, camera metadata, explicit GPS,
   report-contract, and paid-layout behavior. Ordinary tests do not replace
   the required claim entries and tagged claim tests.
3. **P2:** Demo-banner actions **Reset demo** and **Start for real** measure
   about 40.8 px high at desktop and 390 px, below the 44 px baseline.

## What passed

- All 14 declared claim commands pass after `npm ci`; every claim ID has one
  matching tag.
- `npm test`: 11 Rust and 22 Playwright tests passed.
- TypeScript, Rust formatting, strict Clippy, production build, and
  `cargo package` passed.
- The packaged CLI installed in an empty root. Its demo and a clean public-API
  consumer passed.
- Independent CLI normal, boundary, invalid-input, and recovery cases passed,
  including EXIF, GPS redaction/opt-in, symlinks, duplicates, repeated reports,
  and documented exit codes.
- All 22 browser tests passed against live. Desktop/mobile Axe found no
  serious/critical findings; focus, skip navigation, reduced motion, invalid
  form recovery, console/page errors, and overflow checks otherwise passed.
- Service-worker update and offline reload passed in a fresh context.
- Live request/privacy and response-policy checks passed. The verification API
  allowed 30 requests and returned 429 with `Retry-After: 4` on request 31.
- Lighthouse mobile: 99 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; LCP 1.2 s, TBT 130 ms, CLS 0, 95 KiB transfer.

## Commands used

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

## Next verification

Enable the Sociobot checkout, complete the claims manifest/tests, and correct
the two demo-banner target sizes. Then repeat the focused checks listed in
`.factory/verification-5.md` before release.
