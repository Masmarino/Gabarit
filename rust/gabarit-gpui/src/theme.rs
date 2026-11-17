//! The colours by role for the current appearance, the ground under the window and its tone (4.0), the colours of the
//! bars laid on that ground (and of the dark frame, now an option), IBM Plex and the text styles.
//!
//! The ground (`GTheme::ground`) is Gabarit's light or dark one by default, after the appearance; an app may lay its
//! own ambiance instead ([`set_ground`]): its tone is then computed once ([`crate::tone::tone`]), and the ink and the
//! glass come from it.
//!
//! An ambiance may bring its own accent (4.2, [`GTheme::with_accent`], [`set_accent`]): the main buttons in tinted glass,
//! the chosen chip, the tab's line, the links, the selection and the focus ring take it instead of Gabarit's rust, its
//! roles derived by [`crate::tone::accent_tone`]. `GGroundSpec` keeps its fields: the accent goes to the theme.

use std::borrow::Cow;

use gpui::{
    App, FontWeight, Global, Hsla, Rgba, SharedString, Styled, Window, WindowAppearance, px,
};

use crate::tokens::{
    self, GAccentTone, GColorRoles, GGroundMode, GGroundSpec, GGroundToneValues, GRgba, GTextStyle,
    GWeight, grounds, tones,
};

/// The colours by role, as GPUI's.
pub type GColors = GColorRoles<Hsla>;

/// A token's colour as GPUI's.
pub fn hsla(color: GRgba) -> Hsla {
    Rgba {
        r: color.red,
        g: color.green,
        b: color.blue,
        a: color.alpha,
    }
    .into()
}

/// The light or the dark appearance.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum GAppearance {
    #[default]
    Light,
    Dark,
}

impl GAppearance {
    pub fn of(window: &Window) -> Self {
        match window.appearance() {
            WindowAppearance::Dark | WindowAppearance::VibrantDark => GAppearance::Dark,
            WindowAppearance::Light | WindowAppearance::VibrantLight => GAppearance::Light,
        }
    }
}

/// The colours of the bars (the rail, the bands, a window's header). In 4.0 they lie on the ground, in its ink
/// ([`GTheme::bars`]); the dark frame of 3.x (graphite 950, the same in both appearances, as GabaritApple's
/// `GFrameColor`) stays an option ([`GTheme::frame`], the bars' `framed()`).
#[derive(Clone, Copy, Debug)]
pub struct GFrameColors {
    pub ground: Hsla,
    pub text: Hsla,
    pub text_secondary: Hsla,
    pub text_discret: Hsla,
    /// A rim, a badge's ground.
    pub rim: Hsla,
    /// The line under a header.
    pub line: Hsla,
    pub hover: Hsla,
    pub selected: Hsla,
    /// The close cross's hover: a little stronger, on a small circle.
    pub close_hover: Hsla,
}

impl GFrameColors {
    /// The bars on the ground: no ground of their own, the ground's ink, veils of that ink.
    pub fn on_ground(colors: &GColors) -> Self {
        GFrameColors {
            ground: alpha(colors.ink, 0.0),
            text: colors.ink,
            text_secondary: colors.ink_2,
            text_discret: colors.ink_3,
            rim: alpha(colors.ink, 0.14),
            line: alpha(colors.ink, 0.0),
            hover: alpha(colors.ink, 0.06),
            selected: alpha(colors.ink, 0.1),
            close_hover: alpha(colors.ink, 0.12),
        }
    }

    /// The dark frame (graphite 950), as in 3.x.
    pub fn graphite() -> Self {
        use tokens::palette::*;
        GFrameColors {
            ground: hsla(GRAPHITE_950),
            text: hsla(GRAPHITE_100),
            text_secondary: hsla(GRAPHITE_300),
            text_discret: hsla(GRAPHITE_400),
            rim: hsla(GRAPHITE_700),
            line: hsla(GRAPHITE_700.opacity(0.7)),
            hover: hsla(GRAPHITE_100.opacity(0.05)),
            selected: hsla(GRAPHITE_100.opacity(0.09)),
            close_hover: hsla(GRAPHITE_100.opacity(0.12)),
        }
    }
}

