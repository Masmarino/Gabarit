//! The colours by role for the current appearance, the dark frame's colours, IBM Plex and the text styles.

use std::borrow::Cow;

use gpui::{
    App, FontWeight, Global, Hsla, Rgba, SharedString, Styled, Window, WindowAppearance, px,
};

use crate::tokens::{self, GColorRoles, GRgba, GTextStyle, GWeight};

/// The colours by role, as GPUI's.
pub type GColors = GColorRoles<Hsla>;

/// A token's colour as GPUI's.
pub fn hsla(color: GRgba) -> Hsla {
    Rgba { r: color.red, g: color.green, b: color.blue, a: color.alpha }.into()
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

/// The dark frame's colours (the rail, the bands, a window's header): the same in both appearances, as
/// GabaritApple's `GFrameColor`.
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
    fn new() -> Self {
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

/// Gabarit's theme: the appearance, its colours, the frame's. A GPUI global: `cx.theme()`.
#[derive(Clone, Debug)]
pub struct GTheme {
    pub appearance: GAppearance,
    pub colors: GColors,
    pub frame: GFrameColors,
    /// The system asks for less motion: no press scale, no animated knob.
    pub reduce_motion: bool,
}

impl Global for GTheme {}

impl GTheme {
    pub fn new(appearance: GAppearance) -> Self {
        let values = match appearance {
            GAppearance::Light => tokens::LIGHT,
            GAppearance::Dark => tokens::DARK,
        };
        GTheme { appearance, colors: values.map(hsla), frame: GFrameColors::new(), reduce_motion: false }
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
    let fonts = tokens::FONT_FILES.iter().map(|(_, bytes)| Cow::Borrowed(*bytes)).collect();
    cx.text_system().add_fonts(fonts).expect("IBM Plex is embedded in the crate");
    cx.set_global(GTheme::new(GAppearance::Light));
}

/// Sets the appearance (redraws every window).
pub fn set_appearance(appearance: GAppearance, cx: &mut App) {
    let reduce_motion = cx.try_global::<GTheme>().is_some_and(|theme| theme.reduce_motion);
    let mut theme = GTheme::new(appearance);
    theme.reduce_motion = reduce_motion;
    cx.set_global(theme);
    cx.refresh_windows();
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
    Hsla { a: color.a * opacity, ..color }
}

pub fn white(opacity: f32) -> Hsla {
    Hsla { h: 0.0, s: 0.0, l: 1.0, a: opacity }
}

pub fn black(opacity: f32) -> Hsla {
    Hsla { h: 0.0, s: 0.0, l: 0.0, a: opacity }
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
