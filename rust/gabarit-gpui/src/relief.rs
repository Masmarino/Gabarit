//! Gabarit's depth, a little of it (GabaritApple's `GRelief.swift`). Three levels: the page; what rests on it (a card:
//! a soft shadow and the light on its top edge); what can be pressed (a button, a chip: a little volume, a tighter
//! shadow, and it sinks when pressed). What holds a value (a switch's track, a slider's, a field) is slightly hollow,
//! and what is on (a switch, the current tab, a selection) glows a little. One light, from above: top edges catch it,
//! bottom edges fall into shade, the page is lit at its top. A hairline stays the edge of things: all this only adds
//! to it.
//!
//! GPUI has what it takes: shadows (outer and inset), two-stop linear gradients, borders per side. A gradient border
//! is not one of them: the light on a top edge is a top border alone, which GPUI draws thinning along the rounded
//! corners, as the gradient fades along the sides on the Mac.

use gpui::{
    AnyElement, App, BoxShadow, Div, Hsla, Stateful, IntoElement, ParentElement, Pixels, SharedString, Styled, div,
    linear_color_stop, linear_gradient, prelude::*, px,
};

use crate::theme::{ActiveTheme, alpha, black, mix, white};
use crate::tokens::shadows;

/// A control drawn under a pointer that is not there: a gallery forces it hovered or pressed
/// (GabaritApple's `GPointerPreview`).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GPointer {
    Hover,
    Pressed,
}

/// How a control is drawn: forced (a gallery), or following the pointer (`group`: the name of the clickable element
/// whose hover and press its layers follow).
#[derive(Clone, Copy, Debug)]
pub(crate) struct Live {
    pub group: &'static str,
    pub forced: Option<GPointer>,
    pub enabled: bool,
}

impl Live {
    pub fn new(group: &'static str, forced: Option<GPointer>, enabled: bool) -> Self {
        Live { group, forced, enabled }
    }

    /// Whether the forced state is drawn statically (no pointer to follow).
    pub fn hovered(&self) -> bool {
        self.enabled && self.forced.is_some()
    }

    pub fn pressed(&self) -> bool {
        self.enabled && self.forced == Some(GPointer::Pressed)
    }

    /// Whether it follows the pointer (not forced, not disabled).
    pub fn follows(&self) -> bool {
        self.enabled && self.forced.is_none()
    }

    /// A layer whose opacity is `rest`, `hover` under the pointer, `pressed` held down.
    pub fn layer(&self, index: usize, element: Div, rest: f32, hover: f32, pressed: f32) -> Stateful<Div> {
        let group = SharedString::new_static(self.group);
        let element = element.id(("g-layer", index));
        if self.follows() {
            element
                .opacity(rest)
                .group_hover(group.clone(), move |style| style.opacity(hover))
                .group_active(group, move |style| style.opacity(pressed))
        } else if self.pressed() {
            element.opacity(pressed)
        } else if self.hovered() {
            element.opacity(hover)
        } else {
            element.opacity(rest)
        }
    }
}

/// A layer over the whole of its parent, in its shape.
pub(crate) fn overlay(radius: Pixels) -> Div {
    div().absolute().top_0().left_0().size_full().rounded(radius)
}

/// The raised relief's layers, laid over a pressable control (`gRaised`): a little volume (lighter at the top, a touch
/// darker at the bottom; more of it under the pointer), the light on the top edge and the shade on the bottom one;
/// held down, it sinks in its own shade. `on_ink`: on a dark ground (a primary button), the light is the same in both
/// appearances.
pub(crate) fn raised_layers(radius: Pixels, on_ink: bool, live: Live, cx: &App) -> Vec<AnyElement> {
    let colors = &cx.theme().colors;
    let top_light = if on_ink { white(0.32) } else { colors.relief_highlight };
    let top_rest = if on_ink { 0.2 / 0.32 } else { 1.0 };
    vec![
        // The volume: white at the top (0.07, 0.12 under the pointer), fading by the middle…
        live.layer(1, 
            overlay(radius).bg(linear_gradient(180.0, linear_color_stop(white(0.12), 0.0), linear_color_stop(white(0.0), 0.5))),
            0.07 / 0.12,
            1.0,
            0.0,
        )
        .into_any_element(),
        // … and a touch of shade at the bottom.
        live.layer(2, 
            overlay(radius).bg(linear_gradient(180.0, linear_color_stop(black(0.0), 0.5), linear_color_stop(black(0.04), 1.0))),
            1.0,
            1.0,
            0.0,
        )
        .into_any_element(),
        // The light on the top edge, the shade on the bottom one.
        live.layer(3, overlay(radius).border_t_1().border_color(top_light), top_rest, 1.0, 0.0).into_any_element(),
        live.layer(4, overlay(radius).border_b_1().border_color(colors.relief_shade), 1.0, 1.0, 0.0).into_any_element(),
        // Sunk: the shade falls from its top edge.
        live.layer(5, 
            overlay(radius).bg(linear_gradient(
                180.0,
                linear_color_stop(black(if on_ink { 0.28 } else { 0.13 }), 0.0),
                linear_color_stop(black(0.0), 0.45),
            )),
            0.0,
            0.0,
            1.0,
        )
        .into_any_element(),
    ]
}

