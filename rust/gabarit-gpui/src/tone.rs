//! The ground's tone (4.0): tools/tokens.py's `tone()`, step for step, for the grounds an app brings at run time (an
//! ambiance of its own, a colour drawn from a picture). `tests/tokens.rs` compares it with the tones the generator
//! wrote (`tokens::tones`). Computed in f64, as Python does.

use crate::tokens::{self, GAccentTone, GGroundMode, GGroundSpec, GGroundToneValues, GRgba, glass};

type Rgb = [f64; 3];

fn rgb(color: GRgba) -> Rgb {
    [color.red as f64, color.green as f64, color.blue as f64]
}

/// WCAG's relative luminance.
pub fn luminance(c: Rgb) -> f64 {
    fn channel(v: f64) -> f64 {
        if v <= 0.04045 {
            v / 12.92
        } else {
            ((v + 0.055) / 1.055).powf(2.4)
        }
    }
    0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2])
}

pub fn contrast(a: Rgb, b: Rgb) -> f64 {
    let (la, lb) = (luminance(a), luminance(b));
    (la.max(lb) + 0.05) / (la.min(lb) + 0.05)
}

/// `top` at `opacity` on the opaque `under`.
pub fn laid(top: Rgb, opacity: f64, under: Rgb) -> Rgb {
    [0, 1, 2].map(|i| top[i] * opacity + under[i] * (1.0 - opacity))
}

/// Rounding half to even, as Python's `round()`.
fn round_half_even(value: f64) -> f64 {
    let floor = value.floor();
    let diff = value - floor;
    if (diff - 0.5).abs() < 1e-12 {
        if floor % 2.0 == 0.0 {
            floor
        } else {
            floor + 1.0
        }
    } else {
        value.round()
    }
}

/// The ink: the ambiance's own, or the apps' main text in its mode.
pub fn ink(spec: &GGroundSpec) -> GRgba {
    spec.ink.unwrap_or(match spec.mode {
        GGroundMode::Light => tokens::LIGHT.text_primary,
        GGroundMode::Dark => tokens::DARK.text_primary,
    })
}

/// The shadows' colour: the ambiance's own, or its darkest stop, 70 % of the way to black (rounded to a byte).
pub fn shade(spec: &GGroundSpec) -> GRgba {
    if let Some(shade) = spec.shade {
        return shade;
    }
    let darkest = spec
        .stops
        .iter()
        .copied()
        .min_by(|a, b| luminance(rgb(*a)).total_cmp(&luminance(rgb(*b))))
        .expect("a ground has a stop");
    let byte = |v: f32| (round_half_even((v as f64 * 255.0).round() * 0.3) / 255.0) as f32;
    GRgba {
        red: byte(darkest.red),
        green: byte(darkest.green),
        blue: byte(darkest.blue),
        alpha: 1.0,
    }
}

/// The stop under the light's centre: its place projected on the gradient's line, rounded to the nearest stop.
pub fn light_stop(spec: &GGroundSpec) -> usize {
    let angle = (spec.angle as f64).to_radians();
    let (dx, dy) = (angle.sin(), -angle.cos());
    let reach = (dx.abs() + dy.abs()) / 2.0;
    let (x, y) = (spec.light.x as f64, spec.light.y as f64);
    let along = (((x - 0.5) * dx + (y - 0.5) * dy) / reach / 2.0 + 0.5).clamp(0.0, 1.0);
    round_half_even(along * (spec.stops.len() - 1) as f64) as usize
}

/// Where the ink may land: every stop, and the light at its centre over the stop under it.
pub fn worst_points(spec: &GGroundSpec) -> Vec<Rgb> {
    let mut points: Vec<Rgb> = spec.stops.iter().map(|s| rgb(*s)).collect();
    let under = rgb(spec.stops[light_stop(spec)]);
    points.push(laid(
        rgb(spec.light.color),
        spec.light.strength as f64,
        under,
    ));
    points
}

