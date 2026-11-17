//! Gabarit's buttons (GabaritApple's `GButtonStyle`) and the close cross (`GCloseButton`).
//!
//! 4.1: the buttons are liquid glass, capsules. `Glass` (clear liquid glass, the ground's ink) is what a secondary
//! button draws, and a ghost (tertiary) one on thin liquid glass in the ink's second step; `GlassProminent` (liquid glass
//! tinted with the accent) and the primary (tinted with the ink) are the main buttons. Held down, the glass lights and
//! grows a little on the bouncy spring ([`crate::glass::control_glass`]). Danger stays solid red. `solid()`: 4.0's
//! opaque look (ink, white surface with its fine frame, no ground), for a page that is not on a ground.

use std::rc::Rc;

use gpui::{
    AnyElement, App, ClickEvent, CursorStyle, ElementId, Hsla, IntoElement, ParentElement,
    RenderOnce, Role, SharedString, Styled, Window, div, prelude::*, px,
};

use crate::assets::icon;
use crate::glass::{
    GMaterial, accent_glass, control_glass, ink_glass, legible_on_glass, thin_glass_ink,
};
use crate::motion;
use crate::relief::{GPointer, Live, over, raised, raised_shadow};
use crate::theme::{ActiveTheme, GTextExt, alpha, black, mix, white};
use crate::tokens::{opacity, radius, text};

pub type ClickHandler = Rc<dyn Fn(&ClickEvent, &mut Window, &mut App)>;

/// The controls' measures on a computer (GabaritApple's `GControlMetrics`, the Mac's).
pub mod metrics {
    pub const HEIGHT: f32 = 30.0;
    pub const COMPACT: f32 = 28.0;
    pub const BUTTON: f32 = 30.0;
    /// A regular (not compact) button: a sheet's main button.
    pub const REGULAR: f32 = 44.0;
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum GButtonVariant {
    /// The main button: liquid glass tinted with the ink (4.1; 4.0: the solid ink, `solid()`).
    Primary,
    /// Liquid glass, the ground's ink (4.1; 4.0: a white surface with a fine frame, `solid()`).
    #[default]
    Secondary,
    /// The tertiary button: thin liquid glass, the ink's second step (4.1; 4.0: no ground, `solid()`).
    Ghost,
    /// Solid red, in 4.1 too.
    Danger,
    /// Liquid glass, the ground's ink (4.1): what a secondary button draws.
    Glass,
    /// Liquid glass tinted with the accent (4.1): a main button in the accent.
    GlassProminent,
}

/// A Gabarit button: `GButton::new("save", "Save").primary().on_click(…)`.
#[derive(IntoElement)]
pub struct GButton {
    id: ElementId,
    label: SharedString,
    variant: GButtonVariant,
    compact: bool,
    destructive: bool,
    disabled: bool,
    full_width: bool,
    solid: bool,
    icon: Option<&'static str>,
    preview: Option<GPointer>,
    on_click: Option<ClickHandler>,
}

impl GButton {
    pub fn new(id: impl Into<ElementId>, label: impl Into<SharedString>) -> Self {
        GButton {
            id: id.into(),
            label: label.into(),
            variant: GButtonVariant::Secondary,
            compact: true,
            destructive: false,
            disabled: false,
            full_width: false,
            solid: false,
            icon: None,
            preview: None,
            on_click: None,
        }
    }

    pub fn variant(mut self, variant: GButtonVariant) -> Self {
        self.variant = variant;
        self
    }

    pub fn primary(self) -> Self {
        self.variant(GButtonVariant::Primary)
    }

    pub fn ghost(self) -> Self {
        self.variant(GButtonVariant::Ghost)
    }

    pub fn danger(self) -> Self {
        self.variant(GButtonVariant::Danger)
    }

    /// Liquid glass, the ground's ink (4.1): a secondary button's look, said outright.
    pub fn glass(self) -> Self {
        self.variant(GButtonVariant::Glass)
    }

    /// Liquid glass tinted with the accent (4.1): a main button in the accent.
    pub fn glass_prominent(self) -> Self {
        self.variant(GButtonVariant::GlassProminent)
    }

    /// 4.0's opaque look rather than the glass: the primary in solid ink, the secondary a white surface with its fine
    /// frame and its relief, the ghost without ground (a page not laid on a ground). Capsules too.
    pub fn solid(mut self) -> Self {
        self.solid = true;
        self
    }

    /// A destructive action with no solid ground ("Delete", "Leave"): its text in red.
    pub fn destructive(mut self) -> Self {
        self.destructive = true;
        self
    }

    /// 44 high rather than 30 (a sheet's main button).
    pub fn regular(mut self) -> Self {
        self.compact = false;
        self
    }

