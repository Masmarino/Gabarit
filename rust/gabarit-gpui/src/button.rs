//! Gabarit's buttons (GabaritApple's `GButtonStyle`): ink (primary), fine frame (secondary), no ground (ghost), red
//! (danger); and the close cross (`GCloseButton`).

use std::rc::Rc;

use gpui::{
    App, ClickEvent, CursorStyle, ElementId, Hsla, IntoElement, ParentElement, RenderOnce, Role, SharedString, Styled,
    Window, div, prelude::*, px,
};

use crate::assets::icon;
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
    Primary,
    #[default]
    Secondary,
    Ghost,
    Danger,
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

    pub fn on_click(mut self, handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static) -> Self {
        self.on_click = Some(Rc::new(handler));
        self
    }

    fn foreground(&self, cx: &App) -> Hsla {
        let colors = &cx.theme().colors;
        // The text's red: 4.5:1 on the hover's and the press's grounds too.
        if self.destructive && matches!(self.variant, GButtonVariant::Secondary | GButtonVariant::Ghost) {
            return colors.error_text;
        }
        match self.variant {
            GButtonVariant::Primary | GButtonVariant::Danger => colors.on_primary,
            GButtonVariant::Secondary => colors.text_primary,
            GButtonVariant::Ghost => colors.text_secondary,
        }
    }

    /// The ground at rest, under the pointer, held down: a step lighter (the ink) or under the veil (the surfaces).
    fn grounds(&self, cx: &App) -> [Hsla; 3] {
        let colors = &cx.theme().colors;
        match self.variant {
            GButtonVariant::Primary => {
                [colors.primary, mix(colors.primary, colors.primary_hover, 0.55), colors.primary_hover]
            }
            GButtonVariant::Secondary => {
                [colors.surface, over(colors.surface, colors.hover), over(colors.surface, colors.press)]
            }
            GButtonVariant::Ghost => [alpha(colors.hover, 0.0), colors.hover, colors.press],
            GButtonVariant::Danger => {
                [colors.error, mix(colors.error, white(1.0), 0.1), mix(colors.error, black(1.0), 0.18)]
            }
        }
    }
}

impl RenderOnce for GButton {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let shape = px(radius::SM);
        let live = Live::new("g-button", self.preview, !self.disabled);
        let [rest, hover, pressed] = self.grounds(cx);
        let ground = if live.pressed() { pressed } else if live.hovered() { hover } else { rest };
        let secondary = self.variant == GButtonVariant::Secondary;
        let rim = |opacity| alpha(colors.border, opacity);
        let height = if self.compact { metrics::BUTTON } else { metrics::REGULAR };
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
                this.border_1().border_color(rim(if live.hovered() { 0.8 } else { 0.6 }))
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
                .hover(move |style| {
                    let style = style.bg(hover);
                    let style = if ghost { style } else { style.shadow(hover_shadow) };
                    if secondary { style.border_color(rim(0.8)) } else { style }
                })
                .active(move |style| {
                    let style = style.bg(pressed).shadow(vec![]);
                    if sink { style.top(px(0.5)) } else { style }
                })
                .focus_visible(move |style| style.border_2().border_color(alpha(colors.accent, 0.8)));
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
            let on_ink = matches!(self.variant, GButtonVariant::Primary | GButtonVariant::Danger);
            raised(button, shape, on_ink, live, cx)
        };

        button
            .when(sink && live.pressed(), |this| this.top(px(0.5)))
            .when_some(self.icon, |this, name| this.child(icon(name, px(14.), foreground)))
            .child(div().relative().child(self.label))
    }
}

/// Gabarit's close button: a cross in a circle with a fine rim, on the dark frame or on the page. Escape triggers it
/// where the window binds it.
#[derive(IntoElement)]
pub struct GCloseButton {
    id: ElementId,
    label: SharedString,
    on_frame: bool,
    preview: Option<GPointer>,
    on_click: Option<ClickHandler>,
}

impl GCloseButton {
    pub fn new(id: impl Into<ElementId>) -> Self {
        GCloseButton { id: id.into(), label: "Close".into(), on_frame: false, preview: None, on_click: None }
    }

    /// On the dark frame (a window's header).
    pub fn on_frame(mut self) -> Self {
        self.on_frame = true;
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

    pub fn on_click(mut self, handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static) -> Self {
        self.on_click = Some(Rc::new(handler));
        self
    }
}

impl RenderOnce for GCloseButton {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let theme = cx.theme();
        let colors = theme.colors;
        let frame = theme.frame;
        let live = Live::new("g-close", self.preview, true);
        let (hover, pressed) = if self.on_frame { (frame.close_hover, frame.selected) } else { (colors.hover, colors.press) };
        let circle = px(28.);
        // On the page, an opaque ground: GPUI draws a box's shadow under a clear ground too.
        let (rest, hover, pressed) = if self.on_frame {
            (alpha(hover, 0.0), hover, pressed)
        } else {
            (colors.background, over(colors.background, hover), over(colors.background, pressed))
        };
        let ground = if live.pressed() { pressed } else if live.hovered() { hover } else { rest };
        let mut button = div()
            .id(self.id)
            .group("g-close")
            .relative()
            .flex()
            .flex_none()
            .items_center()
            .justify_center()
            .size(circle)
            .rounded_full()
            .bg(ground)
            .border_1()
            .border_color(if self.on_frame { frame.rim } else { colors.hairline })
            .text_color(if self.on_frame { frame.text } else { colors.text_secondary })
            .role(Role::Button)
            .aria_label(self.label.clone())
            .tooltip_text(format!("{} (Esc)", self.label));
        if live.follows() {
            button = button
                .cursor(CursorStyle::PointingHand)
                .focusable()
                .tab_stop(true)
                .hover({
                    let shadow = raised_shadow(true, cx);
                    let on_frame = self.on_frame;
                    move |style| if on_frame { style.bg(hover) } else { style.bg(hover).shadow(shadow) }
                })
                .active(move |style| style.bg(pressed).shadow(vec![]));
            if let Some(handler) = self.on_click {
                button = button.on_click(move |event, window, cx| handler(event, window, cx));
            }
        }
        let button = if self.on_frame { button } else { raised(button, px(14.), false, live, cx) };
        let cross = if self.on_frame { frame.text } else { colors.text_secondary };
        button.child(icon("x-bold", px(11.), cross))
    }
}

/// A tooltip with Gabarit's look, from a plain text.
pub(crate) trait TooltipText: StatefulInteractiveElement + Sized {
    fn tooltip_text(self, text: impl Into<SharedString>) -> Self {
        let text: SharedString = text.into();
        self.tooltip(move |_window, cx| cx.new(|_| crate::feedback::GTooltip::new(text.clone())).into())
    }
}

impl<T: StatefulInteractiveElement> TooltipText for T {}
