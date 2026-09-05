# Camera Ingest Preflight — repair 7 handoff

## Release status: billing registration pending

Implementation `1cced20b57a33415cd5ae1e60b5679d5875daeea` is committed,
pushed, deployed, and verified at
<https://camera-ingest-preflight.sociobot.in/>.

The product implementation, free CLI, demo, paid deliverables, license handling,
and static deployment pass. New purchases remain release-blocked because the
separate Sociobot billing engine still returns HTTP 404 for this product. The
required public registration metadata is in
`/work/.evidence/billing-offer.json`; no credentials or shared services were
read or changed.

## Changes

- Added `scripts/run-claim.mjs` and changed all 25 manifest commands to use it.
  From a clone without `node_modules`, the first command runs the locked
  `npm ci` prerequisite before building and testing. Later commands reuse the
  installed dependencies.
- Restored the standard one-time **Buy migration set — $29** link to the exact
  Sociobot hosted-checkout path. Existing license restore, token-bound verdicts,
  daily verification, revocation, printable/downloadable briefs, and saved
  layouts remain intact.
- Published the existing offer metadata for the billing-registration operator:
  USD 29.00 one-time, exact production return URL, paid features, price
  evidence, and license-validation path.
- Made the home sample action enter `/demo/`. The persistent demo banner,
  **Reset demo**, and **Start for real** now accompany every one-click sample
  flow.
- Added a global `hidden` rule after visual verification found the migration
  grid overriding its hidden state. Paid controls are now absent from the demo
  sandbox, with a browser regression test.
- Reordered the landing content to show the live sample first, followed by
  three concrete usage steps, checks, product limits, and the paid set. Replaced
  metaphor-style headings with task names and refreshed the copy audit.
- Added `.factory/catalog-description.txt` and copied the same 98-character,
  verb-first line to `/work/.evidence/catalog-description.txt`.

## Verification

Final implementation SHA:
`1cced20b57a33415cd5ae1e60b5679d5875daeea`.
This handoff is a later documentation-only change; the live build ID is
`1cced20b57a3`.

- Fresh GitHub clone at the final implementation SHA had no `node_modules`.
  All 25 exact `.factory/claims.json` commands passed in manifest order. The
  first command installed 23 locked packages with zero audit findings.
- `npm test`: PASS — 12 Rust tests and 35 Chromium tests.
- `npm run typecheck`: PASS.
- `cargo fmt --all -- --check`: PASS.
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS.
- `npm run build`: PASS — release CLI and `dist/site/` produced.
- `cargo package --locked`: PASS — 14 files, 58.0 KiB unpacked and 17.6 KiB
  compressed.
- Clean packaged consumer: PASS — installed executable had useful help; bundled
  demo returned expected exit 1 with 4 files, 0 ready, 3 review, and 1 reject.
- Separate Rust API consumer: PASS — compiled against the packaged crate,
  scanned a ready XMP fixture, returned schema 1.0, and kept GPS excluded.
- Live Playwright: PASS — 35 of 35 against the production hostname.
- Factory URL check: PASS in 559 ms — title, `lang=en`, one h1, main, image
  alternatives, named buttons, and zero page or console errors.
- Fresh 1440×900 and 390×844 contexts: PASS. Job, audience, and first action
  were above the fold. One click entered `/demo/`; the banner stayed visible,
  four realistic rows showed 0/3/1, Reset restored the report, seeded real
  license/verdict/layout values were unchanged, no cross-origin requests
  occurred, no console errors occurred, and neither viewport overflowed.
- Demo isolation: PASS — the paid migration section computes to `display:none`
  while sample mode is active.
- Live routes: home, demo, privacy, and terms return 200 with distinct titles.
  An unknown route returns the designed 404 document with HTTP 404.
- Live response policy: CSP, HSTS, Permissions-Policy, `nosniff`, and strict
  referrer policy present. Hashed assets return one-year immutable caching.
- Deployment parity: home, demo, legal pages, designed 404, service worker,
  demo fixture, and all five hashed JS/CSS assets byte-match `dist/site`.
- Lighthouse 13.4.1 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 30 ms, CLS 0, 96 KiB transfer.
  The main JS asset is 13.35 KiB and the primary CSS asset is 17.53 KiB
  uncompressed; no webfonts.

## Earlier findings

- Verification 1: offline shell, headers/cache, TypeScript check, skip focus,
  and touch target remain fixed and covered by the live suite.
- Verification 2: repeated JSON/CSV exports inside a card remain excluded only
  at the exact named destination; the Rust regression tests pass.
- Verification 3: cached verdicts remain token-bound; the paid briefs/layouts
  ship; the wordmark accessible name remains corrected.
- Verification 4: the pushed candidate exists; first-screen audience, isolated
  CLI-derived demo, route metadata, 404, footer, and claim coverage pass.
- Verification 5: all visible scanner promises remain represented by 25 exact
  claims; demo controls remain at least 44 px.
- Verification 6: claim commands now bootstrap from the documented clean
  checkout. The checkout-registration dependency remains external and open.

## Known gap and next step

At the end of this repair, a fresh request to
`https://api.sociobot.in/api/v1/products/camera-ingest-preflight/checkout`
still returns HTTP 404 with the billing engine's “enabled factory product”
error. The controller's billing-registration operator must register and enable
the offer described in `/work/.evidence/billing-offer.json`. After that,
confirm the hosted checkout opens and returns a real license to the exact
product origin; then verify that token against the existing validation path.
A redirect alone is not entitlement proof.

No product backend, database, tenant state, or AI integration applies to this
static site and local CLI.
