//! An ambiance's own accent (4.2): `tone::accent_tone` is tools/tokens.py's `accent_tone()` (the generated
//! `accent_tones`, and the reference values of the rule), and the theme that takes it lays its roles: the accent, its
//! text, the selection, the ink on it, legible on the ground; without one, nothing changes.

use gabarit_gpui::theme::{GAppearance, GTheme, hsla, mix};
use gabarit_gpui::tokens::{
    self, GAccentTone, GGroundSpec, GGroundToneValues, GRgba, accent_tones, glass, grounds, tones,
};
use gabarit_gpui::tone::{
    accent_edge, accent_surfaces, accent_tone, contrast, on_accent_contrast, tone,
};

const BYTE: f32 = 1.0 / 255.0 + 1e-6;

fn same(a: GRgba, b: GRgba) -> bool {
    (a.red - b.red).abs() <= BYTE
        && (a.green - b.green).abs() <= BYTE
        && (a.blue - b.blue).abs() <= BYTE
}

fn rgb(c: GRgba) -> [f64; 3] {
    [c.red as f64, c.green as f64, c.blue as f64]
}

fn check(
    spec: GGroundSpec,
    tone: GGroundToneValues,
    accent: u32,
    text: u32,
    on: u32,
    selected: f32,
) -> GAccentTone {
    let got = accent_tone(&spec, &tone, GRgba::hex(accent));
    let name = spec.name;
    assert!(same(got.accent, GRgba::hex(accent)), "{name}: accent");
    assert!(
        same(got.accent_text, GRgba::hex(text)),
        "{name} + {accent:06X}: text {:?}, not {text:06X}",
        got.accent_text
    );
    assert!(
        same(got.on_accent, GRgba::hex(on)),
        "{name} + {accent:06X}: on {:?}, not {on:06X}",
        got.on_accent
    );
    assert!((got.selected - selected).abs() < 1e-6, "{name}: selected");
    got
}

#[test]
fn the_accent_matches_the_generator() {
    let got = accent_tone(&grounds::DORE, &tones::DORE, grounds::DORE_ACCENT);
    let want = accent_tones::DORE;
    assert!(same(got.accent, want.accent));
    assert!(same(got.accent_text, want.accent_text));
    assert!(same(got.on_accent, want.on_accent));
    assert!((got.selected - want.selected).abs() < 1e-6);
    // Every ambiance that brings an accent has its generated roles.
    for spec in grounds::ALL {
        if let Some(accent) = grounds::accent(spec.name) {
            let tone = tone(spec).expect("a tone");
            let got = accent_tone(spec, &tone, accent);
            assert!(same(got.accent_text, want.accent_text), "{}", spec.name);
        }
    }
}

#[test]
fn the_rule_gives_its_reference_values() {
    check(
        grounds::DORE,
        tones::DORE,
        0xE9C979,
        0xE9C979,
        0x10151C,
        0.16,
    );
    check(
        grounds::GIVRE,
        tones::GIVRE,
        0xB8862B,
        0x7D5E26,
        0x10151C,
        0.10,
    );
    check(
        grounds::AURORE,
        tones::AURORE,
        0xE9C979,
        0xF2DFAF,
        0x10151C,
        0.16,
    );
    // A dark brass on the gold ground: its text pales toward the ink, white on it, but its rim does not show.
    check(
        grounds::DORE,
        tones::DORE,
        0x7A5A20,
        0xD7CEBC,
        0xFFFFFF,
        0.16,
    );
    let edge = accent_edge(&grounds::DORE, &tones::DORE, GRgba::hex(0x7A5A20));
    assert!((edge - 1.18).abs() < 0.01, "edge {edge:.2}");
    // A blue on the light ground: the dark ink on it, only 3.85:1.
    let blue = check(
        grounds::LIGHT,
        tones::LIGHT,
        0x2F6FDB,
        0x2A62BE,
        0x10151C,
        0.10,
    );
    let on = on_accent_contrast(&grounds::LIGHT, &tones::LIGHT, &blue);
    assert!((on - 3.85).abs() < 0.01, "on {on:.2}");
}

