//! The controls on liquid glass (4.1): every text they write holds 4.5:1 at the worst point of every ground, at rest,
//! under the pointer and held down (the press's light laid over the clear glass, under the tinted one).

use gabarit_gpui::glass::{
    GMaterial, accent_glass, hover_light, ink_glass, legible_on_glass, press_light, thin_glass_ink,
};
use gabarit_gpui::theme::{GAppearance, GTheme};
use gabarit_gpui::tokens::{self, glass, grounds};
use gabarit_gpui::tone::{contrast, laid, worst_points};
use gabarit_gpui::{ActiveTheme, theme};
use gpui::{App, Hsla, TestAppContext};

type Rgb = [f64; 3];

fn rgb(color: Hsla) -> Rgb {
    let c = color.to_rgb();
    [c.r as f64, c.g as f64, c.b as f64]
}

/// `color` (with its alpha) laid on `under`.
fn over(color: Hsla, under: Rgb) -> Rgb {
    laid(rgb(color), color.to_rgb().a as f64, under)
}

/// What lies under a control at each worst point: the ground's veil, then the liquid glass's white at `liquid` of its
/// tone's.
fn grounds_under(cx: &App, liquid: f64) -> Vec<Rgb> {
    let theme = cx.theme();
    let glass_colour = rgb(theme.glass_color());
    worst_points(&theme.ground)
        .into_iter()
        .map(|point| {
            laid(
                [1.; 3],
                theme.tone.liquid as f64 * liquid,
                laid(glass_colour, theme.tone.veil as f64, point),
            )
        })
        .collect()
}

fn worst(text: Hsla, fills: &[Rgb]) -> f64 {
    fills
        .iter()
        .map(|fill| contrast(over(text, *fill), *fill))
        .fold(f64::INFINITY, f64::min)
}

fn themes() -> Vec<(String, GTheme)> {
    let mut themes = vec![
        ("light".to_string(), GTheme::new(GAppearance::Light)),
        ("dark".to_string(), GTheme::new(GAppearance::Dark)),
    ];
    for spec in grounds::ALL {
        themes.push((spec.name.to_string(), GTheme::with_ground(*spec)));
    }
    themes
}

fn check(cx: &mut TestAppContext, test: impl Fn(&str, &App)) {
    cx.update(|cx| {
        theme::init(cx);
        for (name, theme) in themes() {
            cx.set_global(theme);
            test(&name, cx);
        }
    });
}

#[gpui::test]
fn text_on_the_tinted_glass_holds(cx: &mut TestAppContext) {
    check(cx, |name, cx| {
        for (what, (material, text)) in [("accent", accent_glass(cx)), ("ink", ink_glass(cx))] {
            let GMaterial::Tinted { tint, .. } = material else {
                panic!("a tinted glass")
            };
            for (state, light) in [("rest", 0.), ("pressed", glass::CONTROL_PRESS_LIGHT)] {
                let fills: Vec<Rgb> = grounds_under(cx, 1.)
                    .into_iter()
                    .map(|under| {
                        let lit = laid([1.; 3], light as f64, under);
                        laid(rgb(tint), glass::CONTROL_PROMINENT as f64, lit)
                    })
                    .collect();
                let held = worst(text, &fills);
                assert!(
                    held >= glass::TEXT_MINIMUM as f64,
                    "{what} glass on {name}, {state}: {held:.2}"
                );
            }
        }
    });
}

#[gpui::test]
fn text_on_the_clear_glass_holds(cx: &mut TestAppContext) {
    check(cx, |name, cx| {
        let colors = cx.theme().colors;
        // The clear glass (its whole white) and the thin one (half of it), at rest, lit by the pointer, held down: a
        // ghost button, a chip, in the ink's second step at rest, in the ink when lit.
        for (what, liquid, rest, lit) in [
            ("glass", 1.0, colors.ink, colors.ink),
            ("thin glass", 0.5, thin_glass_ink(cx), colors.ink),
        ] {
            for (state, light) in [
                ("rest", None),
                ("hover", Some(hover_light(cx))),
                ("pressed", Some(gabarit_gpui::theme::white(press_light(cx)))),
            ] {
                let fills: Vec<Rgb> = grounds_under(cx, liquid)
                    .into_iter()
                    .map(|under| light.map_or(under, |light| over(light, under)))
                    .collect();
                let text = if light.is_some() { lit } else { rest };
                let held = worst(text, &fills);
                assert!(
                    held >= glass::TEXT_MINIMUM as f64,
                    "{what} on {name}, {state}: {held:.2}"
                );
            }
        }
    });
}

#[gpui::test]
fn the_thin_glass_keeps_the_second_step_on_gabarits_grounds(cx: &mut TestAppContext) {
    check(cx, |name, cx| {
        if name == "light" || name == "dark" {
            let (ink_2, thin) = (cx.theme().colors.ink_2, thin_glass_ink(cx));
            assert!(
                (ink_2.a - thin.a).abs() < 0.011,
                "{name}: {} {}",
                ink_2.a,
                thin.a
            );
        }
    });
}

#[gpui::test]
fn the_press_lights_gabarits_grounds(cx: &mut TestAppContext) {
    check(cx, |name, cx| {
        if name == "light" || name == "dark" {
            assert_eq!(press_light(cx), glass::CONTROL_PRESS_LIGHT, "{name}");
        }
    });
}

#[gpui::test]
fn the_tinted_glass_prefers_the_accent(cx: &mut TestAppContext) {
    check(cx, |name, cx| {
        let colors = cx.theme().colors;
        let (material, _) = accent_glass(cx);
        let GMaterial::Tinted { tint, .. } = material else {
            panic!("a tinted glass")
        };
        // Gabarit's light grounds take the accent's darker step; every dark one, the accent itself.
        let dark = cx.theme().ground.mode == tokens::GGroundMode::Dark;
        let expected = if dark {
            colors.accent
        } else {
            colors.accent_text
        };
        assert_eq!(rgb(tint), rgb(expected), "{name}");
    });
}

#[gpui::test]
fn red_and_labels_on_the_glass_hold(cx: &mut TestAppContext) {
    check(cx, |name, cx| {
        let colors = cx.theme().colors;
        // A destructive button's red, on the clear glass and on the thin one.
        for liquid in [1.0, 0.5] {
            let red = legible_on_glass(colors.error_text, liquid as f32, None, cx);
            let held = worst(red, &grounds_under(cx, liquid));
            assert!(
                held >= glass::TEXT_MINIMUM as f64,
                "red on {name} ({liquid}): {held:.2}"
            );
        }
        // A label's text on its state's tint over the thin glass.
        for tone in [
            gabarit_gpui::GTone::Success,
            gabarit_gpui::GTone::Warning,
            gabarit_gpui::GTone::Error,
            gabarit_gpui::GTone::Info,
        ] {
            let fills: Vec<Rgb> = grounds_under(cx, 0.5)
                .into_iter()
                .map(|under| over(tone.tint(cx), under))
                .collect();
            let text = legible_on_glass(tone.tint_text(cx), 0.5, Some(tone.tint(cx)), cx);
            let held = worst(text, &fills);
            assert!(
                held >= glass::TEXT_MINIMUM as f64,
                "{tone:?} label on {name}: {held:.2}"
            );
        }
    });
}

#[gpui::test]
fn gabarits_grounds_keep_their_red(cx: &mut TestAppContext) {
    check(cx, |name, cx| {
        if name == "light" || name == "dark" {
            let red = cx.theme().colors.error_text;
            assert_eq!(rgb(legible_on_glass(red, 1., None, cx)), rgb(red), "{name}");
        }
    });
}
