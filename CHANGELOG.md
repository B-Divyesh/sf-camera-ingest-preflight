# Changelog

## Unreleased

- Bound cached web-license verdicts to a SHA-256 fingerprint of the exact
  license token. Returned and restored tokens now always verify before access.
- Added the paid local migration workspace: it generates printable and
  downloadable PhotoPrism/Lightroom briefs, format-specific handoff notes, and
  saved browser-only layouts from a pasted scanner JSON report.
- Added `camera-ingest-preflight demo`, backed by a shipped sample card in a
  temporary folder.
- Aligned the home wordmark's accessible name with its visible label.
- Prevented explicitly requested JSON and CSV report files inside a scanned
  folder from being re-ingested on later scans.

All notable changes follow semantic versioning.

## 0.1.0 — 2026-08-28

- Initial read-only folder scanner.
- Generic, PhotoPrism, and Lightroom compatibility profiles.
- EXIF orientation, camera identity, GPS-presence, 360-hint, RAW-preview, and SHA-256 duplicate checks.
- Human, JSON, and CSV reports with location redaction by default.
- Blueprint product site, interactive sample report, and Sociobot migration-preset unlock.