/// The tone: the least veil that lets the ink hold 4.5:1 (its secondary step at `INK_SECONDARY_MAX`, its discreet one
/// 3:1 at `INK_DISCRET_MAX`) at every worst point, then the least opacities of the ink's steps from their nominal
/// ones, then the most white for the liquid glass, by steps of a hundredth. None: no veil holds.
pub fn tone(spec: &GGroundSpec) -> Option<GGroundToneValues> {
    let (ink_colour, glass_colour, points) = (ink(spec), rgb(spec.glass), worst_points(spec));
    let ink = rgb(ink_colour);
    let holds = |veil: f64, alpha: f64, minimum: f64, white: f64| {
        points.iter().all(|point| {
            let under = laid([1.0; 3], white, laid(glass_colour, veil, *point));
            contrast(laid(ink, alpha, under), under) >= minimum
        })
    };
    let steps: Vec<f64> = (0..=100).map(|s| s as f64 / 100.0).collect();
    let (text, edge) = (glass::TEXT_MINIMUM as f64, glass::EDGE_MINIMUM as f64);
    let veil = *steps.iter().find(|&&v| {
        holds(v, 1.0, text, 0.0)
            && holds(v, glass::INK_SECONDARY_MAX as f64, text, 0.0)
            && holds(v, glass::INK_DISCRET_MAX as f64, edge, 0.0)
    })?;
    let first = |from: f32, minimum: f64| {
        steps
            .iter()
            .copied()
            .find(|&a| a >= from as f64 - 1e-6 && holds(veil, a, minimum, 0.0))
            .unwrap_or(1.0)
    };
    let (ink2, ink3) = (
        first(glass::INK_SECONDARY, text),
        first(glass::INK_DISCRET, edge),
    );
    let nominal = spec.kind.values().liquid as f64;
    let liquid = steps
        .iter()
        .rev()
        .copied()
        .find(|&w| w <= nominal + 1e-6 && holds(veil, 1.0, text, w))
        .unwrap_or(0.0);
    Some(GGroundToneValues {
        veil: veil as f32,
        ink: ink_colour,
        ink2: ink2 as f32,
        ink3: ink3 as f32,
        liquid: liquid as f32,
        shade: shade(spec),
    })
}

/// tokens/gabarit.json's `ground.accent`: the step by which an accent's text moves toward the ink, the selection's
/// opacity by mode, the inks laid on the accent (white, slate 900). The generator does not write them as constants.
pub mod accent_rule {
    use crate::tokens::{GGroundMode, GRgba, palette};

    pub const STEP: f64 = 0.05;
    pub const INKS: [GRgba; 2] = [GRgba::hex(0xFFFFFF), palette::SLATE_900];

    pub const fn selected(mode: GGroundMode) -> f32 {
        match mode {
            GGroundMode::Light => 0.1,
            GGroundMode::Dark => 0.16,
        }
    }
}

/// `a` moved toward `b` by `amount` (0: `a`, 1: `b`).
fn mixed(a: Rgb, b: Rgb, amount: f64) -> Rgb {
    [0, 1, 2].map(|i| a[i] + (b[i] - a[i]) * amount)
}

/// A colour rounded to bytes, as the generator writes it (Python's `round`).
fn to_bytes(c: Rgb) -> GRgba {
    let byte = |v: f64| (round_half_even(v * 255.0) / 255.0) as f32;
    GRgba {
        red: byte(c[0]),
        green: byte(c[1]),
        blue: byte(c[2]),
        alpha: 1.0,
    }
}

/// The ground under the glass at each worst point: its glass colour laid at the tone's veil.
fn veiled_points(spec: &GGroundSpec, tone: &GGroundToneValues) -> Vec<Rgb> {
    let glass_colour = rgb(spec.glass);
    worst_points(spec)
        .into_iter()
        .map(|point| laid(glass_colour, tone.veil as f64, point))
        .collect()
}