/// Gabarit's theme: the appearance, its colours, the ground and its tone, the bars'. A GPUI global: `cx.theme()`.
#[derive(Clone, Debug)]
pub struct GTheme {
    pub appearance: GAppearance,
    pub colors: GColors,
    /// The dark frame's colours (graphite 950): only for the bars drawn `framed()`.
    pub frame: GFrameColors,
    /// The bars' colours on the ground (4.0's default).
    pub bars: GFrameColors,
    /// The ground under the window: Gabarit's light or dark one, or the app's ([`set_ground`]).
    pub ground: GGroundSpec,
    /// Its tone: the veil laid over it, the ink's steps, the liquid glass's white.
    pub tone: GGroundToneValues,
    /// The app laid its own ground: it stays when the appearance changes (the ground has its own mode).
    pub own_ground: bool,
    /// The ambiance's own accent and its roles (4.2, [`GTheme::with_accent`]); `None`: Gabarit's rust.
    pub accent: Option<GAccentTone>,
    /// The system asks for less motion: no press scale, no animated knob.
    pub reduce_motion: bool,
    /// "Reduce transparency": the glass turns dense (`glass::REDUCED`, 0.94 of the ground's glass colour).
    pub reduce_transparency: bool,
    /// "Increase contrast": the glass's light on its edge becomes a real outline (`border`).
    pub increase_contrast: bool,
}

impl Global for GTheme {}

impl GTheme {
    /// The appearance's theme, on Gabarit's ground for it (`grounds::LIGHT`, `grounds::DARK`).
    pub fn new(appearance: GAppearance) -> Self {
        let (values, ground, tone) = match appearance {
            GAppearance::Light => (tokens::LIGHT, grounds::LIGHT, tones::LIGHT),
            GAppearance::Dark => (tokens::DARK, grounds::DARK, tones::DARK),
        };
        let colors = values.map(hsla);
        GTheme {
            appearance,
            colors,
            frame: GFrameColors::graphite(),
            bars: GFrameColors::on_ground(&colors),
            ground,
            tone,
            own_ground: false,
            accent: None,
            reduce_motion: false,
            reduce_transparency: false,
            increase_contrast: false,
        }
    }

    /// The theme of an app's ground: the appearance is the ground's mode, the colours its mode's, the ink and the
    /// glass from its tone (computed here, once). A ground whose ink no veil can save (`tone` finds none) is fully
    /// veiled: legibility first.
    pub fn with_ground(spec: GGroundSpec) -> Self {
        let appearance = match spec.mode {
            GGroundMode::Light => GAppearance::Light,
            GGroundMode::Dark => GAppearance::Dark,
        };
        let base = GTheme::new(appearance);
        let tone = crate::tone::tone(&spec).unwrap_or(GGroundToneValues {
            veil: 1.0,
            ink: crate::tone::ink(&spec),
            ink2: tokens::glass::INK_SECONDARY_MAX,
            ink3: tokens::glass::INK_DISCRET_MAX,
            liquid: 0.0,
            shade: crate::tone::shade(&spec),
        });
        let mut colors = ground_colors(&spec, &tone, base.colors);
        // The content's text in the ground's ink: what is written on its glass reads on it.
        colors.text_primary = colors.ink;
        colors.text_secondary = colors.ink_2;
        colors.text_discret = colors.ink_3;
        GTheme {
            colors,
            bars: GFrameColors::on_ground(&colors),
            ground: spec,
            tone,
            own_ground: true,
            ..base
        }
    }

    /// The theme with an ambiance's own accent (4.2), its roles computed here, once, on this theme's ground and tone
    /// ([`crate::tone::accent_tone`]): `accent` and `accent_text` (links, a label in the accent), the selection
    /// (`selected_fill`, the accent at its mode's opacity), the main button (`primary` the accent, `on_primary` the
    /// ink on it, `primary_hover` that ink at 15 %), and the ink laid on it ([`GTheme::on_accent`]); the
    /// focus ring, the tab's line and the tinted glass ([`crate::glass::accent_glass`]) follow. `None`: back to
    /// Gabarit's accent, the colours as [`GTheme::new`] and [`GTheme::with_ground`] give them.
    pub fn with_accent(mut self, accent: Option<GRgba>) -> Self {
        let values = match self.appearance {
            GAppearance::Light => tokens::LIGHT,
            GAppearance::Dark => tokens::DARK,
        };
        self.accent =
            accent.map(|accent| crate::tone::accent_tone(&self.ground, &self.tone, accent));
        let colors = &mut self.colors;
        match self.accent {
            Some(tone) => {
                colors.accent = hsla(tone.accent);
                colors.accent_text = hsla(tone.accent_text);
                colors.selected_fill = hsla(GRgba {
                    alpha: tone.selected,
                    ..tone.accent
                });
                // The main button in the accent, its text the ink chosen for it; under the pointer, 15 % of that ink.
                colors.primary = hsla(tone.accent);
                colors.on_primary = hsla(tone.on_accent);
                colors.primary_hover = mix(colors.primary, colors.on_primary, 0.15);
            }
            None => {
                colors.accent = hsla(values.accent);
                colors.accent_text = hsla(values.accent_text);
                colors.selected_fill = hsla(values.selected_fill);
                colors.primary = hsla(values.primary);
                colors.on_primary = hsla(values.on_primary);
                colors.primary_hover = hsla(values.primary_hover);
            }
        }
        self
    }

