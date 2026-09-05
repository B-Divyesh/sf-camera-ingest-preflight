# Copy audit — 2026-09-05

Sources checked: `site/index.html` and visitor-facing status/error strings in
`site/src/main.ts`. Navigation, labels, buttons, code, table headings, and data
fragments are not sentences. Every sentence is at or below 22 words. No banned
plain-words term appears except “unlocked” when it literally describes a
verified paid license.

## Static landing-page sentences

| Words | Sentence |
| ---: | --- |
| 1 | Offline. |
| 12 | The demo and docs still work; license checks will resume when connected. |
| 6 | Demo — sample data, nothing is saved. |
| 5 | Scan cards before DAM import. |
| 15 | For 360° and mixed-camera photographers who need import risks before a DAM sees the card. |
| 7 | The four-file sample report opens below. |
| 6 | Review a sample report before installing. |
| 7 | Choose a profile and run the sample. |
| 7 | No local files are selected or uploaded. |
| 7 | Hashing 4 originals and reading documented metadata… |
| 6 | The sample could not be rendered. |
| 13 | Reload the page or use the CLI example below; your files are unaffected. |
| 3 | Sample scan results. |
| 12 | Each row names the file, verdict, format, preview, projection, camera and issue. |
| 6 | Coordinates are absent from the report. |
| 19 | This recording is generated during the site build by `camera-ingest-preflight demo --profile photoprism`. |
| 4 | How the scanner works. |
| 11 | Build the single Rust binary on the computer that reads your card. |
| 12 | Name the folder and choose the DAM profile you plan to use. |
| 12 | Check the summary or export JSON and CSV before starting the import. |
| 5 | Checks run on every file. |
| 17 | Every regular file receives a SHA-256 fingerprint and a conservative, explainable verdict for your selected downstream profile. |
| 13 | Accepted, version-sensitive, or rejected for Generic, PhotoPrism, and Lightroom profiles. |
| 18 | Finds a bounded embedded JPEG so the library has something fast and faithful to display. |
| 17 | Reads GPano XMP, near-2:1 dimensions, and cautious filename clues without pretending to stitch. |
| 14 | Translates EXIF values 1–8 and flags invalid rotation or mirror values. |
| 17 | Hashes the whole file, not a filename, to surface card copies and burst-folder repeats. |
| 14 | Calls out absent, partial, or garbled make/model metadata before indexing. |
| 14 | Reports GPS presence while redacting coordinates unless you explicitly include them. |
| 4 | Install the command-line scanner. |
| 4 | Exit 0 means import-ready. |
| 5 | Exit 1 means review findings. |
| 9 | Exit 2 means the folder could not be scanned. |
| 4 | Symlinks are never followed. |
| 6 | What the scanner does not do. |
| 2 | No stitching. |
| 11 | Projection clues tell you which workflow to choose; originals remain untouched. |
| 3 | No proprietary codecs. |
| 9 | Insta360 originals are flagged instead of decoded without a supported codec. |
| 3 | No library changes. |
| 4 | This happens before import. |
| 8 | Nothing is indexed, renamed, moved, or changed. |
| 4 | Create a migration brief. |
| 10 | The scanner, every safety check, and JSON/CSV export stay free. |
| 12 | The migration set adds printable briefs, saved report layouts, and handoff notes. |
| 9 | The migration set costs $29 as a one-time purchase. |
| 6 | Sociobot/Dodo handles existing purchases and refunds. |
| 5 | A refund revokes the license. |
| 4 | Migration set is active. |
| 9 | Build a location-redacted brief from a local CLI report. |
| 5 | The free CLI remains unchanged. |
| 7 | Paste a JSON report from this scanner. |
| 9 | It stays in this browser and is never uploaded. |
| 9 | Exact GPS coordinates are never copied into the brief. |

## Dynamic action and error sentences

| Maximum words | Sentence or template |
| ---: | --- |
| 3 | No finding. |
| 3 | Install command copied. |
| 5 | License verified on this device. |
| 10 | License no longer active. Check the token or buy another license. |
| 7 | Using the last verified license while offline. |
| 10 | Connect to verify this license. The free scanner remains available. |
| 2 | Verifying license… |
| 5 | License verified. Migration set unlocked. |
| 10 | License no longer active. Check the token or restore another license. |
| 12 | License check is temporarily unavailable. Try again; the free scanner is unaffected. |
| 9 | Paste the complete license token from your receipt. |
| 6 | License removed from this device. |
| 14 | Paste a Camera Ingest Preflight JSON report with summary and files arrays, then generate again. |
| 9 | Exact GPS coordinates are not included in this brief. |
| 17 | The source report contains exact GPS coordinates. This brief omits them; keep the source report private. |
| 14 | This brief is local-only. It names actions to check, not changes to make to originals. |
| 10 | Migration brief generated. Print it, download it, or save this layout. |
| 9 | Name the layout with at least two characters before saving. |
| 6 | Choose a saved layout first. |
| 6 | Choose a saved layout to delete. |
| 3 | Deleted saved layout. |
| 8 | The bundled sample report could not load. Try again. |

## Terminology

| Concept | Term used |
| --- | --- |
| Camera input folder | card |
| Scanner output | report |
| Bundled sandbox | sample data / demo |
| Paid output | migration brief |
| Stored paid settings | saved report layout |
| Downstream application | DAM / destination |
| Location data | GPS coordinates |
| Paid credential | license token |
