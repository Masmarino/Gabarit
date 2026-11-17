//! The glass (4.0): two materials laid on the ground (`ground.rs`), and nothing else on it.
//!
//! - **The content glass** ([`GGlass`]: `thin`, `regular`, `thick`) for the panels: the ground's glass colour at the
//!   density's opacity over the ground blurred wide, its edge's light (below), a wide soft shadow (`shadow.glass`, two layers), radius `radius::GLASS` (22).
//! - **The liquid glass** ([`GLiquidGlass`]) for what commands and floats (menus, tooltips, the open tab, a search, a
//!   header's buttons): clearer (white at `glassLiquid`) over the ground blurred short and saturated, its edge's
//!   light, brighter, a short shadow. **Never for content**: a sheet that holds a form is thick content glass.
//!
//! 4.1: the controls too ([`control_glass`]): the buttons in liquid glass (the main one tinted, [`accent_glass`],
//! [`ink_glass`]), the chips and labels in thin liquid glass ([`GMaterial::LiquidThin`]), the segmented control's lens,
//! a held knob; the fields in a hollow of thin glass ([`GMaterial::Hollow`]). Held down, a control's glass lights and
//! grows a little on the bouncy spring.
//!
//! 4.1.1: on a light glass, the clear glass laid in a surface already light (a sheet, a card, a thick glass) lost its
//! edges, white on white. There the relief has its light above and its shade below, the hollow the other way round; on
//! a light ground, the dark half does the work ([`nested`]). What floats (a chip at rest, a glass button, a picker's
//! face) keeps its light at the top and takes the ink at its bottom edge, softer up its sides, and a contact shadow; a
//! field's hollow takes the ink's shade inside its top edge, a trace all around and the white at its bottom; a form's
//! card laid in the glass, a sharper near shadow and the ink at its bottom edge only. No uniform line. What lies in a
//! content glass is drawn [`in_glass`] (a sheet, a `GGlass`, a form's card do it for their content). The dark glass
//! and the ambiances keep their look.
//!
//! Light is the edge of things: no hairline around a glass, no line between rows. It runs up and down, never across
//! (iOS 27's liquid glass, not iOS 26's slanted gleam): a point of light along the edge, bright at the top, out by the
//! middle, back at the bottom, the sides only the passage between the two (two stroked halves, each in a vertical
//! gradient); inside, two soft lights, about 8 points under the top and 6 over the bottom. Accessibility: "Reduce
//! transparency" ([`crate::theme::set_reduce_transparency`]) makes every glass dense (`glass::REDUCED` of the ground's
//! glass colour); "Increase contrast" ([`crate::theme::set_increase_contrast`]) turns the rim into an outline.
//!
//! GPUI does not blur what lies behind: the glass paints the ground's picture, blurred once in advance, at the place
//! it sits (see `ground.rs`). Glass laid on glass (a selected row in a panel, sections in a sheet) is `nested`: its
//! tint and its light, no backdrop, no shadow. A window that floats on the desktop (a menu of its own, a pop-up) can
//! also ask the system for a real blur: `WindowOptions { window_background: WindowBackgroundAppearance::Blurred, .. }`,
//! with the glass then laid `nested` over a clear ground.

use std::rc::Rc;

use gpui::{
    AnyElement, App, Bounds, BoxShadow, ClickEvent, Corners, CursorStyle, Div, ElementId, Hsla,
    IntoElement, ParentElement, PathBuilder, Pixels, RenderOnce, Role, SharedString,
    StyleRefinement, Styled, Window, canvas, div, fill, linear_color_stop, linear_gradient,
    outline, point, prelude::*, px, relative,
};

use crate::assets::icon;
use crate::button::ClickHandler;
use crate::controls::ChangeHandler;
use crate::ground::{GBackdrop, GGroundPaint, paint_backdrop};
use crate::relief::GPointer;
use crate::theme::{ActiveTheme, GTextExt, alpha};
use crate::tokens::{glass, radius, text};

/// The content glass's densities.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum GGlassDensity {
    /// The most of the ground: a band, a column laid on it.
    Thin,
    /// A panel, a card: the default.
    Regular,
    /// What must read first: a sheet, the chosen row, a field that floats.
    Thick,
}

/// What a glass is made of.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum GMaterial {
    /// A panel's glass, over the ground (`nested`: over another glass, no backdrop, no shadow).
    Content {
        density: GGlassDensity,
        nested: bool,
    },
    /// The liquid glass, over the ground (`nested`: over another glass).
    Liquid { nested: bool },
    /// The chosen row or tab, on a glass: thick glass on a light ground; on a dark one, thick glass would dig a
    /// hollow, so a light veil (white at 0.12, 0.18 on a tinted ambiance), as the study's mock-ups. Its light, no
    /// backdrop, no shadow.
    Selected,
    /// The thin liquid glass (4.1): a chip, a label, a segmented control's track. Half the liquid's white over the
    /// ground blurred wide and calm (the content's backdrop), its light a little softer, no shadow: it lies flat.
    LiquidThin { nested: bool },
    /// The tinted liquid glass (4.1): the main button, the chosen chip. `tint` (opaque: the accent, the ink) laid at
    /// `glass::CONTROL_PROMINENT` over the liquid glass, the liquid's light and shadow. Its text: [`prominent_ink`].
    Tinted { tint: Hsla, nested: bool },
    /// A field's hollow (4.1): thin glass dug in, the shade (`glass_hollow`) inside its top edge, the light on its
    /// bottom one. No backdrop (it lies on a card or a band), no shadow.
    Hollow,
}

impl GMaterial {
    pub const fn content(density: GGlassDensity) -> Self {
        GMaterial::Content {
            density,
            nested: false,
        }
    }

    pub const fn liquid() -> Self {
        GMaterial::Liquid { nested: false }
    }

    /// The thin liquid glass (a chip, a track).
    pub const fn liquid_thin() -> Self {
        GMaterial::LiquidThin { nested: false }
    }

    /// The liquid glass tinted with `tint` (opaque), at `glass::CONTROL_PROMINENT`.
    pub const fn tinted(tint: Hsla) -> Self {
        GMaterial::Tinted {
            tint,
            nested: false,
        }
    }

    /// A field's hollow of thin glass.
    pub const fn hollow() -> Self {
        GMaterial::Hollow
    }