/// The raised relief's shadow: tight, wider under the pointer, none held down.
pub(crate) fn raised_shadow(hovering: bool, cx: &App) -> Vec<BoxShadow> {
    let raised = shadows::RAISED;
    let (blur, y) = if hovering { (raised.radius + 2.0, raised.y + 1.0) } else { (raised.radius, raised.y) };
    vec![BoxShadow::new(px(raised.x), px(y), cx.theme().colors.relief_shadow).blur_radius(px(blur))]
}

/// Lays the raised relief on a pressable control: its layers (`raised_layers`) and its shadow at rest (or in the forced
/// state). Following the pointer, the control sets `raised_shadow(true)` in its hover style and none in its active
/// one: GPUI keeps one hover and one active style per element.
pub(crate) fn raised<E: Styled + ParentElement>(element: E, radius: Pixels, on_ink: bool, live: Live, cx: &App) -> E {
    let element = element.children(raised_layers(radius, on_ink, live, cx));
    if live.pressed() { element } else { element.shadow(raised_shadow(live.hovered(), cx)) }
}

/// The light on a card that rests on the page (`gCardDepth`): light on the top edge, shade on the bottom one, just
/// inside its hairline.
pub(crate) fn card_layers(radius: Pixels, cx: &App) -> [AnyElement; 2] {
    let colors = &cx.theme().colors;
    let inner = |element: Div| element.absolute().top(px(1.)).left(px(1.)).right(px(1.)).bottom(px(1.)).rounded(radius - px(1.));
    [
        inner(div()).border_t_1().border_color(colors.relief_highlight).into_any_element(),
        inner(div()).border_b_1().border_color(colors.relief_shade).into_any_element(),
    ]
}

/// The soft shadow of a card on the page.
pub fn card_shadow(cx: &App) -> Vec<BoxShadow> {
    let card = shadows::CARD;
    vec![BoxShadow::new(px(card.x), px(card.y), cx.theme().colors.card_shadow).blur_radius(px(card.radius))]
}

/// A card that rests on the page: its surface, its hairline, a soft shadow and the light on its top edge
/// (`gSurface`). `radius`: `GRadius.lg` for a form's card.
pub fn card(radius: Pixels, cx: &App) -> Div {
    let colors = &cx.theme().colors;
    div()
        .relative()
        .bg(colors.surface)
        .rounded(radius)
        .border_1()
        .border_color(colors.hairline)
        .shadow(card_shadow(cx))
        .children(card_layers(radius, cx))
}

/// A slight hollow, for what holds a value (a field, a track): an inner shadow from the top edge (`gHollow`).
pub fn hollow(strength: f32) -> BoxShadow {
    BoxShadow::new(px(0.), px(1.), black(strength)).blur_radius(px(1.5)).inset()
}

/// What is on glows a little, in its colour (`gGlow`).
pub fn glow(color: Hsla, radius: f32) -> BoxShadow {
    BoxShadow::new(px(0.), px(0.), alpha(color, 0.45)).blur_radius(px(radius))
}

/// The glow of a translucent ground (a selection's tint): SwiftUI's shadow follows what is drawn, as faint as the
/// ground is; GPUI's follows the box, so it is made as faint by hand.
pub fn glow_through(color: Hsla, radius: f32, ground: Hsla) -> BoxShadow {
    BoxShadow::new(px(0.), px(0.), alpha(color, 0.45 * ground.a)).blur_radius(px(radius))
}

/// A floating shadow (a toast, a menu): `GShadowValues.floating`.
pub fn floating_shadow() -> Vec<BoxShadow> {
    let floating = shadows::FLOATING;
    vec![BoxShadow::new(px(floating.x), px(floating.y), crate::theme::hsla(floating.color)).blur_radius(px(floating.radius))]
}

/// The shadow one of the frame's bars casts on the page below it (`gBarShadow`). `up`: from a bar at the bottom.
pub fn bar_shadow(up: bool) -> Vec<BoxShadow> {
    let bar = shadows::BAR;
    vec![BoxShadow::new(px(0.), px(if up { -1. } else { bar.y }), crate::theme::hsla(bar.color)).blur_radius(px(bar.radius))]
}

/// The page's ground: Gabarit's background, lit at its top (`gPageGround`).
pub fn page_ground(cx: &App) -> Div {
    let colors = &cx.theme().colors;
    let lit = mix(colors.background, white(1.0), colors.page_light.a);
    div().bg(linear_gradient(180.0, linear_color_stop(lit, 0.0), linear_color_stop(colors.background, 0.4)))
}

/// A switch's or a slider's knob: white, a little rounded by the light (`GKnob`).
pub fn knob(size: Pixels) -> Div {
    div()
        .size(size)
        .rounded_full()
        .bg(linear_gradient(180.0, linear_color_stop(white(1.0), 0.0), linear_color_stop(gpui::rgb(0xEDEDED), 1.0)))
}

/// A veil laid over `base` (hover, press), as one opaque colour: GPUI takes one ground per element.
pub fn over(base: Hsla, veil: Hsla) -> Hsla {
    mix(base, Hsla { a: 1.0, ..veil }, veil.a)
}
