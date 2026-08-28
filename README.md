# Camera Ingest Preflight

`camera-ingest-preflight` is a read-only card and folder scanner for 360° and mixed-camera photographers. It flags likely DAM import failures before an ingest job: unsupported formats, missing embedded previews, 360 projection hints, orientation issues, duplicate content, and camera/GPS metadata anomalies.

The scanner never modifies originals. Reports redact GPS coordinates by default.

## Install

Build the single binary with stable Rust:

```sh
cargo install --path .
camera-ingest-preflight --help
```

The factory publishes release binaries separately. This repository is ready to package with `cargo package`.

## Usage

Scan a card for the conservative generic DAM profile:

```sh
camera-ingest-preflight scan /media/CARD --profile generic
```

Write a machine-readable report while keeping coordinates private:

```sh
camera-ingest-preflight scan /media/CARD --profile photoprism --json report.json
```

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

Supported profiles are `generic`, `photoprism`, and `lightroom`. The free generic profile, all checks, and JSON/CSV export remain fully usable. The one-time web unlock adds printable migration briefs and curated downstream preset guidance; it does not alter the open CLI or gate privacy/safety.

## Develop and verify

Requirements: stable Rust, Node 22+, and npm.

```sh
npm install
npm test
npm run build
```

`npm test` runs Rust unit/integration tests plus site tests. `npm run build` compiles the release CLI and Vite site; the deployable static site lands in `dist/site/`. Run the site locally with `npm run dev`.

## Privacy and limitations

All scanning is local. The site demo uses fixed sample data and never reads or uploads visitor files. License tokens are stored in browser local storage and verified with Sociobot at most once daily. See `/privacy/` and `/terms/` on the built site.

Metadata support focuses on EXIF-bearing JPEG/TIFF and common originals. Some proprietary RAW/video containers expose previews or spatial metadata in undocumented structures; those are conservatively reported as unknown instead of guessed. Camera Ingest Preflight does not decode, develop, or stitch media.

## License

MIT © 2026 Sociobot (Param Factory). See [LICENSE](LICENSE).