    /// Laid on another glass.
    pub const fn nested(self) -> Self {
        match self {
            GMaterial::Content { density, .. } => GMaterial::Content {
                density,
                nested: true,
            },
            GMaterial::Liquid { .. } => GMaterial::Liquid { nested: true },
            GMaterial::LiquidThin { .. } => GMaterial::LiquidThin { nested: true },
            GMaterial::Tinted { tint, .. } => GMaterial::Tinted { tint, nested: true },
            other => other,
        }
    }

    fn is_nested(self) -> bool {
        matches!(
            self,
            GMaterial::Content { nested: true, .. }
                | GMaterial::Liquid { nested: true }
                | GMaterial::LiquidThin { nested: true }
                | GMaterial::Tinted { nested: true, .. }
                | GMaterial::Selected
                | GMaterial::Hollow
        )
    }

    /// Its tint: the density's glass, the liquid's white; dense when transparency is reduced.
    pub fn tint(self, cx: &App) -> Hsla {
        let theme = cx.theme();
        if let GMaterial::Tinted { tint, .. } = self {
            // Dense, it is the tint itself: its text was chosen for it at its usual opacity, and holds on more of it.
            return if theme.reduce_transparency {
                Hsla { a: 1., ..tint }
            } else {
                alpha(tint, glass::CONTROL_PROMINENT)
            };
        }
        if theme.reduce_transparency {
            return alpha(theme.glass_color(), glass::REDUCED);
        }
        let colors = &theme.colors;
        match self {
            GMaterial::Content { density, .. } => match density {
                GGlassDensity::Thin => colors.glass_thin,
                GGlassDensity::Regular => colors.glass_regular,
                GGlassDensity::Thick => colors.glass_thick,
            },
            GMaterial::Liquid { .. } => colors.glass_liquid,
            GMaterial::LiquidThin { .. } => alpha(colors.glass_liquid, 0.5),
            GMaterial::Tinted { .. } => unreachable!("answered above"),
            GMaterial::Hollow => colors.glass_thin,
            GMaterial::Selected => match (theme.ground.mode, theme.ground.kind) {
                (crate::tokens::GGroundMode::Light, _) => colors.glass_thick,
                (_, crate::tokens::GGlassKind::Tinted) => crate::theme::white(0.18),
                _ => crate::theme::white(0.12),
            },
        }
    }

    /// Its shadows, under it (`shadow.glass`, two layers; the liquid's, short): CSS's blurs halved, as GPUI's.
    pub fn shadows(self, cx: &App) -> Vec<BoxShadow> {
        let colors = &cx.theme().colors;
        // Laid in a light glass (4.1.1), what floats takes a contact shadow under it as well (its backdrop hides it
        // inside). A card's, under a glass that lets it through, is painted outside its edge (`paint_nested_edge`).
        if self.nesting(cx) == Some(Nesting::Float) {
            let mut shadows = self.resting_shadows(cx);
            shadows.push(
                BoxShadow::new(px(0.), px(1.), colors.glass_shadow_near).blur_radius(px(1.5)),
            );
            return shadows;
        }
        self.resting_shadows(cx)
    }

    fn resting_shadows(self, cx: &App) -> Vec<BoxShadow> {
        if self.is_nested() {
            return Vec::new();
        }
        let colors = &cx.theme().colors;
        match self {
            GMaterial::Selected | GMaterial::LiquidThin { .. } | GMaterial::Hollow => Vec::new(),
            GMaterial::Content { .. } => vec![
                BoxShadow::new(px(0.), px(glass::SHADOW_Y), colors.glass_shadow)
                    .blur_radius(px(glass::SHADOW_BLUR / 2.))
                    .spread_radius(px(glass::SHADOW_SPREAD)),
                BoxShadow::new(px(0.), px(glass::SHADOW_NEAR_Y), colors.glass_shadow_near)
                    .blur_radius(px(glass::SHADOW_NEAR_BLUR / 2.))
                    .spread_radius(px(glass::SHADOW_NEAR_SPREAD)),
            ],
            GMaterial::Liquid { .. } | GMaterial::Tinted { .. } => vec![
                BoxShadow::new(px(0.), px(glass::SHADOW_LIQUID_Y), colors.liquid_shadow)
                    .blur_radius(px(glass::SHADOW_LIQUID_BLUR / 2.))
                    .spread_radius(px(glass::SHADOW_LIQUID_SPREAD)),
            ],
        }
    }

    /// Its edge's light (`top`, `bottom`) and its two soft lights inside (`sheen`): the content's, soft; the
    /// liquid's, brighter.
    fn edge_light(self, cx: &App) -> (Hsla, Hsla, Hsla) {
        let colors = &cx.theme().colors;
        match self {
            GMaterial::Content { .. } | GMaterial::Selected => (
                colors.glass_rim_top,
                colors.glass_rim_bottom,
                colors.glass_sheen,
            ),
            // Dug in: the shade at the top, the light at the bottom (painted by `paint_hollow`).
            GMaterial::Hollow => (
                colors.glass_hollow,
                colors.glass_rim_bottom,
                alpha(colors.glass_hollow, 0.6),
            ),
            GMaterial::LiquidThin { .. } => (
                alpha(colors.liquid_rim_top, 0.8),
                alpha(colors.liquid_rim_bottom, 0.8),
                alpha(colors.liquid_sheen, 0.6),
            ),
            GMaterial::Liquid { .. } | GMaterial::Tinted { .. } => (
                colors.liquid_rim_top,
                colors.liquid_rim_bottom,
                colors.liquid_sheen,
            ),
        }
    }

    fn backdrop(self) -> Option<GBackdrop> {
        match self {
            GMaterial::Content { nested: false, .. } => Some(GBackdrop::Content),
            GMaterial::Liquid { nested: false } | GMaterial::Tinted { nested: false, .. } => {
                Some(GBackdrop::Liquid)
            }
            // Thin: the ground blurred wide and calm, as the content's, not the liquid's saturated one.
            GMaterial::LiquidThin { nested: false } => Some(GBackdrop::Content),
            _ => None,
        }
    }
}