    pub fn full_width(mut self) -> Self {
        self.full_width = true;
        self
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    pub fn icon(mut self, name: &'static str) -> Self {
        self.icon = Some(name);
        self
    }

    /// Drawn hovered or pressed whatever the pointer does (a gallery).
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

    fn foreground(&self, cx: &App) -> Hsla {
        let colors = &cx.theme().colors;
        // The text's red: 4.5:1 on the hover's and the press's grounds too.
        if self.destructive
            && matches!(
                self.variant,
                GButtonVariant::Secondary | GButtonVariant::Ghost
            )
        {
            return colors.error_text;
        }
        match self.variant {
            GButtonVariant::Primary | GButtonVariant::Danger | GButtonVariant::GlassProminent => {
                colors.on_primary
            }
            GButtonVariant::Secondary | GButtonVariant::Glass => colors.text_primary,
            GButtonVariant::Ghost => colors.text_secondary,
        }
    }

    /// The ground at rest, under the pointer, held down: a step lighter (the ink) or under the veil (the surfaces).
    fn grounds(&self, cx: &App) -> [Hsla; 3] {
        let colors = &cx.theme().colors;
        match self.variant {
            GButtonVariant::Primary | GButtonVariant::GlassProminent => [
                colors.primary,
                mix(colors.primary, colors.primary_hover, 0.55),
                colors.primary_hover,
            ],
            GButtonVariant::Secondary | GButtonVariant::Glass => [
                colors.surface,
                over(colors.surface, colors.hover),
                over(colors.surface, colors.press),
            ],
            GButtonVariant::Ghost => [alpha(colors.hover, 0.0), colors.hover, colors.press],
            GButtonVariant::Danger => [
                colors.error,
                mix(colors.error, white(1.0), 0.1),
                mix(colors.error, black(1.0), 0.18),
            ],
        }
    }
}

impl GButton {
    /// Its glass and its text (4.1), when it is not solid.
    fn glass_look(&self, cx: &App) -> Option<(GMaterial, Hsla)> {
        if self.solid {
            return None;
        }
        let colors = &cx.theme().colors;
        // A destructive action's red, legible on the glass of the ground (lighter on a tinted ambiance).
        let red = |ink: Hsla, liquid: f32| {
            if self.destructive {
                legible_on_glass(colors.error_text, liquid, None, cx)
            } else {
                ink
            }
        };
        match self.variant {
            GButtonVariant::Danger => None,
            GButtonVariant::Primary => Some(ink_glass(cx)),
            GButtonVariant::GlassProminent => Some(accent_glass(cx)),
            GButtonVariant::Secondary | GButtonVariant::Glass => {
                Some((GMaterial::liquid(), red(colors.ink, 1.)))
            }
            GButtonVariant::Ghost => Some((GMaterial::liquid_thin(), red(thin_glass_ink(cx), 0.5))),
        }
    }

