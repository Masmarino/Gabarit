//! The ground (4.0): the roles `theme::ground_colors` lays for Gabarit's light and dark grounds are the ones
//! tools/tokens.py wrote (`tokens::LIGHT`, `tokens::DARK`): an app's ambiance is themed the same way. And a ground's
//! picture is the gradient and the light it says.

use gabarit_gpui::ground::{GGroundPaint, draw};
use gabarit_gpui::theme::{ground_colors, hsla};
use gabarit_gpui::tokens::{self, GRgba, grounds, tones};

fn close(a: gpui::Hsla, b: gpui::Hsla) -> bool {
    let (a, b) = (a.to_rgb(), b.to_rgb());
    // A colour that is fully clear has no hue to compare.
    if a.a < 1e-4 && b.a < 1e-4 {
        return true;
    }
    (a.r - b.r).abs() < 2e-3
        && (a.g - b.g).abs() < 2e-3
        && (a.b - b.b).abs() < 2e-3
        && (a.a - b.a).abs() < 2e-3
}

#[test]
fn ground_roles_match_the_generator() {
    for (spec, tone, values) in [
        (grounds::LIGHT, tones::LIGHT, tokens::LIGHT),
        (grounds::DARK, tones::DARK, tokens::DARK),
    ] {
        let generated = values.map(hsla);
        let laid = ground_colors(&spec, &tone, generated);
        let pairs = [
            ("ink", laid.ink, generated.ink),
            ("ink_2", laid.ink_2, generated.ink_2),
            ("ink_3", laid.ink_3, generated.ink_3),
            ("ground_veil", laid.ground_veil, generated.ground_veil),
            ("glass_thin", laid.glass_thin, generated.glass_thin),
            ("glass_regular", laid.glass_regular, generated.glass_regular),
            ("glass_thick", laid.glass_thick, generated.glass_thick),
            ("glass_liquid", laid.glass_liquid, generated.glass_liquid),
            ("glass_rim", laid.glass_rim, generated.glass_rim),
            (
                "glass_rim_edge",
                laid.glass_rim_edge,
                generated.glass_rim_edge,
            ),
            ("liquid_rim", laid.liquid_rim, generated.liquid_rim),
            (
                "liquid_rim_soft",
                laid.liquid_rim_soft,
                generated.liquid_rim_soft,
            ),
            ("glass_shadow", laid.glass_shadow, generated.glass_shadow),
            (
                "glass_shadow_near",
                laid.glass_shadow_near,
                generated.glass_shadow_near,
            ),
            ("liquid_shadow", laid.liquid_shadow, generated.liquid_shadow),
        ];
        for (name, got, want) in pairs {
            assert!(close(got, want), "{}: {name} {got:?} ≠ {want:?}", spec.name);
        }
    }
}

#[test]
fn a_ground_is_its_gradient() {
    let ground = GGroundPaint {
        spec: grounds::BLACK,
        veil: GRgba::hexa(0x000000, 0.0),
    };
    let (w, h) = (40, 30);
    let pixels = draw(&ground, w, h);
    assert_eq!(pixels.len(), w * h);
    // Black's gradient runs from #000 at the top left to #07090D at the bottom right (160°): the bottom is lighter.
    let sum = |p: [f32; 3]| p[0] + p[1] + p[2];
    assert!(sum(pixels[(h - 1) * w + w / 2]) > sum(pixels[w / 2]) - 0.05);
    // A full veil hides the ground.
    let veiled = draw(
        &GGroundPaint {
            veil: GRgba::hexa(0xFF0000, 1.0),
            ..ground
        },
        w,
        h,
    );
    assert!(
        veiled
            .iter()
            .all(|p| (p[0] - 1.0).abs() < 1e-4 && p[1].abs() < 1e-4)
    );
}