/// Paints a glass in `bounds` (at paint time, from a `canvas`): the ground blurred under it, its tint, its light (or
/// its outline, contrast increased). Its shadow is its element's (`GMaterial::shadows`), drawn under.
pub fn paint_glass(
    material: GMaterial,
    radius: Pixels,
    bounds: gpui::Bounds<Pixels>,
    window: &mut Window,
    cx: &mut App,
) {
    paint_lit_glass(material, radius, 0., bounds, window, cx)
}

/// Paints a glass lit by a press (4.1): `light` from 0 to 1, white at `glass::CONTROL_PRESS_LIGHT` laid over it at 1.
/// On a tinted glass, the light lies under the tint: its text keeps its contrast.
pub fn paint_lit_glass(
    material: GMaterial,
    radius: Pixels,
    light: f32,
    bounds: gpui::Bounds<Pixels>,
    window: &mut Window,
    cx: &mut App,
) {
    let corners = Corners::all(radius).clamp_radii_for_quad_size(bounds.size);
    if let Some(backdrop) = material.backdrop() {
        paint_backdrop(&GGroundPaint::of(cx), backdrop, bounds, corners, window);
    }
    let light = light.clamp(0., 1.);
    let tinted = matches!(material, GMaterial::Tinted { .. });
    // Under a tint, the whole light (its text keeps its contrast); on the clear glass, what the ink allows.
    let white = if tinted {
        glass::CONTROL_PRESS_LIGHT
    } else if light > 0.001 {
        press_light(cx)
    } else {
        0.
    };
    let press = (light > 0.001 && white > 0.)
        .then(|| fill(bounds, crate::theme::white(white * light)).corner_radii(corners));
    if tinted && let Some(press) = press.clone() {
        window.paint_quad(press);
    }
    window.paint_quad(fill(bounds, material.tint(cx)).corner_radii(corners));
    if !tinted && let Some(press) = press {
        window.paint_quad(press);
    }
    let theme = cx.theme();
    if theme.increase_contrast {
        window.paint_quad(
            outline(bounds, theme.colors.border, gpui::BorderStyle::Solid).corner_radii(corners),
        );
    } else if material == GMaterial::Hollow {
        let (shade, light, inner) = material.edge_light(cx);
        paint_hollow(bounds, corners, shade, light, inner, window);
    } else {
        let (top, bottom, sheen) = material.edge_light(cx);
        paint_edge_light(bounds, corners, top, bottom, sheen, window);
    }
    if !theme.increase_contrast
        && let Some(nesting) = material.nesting(cx)
    {
        paint_nested_edge(nesting, bounds, corners, window, cx);
    }
}

/// The edge of a glass laid in a light glass (4.1.1, [`nested`]), over its own light.
fn paint_nested_edge(
    nesting: Nesting,
    bounds: Bounds<Pixels>,
    corners: Corners<Pixels>,
    window: &mut Window,
    cx: &App,
) {
    let height = f32::from(bounds.size.height).max(1.);
    let band = |color: Hsla, depth: f32, top: bool| {
        let clear = Hsla { a: 0., ..color };
        let edge = (depth / height).min(0.5);
        let gradient = if top {
            linear_gradient(
                180.,
                linear_color_stop(color, 0.),
                linear_color_stop(clear, edge),
            )
        } else {
            linear_gradient(
                180.,
                linear_color_stop(clear, 1. - edge),
                linear_color_stop(color, 1.),
            )
        };
        fill(bounds, gradient).corner_radii(corners)
    };
    // The lower half of the outline, the colour at the bottom, out by the middle of the sides.
    let low = |color: Hsla, window: &mut Window| {
        if let Some(path) = edge_half(bounds, corners, false) {
            window.paint_path(
                path,
                linear_gradient(
                    180.,
                    linear_color_stop(Hsla { a: 0., ..color }, 0.),
                    linear_color_stop(color, 1.),
                ),
            );
        }
    };
    match nesting {
        Nesting::Float => {
            window.paint_quad(band(ink_at(nested::LOW_SOFT, cx), 4., false));
            low(ink_at(nested::LOW, cx), window);
        }
        Nesting::Hollow => {
            window.paint_quad(band(ink_at(nested::HOLLOW_SHADE, cx), 3., true));
            window.paint_quad(
                outline(
                    bounds,
                    ink_at(nested::HOLLOW_TRACE, cx),
                    gpui::BorderStyle::Solid,
                )
                .corner_radii(corners),
            );
            low(gpui::white(), window);
        }
        Nesting::Group => {
            // A sharper near shadow, outside its edge only (a box's shadow would grey its clear glass): a contact
            // line under its lower half, a soft shade under its middle.
            let colors = &cx.theme().colors;
            for (spread, strength) in [(1., 1.), (2., 0.5)] {
                let around = Bounds {
                    origin: point(bounds.origin.x - px(spread), bounds.origin.y),
                    size: gpui::size(
                        bounds.size.width + px(2. * spread),
                        bounds.size.height + px(spread),
                    ),
                };
                let wider = Corners {
                    top_left: corners.top_left + px(spread),
                    top_right: corners.top_right + px(spread),
                    bottom_left: corners.bottom_left + px(spread),
                    bottom_right: corners.bottom_right + px(spread),
                };
                let shade = alpha(
                    colors.glass_shadow_near,
                    colors.glass_shadow_near.a * strength,
                );
                if let Some(path) = edge_half(around, wider, false) {
                    window.paint_path(
                        path,
                        linear_gradient(
                            180.,
                            linear_color_stop(Hsla { a: 0., ..shade }, 0.),
                            linear_color_stop(shade, 1.),
                        ),
                    );
                }
            }
            let inset = corners.bottom_left.max(corners.bottom_right).min(px(12.));
            let under = Bounds {
                origin: point(
                    bounds.origin.x + inset,
                    bounds.origin.y + bounds.size.height,
                ),
                size: gpui::size(bounds.size.width - inset * 2., px(5.)),
            };
            let soft = alpha(colors.glass_shadow, colors.glass_shadow.a * 0.5);
            window.paint_quad(
                fill(
                    under,
                    linear_gradient(
                        180.,
                        linear_color_stop(soft, 0.),
                        linear_color_stop(Hsla { a: 0., ..soft }, 1.),
                    ),
                )
                .corner_radii(Corners::all(px(2.5))),
            );
            low(ink_at(nested::GROUP_LOW, cx), window);
        }
    }
}

