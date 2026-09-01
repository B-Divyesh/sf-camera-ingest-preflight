//! Scanning library used by the `camera-ingest-preflight` CLI.
//!
//! The scanner is read-only: it walks without following symlinks, hashes each
//! regular file, and reads documented EXIF plus bounded container bytes.

use exif::{In, Reader as ExifReader, Tag, Value};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::{self, BufReader, Read};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use walkdir::WalkDir;

const INSPECTION_LIMIT: u64 = 24 * 1024 * 1024;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Profile {
    Generic,
    Photoprism,
    Lightroom,
}

impl std::str::FromStr for Profile {
    type Err = String;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value.to_ascii_lowercase().as_str() {
            "generic" => Ok(Self::Generic),
            "photoprism" => Ok(Self::Photoprism),
            "lightroom" => Ok(Self::Lightroom),
            _ => Err(format!(
                "unknown profile '{value}'; use generic, photoprism, or lightroom"
            )),
        }
    }
}

impl std::fmt::Display for Profile {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::Generic => "generic",
            Self::Photoprism => "photoprism",
            Self::Lightroom => "lightroom",
        };
        f.write_str(name)
    }
}

#[derive(Debug, Clone)]
pub struct ScanOptions {
    pub root: PathBuf,
    pub profile: Profile,
    pub include_gps: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Report {
    pub schema_version: String,
    pub tool_version: String,
    pub generated_unix_seconds: u64,
    pub root: String,
    pub profile: Profile,
    pub privacy: Privacy,
    pub summary: Summary,
    pub files: Vec<FileReport>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Privacy {
    pub gps_coordinates_included: bool,
    pub note: String,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct Summary {
    pub files_scanned: usize,
    pub ready: usize,
    pub review: usize,
    pub rejected: usize,
    pub duplicate_files: usize,
    pub gps_files: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileReport {
    pub path: String,
    pub bytes: u64,
    pub sha256: String,
    pub extension: String,
    pub media_kind: MediaKind,
    pub support: Support,
    pub embedded_preview: PreviewStatus,
    pub orientation: OrientationInfo,
    pub projection: ProjectionInfo,
    pub camera: CameraInfo,
    pub gps: GpsInfo,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duplicate_of: Option<String>,
    pub findings: Vec<Finding>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MediaKind {
    RenderedImage,
    RawImage,
    Video,
    Sidecar,
    Unknown,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SupportStatus {
    Accepted,
    Review,
    Rejected,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Support {
    pub status: SupportStatus,
    pub reason: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PreviewStatus {
    Available,
    Missing,
    NotApplicable,
    Unknown,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrientationInfo {
    pub value: Option<u32>,
    pub label: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectionInfo {
    pub kind: String,
    pub evidence: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CameraInfo {
    pub make: Option<String>,
    pub model: Option<String>,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GpsInfo {
    pub present: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latitude: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub longitude: Option<f64>,
    pub redacted: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Severity {
    Info,
    Warning,
    Error,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Finding {
    pub severity: Severity,
    pub code: String,
    pub message: String,
}

#[derive(Default)]
struct Metadata {
    make: Option<String>,
    model: Option<String>,
    orientation: Option<u32>,
    width: Option<u32>,
    height: Option<u32>,
    latitude: Option<f64>,
    longitude: Option<f64>,
}

/// Scan a directory without following symlinks or modifying originals.
pub fn scan(options: &ScanOptions) -> Result<Report, String> {
    scan_excluding_paths(options, &[])
}

/// Scan a directory without following symlinks or modifying originals.
///
/// `excluded_paths` is intentionally an exact list rather than an extension
/// filter. It lets the CLI omit a report destination inside the scanned folder
/// without hiding a photographer's unrelated JSON or CSV files.
pub fn scan_excluding_paths(
    options: &ScanOptions,
    excluded_paths: &[PathBuf],
) -> Result<Report, String> {
    let root = options
        .root
        .canonicalize()
        .map_err(|e| format!("cannot open '{}': {e}", options.root.display()))?;
    if !root.is_dir() {
        return Err(format!("'{}' is not a directory", root.display()));
    }

    let excluded_paths = excluded_paths
        .iter()
        .filter_map(|path| resolve_output_path(path).ok())
        .filter(|path| path.starts_with(&root))
        .collect::<HashSet<_>>();

    let mut paths = Vec::new();
    for entry in WalkDir::new(&root).follow_links(false).sort_by_file_name() {
        match entry {
            Ok(item) if item.file_type().is_file() && !excluded_paths.contains(item.path()) => {
                paths.push(item.into_path())
            }
            Ok(_) => {}
            Err(error) => return Err(format!("could not walk '{}': {error}", root.display())),
        }
    }

    let mut files = Vec::with_capacity(paths.len());
    let mut hashes: HashMap<String, String> = HashMap::new();
    for path in paths {
        let relative = path
            .strip_prefix(&root)
            .unwrap_or(&path)
            .to_string_lossy()
            .replace('\\', "/");
        let mut report = inspect_file(&path, &relative, options.profile, options.include_gps)
            .map_err(|e| format!("could not read '{}': {e}", path.display()))?;
        if let Some(first) = hashes.get(&report.sha256) {
            report.duplicate_of = Some(first.clone());
            report.findings.push(Finding {
                severity: Severity::Warning,
                code: "duplicate_content".into(),
                message: format!("Same bytes as {first}"),
            });
        } else {
            hashes.insert(report.sha256.clone(), relative);
        }
        files.push(report);
    }

    let mut summary = Summary {
        files_scanned: files.len(),
        ..Summary::default()
    };
    for file in &files {
        match file.support.status {
            SupportStatus::Rejected => summary.rejected += 1,
            SupportStatus::Review => summary.review += 1,
            SupportStatus::Accepted
                if file.findings.iter().any(|f| f.severity != Severity::Info) =>
            {
                summary.review += 1
            }
            SupportStatus::Accepted => summary.ready += 1,
        }
        summary.duplicate_files += usize::from(file.duplicate_of.is_some());
        summary.gps_files += usize::from(file.gps.present);
    }

    Ok(Report {
        schema_version: "1.0".into(),
        tool_version: env!("CARGO_PKG_VERSION").into(),
        generated_unix_seconds: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        root: root.to_string_lossy().into_owned(),
        profile: options.profile,
        privacy: Privacy {
            gps_coordinates_included: options.include_gps,
            note: if options.include_gps {
                "Exact GPS coordinates included by explicit request. Keep this report private."
            } else {
                "GPS presence is reported; exact coordinates are redacted."
            }
            .into(),
        },
        summary,
        files,
    })
}

/// Resolve an existing output through symlinks, or resolve its existing parent
/// for the first run before the file has been created. A later write remains
/// responsible for reporting an invalid destination to the user.
fn resolve_output_path(path: &Path) -> io::Result<PathBuf> {
    if path.exists() {
        return path.canonicalize();
    }

    let absolute = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir()?.join(path)
    };
    let parent = absolute
        .parent()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "output path has no parent"))?;
    let name = absolute.file_name().ok_or_else(|| {
        io::Error::new(io::ErrorKind::InvalidInput, "output path has no file name")
    })?;
    Ok(parent.canonicalize()?.join(name))
}

fn inspect_file(
    path: &Path,
    relative: &str,
    profile: Profile,
    include_gps: bool,
) -> io::Result<FileReport> {
    let bytes = path.metadata()?.len();
    let extension = path
        .extension()
        .and_then(|v| v.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    let media_kind = classify(&extension);
    let support = support_for(profile, &extension, media_kind);
    let sha256 = hash_file(path)?;
    let sample = read_sample(path)?;
    let metadata = read_exif(path).unwrap_or_default();
    let embedded_preview = preview_status(media_kind, &extension, &sample);
    let projection = projection_info(path, &sample, &metadata);
    let orientation = orientation_info(metadata.orientation);
    let camera = camera_info(metadata.make, metadata.model, media_kind);
    let gps_present = metadata.latitude.is_some()
        || metadata.longitude.is_some()
        || contains_any(&sample, &[b"GPSLatitude", b"GPSLongitude"]);
    let gps = GpsInfo {
        present: gps_present,
        latitude: if include_gps { metadata.latitude } else { None },
        longitude: if include_gps {
            metadata.longitude
        } else {
            None
        },
        redacted: gps_present && !include_gps,
    };

    let mut findings = Vec::new();
    match support.status {
        SupportStatus::Rejected => findings.push(Finding {
            severity: Severity::Error,
            code: "unsupported_format".into(),
            message: support.reason.clone(),
        }),
        SupportStatus::Review => findings.push(Finding {
            severity: Severity::Warning,
            code: "format_review".into(),
            message: support.reason.clone(),
        }),
        SupportStatus::Accepted => {}
    }
    if embedded_preview == PreviewStatus::Missing {
        findings.push(Finding {
            severity: Severity::Warning,
            code: "preview_missing".into(),
            message: "No embedded JPEG preview found in the inspected RAW header.".into(),
        });
    }
    if orientation.status == "invalid" {
        findings.push(Finding {
            severity: Severity::Warning,
            code: "orientation_invalid".into(),
            message: "EXIF orientation is outside the documented 1–8 range.".into(),
        });
    }
    if camera.status == "missing"
        && matches!(media_kind, MediaKind::RawImage | MediaKind::RenderedImage)
    {
        findings.push(Finding {
            severity: Severity::Warning,
            code: "camera_missing".into(),
            message: "Camera make and model are both missing.".into(),
        });
    } else if camera.status == "partial" {
        findings.push(Finding {
            severity: Severity::Warning,
            code: "camera_partial".into(),
            message: "Only one of camera make/model is present.".into(),
        });
    } else if camera.status == "garbled" {
        findings.push(Finding {
            severity: Severity::Warning,
            code: "camera_garbled".into(),
            message: "Camera make/model contains control or replacement characters.".into(),
        });
    }
    if gps.present {
        findings.push(Finding {
            severity: Severity::Info,
            code: "gps_present".into(),
            message: if gps.redacted {
                "GPS metadata found; exact coordinates redacted."
            } else {
                "GPS metadata found; exact coordinates included by request."
            }
            .into(),
        });
    }
    if projection.kind != "flat" && projection.kind != "unknown" {
        findings.push(Finding {
            severity: Severity::Info,
            code: "projection_hint".into(),
            message: format!(
                "Likely {} media; verify downstream projection handling.",
                projection.kind
            ),
        });
    }

    Ok(FileReport {
        path: relative.into(),
        bytes,
        sha256,
        extension,
        media_kind,
        support,
        embedded_preview,
        orientation,
        projection,
        camera,
        gps,
        duplicate_of: None,
        findings,
    })
}

fn classify(ext: &str) -> MediaKind {
    match ext {
        "jpg" | "jpeg" | "png" | "tif" | "tiff" | "webp" | "avif" | "heic" | "heif" | "gif"
        | "bmp" => MediaKind::RenderedImage,
        "dng" | "cr2" | "cr3" | "nef" | "nrw" | "arw" | "srf" | "sr2" | "raf" | "orf" | "rw2"
        | "pef" | "srw" | "raw" | "insp" => MediaKind::RawImage,
        "mp4" | "mov" | "m4v" | "avi" | "mkv" | "insv" => MediaKind::Video,
        "xmp" | "aae" | "thm" | "lrv" => MediaKind::Sidecar,
        _ => MediaKind::Unknown,
    }
}

fn support_for(profile: Profile, ext: &str, kind: MediaKind) -> Support {
    if kind == MediaKind::Sidecar {
        return Support {
            status: SupportStatus::Accepted,
            reason: "Recognized companion file; keep it beside its original.".into(),
        };
    }
    if kind == MediaKind::Unknown {
        return Support {
            status: SupportStatus::Rejected,
            reason: "Extension is not in the selected profile.".into(),
        };
    }
    if matches!(ext, "insp" | "insv") {
        return Support { status: SupportStatus::Rejected, reason: "Proprietary Insta360 original requires vendor conversion or a tested downstream decoder.".into() };
    }
    let review = match profile {
        Profile::Generic => matches!(ext, "heic" | "heif" | "avif" | "mkv" | "raw"),
        Profile::Photoprism => matches!(ext, "raw" | "avi" | "mkv"),
        Profile::Lightroom => matches!(ext, "webp" | "avif" | "mkv" | "avi" | "raw"),
    };
    if review {
        Support {
            status: SupportStatus::Review,
            reason: format!(
                ".{ext} support varies by codec build or downstream version; test before import."
            ),
        }
    } else {
        Support {
            status: SupportStatus::Accepted,
            reason: format!(".{ext} is listed by the selected {profile} profile."),
        }
    }
}

fn hash_file(path: &Path) -> io::Result<String> {
    let mut reader = BufReader::new(File::open(path)?);
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 64 * 1024];
    loop {
        let count = reader.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn read_sample(path: &Path) -> io::Result<Vec<u8>> {
    let mut data = Vec::new();
    File::open(path)?
        .take(INSPECTION_LIMIT)
        .read_to_end(&mut data)?;
    Ok(data)
}

fn preview_status(kind: MediaKind, ext: &str, sample: &[u8]) -> PreviewStatus {
    match kind {
        MediaKind::RawImage => {
            if has_embedded_jpeg(sample) {
                PreviewStatus::Available
            } else {
                PreviewStatus::Missing
            }
        }
        MediaKind::RenderedImage | MediaKind::Video | MediaKind::Sidecar => {
            PreviewStatus::NotApplicable
        }
        MediaKind::Unknown if ext.is_empty() => PreviewStatus::Unknown,
        MediaKind::Unknown => PreviewStatus::NotApplicable,
    }
}

fn has_embedded_jpeg(data: &[u8]) -> bool {
    let start = data.windows(2).position(|w| w == [0xff, 0xd8]);
    let end = data.windows(2).rposition(|w| w == [0xff, 0xd9]);
    matches!((start, end), (Some(a), Some(b)) if b > a + 128)
}

fn projection_info(path: &Path, sample: &[u8], metadata: &Metadata) -> ProjectionInfo {
    let lower = String::from_utf8_lossy(sample).to_ascii_lowercase();
    let filename = path
        .file_name()
        .and_then(|v| v.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    let mut evidence = Vec::new();
    let kind = if lower.contains("gpano:projectiontype") && lower.contains("equirectangular") {
        evidence.push("XMP GPano projection type".into());
        "equirectangular"
    } else if metadata
        .width
        .zip(metadata.height)
        .is_some_and(|(w, h)| w > 0 && (w as f64 / h as f64 - 2.0).abs() < 0.04)
    {
        evidence.push("image dimensions are approximately 2:1".into());
        "equirectangular"
    } else if filename.contains("360") || filename.contains("theta") || filename.contains("pano") {
        evidence.push("filename contains a panorama marker".into());
        "panorama_candidate"
    } else if filename.contains("fisheye") {
        evidence.push("filename contains fisheye".into());
        "fisheye"
    } else if matches!(
        classify(
            path.extension()
                .and_then(|v| v.to_str())
                .unwrap_or("")
                .to_ascii_lowercase()
                .as_str()
        ),
        MediaKind::RenderedImage
    ) {
        "flat"
    } else {
        "unknown"
    };
    ProjectionInfo {
        kind: kind.into(),
        evidence,
    }
}

fn orientation_info(value: Option<u32>) -> OrientationInfo {
    let (label, status) = match value {
        None => ("not recorded", "missing"),
        Some(1) => ("normal", "valid"),
        Some(2) => ("mirrored horizontal", "valid"),
        Some(3) => ("rotated 180°", "valid"),
        Some(4) => ("mirrored vertical", "valid"),
        Some(5) => ("mirrored horizontal, rotated 270°", "valid"),
        Some(6) => ("rotated 90°", "valid"),
        Some(7) => ("mirrored horizontal, rotated 90°", "valid"),
        Some(8) => ("rotated 270°", "valid"),
        Some(_) => ("invalid value", "invalid"),
    };
    OrientationInfo {
        value,
        label: label.into(),
        status: status.into(),
    }
}

fn camera_info(make: Option<String>, model: Option<String>, kind: MediaKind) -> CameraInfo {
    let garbled =
        make.as_deref().is_some_and(is_garbled) || model.as_deref().is_some_and(is_garbled);
    let status = if garbled {
        "garbled"
    } else {
        match (&make, &model) {
            (Some(_), Some(_)) => "complete",
            (None, None)
                if matches!(
                    kind,
                    MediaKind::Sidecar | MediaKind::Video | MediaKind::Unknown
                ) =>
            {
                "not_applicable"
            }
            (None, None) => "missing",
            _ => "partial",
        }
    };
    CameraInfo {
        make,
        model,
        status: status.into(),
    }
}

fn is_garbled(value: &str) -> bool {
    let escaped_byte = value.as_bytes().windows(4).any(|window| {
        window[0] == b'\\'
            && window[1].eq_ignore_ascii_case(&b'x')
            && window[2].is_ascii_hexdigit()
            && window[3].is_ascii_hexdigit()
    });
    value.contains('\u{fffd}')
        || value.contains("\\u{")
        || escaped_byte
        || value.chars().any(|c| c.is_control() && !c.is_whitespace())
}

fn read_exif(path: &Path) -> Option<Metadata> {
    let file = File::open(path).ok()?;
    let mut reader = BufReader::new(file);
    let exif = ExifReader::new().read_from_container(&mut reader).ok()?;
    let text = |tag| {
        exif.get_field(tag, In::PRIMARY)
            .map(|f| {
                f.display_value()
                    .with_unit(&exif)
                    .to_string()
                    .trim()
                    .trim_matches('"')
                    .to_string()
            })
            .filter(|s| !s.is_empty())
    };
    let uint = |tag| {
        exif.get_field(tag, In::PRIMARY)
            .and_then(|f| f.value.get_uint(0))
    };
    let lat = exif
        .get_field(Tag::GPSLatitude, In::PRIMARY)
        .and_then(|f| gps_decimal(&f.value));
    let lon = exif
        .get_field(Tag::GPSLongitude, In::PRIMARY)
        .and_then(|f| gps_decimal(&f.value));
    let lat_ref = text(Tag::GPSLatitudeRef).unwrap_or_default();
    let lon_ref = text(Tag::GPSLongitudeRef).unwrap_or_default();
    Some(Metadata {
        make: text(Tag::Make),
        model: text(Tag::Model),
        orientation: uint(Tag::Orientation),
        width: uint(Tag::PixelXDimension).or_else(|| uint(Tag::ImageWidth)),
        height: uint(Tag::PixelYDimension).or_else(|| uint(Tag::ImageLength)),
        latitude: lat.map(|v| {
            if lat_ref.eq_ignore_ascii_case("S") {
                -v
            } else {
                v
            }
        }),
        longitude: lon.map(|v| {
            if lon_ref.eq_ignore_ascii_case("W") {
                -v
            } else {
                v
            }
        }),
    })
}

fn gps_decimal(value: &Value) -> Option<f64> {
    match value {
        Value::Rational(values) if values.len() >= 3 => {
            let part = |i: usize| values[i].to_f64();
            Some(part(0) + part(1) / 60.0 + part(2) / 3600.0)
        }
        _ => None,
    }
}

fn contains_any(haystack: &[u8], needles: &[&[u8]]) -> bool {
    needles.iter().any(|needle| {
        haystack
            .windows(needle.len())
            .any(|window| window == *needle)
    })
}

pub fn needs_review(report: &Report) -> bool {
    report.summary.files_scanned == 0 || report.summary.review > 0 || report.summary.rejected > 0
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn classifies_camera_formats() {
        assert_eq!(classify("dng"), MediaKind::RawImage);
        assert_eq!(classify("insv"), MediaKind::Video);
        assert_eq!(classify("xmp"), MediaKind::Sidecar);
        assert_eq!(classify("zip"), MediaKind::Unknown);
    }

    #[test]
    fn detects_embedded_jpeg_and_panorama_name() {
        let mut data = vec![0xff, 0xd8];
        data.extend(vec![0; 256]);
        data.extend([0xff, 0xd9]);
        assert!(has_embedded_jpeg(&data));
        let metadata = Metadata::default();
        assert_eq!(
            projection_info(Path::new("R001_360.dng"), &data, &metadata).kind,
            "panorama_candidate"
        );
    }

    #[test]
    fn scan_finds_duplicates_and_redacts_gps_markers() {
        let dir = tempdir().unwrap();
        fs::write(dir.path().join("a.jpg"), b"fake JPEG GPSLatitude").unwrap();
        fs::write(dir.path().join("b.jpg"), b"fake JPEG GPSLatitude").unwrap();
        let report = scan(&ScanOptions {
            root: dir.path().into(),
            profile: Profile::Generic,
            include_gps: false,
        })
        .unwrap();
        assert_eq!(report.summary.files_scanned, 2);
        assert_eq!(report.summary.duplicate_files, 1);
        assert!(report.files[0].gps.redacted);
        assert!(report.files[0].gps.latitude.is_none());
    }

    #[test]
    fn detects_raw_and_exif_display_escaped_garbled_identity() {
        assert!(is_garbled("Can\u{1}on"));
        assert!(is_garbled(r"Can\x01on"));
        assert!(is_garbled(r"Can\u{fffd}on"));
        assert!(!is_garbled("Canon"));
    }

    #[test]
    fn proprietary_original_is_rejected_honestly() {
        let support = support_for(Profile::Photoprism, "insp", MediaKind::RawImage);
        assert_eq!(support.status, SupportStatus::Rejected);
        assert!(support.reason.contains("vendor conversion"));
    }

    #[test]
    fn an_empty_card_is_not_import_ready() {
        let dir = tempdir().unwrap();
        let report = scan(&ScanOptions {
            root: dir.path().into(),
            profile: Profile::Generic,
            include_gps: false,
        })
        .unwrap();
        assert!(needs_review(&report));
    }
}