/// The ambiances that bring an accent hold it: its text 4.5:1 on the ground and every glass, the ink on it 4.5:1,
/// the accent against the ground 3:1 (a rim, the focus ring).
#[test]
fn every_accent_holds_on_its_ambiance() {
    let mut seen = 0;
    for spec in grounds::ALL {
        let Some(accent) = grounds::accent(spec.name) else {
            continue;
        };
        seen += 1;
        let name = spec.name;
        let tone = tone(spec).expect("a tone");
        let roles = accent_tone(spec, &tone, accent);
        let on = on_accent_contrast(spec, &tone, &roles);
        assert!(
            on >= glass::TEXT_MINIMUM as f64,
            "{name}: on the accent {on:.2}"
        );
        let edge = accent_edge(spec, &tone, accent);
        assert!(
            edge >= glass::EDGE_MINIMUM as f64,
            "{name}: the accent's edge {edge:.2}"
        );
        let text = accent_surfaces(spec, &tone)
            .into_iter()
            .map(|under| contrast(rgb(roles.accent_text), under))
            .fold(f64::INFINITY, f64::min);
        assert!(
            text >= glass::TEXT_MINIMUM as f64,
            "{name}: its text {text:.2}"
        );
    }
    assert!(seen > 0, "an ambiance brings an accent");
}

#[test]
fn the_theme_lays_the_accent() {
    let theme = GTheme::with_ground(grounds::DORE).with_accent(Some(grounds::DORE_ACCENT));
    let want = accent_tones::DORE;
    assert_eq!(theme.accent.map(|a| a.on_accent), Some(want.on_accent));
    assert_eq!(theme.colors.accent, hsla(want.accent));
    assert_eq!(theme.colors.accent_text, hsla(want.accent_text));
    assert_eq!(
        theme.colors.selected_fill,
        hsla(GRgba {
            alpha: want.selected,
            ..want.accent
        })
    );
    assert_eq!(theme.on_accent(), Some(hsla(want.on_accent)));
}

/// Without an accent, the theme is the one of 4.1, to the bit; and taking the accent back restores it.
#[test]
fn without_an_accent_nothing_changes() {
    for (before, after) in [
        (
            GTheme::new(GAppearance::Light),
            GTheme::new(GAppearance::Light).with_accent(None),
        ),
        (
            GTheme::new(GAppearance::Dark),
            GTheme::new(GAppearance::Dark)
                .with_accent(Some(GRgba::hex(0xE9C979)))
                .with_accent(None),
        ),
        (
            GTheme::with_ground(grounds::DORE),
            GTheme::with_ground(grounds::DORE)
                .with_accent(Some(grounds::DORE_ACCENT))
                .with_accent(None),
        ),
    ] {
        assert_eq!(after.accent, None);
        assert_eq!(after.on_accent(), None);
        assert_eq!(
            format!("{:?}", before.colors),
            format!("{:?}", after.colors)
        );
    }
    assert_eq!(
        GTheme::with_ground(grounds::DORE).colors.accent,
        hsla(tokens::DARK.accent)
    );
}

/// The main button takes the ambiance's accent, as on Android: `primary` the accent, `on_primary` the ink on it,
/// `primary_hover` the accent with 15 % of that ink; its ink holds 4.5:1. The danger button keeps its own ink.
#[test]
fn the_main_button_takes_the_accent() {
    let theme = GTheme::with_ground(grounds::DORE).with_accent(Some(grounds::DORE_ACCENT));
    let want = accent_tones::DORE;
    let colors = theme.colors;
    assert_eq!(colors.primary, hsla(want.accent));
    assert_eq!(colors.on_primary, hsla(want.on_accent));
    assert_eq!(
        colors.primary_hover,
        mix(hsla(want.accent), hsla(want.on_accent), 0.15)
    );
    let held = contrast(rgb(want.on_accent), rgb(want.accent));
    assert!(held >= glass::TEXT_MINIMUM as f64, "{held:.2}");
    assert_eq!(theme.on_error_fill(), hsla(tokens::DARK.on_primary));
    // Without an accent, the danger's ink is the theme's `on_primary`, as before.
    let plain = GTheme::with_ground(grounds::DORE);
    assert_eq!(plain.on_error_fill(), plain.colors.on_primary);
}