/// A hollow's edges, up and down as the glass's light: a soft shade inside the top edge (about 5 points) and the shade
/// along it, out by the middle; the light along the bottom edge.
fn paint_hollow(
    bounds: Bounds<Pixels>,
    corners: Corners<Pixels>,
    shade: Hsla,
    light: Hsla,
    inner: Hsla,
    window: &mut Window,
) {
    let height = f32::from(bounds.size.height).max(1.);
    window.paint_quad(
        fill(
            bounds,
            linear_gradient(
                180.,
                linear_color_stop(inner, 0.),
                linear_color_stop(Hsla { a: 0., ..inner }, (5. / height).min(0.5)),
            ),
        )
        .corner_radii(corners),
    );
    for upper in [true, false] {
        let lit = if upper { shade } else { light };
        let (from, to) = if upper {
            (lit, Hsla { a: 0., ..lit })
        } else {
            (Hsla { a: 0., ..lit }, lit)
        };
        if let Some(path) = edge_half(bounds, corners, upper) {
            window.paint_path(
                path,
                linear_gradient(180., linear_color_stop(from, 0.), linear_color_stop(to, 1.)),
            );
        }
    }
}

/// Light is the edge of things, up and down (see the module): the two soft lights inside, then the point of light
/// along the edge, half a point in, as two halves each stroked in a vertical gradient (out by the middle).
pub fn paint_edge_light(
    bounds: Bounds<Pixels>,
    corners: Corners<Pixels>,
    top: Hsla,
    bottom: Hsla,
    sheen: Hsla,
    window: &mut Window,
) {
    let height = f32::from(bounds.size.height).max(1.);
    let clear = Hsla { a: 0., ..sheen };
    window.paint_quad(
        fill(
            bounds,
            linear_gradient(
                180.,
                linear_color_stop(sheen, 0.),
                linear_color_stop(clear, (8. / height).min(0.5)),
            ),
        )
        .corner_radii(corners),
    );
    window.paint_quad(
        fill(
            bounds,
            linear_gradient(
                180.,
                linear_color_stop(clear, (1. - 6. / height).max(0.5)),
                linear_color_stop(sheen, 1.),
            ),
        )
        .corner_radii(corners),
    );
    for upper in [true, false] {
        let lit = if upper { top } else { bottom };
        let (from, to) = if upper {
            (lit, Hsla { a: 0., ..lit })
        } else {
            (Hsla { a: 0., ..lit }, lit)
        };
        if let Some(path) = edge_half(bounds, corners, upper) {
            window.paint_path(
                path,
                linear_gradient(180., linear_color_stop(from, 0.), linear_color_stop(to, 1.)),
            );
        }
    }
}

/// Half the outline, half a point in, from one side's middle round the top (or the bottom) to the other's: a stroke
/// of one point.
fn edge_half(
    bounds: Bounds<Pixels>,
    corners: Corners<Pixels>,
    upper: bool,
) -> Option<gpui::Path<Pixels>> {
    let inset = 0.5;
    let (x0, y0) = (
        f32::from(bounds.origin.x) + inset,
        f32::from(bounds.origin.y) + inset,
    );
    let (x1, y1) = (
        f32::from(bounds.origin.x + bounds.size.width) - inset,
        f32::from(bounds.origin.y + bounds.size.height) - inset,
    );
    let middle = (y0 + y1) / 2.;
    let radius = |r: Pixels| {
        (f32::from(r) - inset)
            .max(0.)
            .min((y1 - y0) / 2.)
            .min((x1 - x0) / 2.)
    };
    let mut builder = PathBuilder::stroke(px(1.));
    let at = |x: f32, y: f32| point(px(x), px(y));
    if upper {
        let (left, right) = (radius(corners.top_left), radius(corners.top_right));
        builder.move_to(at(x0, middle));
        builder.line_to(at(x0, y0 + left));
        builder.arc_to(at(left, left), px(0.), false, true, at(x0 + left, y0));
        builder.line_to(at(x1 - right, y0));
        builder.arc_to(at(right, right), px(0.), false, true, at(x1, y0 + right));
        builder.line_to(at(x1, middle));
    } else {
        let (left, right) = (radius(corners.bottom_left), radius(corners.bottom_right));
        builder.move_to(at(x0, middle));
        builder.line_to(at(x0, y1 - left));
        builder.arc_to(at(left, left), px(0.), false, false, at(x0 + left, y1));
        builder.line_to(at(x1 - right, y1));
        builder.arc_to(at(right, right), px(0.), false, false, at(x1, y1 - right));
        builder.line_to(at(x1, middle));
    }
    builder.build().ok()
}

/// A control's liquid glass (4.1), over the whole of its parent (which must be `relative`; put it first among its
/// children): its shadow under it; held down (`pressed`), it lights (white at `glass::CONTROL_PRESS_LIGHT`) and grows
/// to `glass::CONTROL_PRESS_SCALE` on the bouncy spring, overshooting a little and settling; released, back the same
/// way. GPUI has no scale transform for a box: the glass itself grows around its content (its insets, by fractions of
/// the control's size), the label stays. Less motion: it lights, it does not grow. `id`: unique among its siblings.
pub fn control_glass(
    id: impl Into<ElementId>,
    material: GMaterial,
    radius: Pixels,
    pressed: bool,
    cx: &App,
) -> AnyElement {
    let id: ElementId = id.into();
    let reduce = cx.theme().reduce_motion;
    let grow = (glass::CONTROL_PRESS_SCALE - 1.) / 2.;
    crate::motion::spring_to(
        div()
            .absolute()
            .rounded(radius)
            .shadow(material.shadows(cx)),
        id,
        crate::motion::BOUNCY,
        pressed,
        cx,
        move |layer, phase: gpui::AnimationPhase| {
            let t = phase.0;
            // Past its rest on the way back, it shrinks a hair at most.
            let k = if reduce { 0. } else { grow * t.max(-0.25) };
            let light = t.clamp(0., 1.);
            layer
                .top(relative(-k))
                .bottom(relative(-k))
                .left(relative(-k))
                .right(relative(-k))
                .child(
                    canvas(
                        |_, _, _| {},
                        move |bounds, _, window, cx| {
                            paint_lit_glass(material, radius, light, bounds, window, cx)
                        },
                    )
                    .size_full(),
                )
        },
    )
    .into_any_element()
}