    fn render_glass(
        self,
        material: GMaterial,
        foreground: Hsla,
        window: &mut Window,
        cx: &mut App,
    ) -> AnyElement {
        let colors = cx.theme().colors;
        let shape = px(radius::PILL);
        let live = Live::new("g-button", self.preview, !self.disabled);
        let (held, press) = motion::use_press(self.id.clone(), window, cx);
        let pressed = live.pressed() || (live.follows() && held);
        // The ghost's text in the ink's second step at rest, in the ink when its glass lights (4.5:1 on it).
        let ghost = self.variant == GButtonVariant::Ghost && !self.destructive;
        let foreground = if ghost && (live.hovered() || pressed) {
            colors.ink
        } else {
            foreground
        };
        let ink = colors.ink;
        // Under the pointer, a veil that deepens the contrast: of the ink on the clear glass, white or shade on a
        // tinted one (away from its text).
        let veil = match material {
            GMaterial::Tinted { .. } if foreground.l > 0.5 => black(0.1),
            GMaterial::Tinted { .. } => white(0.14),
            _ => crate::glass::hover_light(cx),
        };
        let height = if self.compact {
            metrics::BUTTON
        } else {
            metrics::REGULAR
        };
        let follows = live.follows();
        let mut button = div()
            .id(self.id.clone())
            .group("g-button")
            .relative()
            .flex()
            .flex_none()
            .items_center()
            .justify_center()
            .gap(px(6.))
            .h(px(height))
            .px(px(if self.compact { 14. } else { 18. }))
            .rounded(shape)
            .g_text(text::BODY)
            .font_weight(gpui::FontWeight::SEMIBOLD)
            .text_color(foreground)
            .whitespace_nowrap()
            .role(Role::Button)
            .aria_label(self.label.clone())
            .when(self.full_width, |this| this.w_full())
            .child(control_glass(
                "g-button-glass",
                material,
                shape,
                pressed,
                cx,
            ))
            .child(
                div()
                    .id("g-button-veil")
                    .absolute()
                    .top_0()
                    .left_0()
                    .size_full()
                    .rounded(shape)
                    .when(live.hovered() && !pressed, |this| this.bg(veil))
                    .when(follows, |this| {
                        this.group_hover("g-button", move |style| style.bg(veil))
                    }),
            );
        if follows {
            button = motion::on_press(
                button
                    .cursor(CursorStyle::PointingHand)
                    .focusable()
                    .tab_stop(true)
                    .when(ghost, |this| this.hover(move |style| style.text_color(ink)))
                    .focus_visible(move |style| {
                        style.border_2().border_color(alpha(colors.accent, 0.8))
                    }),
                &press,
            );
            if let Some(handler) = self.on_click.clone() {
                button = button.on_click(move |event, window, cx| handler(event, window, cx));
            }
        }
        if self.disabled {
            button = button.opacity(opacity::DISABLED);
        }
        button
            .when_some(self.icon, |this, name| {
                this.child(icon(name, px(14.), foreground).relative())
            })
            .child(div().relative().child(self.label))
            .into_any_element()
    }
}

impl RenderOnce for GButton {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        if let Some((material, foreground)) = self.glass_look(cx) {
            return self.render_glass(material, foreground, window, cx);
        }
        let colors = cx.theme().colors;
        let shape = px(radius::PILL);
        let live = Live::new("g-button", self.preview, !self.disabled);
        // Under the pointer, its ground fades to the hover's (GPUI's hover style would jump); held down, it changes at
        // once and sinks.
        let (hovered, on_hover) = motion::use_hover(self.id.clone(), window, cx);
        let [rest, hover, pressed] = self.grounds(cx);
        let ground = if live.pressed() {
            pressed
        } else if live.hovered() {
            hover
        } else {
            rest
        };
        let secondary = matches!(
            self.variant,
            GButtonVariant::Secondary | GButtonVariant::Glass
        );
        let rim = |opacity| alpha(colors.border, opacity);
        let height = if self.compact {
            metrics::BUTTON
        } else {
            metrics::REGULAR
        };
        let foreground = self.foreground(cx);

        let mut button = div()
            .id(self.id.clone())
            .group("g-button")
            .relative()
            .flex()
            .flex_none()
            .items_center()
            .justify_center()
            .gap(px(6.))
            .h(px(height))
            .px(px(if self.compact { 12. } else { 16. }))
            .rounded(shape)
            .bg(ground)
            .g_text(text::BODY)
            .font_weight(gpui::FontWeight::SEMIBOLD)
            .text_color(foreground)
            .whitespace_nowrap()
            .role(Role::Button)
            .aria_label(self.label.clone())
            .when(self.full_width, |this| this.w_full())
            .when(secondary, |this| {
                this.border_1()
                    .border_color(rim(if live.hovered() { 0.8 } else { 0.6 }))
            });

        let ghost = self.variant == GButtonVariant::Ghost;
        // Held down, it sinks half a point (not when the system asks for less motion).
        let sink = !cx.theme().reduce_motion;
        if live.follows() {
            let hover_shadow = raised_shadow(true, cx);
            button = button
                .cursor(CursorStyle::PointingHand)
                .focusable()
                .tab_stop(true)
                .on_hover(on_hover)
                .hover(move |style| {
                    let style = if ghost {
                        style
                    } else {
                        style.shadow(hover_shadow)
                    };
                    if secondary {
                        style.border_color(rim(0.8))
                    } else {
                        style
                    }
                })
                .active(move |style| {
                    let style = style.bg(pressed).shadow(vec![]);
                    if sink { style.top(px(0.5)) } else { style }
                })
                .focus_visible(move |style| {
                    style.border_2().border_color(alpha(colors.accent, 0.8))
                });
            if let Some(handler) = self.on_click.clone() {
                button = button.on_click(move |event, window, cx| handler(event, window, cx));
            }
        }
        if self.disabled {
            button = button.opacity(opacity::DISABLED);
        }

        let button = if ghost {
            button
        } else {
            let on_ink = matches!(
                self.variant,
                GButtonVariant::Primary | GButtonVariant::Danger | GButtonVariant::GlassProminent
            );
            raised(button, shape, on_ink, live, cx)
        };

