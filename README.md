# Camera Ingest Preflight

`camera-ingest-preflight` is a read-only card and folder scanner for 360° and mixed-camera photographers. It flags likely DAM import failures before an ingest job: unsupported formats, missing embedded previews, 360 projection hints, orientation issues, duplicate content, and camera/GPS metadata anomalies.

The scanner never modifies originals. Reports redact GPS coordinates by default.

Try the static site demo at <https://camera-ingest-preflight.sociobot.in/demo/>.
It runs the shipped four-file card in an isolated sample mode and saves nothing.

## Install

Build the single binary with stable Rust:

```sh
cargo install --path .
camera-ingest-preflight --help
```

The factory publishes release binaries separately. This repository is ready to package with `cargo package`.

Try the bundled card without preparing a folder:

```sh
camera-ingest-preflight demo --profile photoprism
```

The demo writes its sample card and `preflight-demo.json` into a new temporary
folder and prints that folder's path. The shipped fixture lives in
`examples/demo-card/`; it never reads a real card.

The web demo is generated from the same CLI output during `npm run build:site`.
Open `/demo/` or `/?demo=1` for its banner, reset control, and preloaded report.

## Usage

Scan a card for the conservative generic DAM profile:

```sh
camera-ingest-preflight scan /media/CARD --profile generic
```

Write a machine-readable report while keeping coordinates private:

```sh
camera-ingest-preflight scan /media/CARD --profile photoprism --json report.json
```

When an explicitly named JSON or CSV report is saved inside the scanned folder,
the scanner excludes that exact destination on later runs. Other files in the
folder remain inspected normally.

Include exact coordinates only when the report stays private:

```sh
camera-ingest-preflight scan /media/CARD --json report.json --include-gps
```

Print JSON to stdout for scripting (human progress goes to stderr):

```sh
camera-ingest-preflight scan /media/CARD --json - --quiet
```

Exit codes are `0` when the scan is import-ready, `1` when issues need review, and `2` for usage or scan errors. Symlinks are not followed. Unknown files are reported, never opened as images, and all reads are bounded by the file itself.

## Report contract

The JSON schema is versioned with `schema_version`. Each file includes its relative path, byte size, SHA-256 digest, detected kind, downstream support status, preview status, orientation, 360 hint, camera make/model status, GPS presence, and structured findings. Exact latitude/longitude are omitted unless `--include-gps` is set.

Supported profiles are `generic`, `photoprism`, and `lightroom`. The free
generic profile, all checks, and JSON/CSV export remain fully usable. Existing
web migration licenses turn a pasted local JSON report into a printable or
downloadable PhotoPrism or Lightroom brief, with format-specific handoff notes.
They can save destination/order layouts in browser storage. The planned
one-time price is $29, but new purchases are unavailable while checkout
registration is completed. The migration set does not alter the open CLI or
gate privacy/safety.

## Develop and verify

Requirements: stable Rust, Node 22+, and npm.

```sh
npm ci
npm test
npm run build
```

`npm test` runs Rust unit/integration tests plus site tests. `npm run build` compiles the release CLI and Vite site; the deployable static site lands in `dist/site/`. Run the site locally with `npm run dev`.

To create the ready-to-publish crate without publishing it, run `cargo package`.
The factory owns registry credentials and deployment.

## Privacy and limitations

All scanning is local. The site demo uses fixed sample data and never reads or
uploads visitor files. A pasted migration report is processed in the page and
is not uploaded. License tokens are stored in browser local storage. A cached
license verdict is tied to that exact token and is checked with Sociobot at most
once daily; a returned or pasted token is checked immediately. See `/privacy/`
and `/terms/` on the built site.

Metadata support focuses on EXIF-bearing JPEG/TIFF and common originals. Some proprietary RAW/video containers expose previews or spatial metadata in undocumented structures; those are conservatively reported as unknown instead of guessed. Camera Ingest Preflight does not decode, develop, or stitch media.

## License

MIT © 2026 Sociobot (Param Factory). See [LICENSE](LICENSE).