/// The white a press lays on a control's clear glass on the current ground (4.1): `glass::CONTROL_PRESS_LIGHT`, or less
/// where the ground's ink is light and more white would take it under 4.5:1 at the ground's worst points (the liquid
/// glass's white already goes as far as the ink allows on most ambiances: there, the glass grows without lighting).
pub fn press_light(cx: &App) -> f32 {
    use crate::tone::{contrast, laid, worst_points};
    let theme = cx.theme();
    let rgb = |c: Hsla| {
        let c = c.to_rgb();
        [c.r as f64, c.g as f64, c.b as f64]
    };
    let (ink, glass_rgb) = (rgb(theme.colors.ink), rgb(theme.glass_color()));
    let unders: Vec<[f64; 3]> = worst_points(&theme.ground)
        .into_iter()
        .map(|point| {
            laid(
                [1.; 3],
                theme.tone.liquid as f64,
                laid(glass_rgb, theme.tone.veil as f64, point),
            )
        })
        .collect();
    let holds = |white: f64| {
        unders.iter().all(|under| {
            let lit = laid([1.; 3], white, *under);
            contrast(ink, lit) >= glass::TEXT_MINIMUM as f64
        })
    };
    let steps = (glass::CONTROL_PRESS_LIGHT * 100.).round() as i32;
    (0..=steps)
        .rev()
        .map(|step| step as f32 / 100.)
        .find(|white| holds(*white as f64))
        .unwrap_or(0.)
}

/// A coloured text (a destructive button's red, a label's state) made legible on the liquid glass of the current ground
/// (4.1): `color`, mixed toward the ink by twentieths until it holds 4.5:1 at the ground's worst points, over the liquid
/// glass (`liquid`: 1 for the clear one, 0.5 for the thin one) and `tint` laid on it (a label's). On Gabarit's own
/// grounds the colour stays; on a tinted ambiance (a red on violet) it lightens toward the ink.
pub fn legible_on_glass(color: Hsla, liquid: f32, tint: Option<Hsla>, cx: &App) -> Hsla {
    use crate::tone::{contrast, laid, worst_points};
    let theme = cx.theme();
    let rgb = |c: Hsla| {
        let c = c.to_rgb();
        [c.r as f64, c.g as f64, c.b as f64]
    };
    let glass_rgb = rgb(theme.glass_color());
    let fills: Vec<[f64; 3]> = worst_points(&theme.ground)
        .into_iter()
        .map(|point| {
            let under = laid(
                [1.; 3],
                (theme.tone.liquid * liquid) as f64,
                laid(glass_rgb, theme.tone.veil as f64, point),
            );
            tint.map_or(under, |tint| laid(rgb(tint), tint.to_rgb().a as f64, under))
        })
        .collect();
    let ink = Hsla {
        a: 1.,
        ..theme.colors.ink
    };
    (0..=20)
        .map(|step| crate::theme::mix(color, ink, step as f32 / 20.))
        .find(|candidate| {
            let text = rgb(*candidate);
            fills
                .iter()
                .all(|fill| contrast(text, *fill) >= glass::TEXT_MINIMUM as f64)
        })
        .unwrap_or(ink)
}

/// The ink's second step on the thin liquid glass (4.1: a ghost button, a chip at rest): `ink_2`, or as much more of
/// the ink as the thin glass's white asks for 4.5:1 at the ground's worst points (on the tinted ambiances).
pub fn thin_glass_ink(cx: &App) -> Hsla {
    use crate::tone::{contrast, laid, worst_points};
    let theme = cx.theme();
    let rgb = |c: Hsla| {
        let c = c.to_rgb();
        [c.r as f64, c.g as f64, c.b as f64]
    };
    let ink = Hsla {
        a: 1.,
        ..theme.colors.ink
    };
    let (ink_rgb, glass_rgb) = (rgb(ink), rgb(theme.glass_color()));
    let unders: Vec<[f64; 3]> = worst_points(&theme.ground)
        .into_iter()
        .map(|point| {
            laid(
                [1.; 3],
                theme.tone.liquid as f64 * 0.5,
                laid(glass_rgb, theme.tone.veil as f64, point),
            )
        })
        .collect();
    let from = (theme.colors.ink_2.a * 100.).round() as i32;
    let opacity = (from..=100)
        .map(|step| step as f32 / 100.)
        .find(|opacity| {
            unders.iter().all(|under| {
                contrast(laid(ink_rgb, *opacity as f64, *under), *under)
                    >= glass::TEXT_MINIMUM as f64
            })
        })
        .unwrap_or(1.);
    alpha(ink, opacity)
}

/// The light a control's clear glass takes under the pointer (4.1): white at 0.6 of the press's ([`press_light`]), a
/// glass that brightens rather than a veil that greys it.
pub fn hover_light(cx: &App) -> Hsla {
    crate::theme::white(press_light(cx) * 0.6)
}

/// The text on a liquid glass tinted with `tint`, laid on the current ground: white, or the deepest graphite, the one
/// that holds the more contrast at the ground's worst points (its veil, the liquid's white, then the tint at
/// `glass::CONTROL_PROMINENT`), and that contrast.
pub fn prominent_ink(tint: Hsla, cx: &App) -> (Hsla, f64) {
    use crate::tone::{contrast, laid, worst_points};
    let theme = cx.theme();
    let rgb = |c: Hsla| {
        let c = c.to_rgb();
        [c.r as f64, c.g as f64, c.b as f64]
    };
    let (tint_rgb, glass_rgb) = (rgb(tint), rgb(theme.glass_color()));
    let fills: Vec<[f64; 3]> = worst_points(&theme.ground)
        .into_iter()
        .map(|point| {
            let under = laid(
                [1.; 3],
                theme.tone.liquid as f64,
                laid(glass_rgb, theme.tone.veil as f64, point),
            );
            laid(tint_rgb, glass::CONTROL_PROMINENT as f64, under)
        })
        .collect();
    let deep = crate::theme::hsla(crate::tokens::palette::GRAPHITE_1000);
    [gpui::white(), deep]
        .into_iter()
        .map(|text| {
            let worst = fills
                .iter()
                .map(|fill| contrast(rgb(text), *fill))
                .fold(f64::INFINITY, f64::min);
            (text, worst)
        })
        .max_by(|a, b| a.1.total_cmp(&b.1))
        .expect("two candidates")
}

