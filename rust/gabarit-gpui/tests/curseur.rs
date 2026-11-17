//! The pointer over Gabarit's components (4.1.2): the hand over everything that is clicked, the arrow over what is
//! disabled, the text cursor over the fields. GPUI does not let a test outside its crate read the cursor it asks the
//! system for, so this test reads the sources: every click handler sits next to the hand (or the text cursor), and the
//! arrow is asked for only where the system's own convention wants it.

use std::fs;
use std::path::Path;

/// How far above a click handler its hand may be asked for (the same element, built over a few lines).
const REACH: usize = 30;

/// Click handlers that need no hand of their own, with why.
const EXEMPT: &[(&str, &str)] = &[
    // The sheet's close: a `GCloseButton`, which asks for the hand itself.
    ("sheet.rs", "close.on_click("),
    // The picker's choices: `GMenuItem`s, which ask for the hand themselves.
    ("picker.rs", "GMenuItem"),
    // The window's own buttons (Windows, Linux): the arrow, as the system draws them.
    ("bars.rs", "window_button_click(area, window)"),
];

fn sources() -> Vec<(String, Vec<String>)> {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("src");
    let mut files: Vec<_> = fs::read_dir(&dir)
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .filter(|path| path.extension().is_some_and(|ext| ext == "rs"))
        .collect();
    files.sort();
    files
        .into_iter()
        .map(|path| {
            let name = path.file_name().unwrap().to_string_lossy().into_owned();
            let lines = fs::read_to_string(&path)
                .unwrap()
                .lines()
                .map(str::to_owned)
                .collect();
            (name, lines)
        })
        .collect()
}

fn exempt(file: &str, lines: &[String], at: usize) -> bool {
    EXEMPT.iter().any(|(name, mark)| {
        *name == file
            && lines[at.saturating_sub(4)..=at]
                .iter()
                .any(|l| l.contains(mark))
    })
}

#[test]
fn every_click_has_the_hand() {
    let mut missing = Vec::new();
    for (file, lines) in sources() {
        for (at, line) in lines.iter().enumerate() {
            let code = line.trim_start();
            if code.starts_with("//") || !code.contains(".on_click(") || exempt(&file, &lines, at) {
                continue;
            }
            let near = &lines[at.saturating_sub(REACH)..=at];
            if !near
                .iter()
                .any(|l| l.contains("PointingHand") || l.contains("IBeam"))
            {
                missing.push(format!("{file}:{}: {}", at + 1, code));
            }
        }
    }
    assert!(
        missing.is_empty(),
        "clicked without the hand:\n{}",
        missing.join("\n")
    );
}

#[test]
fn the_arrow_only_on_the_window_buttons() {
    let arrows: Vec<_> = sources()
        .into_iter()
        .flat_map(|(file, lines)| {
            lines
                .iter()
                .enumerate()
                .filter(|(_, l)| l.contains("CursorStyle::Arrow"))
                .map(|(at, _)| format!("{file}:{}", at + 1))
                .collect::<Vec<_>>()
        })
        .collect();
    assert_eq!(arrows.len(), 1, "the arrow asked for at {arrows:?}");
    assert!(arrows[0].starts_with("bars.rs:"), "{arrows:?}");
}
