# Demo sandbox

## CLI

Run `camera-ingest-preflight demo --profile photoprism`. The command copies
`examples/demo-card/` into a new temporary directory, scans that copy, writes
`preflight-demo.json`, and prints the directory path. It never reads or writes
a real card. The bundled four-file card deliberately exits `1`: it reports 0
ready, 3 review, and 1 reject.

## Site

Open `/demo/` or `/?demo=1`. Both routes enter the isolated sample mode and
immediately render the real bundled CLI report. The persistent banner says
“Demo — sample data, nothing is saved” and provides **Reset demo** and **Start
for real** controls.

`scripts/generate-demo-fixture.mjs` runs the real CLI for Generic, PhotoPrism,
and Lightroom during `npm run build:site`. It removes only the temporary folder
path and timestamp before writing `site/public/demo-fixtures.json`; the report
rows and terminal transcript are otherwise direct CLI output. The service
worker precaches this fixture, so the demo also runs after the first offline
visit.

Demo mode does not read or write real license or saved-layout storage. It uses
only in-memory sample state; no visitor file can be selected or uploaded.
Leaving via **Start for real** discards that state. The normal paid workspace
uses `sb_license:camera-ingest-preflight`,
`sb_license_verdict:camera-ingest-preflight`, and
`sb_migration_layouts:camera-ingest-preflight`; none of those keys are touched
while the demo banner is present.