        let button = button
            .when(sink && live.pressed(), |this| this.top(px(0.5)))
            .when_some(self.icon, |this, name| {
                this.child(icon(name, px(14.), foreground))
            })
            .child(div().relative().child(self.label));
        if live.follows() {
            motion::fade_color(
                button,
                "g-button-ground",
                hovered,
                rest,
                hover,
                |b, color| b.bg(color),
            )
            .into_any_element()
        } else {
            button.into_any_element()
        }
    }
}

/// Gabarit's close button: a cross in a circle of liquid glass, in the ground's ink, on a bar or on the page (4.1; 4.0:
/// an opaque raised circle on the page), held down it lights and grows; a fine rim on the dark frame, `framed()`. Escape triggers it where the window binds it.
#[derive(IntoElement)]
pub struct GCloseButton {
    id: ElementId,
    label: SharedString,
    framed: bool,
    preview: Option<GPointer>,
    on_click: Option<ClickHandler>,
}

impl GCloseButton {
    pub fn new(id: impl Into<ElementId>) -> Self {
        GCloseButton {
            id: id.into(),
            label: "Close".into(),
            framed: false,
            preview: None,
            on_click: None,
        }
    }

    /// On a bar (a window's header). Since 4.1 the same circle of liquid glass as on the page: kept so that 4.0's
    /// calls still build.
    pub fn on_frame(self) -> Self {
        self
    }

    /// On the dark frame (a `framed()` header, 3.x's look).
    pub fn framed(mut self) -> Self {
        self.framed = true;
        self
    }

    pub fn label(mut self, label: impl Into<SharedString>) -> Self {
        self.label = label.into();
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

impl RenderOnce for GCloseButton {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let (held, press) = motion::use_press(self.id.clone(), window, cx);
        let theme = cx.theme();
        // 4.1: on the page too, a circle of liquid glass in the ground's ink (the bars' colours); the dark frame
        // (`framed()`) keeps its rim.
        let frame = theme.bar_colors(self.framed);
        let liquid = !self.framed;
        let live = Live::new("g-close", self.preview, true);
        let circle = px(28.);
        let (rest, hover, pressed) = if liquid {
            (
                alpha(frame.close_hover, 0.0),
                crate::glass::hover_light(cx),
                frame.selected,
            )
        } else {
            (
                alpha(frame.close_hover, 0.0),
                frame.close_hover,
                frame.selected,
            )
        };
        let ground = if live.pressed() {
            pressed
        } else if live.hovered() {
            hover
        } else {
            rest
        };
        let base = if liquid {
            // GPUI paints a box's ground under its children: on the glass, the hover is a layer over it.
            let (forced, follows) = (
                if live.pressed() {
                    Some(pressed)
                } else if live.hovered() {
                    Some(hover)
                } else {
                    None
                },
                live.follows(),
            );
            let held = live.pressed() || (live.follows() && held);
            div()
                .relative()
                .child(crate::glass::control_glass(
                    "g-close-glass",
                    GMaterial::liquid(),
                    px(14.),
                    held,
                    cx,
                ))
                .child(
                    div()
                        .id("g-close-veil")
                        .absolute()
                        .top_0()
                        .left_0()
                        .size_full()
                        .rounded_full()
                        .when_some(forced.filter(|_| !held), |this, color| this.bg(color))
                        .when(follows && !held, |this| {
                            this.group_hover("g-close", move |style| style.bg(hover))
                        }),
                )
        } else {
            div().border_1().border_color(frame.rim)
        };
        let mut button = base
            .id(self.id)
            .group("g-close")
            .relative()
            .flex()
            .flex_none()
            .items_center()
            .justify_center()
            .size(circle)
            .rounded_full()
            .when(!liquid, |this| this.bg(ground))
            .text_color(frame.text)
            .role(Role::Button)
            .aria_label(self.label.clone())
            .tooltip_text(format!("{} (Esc)", self.label));
        if live.follows() {
            button = button
                .cursor(CursorStyle::PointingHand)
                .focusable()
                .tab_stop(true);
            if liquid {
                button = motion::on_press(button, &press);
            } else {
                button = button
                    .hover(move |style| style.bg(hover))
                    .active(move |style| style.bg(pressed));
            }
            if let Some(handler) = self.on_click {
                button = button.on_click(move |event, window, cx| handler(event, window, cx));
            }
        }
        button.child(icon("x-bold", px(11.), frame.text).relative())
    }
}

/// A tooltip with Gabarit's look, from a plain text.
pub(crate) trait TooltipText: StatefulInteractiveElement + Sized {
    fn tooltip_text(self, text: impl Into<SharedString>) -> Self {
        let text: SharedString = text.into();
        self.tooltip(move |_window, cx| {
            cx.new(|_| crate::feedback::GTooltip::new(text.clone()))
                .into()
        })
    }
}

impl<T: StatefulInteractiveElement> TooltipText for T {}
