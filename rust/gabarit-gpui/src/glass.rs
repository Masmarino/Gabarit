//! The glass (4.0): two materials laid on the ground (`ground.rs`), and nothing else on it.
//!
//! - **The content glass** ([`GGlass`]: `thin`, `regular`, `thick`) for the panels: the ground's glass colour at the
//!   density's opacity over the ground blurred wide, its edge's light (below), a wide soft shadow (`shadow.glass`, two layers), radius `radius::GLASS` (22).
//! - **The liquid glass** ([`GLiquidGlass`]) for what commands and floats (menus, tooltips, the open tab, a search, a
//!   header's buttons): clearer (white at `glassLiquid`) over the ground blurred short and saturated, its edge's
//!   light, brighter, a short shadow. **Never for content**: a sheet that holds a form is thick content glass.
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
    outline, point, prelude::*, px,
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

    /// Laid on another glass.
    pub const fn nested(self) -> Self {
        match self {
            GMaterial::Content { density, .. } => GMaterial::Content {
                density,
                nested: true,
            },
            GMaterial::Liquid { .. } => GMaterial::Liquid { nested: true },
            GMaterial::Selected => GMaterial::Selected,
        }
    }

    fn is_nested(self) -> bool {
        matches!(
            self,
            GMaterial::Content { nested: true, .. }
                | GMaterial::Liquid { nested: true }
                | GMaterial::Selected
        )
    }

    /// Its tint: the density's glass, the liquid's white; dense when transparency is reduced.
    pub fn tint(self, cx: &App) -> Hsla {
        let theme = cx.theme();
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
            GMaterial::Selected => match (theme.ground.mode, theme.ground.kind) {
                (crate::tokens::GGroundMode::Light, _) => colors.glass_thick,
                (_, crate::tokens::GGlassKind::Tinted) => crate::theme::white(0.18),
                _ => crate::theme::white(0.12),
            },
        }
    }

    /// Its shadows, under it (`shadow.glass`, two layers; the liquid's, short): CSS's blurs halved, as GPUI's.
    pub fn shadows(self, cx: &App) -> Vec<BoxShadow> {
        if self.is_nested() {
            return Vec::new();
        }
        let colors = &cx.theme().colors;
        match self {
            GMaterial::Selected => Vec::new(),
            GMaterial::Content { .. } => vec![
                BoxShadow::new(px(0.), px(glass::SHADOW_Y), colors.glass_shadow)
                    .blur_radius(px(glass::SHADOW_BLUR / 2.))
                    .spread_radius(px(glass::SHADOW_SPREAD)),
                BoxShadow::new(px(0.), px(glass::SHADOW_NEAR_Y), colors.glass_shadow_near)
                    .blur_radius(px(glass::SHADOW_NEAR_BLUR / 2.))
                    .spread_radius(px(glass::SHADOW_NEAR_SPREAD)),
            ],
            GMaterial::Liquid { .. } => vec![
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
            GMaterial::Liquid { .. } => (
                colors.liquid_rim_top,
                colors.liquid_rim_bottom,
                colors.liquid_sheen,
            ),
        }
    }

    fn backdrop(self) -> Option<GBackdrop> {
        match self {
            GMaterial::Content { nested: false, .. } => Some(GBackdrop::Content),
            GMaterial::Liquid { nested: false } => Some(GBackdrop::Liquid),
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
    let corners = Corners::all(radius).clamp_radii_for_quad_size(bounds.size);
    if let Some(backdrop) = material.backdrop() {
        paint_backdrop(&GGroundPaint::of(cx), backdrop, bounds, corners, window);
    }
    window.paint_quad(fill(bounds, material.tint(cx)).corner_radii(corners));
    let theme = cx.theme();
    if theme.increase_contrast {
        window.paint_quad(
            outline(bounds, theme.colors.border, gpui::BorderStyle::Solid).corner_radii(corners),
        );
    } else {
        let (top, bottom, sheen) = material.edge_light(cx);
        paint_edge_light(bounds, corners, top, bottom, sheen, window);
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
        glass_on(self.base, self.material, self.radius, cx)
            .text_color(cx.theme().colors.ink)
            .children(self.children)
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

/// A round button of liquid glass (`GGlassButton`), for a header's actions: its icon in the ground's ink.
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
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let (veil, press) = (alpha(colors.ink, 0.06), alpha(colors.ink, 0.12));
        let lit = match self.preview {
            Some(GPointer::Hover) => Some(veil),
            Some(GPointer::Pressed) => Some(press),
            None => None,
        };
        let radius = px(self.size / 2.);
        let follows = self.preview.is_none();
        let foreground = if lit.is_some() {
            colors.ink
        } else {
            colors.ink_2
        };
        let mut button = glass_on(div(), GMaterial::liquid(), radius, cx)
            .flex()
            .flex_none()
            .items_center()
            .justify_center()
            .size(px(self.size))
            .id(self.id)
            .role(Role::Button)
            .aria_label(self.label.clone())
            .group("g-glass-button")
            .child(
                div()
                    .id("g-glass-button-veil")
                    .absolute()
                    .top_0()
                    .left_0()
                    .size_full()
                    .rounded(radius)
                    .when_some(lit, |this, color| this.bg(color))
                    .when(follows, |this| {
                        this.group_hover("g-glass-button", move |style| style.bg(veil))
                            .group_active("g-glass-button", move |style| style.bg(press))
                    }),
            )
            .child(icon(self.icon, px(self.size * 0.5), foreground));
        if follows {
            button = button
                .cursor(CursorStyle::PointingHand)
                .focusable()
                .tab_stop(true);
            if let Some(handler) = self.on_click {
                button = button.on_click(move |event, window, cx| handler(event, window, cx));
            }
        }
        button
    }
}

/// Tabs on liquid glass (`GGlassTabs`): a capsule, the open tab on thick glass in it. For a page's few views (a
/// segmented control's place); `GNavTabs` stays for the underlined ones.
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
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let tab_radius = px(radius::PILL);
        let hover = alpha(colors.ink, 0.06);
        glass_on(div(), GMaterial::liquid(), px(radius::PILL), cx)
            .id(self.id)
            .role(Role::TabList)
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
                    .when(current, |this| this.child(selection_layer(tab_radius)))
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
