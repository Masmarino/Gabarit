//! The tone gabarit-gpui computes (`tone::tone`) is tools/tokens.py's, for every ambiance of tokens/gabarit.json.

use gabarit_gpui::tokens::{grounds, tones};
use gabarit_gpui::tone::tone;

#[test]
fn tones_match_the_generator() {
    let expected = [
        tones::LIGHT,
        tones::DARK,
        tones::BLACK,
        tones::AURORE,
        tones::LAGUNE,
        tones::BRAISE,
        tones::NUIT_POLAIRE,
        tones::SOUS_BOIS,
        tones::LAITON,
        tones::GIVRE,
    ];
    assert_eq!(grounds::ALL.len(), expected.len());
    for (ground, want) in grounds::ALL.iter().zip(expected) {
        let got = tone(ground).unwrap_or_else(|| panic!("{}: no tone", ground.name));
        assert!(
            (got.veil - want.veil).abs() < 1e-6,
            "{}: veil {} ≠ {}",
            ground.name,
            got.veil,
            want.veil
        );
        assert!(
            (got.ink2 - want.ink2).abs() < 1e-6,
            "{}: ink2 {} ≠ {}",
            ground.name,
            got.ink2,
            want.ink2
        );
        assert!(
            (got.ink3 - want.ink3).abs() < 1e-6,
            "{}: ink3 {} ≠ {}",
            ground.name,
            got.ink3,
            want.ink3
        );
        assert!(
            (got.liquid - want.liquid).abs() < 1e-6,
            "{}: liquid {} ≠ {}",
            ground.name,
            got.liquid,
            want.liquid
        );
        assert!(
            (got.shade.red - want.shade.red).abs() < 1e-3,
            "{}: shade",
            ground.name
        );
    }
}
