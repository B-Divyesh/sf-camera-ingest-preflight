# Camera Ingest Preflight — visual thesis

## Direction: blueprint drafting sheet

This product is an inspection instrument used before a destructive or expensive library import. Its interface borrows the calm precision of a camera technician's cyanotype plan: ruled coordinates, crop marks, numbered callouts, and amber pencil annotations. It should feel like a field sheet laid beside a card reader, not a generic SaaS dashboard.

## Palette

The site is intentionally single-mode, like a blueprint under a desk lamp.

| Token | Hex | Use |
| --- | --- | --- |
| Blueprint field | `#082f49` | Page background |
| Deep field | `#05263b` | Raised strips and code panels |
| Paper line | `#d8f3f1` | Primary text and diagram strokes |
| Drafting cyan | `#67e8f9` | Focus, active controls, coordinate lines |
| Pencil amber | `#fbbf24` | Warnings and primary action |
| Pass green | `#86efac` | Ready status |
| Fault coral | `#fda4af` | Errors and rejects |
| Muted blue | `#a9c8d3` | Secondary copy |

Text contrast is designed to exceed 4.5:1 against both field surfaces. States always pair color with a word, icon, or shape.

## Type

- Interface and prose: `Arial`, `Helvetica Neue`, system sans-serif. Neutral, compact, and local—no font download.
- Measurements and data: `SFMono-Regular`, `Consolas`, `Liberation Mono`, monospace. Tabular figures make hashes, counts, paths, and dimensions line up like a contact sheet.
- Scale: 14 / 16 / 20 / 32 / clamp(48–80) px; body stays at 16 px minimum.

## Space and geometry

An 8 px base rhythm with 4 px micro-adjustments. Main gutters are 24 px mobile, 48 px tablet, and 64 px desktop. Hairline rules use semi-transparent cyan; clipped corners and registration marks replace generic rounded cards. Content width tops out at 1,280 px and prose at 68 characters.

## Interaction grammar

Controls behave like drafting tools: amber filled primary actions, outlined secondary actions, and cyan 3 px focus rings. Hover shifts a control by 2 px as if lifted from the sheet; active returns it to the baseline. The report demo uses a scan line that travels once, then reveals rows in source order. Mobile drops decorative coordinates and stacks report columns into labeled records.

## Motion

Useful motion only, 180–260 ms: control lift, disclosure, and a single scan-line pass. Nothing loops. Under `prefers-reduced-motion: reduce`, transforms and scanning are removed and state changes become immediate opacity swaps.

## Original asset plan and provenance

- `site/public/camera-blueprint.webp`: generated specifically for this product using the factory image generator, then converted locally to WebP. It depicts a mixed-camera ingest plan as a technical cyanotype with card, lens, panorama, and metadata callouts. No text, logo, people, trademark, or stock asset.
- Diagram icons, registration marks, grid, and contact-sheet shapes are hand-authored in HTML/CSS and are licensed under the repository MIT license.

Generation prompt (factory `factory-image` deployment, 2026-08-28):

> Use case: stylized-concept. Asset type: landing page hero illustration. Primary request: an original technical cyanotype drafting-board illustration for a camera ingest inspection tool. Scene: deep navy blueprint sheet with precise pale-cyan orthographic line drawings of a mirrorless camera body, small memory card, circular fisheye lens, equirectangular panorama strip, compass/orientation marks, and metadata measurement callouts connected by fine drafting lines. Style: hand-inked engineering blueprint, subtle paper grain, restrained and sophisticated. Composition: wide 3:2, subjects grouped toward the right with quiet negative space on the left; clear silhouette at small size. Palette: navy, pale cyan, tiny amber inspection-pencil marks. Constraints: no readable text, no logos, no trademarks, no UI mockup, no photorealism, no gradients, no watermark.

The generated PNG is an intermediate only and is not shipped. The WebP derivative is the published original asset.
