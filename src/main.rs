use camera_ingest_preflight::{
    Profile, Report, ScanOptions, Severity, SupportStatus, needs_review, scan_excluding_paths,
};
use clap::{Parser, Subcommand};
use std::fs;
use std::path::PathBuf;
use std::process::ExitCode;

#[derive(Parser)]
#[command(
    name = "camera-ingest-preflight",
    version,
    about = "Find camera-card ingest risks before your DAM does",
    long_about = "Read-only preflight scanner for 360° and mixed-camera folders. Reports format support, embedded previews, projection hints, orientation, duplicate hashes, camera identity, and GPS presence. Originals are never modified; coordinates are redacted by default."
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Scan a card or folder recursively without following symlinks
    Scan {
        /// Folder to inspect
        folder: PathBuf,
        /// Downstream compatibility profile: generic, photoprism, or lightroom
        #[arg(long, default_value = "generic")]
        profile: Profile,
        /// Write JSON report to a file, or - for stdout
        #[arg(long, value_name = "PATH")]
        json: Option<String>,
        /// Write CSV summary to a file
        #[arg(long, value_name = "PATH")]
        csv: Option<PathBuf>,
        /// Include exact GPS coordinates in JSON (off by default)
        #[arg(long)]
        include_gps: bool,
        /// Suppress the human report
        #[arg(long)]
        quiet: bool,
    },
}

fn main() -> ExitCode {
    match run() {
        Ok(review) => {
            if review {
                ExitCode::from(1)
            } else {
                ExitCode::SUCCESS
            }
        }
        Err(message) => {
            eprintln!("error: {message}");
            ExitCode::from(2)
        }
    }
}

fn run() -> Result<bool, String> {
    let Cli { command } = Cli::parse();
    match command {
        Command::Scan {
            folder,
            profile,
            json,
            csv,
            include_gps,
            quiet,
        } => {
            let output_destinations = json
                .as_deref()
                .filter(|destination| *destination != "-")
                .map(PathBuf::from)
                .into_iter()
                .chain(csv.iter().cloned())
                .collect::<Vec<_>>();
            let report = scan_excluding_paths(
                &ScanOptions {
                    root: folder,
                    profile,
                    include_gps,
                },
                &output_destinations,
            )?;
            if !quiet {
                print_human(&report);
            }
            if let Some(destination) = json {
                let output = serde_json::to_string_pretty(&report).map_err(|e| e.to_string())?;
                if destination == "-" {
                    println!("{output}");
                } else {
                    fs::write(&destination, output)
                        .map_err(|e| format!("cannot write '{destination}': {e}"))?;
                    if !quiet {
                        eprintln!("JSON report → {destination}");
                    }
                }
            }
            if let Some(destination) = csv {
                write_csv(&destination, &report)?;
                if !quiet {
                    eprintln!("CSV report → {}", destination.display());
                }
            }
            Ok(needs_review(&report))
        }
    }
}

fn print_human(report: &Report) {
    println!("CAMERA INGEST PREFLIGHT  /  {} profile", report.profile);
    println!("ROOT  {}", report.root);
    println!(
        "FILES {:>4}   READY {:>4}   REVIEW {:>4}   REJECT {:>4}",
        report.summary.files_scanned,
        report.summary.ready,
        report.summary.review,
        report.summary.rejected
    );
    println!();
    for file in &report.files {
        let mark = match file.support.status {
            SupportStatus::Accepted => "✓",
            SupportStatus::Review => "!",
            SupportStatus::Rejected => "×",
        };
        let state = if file.findings.iter().any(|f| f.severity == Severity::Error) {
            "REJECT"
        } else if file
            .findings
            .iter()
            .any(|f| f.severity == Severity::Warning)
        {
            "REVIEW"
        } else {
            "READY"
        };
        println!(
            "{mark} {state:<6} {:<42} .{:<5} {:>8} bytes",
            truncate(&file.path, 42),
            file.extension,
            file.bytes
        );
        for finding in file
            .findings
            .iter()
            .filter(|f| f.severity != Severity::Info)
        {
            println!("          {} — {}", finding.code, finding.message);
        }
    }
    if report.files.is_empty() {
        println!(
            "No files found. Check the mount path or insert a card, then run the same command again."
        );
    }
    println!();
    println!(
        "GPS   {} file(s); {}",
        report.summary.gps_files, report.privacy.note
    );
    println!("HASH  SHA-256 across every regular file; symlinks were not followed.");
}

fn truncate(value: &str, width: usize) -> String {
    if value.chars().count() <= width {
        return value.into();
    }
    let tail: String = value
        .chars()
        .rev()
        .take(width - 1)
        .collect::<String>()
        .chars()
        .rev()
        .collect();
    format!("…{tail}")
}

fn write_csv(path: &PathBuf, report: &Report) -> Result<(), String> {
    let mut output = String::from(
        "path,status,format,bytes,sha256,preview,projection,orientation,camera_make,camera_model,gps_present,duplicate_of,findings\n",
    );
    for file in &report.files {
        let findings = file
            .findings
            .iter()
            .map(|f| f.code.as_str())
            .collect::<Vec<_>>()
            .join(";");
        let row = [
            file.path.clone(),
            format!("{:?}", file.support.status).to_ascii_lowercase(),
            file.extension.clone(),
            file.bytes.to_string(),
            file.sha256.clone(),
            format!("{:?}", file.embedded_preview).to_ascii_lowercase(),
            file.projection.kind.clone(),
            file.orientation.label.clone(),
            file.camera.make.clone().unwrap_or_default(),
            file.camera.model.clone().unwrap_or_default(),
            file.gps.present.to_string(),
            file.duplicate_of.clone().unwrap_or_default(),
            findings,
        ];
        output.push_str(
            &row.iter()
                .map(|v| csv_cell(v))
                .collect::<Vec<_>>()
                .join(","),
        );
        output.push('\n');
    }
    fs::write(path, output).map_err(|e| format!("cannot write '{}': {e}", path.display()))
}

fn csv_cell(value: &str) -> String {
    format!("\"{}\"", value.replace('"', "\"\""))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn csv_escapes_quotes() {
        assert_eq!(csv_cell("a, \"b\""), "\"a, \"\"b\"\"\"");
    }

    #[test]
    fn truncates_from_the_front() {
        assert_eq!(truncate("1234567890", 6), "…67890");
    }
}