/// The tinted glass of a main button or a chosen chip (4.1) and its text: the first of `tints` (opaque) whose text
/// holds 4.5:1 on the current ground (the accent, then its darker step for text), else the last one.
pub fn tinted_glass(tints: &[Hsla], cx: &App) -> (GMaterial, Hsla) {
    let mut chosen = None;
    for tint in tints {
        let (text, worst) = prominent_ink(*tint, cx);
        chosen = Some((GMaterial::tinted(*tint), text));
        if worst >= glass::TEXT_MINIMUM as f64 {
            break;
        }
    }
    chosen.expect("a tint at least")
}

/// The accent's tinted glass: the accent, or its darker step for text (`accent_text`) where the accent would not
/// hold 4.5:1 with either text (Gabarit's light ground).
pub fn accent_glass(cx: &App) -> (GMaterial, Hsla) {
    let colors = cx.theme().colors;
    tinted_glass(&[colors.accent, colors.accent_text], cx)
}

/// The ink's tinted glass (a main button in Gabarit's ink).
pub fn ink_glass(cx: &App) -> (GMaterial, Hsla) {
    let colors = cx.theme().colors;
    tinted_glass(&[colors.primary], cx)
}

/// How many content glasses the element being laid out or painted lies in (4.1.1): [`in_glass`] counts them.
#[derive(Default)]
struct GGlassDepth(u32);

impl gpui::Global for GGlassDepth {}

fn glass_depth(cx: &App) -> u32 {
    cx.try_global::<GGlassDepth>().map_or(0, |depth| depth.0)
}

/// Whether what is being drawn lies in a content glass (a sheet, a `GGlass`, a form's card): see [`in_glass`].
pub fn is_in_glass(cx: &App) -> bool {
    glass_depth(cx) > 0
}

/// Whether what is being drawn lies in a content glass on a light glass (4.1.1): there, the clear glass takes the
/// edge of [`nested`]. Never on a dark glass or an ambiance.
pub fn holds_controls(cx: &App) -> bool {
    is_in_glass(cx) && light_glass(cx)
}

fn light_glass(cx: &App) -> bool {
    cx.theme().ground.kind == crate::tokens::GGlassKind::Light
}

/// The ground's ink at `opacity`.
fn ink_at(opacity: f32, cx: &App) -> Hsla {
    alpha(
        Hsla {
            a: 1.,
            ..cx.theme().colors.ink
        },
        opacity,
    )
}

/// The edge of the clear glass laid in a light glass (4.1.1, a trial of the web chosen by Florian): the ink's opacities,
/// on a light glass only.
pub mod nested {
    /// What floats: the ink at its bottom edge, along the lower half of its outline (out by the middle of its sides).
    pub const LOW: f32 = 0.2;
    /// What floats: the ink's soft shade inside its bottom, up the curve of its sides.
    pub const LOW_SOFT: f32 = 0.08;
    /// A field's hollow: the ink's shade inside its top edge.
    pub const HOLLOW_SHADE: f32 = 0.14;
    /// A field's hollow: a trace of the ink all around.
    pub const HOLLOW_TRACE: f32 = 0.06;
    /// A form's card in the glass: the ink at its bottom edge only.
    pub const GROUP_LOW: f32 = 0.12;
}

/// How a glass is laid in a light glass (4.1.1).
#[derive(Clone, Copy, PartialEq)]
enum Nesting {
    /// It floats (a chip at rest, a glass button, a picker's face).
    Float,
    /// It is dug in (a field).
    Hollow,
    /// A glass in the glass (a form's card).
    Group,
}

impl GMaterial {
    /// How it is laid in a light glass, where it is (none on a dark glass or an ambiance, nor outside a glass).
    fn nesting(self, cx: &App) -> Option<Nesting> {
        if !light_glass(cx) {
            return None;
        }
        let held = is_in_glass(cx);
        match self {
            GMaterial::Liquid { nested: false } | GMaterial::LiquidThin { nested: false }
                if held =>
            {
                Some(Nesting::Float)
            }
            GMaterial::Hollow if held => Some(Nesting::Hollow),
            GMaterial::Content { nested: true, .. } => Some(Nesting::Group),
            GMaterial::Content { .. } if held => Some(Nesting::Group),
            _ => None,
        }
    }
}

/// Lays `content` in a content glass (4.1.1): while it is laid out and painted, [`is_in_glass`] says so, and the
/// clear glass in it (a field's hollow, a chip at rest) takes its edge on a light glass ([`holds_controls`]). A sheet, a
/// `GGlass` and a form's card do it for their content; an app does it for content glass of its own (`glass_on`).
/// It adds no box: `content` is laid as it would be.
pub fn in_glass(content: impl IntoElement) -> GInGlass {
    GInGlass {
        content: Some(content.into_any_element()),
    }
}

/// See [`in_glass`].
pub struct GInGlass {
    content: Option<AnyElement>,
}

impl GInGlass {
    fn deeper<R>(cx: &mut App, f: impl FnOnce(&mut App) -> R) -> R {
        let depth = glass_depth(cx);
        cx.set_global(GGlassDepth(depth + 1));
        let result = f(cx);
        cx.set_global(GGlassDepth(depth));
        result
    }
}

impl IntoElement for GInGlass {
    type Element = Self;

    fn into_element(self) -> Self::Element {
        self
    }
}

impl gpui::Element for GInGlass {
    type RequestLayoutState = AnyElement;
    type PrepaintState = ();

    fn id(&self) -> Option<ElementId> {
        None
    }

    fn source_location(&self) -> Option<&'static core::panic::Location<'static>> {
        None
    }

    fn request_layout(
        &mut self,
        _id: Option<&gpui::GlobalElementId>,
        _inspector_id: Option<&gpui::InspectorElementId>,
        window: &mut Window,
        cx: &mut App,
    ) -> (gpui::LayoutId, AnyElement) {
        let mut content = self.content.take().expect("laid out once");
        let layout = Self::deeper(cx, |cx| content.request_layout(window, cx));
        (layout, content)
    }

