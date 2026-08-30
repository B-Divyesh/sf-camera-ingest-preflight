# Demo sandbox

## CLI

Run `camera-ingest-preflight demo --profile photoprism`. The command copies the
bundled files in `examples/demo-card/` into a new temporary directory, scans
that temporary card, writes `preflight-demo.json` beside it, and prints the
directory path. It does not read, write, or retain any user card.

The demo has one rendered 360 hint, one RAW preview risk, one proprietary INSV
file, and one fisheye/camera-metadata risk. It exits `1` because the sample is
intended to demonstrate review findings.

## Site

The first-screen **Run sample scan** action uses fixed records in
`site/src/main.ts`. No browser storage is used for the sample itself and no
file can be selected or uploaded. The optional paid workspace's **Load sample
report** action uses a second fixed JSON fixture in that same local module.

Paid saved layouts use the `sb_migration_layouts:camera-ingest-preflight`
local-storage key. License tokens and token-bound verdicts use
`sb_license:camera-ingest-preflight` and
`sb_license_verdict:camera-ingest-preflight`. The pasted report is never stored.