    /// The ink on the ambiance's accent (a pale accent takes the dark ink); `None` without an accent of its own (each
    /// control keeps its own: white on Gabarit's rust).
    pub fn on_accent(&self) -> Option<Hsla> {
        self.accent.map(|tone| hsla(tone.on_accent))
    }

    /// The ink on a solid ground of a state's colour (a danger button): the mode's `on_primary`, which an ambiance's
    /// accent does not take.
    pub fn on_error_fill(&self) -> Hsla {
        if self.accent.is_none() {
            return self.colors.on_primary;
        }
        hsla(match self.appearance {
            GAppearance::Light => tokens::LIGHT.on_primary,
            GAppearance::Dark => tokens::DARK.on_primary,
        })
    }

    /// The colour of the ground's glass (its veil's, its panels'), opaque.
    pub fn glass_color(&self) -> Hsla {
        hsla(self.ground.glass)
    }

    /// The bars' colours: on the ground, or the dark frame's (`framed`).
    pub fn bar_colors(&self, framed: bool) -> GFrameColors {
        if framed { self.frame } else { self.bars }
    }

    pub fn is_dark(&self) -> bool {
        self.appearance == GAppearance::Dark
    }

    /// A solid ground in a state's colour (a danger button): a step darker for errors in light, so white text
    /// reads (GabaritApple's `GTone.error.fill`).
    pub fn error_fill(&self) -> Hsla {
        match self.appearance {
            GAppearance::Light => hsla(tokens::palette::RED_700),
            GAppearance::Dark => hsla(tokens::palette::RED_400),
        }
    }
}

/// Reads Gabarit's theme: `cx.theme().colors.surface`.
pub trait ActiveTheme {
    fn theme(&self) -> &GTheme;
}

impl ActiveTheme for App {
    fn theme(&self) -> &GTheme {
        self.global::<GTheme>()
    }
}

/// Registers IBM Plex and sets the light theme: call once, before opening a window.
pub fn init(cx: &mut App) {
    let fonts = tokens::FONT_FILES
        .iter()
        .map(|(_, bytes)| Cow::Borrowed(*bytes))
        .collect();
    cx.text_system()
        .add_fonts(fonts)
        .expect("IBM Plex is embedded in the crate");
    cx.set_global(GTheme::new(GAppearance::Light));
}

/// The glass and ink roles a ground lays, as tools/tokens.py writes them for Gabarit's light and dark grounds: the
/// ink at its tone's opacities, the veil (the glass colour at the tone's `veil`), the glass at its kind's opacities,
/// the liquid glass's white at the tone's, the rims in white, the shadows in the ground's shade. Over `base`, the
/// ground's mode's colours.
pub fn ground_colors(spec: &GGroundSpec, tone: &GGroundToneValues, base: GColors) -> GColors {
    let kind = spec.kind.values();
    let at = |color: GRgba, opacity: f32| {
        hsla(GRgba {
            alpha: opacity,
            ..color
        })
    };
    let white = GRgba::hex(0xFFFFFF);
    GColors {
        ink: at(tone.ink, 1.0),
        ink_2: at(tone.ink, tone.ink2),
        ink_3: at(tone.ink, tone.ink3),
        ground_veil: at(spec.glass, tone.veil),
        glass_thin: at(spec.glass, kind.thin),
        glass_regular: at(spec.glass, kind.regular),
        glass_thick: at(spec.glass, kind.thick),
        glass_liquid: at(white, tone.liquid),
        glass_rim: at(white, kind.rim),
        glass_rim_edge: at(white, kind.rim_edge),
        liquid_rim: at(white, kind.liquid_rim),
        liquid_rim_soft: at(white, kind.liquid_rim_soft),
        glass_rim_top: at(white, kind.rim_top),
        glass_rim_bottom: at(white, kind.rim_bottom),
        glass_sheen: at(white, kind.sheen),
        liquid_rim_top: at(white, kind.liquid_rim_top),
        liquid_rim_bottom: at(white, kind.liquid_rim_bottom),
        liquid_sheen: at(white, kind.liquid_sheen),
        glass_shadow: at(tone.shade, kind.shadow),
        glass_shadow_near: at(tone.shade, kind.shadow_near),
        liquid_shadow: at(tone.shade, kind.liquid_shadow),
        glass_hollow: at(tone.shade, kind.hollow),
        ..base
    }
}