    fn prepaint(
        &mut self,
        _id: Option<&gpui::GlobalElementId>,
        _inspector_id: Option<&gpui::InspectorElementId>,
        _bounds: Bounds<Pixels>,
        content: &mut AnyElement,
        window: &mut Window,
        cx: &mut App,
    ) {
        Self::deeper(cx, |cx| content.prepaint(window, cx));
    }

    fn paint(
        &mut self,
        _id: Option<&gpui::GlobalElementId>,
        _inspector_id: Option<&gpui::InspectorElementId>,
        _bounds: Bounds<Pixels>,
        content: &mut AnyElement,
        _prepaint: &mut (),
        window: &mut Window,
        cx: &mut App,
    ) {
        Self::deeper(cx, |cx| content.paint(window, cx));
    }
}

/// The glass's layer, over the whole of its parent (which must be `relative`): put it first among its children.
pub fn glass_layer(material: GMaterial, radius: Pixels) -> impl IntoElement {
    canvas(
        |_, _, _| {},
        move |bounds, _, window, cx| paint_glass(material, radius, bounds, window, cx),
    )
    .absolute()
    .top_0()
    .left_0()
    .size_full()
}

/// Lays a glass on `base` (a `div`): its shape, its shadow, its layer (first child: add the content after).
pub fn glass_on(base: Div, material: GMaterial, radius: Pixels, cx: &App) -> Div {
    // No `relative()`: it would undo an `absolute()` laid on it (GPUI lays absolute children on their parent).
    base.rounded(radius)
        .shadow(material.shadows(cx))
        .child(glass_layer(material, radius))
}

/// A panel of content glass (`GGlass`): `GGlass::regular().p(px(20.)).child(…)`. Radius `radius::GLASS`; children and
/// styles as a `div`'s.
#[derive(IntoElement)]
pub struct GGlass {
    base: Div,
    children: Vec<AnyElement>,
    material: GMaterial,
    radius: Pixels,
}

impl GGlass {
    pub fn new(density: GGlassDensity) -> Self {
        GGlass {
            base: div(),
            children: Vec::new(),
            material: GMaterial::content(density),
            radius: px(radius::GLASS),
        }
    }

    pub fn thin() -> Self {
        Self::new(GGlassDensity::Thin)
    }

    pub fn regular() -> Self {
        Self::new(GGlassDensity::Regular)
    }

    pub fn thick() -> Self {
        Self::new(GGlassDensity::Thick)
    }

    /// Its corners' radius (`radius::GLASS` by default).
    pub fn radius(mut self, radius: f32) -> Self {
        self.radius = px(radius);
        self
    }

    /// Laid on another glass: its tint and its light, no backdrop, no shadow.
    pub fn nested(mut self) -> Self {
        self.material = self.material.nested();
        self
    }
}

impl Styled for GGlass {
    fn style(&mut self) -> &mut StyleRefinement {
        self.base.style()
    }
}

impl ParentElement for GGlass {
    fn extend(&mut self, elements: impl IntoIterator<Item = AnyElement>) {
        self.children.extend(elements)
    }
}

impl RenderOnce for GGlass {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        // Its content lies in a content glass (4.1.1): the clear glass in it takes its edge there.
        glass_on(self.base, self.material, self.radius, cx)
            .text_color(cx.theme().colors.ink)
            .children(self.children.into_iter().map(in_glass))
    }
}

/// Liquid glass (`GLiquidGlass`), for what commands and floats: a capsule by default (`radius`), children and styles
/// as a `div`'s. Never for content.
#[derive(IntoElement)]
pub struct GLiquidGlass {
    base: Div,
    children: Vec<AnyElement>,
    material: GMaterial,
    radius: Pixels,
}

impl GLiquidGlass {
    pub fn new() -> Self {
        GLiquidGlass {
            base: div(),
            children: Vec::new(),
            material: GMaterial::liquid(),
            radius: px(radius::PILL),
        }
    }

    /// Its corners' radius (a capsule by default).
    pub fn radius(mut self, radius: f32) -> Self {
        self.radius = px(radius);
        self
    }

    /// Laid on another glass: no backdrop, no shadow.
    pub fn nested(mut self) -> Self {
        self.material = self.material.nested();
        self
    }
}

impl Default for GLiquidGlass {
    fn default() -> Self {
        Self::new()
    }
}

impl Styled for GLiquidGlass {
    fn style(&mut self) -> &mut StyleRefinement {
        self.base.style()
    }
}

impl ParentElement for GLiquidGlass {
    fn extend(&mut self, elements: impl IntoIterator<Item = AnyElement>) {
        self.children.extend(elements)
    }
}

impl RenderOnce for GLiquidGlass {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        glass_on(self.base, self.material, self.radius, cx)
            .text_color(cx.theme().colors.ink)
            .children(self.children)
    }
}

/// The chosen one among rows or tabs, on a glass ([`GMaterial::Selected`]).
pub fn selection_layer(radius: Pixels) -> impl IntoElement {
    glass_layer(GMaterial::Selected, radius)
}

/// A round button of liquid glass (`GGlassButton`), for a header's actions: its icon in the ground's ink. Held down,
/// the glass lights and grows (4.1).
#[derive(IntoElement)]
pub struct GGlassButton {
    id: ElementId,
    icon: &'static str,
    label: SharedString,
    size: f32,
    preview: Option<GPointer>,
    on_click: Option<ClickHandler>,
}

impl GGlassButton {
    pub fn new(
        id: impl Into<ElementId>,
        icon: &'static str,
        label: impl Into<SharedString>,
    ) -> Self {
        GGlassButton {
            id: id.into(),
            icon,
            label: label.into(),
            size: 34.,
            preview: None,
            on_click: None,
        }
    }

    /// Its diameter (34 by default).
    pub fn size(mut self, size: f32) -> Self {
        self.size = size;
        self
    }

    pub fn preview(mut self, preview: Option<GPointer>) -> Self {
        self.preview = preview;
        self
    }

    pub fn on_click(
        mut self,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_click = Some(Rc::new(handler));
        self
    }
}

