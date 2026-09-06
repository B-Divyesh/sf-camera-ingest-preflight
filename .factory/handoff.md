# Camera Ingest Preflight — review 2 handoff

## Review 2 status: PASS

Strict review 2 examined implementation
`cda621b15d037f896501de60f136eec7ebf3cca3`, documentation
`0bc8952415b8a968abdbd4fe632ce90f2312489d`, and the live product at
<https://camera-ingest-preflight.sociobot.in/> on 2026-09-06.

There are zero findings at every severity and zero untested public claims. All
25 exact claim commands passed from a fresh clone. Local gates passed: 12 Rust
tests, 36 browser tests, typecheck, format, clippy, build, and package. A clean
consumer installed the packaged CLI and another installed the documented Git
source. The real demo reported 4 files, 0 ready, 3 review, and 1 reject with
GPS coordinates redacted and expected exit code 1.

Fresh desktop and phone live contexts showed the job, audience, and first
action before scrolling. Keyboard and touch sample entry, persistent demo
label, reset, real-storage isolation, offline reload, reduced motion, 200%
text, focus, touch targets, legal routes, links, and designed HTTP 404 passed.
Axe had no serious or critical violations. The URL check had no browser errors.
Lighthouse mobile scored 100 in all four categories, with 1.20 s LCP, 0 ms TBT,
0 CLS, and 97,889 transferred bytes.

The live documentation build ID is `0bc8952415b8`. Runtime JS, CSS, fixture,
art, icons, and normalized documents match the implementation candidate; the
service worker differs only by its derived cache stamp. The checkout's
deliberate HTTP 404 is the work order's expected external billing condition,
not a product defect.

See `.factory/review-2.md` for the complete decision and evidence. Reports
only were changed in this review; product code was not modified. Reproduce the
main checks with:

```sh
npm ci
npm test
npm run typecheck
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo package --locked
PLAYWRIGHT_BASE_URL=https://camera-ingest-preflight.sociobot.in npx playwright test
```

---

# Camera Ingest Preflight — verification 8 handoff

## Verification 8 status: PASS

Independent QA reviewed implementation
`cda621b15d037f896501de60f136eec7ebf3cca3` and documentation
`0bc8952415b8a968abdbd4fe632ce90f2312489d` at
<https://camera-ingest-preflight.sociobot.in/> on 2026-09-06.

There are zero findings and zero untested public claims. A clean clone without
`node_modules` passed all 25 exact manifest commands, `npm test` (12 Rust and
36 Chromium tests), typecheck, format, clippy, build, and `cargo package
--locked`. A clean extracted consumer installed the packaged CLI and its real
`demo --profile photoprism` produced the expected four-file 0 ready / 3 review
/ 1 reject report and exit code 1.

Fresh desktop and phone live browsers showed the job, audience, and **Try it
with sample data** before scrolling. Keyboard demo entry, persistent sandbox
label, reset, privacy isolation, offline reload, legal routes, 404, focus,
reduced motion, and accessibility passed. The worker URL check passed with no
browser errors; the full live Playwright suite passed 36/36.

Live documents carry the later documentation build ID `0bc8952415b8`; all
product JS, CSS, fixture, image, legal assets, and normalized documents match
implementation `cda621b`. The derived service-worker cache name is the only
expected build-stamp difference.

The prior unavailable-release-binary finding is fixed: public copy offers a
working source install and source link only, with regression coverage. The
external Sociobot checkout still returns the authorised expected unregistered
404 and is not a product finding.

See `.factory/verification-8.md` for complete evidence. To reproduce:

```sh
npm ci
npm test
npm run typecheck
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo package --locked
```

---

# Camera Ingest Preflight — repair 8 handoff

## Status: PASS

Implementation `cda621b15d037f896501de60f136eec7ebf3cca3` repairs the review-1
release-binary finding. The final HTTPS runtime serves build ID `cda621b15d03`
at <https://camera-ingest-preflight.sociobot.in/>. Later handoff and
documentation commits do not change that deployed product artifact.

