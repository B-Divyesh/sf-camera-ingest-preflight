# Camera Ingest Preflight — review 1 handoff

## Review 1 status: FAIL

Review `camera-ingest-preflight-review-1` examined implementation
`1cced20b57a33415cd5ae1e60b5679d5875daeea` and repository documentation
`bb72d7d0818873f875a3c24247ba5fee57a483ea`. The current live documentation
build ID is `bf5a40e9239c`.

All 25 declared claims, clean checks, installed-CLI checks, live demo paths,
accessibility checks, privacy behavior, routes, designed 404, and offline
reload passed. The review is nevertheless **FAIL** with one P2 finding and one
untested public claim: the landing page and README promise release binaries,
but the linked GitHub repository has no tags or releases. The claim manifest
tests source availability only, not release availability.

Do not call this product PASS until release assets plus a claim test exist, or
the release-binary wording is removed. The external Sociobot checkout still
returns the expected billing-registration 404; that is not a product finding.

See `.factory/review-1.md` for full evidence.

---

# Camera Ingest Preflight — verification 7 handoff

## Release status: PASS

Implementation `1cced20b57a33415cd5ae1e60b5679d5875daeea` is committed,
pushed, deployed, and independently verified at
<https://camera-ingest-preflight.sociobot.in/>.

Documentation is at `bf5a40e9239c1d86116099a5ba64ff3d397f2eb1`. The product
implementation, free CLI, demo, paid deliverables, license handling, and static
deployment pass. The separately operated billing registration still deliberately
returns HTTP 404 until its operator enables the offer; this is an external
dependency, not a defect in this product verification.

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

### Independent verification 7

- Verdict: **PASS** — zero product findings and zero untested public claims.
- A new clone at implementation `1cced20` began without `node_modules`. Its
  first exact claim command installed the locked dependencies through the
  documented runner; all 25 manifest commands then passed, one tagged test each.
- `npm test` passed: 12 Rust tests and 35 Chromium tests. `npm run typecheck`,
  `cargo fmt --all -- --check`, `cargo clippy --all-targets --all-features --
  -D warnings`, `npm run build`, and `cargo package --locked` also passed.
- A clean consumer installed the release binary. `--help` was useful and
  `demo --profile photoprism` created its temporary four-file report and exited
  1 with 0 ready, 3 review, and 1 reject.
- Fresh desktop and 390 px phone browsers showed the job, audience, and
  **Try it with sample data** before scrolling. One keyboard activation entered
  `/demo/`; the persistent label, 4/0/3/1 report, reset, same-origin-only demo
  requests, and preservation of seeded real license/layout storage all passed.
- The factory URL check passed in 780 ms. Axe found zero serious/critical issues
  on desktop and phone demo screens. Offline reload rendered the four sample
  rows. Home, demo, privacy, terms, and the designed HTTP 404 had correct
  route-specific titles and one h1.
- The live functional HTML and all runtime assets match implementation
  `1cced20` after normalizing the later documentation build identifier. The
  live identifier is `bf5a40e9239c`; its service-worker cache name changed with
  that documentation build, but its precache list matches.
- Invalid license input received focused, announced guidance and a corrected
  submission recovered to the documented inactive-license message. The product
  verification endpoint allowed 30 requests and returned 429 with `Retry-After`
  on request 31.

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

## External billing dependency and next step

At the end of verification 7, a fresh request to
`https://api.sociobot.in/api/v1/products/camera-ingest-preflight/checkout`
still returns HTTP 404 with the billing engine's “enabled factory product”
error. The assignment classifies that deliberate response as expected while the
separate billing operator registers and enables the offer described in
`/work/.evidence/billing-offer.json`. After registration, confirm the hosted
checkout opens and returns a real license to the exact product origin; then
verify that token against the existing validation path. A redirect alone is not
entitlement proof.

No product backend, database, tenant state, or AI integration applies to this
static site and local CLI.