impl RenderOnce for GGlassButton {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let veil = hover_light(cx);
        let follows = self.preview.is_none();
        let (held, press_state) = crate::motion::use_press(self.id.clone(), window, cx);
        // 4.1: held down, the glass lights and grows (no darker veil then).
        let pressed = self.preview == Some(GPointer::Pressed) || (follows && held);
        let lit = match self.preview {
            Some(GPointer::Hover) => Some(veil),
            Some(GPointer::Pressed) => None,
            None => None,
        };
        let radius = px(self.size / 2.);
        let foreground = if lit.is_some() || pressed {
            colors.ink
        } else {
            colors.ink_2
        };
        let mut button = div()
            .relative()
            .rounded(radius)
            .flex()
            .flex_none()
            .items_center()
            .justify_center()
            .size(px(self.size))
            .id(self.id)
            .role(Role::Button)
            .aria_label(self.label.clone())
            .group("g-glass-button")
            .child(control_glass(
                "g-glass-button-glass",
                GMaterial::liquid(),
                radius,
                pressed,
                cx,
            ))
            .child(
                div()
                    .id("g-glass-button-veil")
                    .absolute()
                    .top_0()
                    .left_0()
                    .size_full()
                    .rounded(radius)
                    .when_some(lit, |this, color| this.bg(color))
                    .when(follows && !pressed, |this| {
                        this.group_hover("g-glass-button", move |style| style.bg(veil))
                    }),
            )
            .child(icon(self.icon, px(self.size * 0.5), foreground));
        if follows {
            button = crate::motion::on_press(
                button
                    .cursor(CursorStyle::PointingHand)
                    .focusable()
                    .tab_stop(true),
                &press_state,
            );
            if let Some(handler) = self.on_click {
                button = button.on_click(move |event, window, cx| handler(event, window, cx));
            }
        }
        button
    }
}

/// Tabs on liquid glass (`GGlassTabs`), Gabarit's segmented control: a track of thin liquid glass, a capsule, and the
/// open tab under a lens of liquid glass that slides from tab to tab on a spring (4.1; 4.0: the open tab on thick glass,
/// in place). For a page's few views; `GNavTabs` stays for the underlined ones.
#[derive(IntoElement)]
pub struct GGlassTabs {
    id: ElementId,
    tabs: Vec<SharedString>,
    selected: usize,
    on_change: Option<ChangeHandler<usize>>,
}

impl GGlassTabs {
    pub fn new(
        id: impl Into<ElementId>,
        tabs: impl IntoIterator<Item = impl Into<SharedString>>,
        selected: usize,
    ) -> Self {
        GGlassTabs {
            id: id.into(),
            tabs: tabs.into_iter().map(Into::into).collect(),
            selected,
            on_change: None,
        }
    }

    pub fn on_change(mut self, handler: impl Fn(&usize, &mut Window, &mut App) + 'static) -> Self {
        self.on_change = Some(Rc::new(move |value, window, cx| {
            handler(&value, window, cx)
        }));
        self
    }
}

impl RenderOnce for GGlassTabs {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let tab_radius = px(radius::PILL);
        let hover = alpha(colors.ink, 0.06);
        // Where each tab lies in the track, measured at the last frame (as `GNavTabs`'s line): the open tab's lens is
        // one glass that slides from tab to tab on the spring of what moves (`motion::SHARED`). Before the first
        // measure, the open tab draws its own.
        let places = window.use_keyed_state(
            ElementId::NamedChild(std::sync::Arc::new(self.id.clone()), "g-lens-places".into()),
            cx,
            |_, _| Vec::<(f32, f32)>::new(),
        );
        let count = self.tabs.len();
        let sliding = places.read(cx).get(self.selected).copied();
        let measure = places.clone();
        let lens = sliding.map(|(left, width)| {
            let glass = crate::motion::spring_to(
                div()
                    .relative()
                    .h_full()
                    .child(glass_layer(GMaterial::liquid(), tab_radius)),
                "g-lens-width",
                crate::motion::SHARED,
                px(width),
                cx,
                |lens, width| lens.w(width),
            );
            crate::motion::spring_to(
                div()
                    .absolute()
                    .top(px(3.))
                    .bottom(px(3.))
                    .shadow(GMaterial::liquid().shadows(cx))
                    .rounded(tab_radius)
                    .child(glass),
                "g-lens-left",
                crate::motion::SHARED,
                px(left),
                cx,
                |lens, left| lens.left(left),
            )
        });
        // The track's glass first (over the whole track), then the lens, then the tabs.
        let skip = 1 + lens.is_some() as usize;
        glass_on(div(), GMaterial::liquid_thin(), px(radius::PILL), cx)
            .children(lens)
            .on_children_prepainted(move |bounds, _, cx| {
                let Some(track) = bounds.first() else { return };
                let measured: Vec<(f32, f32)> = bounds
                    .iter()
                    .skip(skip)
                    .take(count)
                    .map(|b| ((b.left() - track.left()).as_f32(), b.size.width.as_f32()))
                    .collect();
                measure.update(cx, |places, cx| {
                    if *places != measured {
                        *places = measured;
                        cx.notify();
                    }
                });
            })
            .id(self.id)
            .role(Role::TabList)
            .relative()
            .flex()
            .flex_none()
            .items_center()
            .gap(px(2.))
            .p(px(3.))
            .children(self.tabs.into_iter().enumerate().map(|(index, title)| {
                let current = index == self.selected;
                let handler = self.on_change.clone();
                div()
                    .id(("g-glass-tab", index))
                    .relative()
                    .px(px(14.))
                    .py(px(5.))
                    .rounded(tab_radius)
                    .g_text(text::CALLOUT)
                    .font_weight(if current {
                        gpui::FontWeight::SEMIBOLD
                    } else {
                        gpui::FontWeight::MEDIUM
                    })
                    .text_color(if current { colors.ink } else { colors.ink_2 })
                    .role(Role::Tab)
                    .aria_label(title.clone())
                    .aria_selected(current)
                    .when(current && sliding.is_none(), |this| {
                        this.child(glass_layer(GMaterial::liquid(), tab_radius))
                    })
                    .when(!current, |this| {
                        this.cursor(CursorStyle::PointingHand)
                            .hover(move |style| style.bg(hover))
                            .when_some(handler, |this, handler| {
                                this.on_click(move |_, window, cx| handler(index, window, cx))
                            })
                    })
                    .child(div().relative().child(gpui::Text::new_inaccessible(title)))
            }))
    }
}