/// Where an accent's text may land: the veiled ground and every content glass over it, at each worst point.
pub fn accent_surfaces(spec: &GGroundSpec, tone: &GGroundToneValues) -> Vec<Rgb> {
    let (kind, glass_colour) = (spec.kind.values(), rgb(spec.glass));
    veiled_points(spec, tone)
        .into_iter()
        .flat_map(|veiled| {
            [
                veiled,
                laid(glass_colour, kind.thin as f64, veiled),
                laid(glass_colour, kind.regular as f64, veiled),
                laid(glass_colour, kind.thick as f64, veiled),
            ]
        })
        .collect()
}

/// What the accent fills: the accent alone, and the prominent glass (the accent at `glass::CONTROL_PROMINENT`) over
/// the veiled ground at each worst point.
pub fn accent_fills(spec: &GGroundSpec, tone: &GGroundToneValues, accent: GRgba) -> Vec<Rgb> {
    let a = rgb(accent);
    std::iter::once(a)
        .chain(
            veiled_points(spec, tone)
                .into_iter()
                .map(|veiled| laid(a, glass::CONTROL_PROMINENT as f64, veiled)),
        )
        .collect()
}

/// An ambiance's own accent and its roles (4.2): tools/tokens.py's `accent_tone()`, step for step. The text's colour
/// is the first mix of the accent toward the tone's ink, by `accent_rule::STEP`, that holds 4.5:1 on every surface
/// ([`accent_surfaces`]); the ink on the accent, of `accent_rule::INKS`, the one whose worst contrast on the fills
/// ([`accent_fills`]) is the best; the selection, the accent at its mode's opacity. Whether the accent may be used
/// at all is [`accent_edge`] (3:1) and [`on_accent_contrast`] (4.5:1).
pub fn accent_tone(spec: &GGroundSpec, tone: &GGroundToneValues, accent: GRgba) -> GAccentTone {
    let (a, ink) = (rgb(accent), rgb(tone.ink));
    let surfaces = accent_surfaces(spec, tone);
    let text_minimum = glass::TEXT_MINIMUM as f64 - 1e-9;
    let steps = (1.0 / accent_rule::STEP).round() as usize;
    let text = (0..=steps)
        .map(|index| mixed(a, ink, (index as f64 * accent_rule::STEP).min(1.0)))
        .find(|candidate| {
            surfaces
                .iter()
                .all(|under| contrast(*candidate, *under) >= text_minimum)
        })
        .unwrap_or(ink);
    let fills = accent_fills(spec, tone, accent);
    let worst = |ink: GRgba| {
        fills
            .iter()
            .map(|fill| contrast(rgb(ink), *fill))
            .fold(f64::INFINITY, f64::min)
    };
    // The first of the inks wins a tie, as Python's `max`.
    let on = accent_rule::INKS
        .into_iter()
        .fold(None::<(GRgba, f64)>, |best, ink| {
            let held = worst(ink);
            match best {
                Some((_, best_held)) if best_held >= held => best,
                _ => Some((ink, held)),
            }
        })
        .expect("two inks")
        .0;
    GAccentTone {
        accent: GRgba {
            alpha: 1.0,
            ..accent
        },
        accent_text: to_bytes(text),
        on_accent: on,
        selected: accent_rule::selected(spec.mode),
    }
}

/// The accent against the veiled ground at its worst point (a rim, the focus ring): 3:1 at least.
pub fn accent_edge(spec: &GGroundSpec, tone: &GGroundToneValues, accent: GRgba) -> f64 {
    let a = rgb(accent);
    veiled_points(spec, tone)
        .into_iter()
        .map(|veiled| contrast(a, veiled))
        .fold(f64::INFINITY, f64::min)
}

/// The ink on the accent at its worst fill ([`accent_fills`]): 4.5:1 at least.
pub fn on_accent_contrast(
    spec: &GGroundSpec,
    tone: &GGroundToneValues,
    accent: &GAccentTone,
) -> f64 {
    let on = rgb(accent.on_accent);
    accent_fills(spec, tone, accent.accent)
        .into_iter()
        .map(|fill| contrast(on, fill))
        .fold(f64::INFINITY, f64::min)
}
