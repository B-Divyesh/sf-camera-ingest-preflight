use std::fs;
use std::process::Command;
use tempfile::tempdir;

fn scan(card: &std::path::Path, flag: &str, report: &std::path::Path) -> std::process::Output {
    Command::new(env!("CARGO_BIN_EXE_camera-ingest-preflight"))
        .args([
            "scan",
            card.to_str().unwrap(),
            flag,
            report.to_str().unwrap(),
            "--quiet",
        ])
        .output()
        .unwrap()
}

#[test]
fn repeated_json_export_inside_card_stays_import_ready() {
    let fixture = tempdir().unwrap();
    let card = fixture.path().join("card");
    fs::create_dir(&card).unwrap();
    fs::write(card.join("IMG_0001.XMP"), "sidecar").unwrap();
    let report_path = card.join("preflight.json");

    for _ in 0..2 {
        let output = scan(&card, "--json", &report_path);
        assert!(
            output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        let report = fs::read_to_string(&report_path).unwrap();
        assert!(report.contains("\"files_scanned\": 1"));
        assert!(report.contains("IMG_0001.XMP"));
        assert!(!report.contains("preflight.json"));
    }
}

#[test]
fn repeated_csv_export_inside_card_stays_import_ready() {
    let fixture = tempdir().unwrap();
    let card = fixture.path().join("card");
    fs::create_dir(&card).unwrap();
    fs::write(card.join("IMG_0001.XMP"), "sidecar").unwrap();
    let report_path = card.join("preflight.csv");

    for _ in 0..2 {
        let output = scan(&card, "--csv", &report_path);
        assert!(
            output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        let report = fs::read_to_string(&report_path).unwrap();
        assert!(report.contains("IMG_0001.XMP"));
        assert!(!report.contains("preflight.csv"));
    }
}

#[test]
fn only_the_named_report_destination_is_excluded() {
    let fixture = tempdir().unwrap();
    let card = fixture.path().join("card");
    fs::create_dir(&card).unwrap();
    fs::write(card.join("IMG_0001.XMP"), "sidecar").unwrap();
    let report_path = card.join("preflight.json");
    assert!(scan(&card, "--json", &report_path).status.success());
    fs::write(card.join("photographer-notes.json"), "keep this finding").unwrap();

    let output = scan(&card, "--json", &report_path);
    assert_eq!(output.status.code(), Some(1));
    let report = fs::read_to_string(&report_path).unwrap();
    assert!(report.contains("photographer-notes.json"));
    assert!(!report.contains("preflight.json"));
}