The supported public install path is the documented source build. The landing
link now says **View source code** and goes to the source repository; it no
longer offers release binaries. The README no longer claims that binaries are
published. GitHub still has no releases or tags, but that absence is no longer
a visitor promise.

## What changed

- Replaced the misleading **Source and release binaries** link with **View
  source code** while retaining the working `cargo install --git` path.
- Removed the README binary-publishing statement and clarified that `npm run
  build` produces an optimized local CLI.
- Strengthened the `open-source` claim test to prove the MIT license, documented
  source install, and visible source-repository link.
- Added a public-install regression: users are sent to the source repository,
  not a `/releases` URL, and neither public install surface promises binaries.
- Updated the claim sandbox description and changelog.

## Verification

- A fresh `git clone --no-local` of `cda621b` began without `node_modules`.
  All 25 exact `.factory/claims.json` commands passed in manifest order. The
  first command performed its documented locked `npm ci` bootstrap; the final
  Playwright record is `passed` with no failed tests.
- Local gates passed: `npm test` (12 Rust tests and 36 Chromium tests),
  `npm run typecheck`, `cargo fmt --all -- --check`, `cargo clippy
  --all-targets --all-features -- -D warnings`, and `npm run build`.
- `cargo package --locked` passed (14 files; 58.0 KiB unpacked, 17.6 KiB
  compressed). A clean extracted consumer installed it with `cargo install
  --locked`; `--help` worked and `demo --profile photoprism` produced the real
  four-file report: 0 ready, 3 review, 1 reject, with expected exit code 1.
- The final static artifact was uploaded to the existing product app only. No
  resource, DNS record, deployment setting, billing setting, or secret changed.
  Both app host and product HTTPS origin returned build ID `cda621b15d03`.
- Full live Playwright against the production hostname passed 36 of 36 tests.
  This covers fresh desktop/390 px phone first screens, keyboard sample entry,
  the isolated CLI-derived demo, persistent label, reset, no real-storage
  changes, no sample upload, offline reload, reduced motion, legal routes,
  designed 404, and the repaired install behavior.
- `/opt/fleet/lib/verify-url.sh` passed against final HTTPS in 645 ms: title,
  `lang=en`, one h1, main, image alternatives, named buttons, and no page or
  console errors. The live suite uses Axe 4.13 with no serious or critical
  violations.
- `.factory/catalog-description.txt` remains the verb-first 98-character line
  and is copied to `/work/.evidence/catalog-description.txt`.

## Earlier findings

| Earlier report | Current disposition |
| --- | --- |
| Verification 1: policy, cache, offline, typecheck, skip focus, touch target | Fixed; live suite and URL check pass. |
| Verification 2: exports scanned as inputs | Fixed; exact-destination Rust regressions pass. |
| Verification 3: token cache and wordmark name | Fixed; token-bound verification and Axe pass. |
| Verification 4: candidate, audience, demo, routes, metadata | Fixed; final build identity, first screen, demo, and routes pass. |
| Verification 5: claims and demo controls | Fixed; all 25 claims and mobile controls pass. |
| Verification 6: clean claims and checkout availability | Bootstrap fixed; checkout registration remains external. |
| Review 1: unavailable, untested release binaries | Fixed by removing the offer and adding public-install regression coverage. |

## Run and package

Use stable Rust, Node 22+, and npm:

```sh
npm ci
npm test
npm run typecheck
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo package --locked
```

One claim command from a clean checkout is, for example,
`npm run claim -- --grep @claim:open-source`. The runner installs locked site
dependencies only when absent. Package publication remains factory-owned;
`cargo package --locked` makes the ready package.

## Known external dependency

The free local scanner, JSON/CSV export, and sample demo are fully usable. The
$29 one-time migration set and existing-license restoration remain in place.
The separate Sociobot billing registration is pending: its hosted checkout
deliberately returns the expected HTTP 404 until the billing operator enables
the prepared offer. No payment, billing, or provider setting changed here. Once
enabled, verify a purchased return token against the existing endpoint; a
checkout redirect alone is not entitlement proof.

---

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