/// Replaces the theme, keeping the accessibility settings, and redraws every window.
fn replace(mut theme: GTheme, cx: &mut App) {
    if let Some(current) = cx.try_global::<GTheme>() {
        theme.reduce_motion = current.reduce_motion;
        theme.reduce_transparency = current.reduce_transparency;
        theme.increase_contrast = current.increase_contrast;
    }
    cx.set_global(theme);
    cx.refresh_windows();
}

/// Sets the appearance (redraws every window). An app's own ground stays (it has its own mode): see [`set_ground`];
/// its own accent too ([`set_accent`]).
pub fn set_appearance(appearance: GAppearance, cx: &mut App) {
    let current = cx.try_global::<GTheme>();
    let own = current
        .filter(|theme| theme.own_ground)
        .map(|theme| theme.ground);
    let accent = current
        .and_then(|theme| theme.accent)
        .map(|tone| tone.accent);
    let theme = match own {
        Some(spec) => GTheme::with_ground(spec),
        None => GTheme::new(appearance),
    };
    replace(theme.with_accent(accent), cx);
}

/// Gives the current ground an accent of its own (4.2: `tokens::grounds::accent(name)` for a sample ambiance, or the
/// app's), or takes it back (`None`). Redraws.
pub fn set_accent(accent: Option<GRgba>, cx: &mut App) {
    let theme = cx.theme().clone().with_accent(accent);
    replace(theme, cx);
}

/// Lays the app's own ground under its windows (an ambiance of `tokens::grounds`, or one of its own), its tone
/// computed once; the appearance becomes the ground's mode. `None`: back to Gabarit's light or dark ground, after
/// `appearance`. The ambiance's accent, if any, goes back to Gabarit's: give the new one with [`set_accent`].
pub fn set_ground(ground: Option<GGroundSpec>, appearance: GAppearance, cx: &mut App) {
    match ground {
        Some(spec) => replace(GTheme::with_ground(spec), cx),
        None => replace(GTheme::new(appearance), cx),
    }
}

/// "Reduce transparency" (the app reads the system's setting): the glass turns dense. Redraws.
pub fn set_reduce_transparency(reduce: bool, cx: &mut App) {
    if cx.theme().reduce_transparency != reduce {
        cx.global_mut::<GTheme>().reduce_transparency = reduce;
        cx.refresh_windows();
    }
}

/// "Increase contrast" (the app reads the system's setting): the glass's edge becomes an outline. Redraws.
pub fn set_increase_contrast(increase: bool, cx: &mut App) {
    if cx.theme().increase_contrast != increase {
        cx.global_mut::<GTheme>().increase_contrast = increase;
        cx.refresh_windows();
    }
}

/// Follows the system's appearance in this window: now, and whenever it changes.
pub fn follow_system_appearance(window: &mut Window, cx: &mut App) {
    set_appearance(GAppearance::of(window), cx);
    window
        .observe_window_appearance(|window, cx| set_appearance(GAppearance::of(window), cx))
        .detach();
}

/// Mixes two colours, `amount` of `other` (0: `color`, 1: `other`), in sRGB.
pub fn mix(color: Hsla, other: Hsla, amount: f32) -> Hsla {
    let a = color.to_rgb();
    let b = other.to_rgb();
    let t = amount.clamp(0.0, 1.0);
    Rgba {
        r: a.r + (b.r - a.r) * t,
        g: a.g + (b.g - a.g) * t,
        b: a.b + (b.b - a.b) * t,
        a: a.a + (b.a - a.a) * t,
    }
    .into()
}

/// A colour with its alpha multiplied by `opacity` (SwiftUI's `.opacity`).
pub fn alpha(color: Hsla, opacity: f32) -> Hsla {
    Hsla {
        a: color.a * opacity,
        ..color
    }
}

pub fn white(opacity: f32) -> Hsla {
    Hsla {
        h: 0.0,
        s: 0.0,
        l: 1.0,
        a: opacity,
    }
}

pub fn black(opacity: f32) -> Hsla {
    Hsla {
        h: 0.0,
        s: 0.0,
        l: 0.0,
        a: opacity,
    }
}

/// The text styles, at the computer's sizes (as the Mac): `.g_text(text::BODY)`.
pub trait GTextExt: Styled + Sized {
    fn g_text(self, style: GTextStyle) -> Self {
        self.font_family(SharedString::new_static(style.family.name()))
            .font_weight(weight(style.weight))
            .text_size(px(style.desktop))
            .line_height(px(style.desktop * tokens::LINE_HEIGHT))
    }
}

impl<T: Styled> GTextExt for T {}

pub fn weight(weight: GWeight) -> FontWeight {
    match weight {
        GWeight::Regular => FontWeight::NORMAL,
        GWeight::Medium => FontWeight::MEDIUM,
        GWeight::Semibold => FontWeight::SEMIBOLD,
    }
}
