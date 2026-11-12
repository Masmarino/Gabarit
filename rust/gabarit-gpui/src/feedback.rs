//! What Gabarit says back (GabaritApple's `GFeedback.swift`): the badge, the banner, the toast, the tooltip, the
//! skeleton, the typing dots, the empty state.

use std::time::Duration;

use gpui::{
    Animation, AnimationExt, App, Context, Entity, Hsla, IntoElement, ParentElement, Render,
    RenderOnce, Role, SharedString, Styled, Task, Window, div, linear_color_stop, linear_gradient,
    prelude::*, px, relative,
};

use crate::assets::icon;
use crate::button::GButton;
use crate::relief::{card, floating_shadow};
use crate::theme::{ActiveTheme, GTextExt, alpha};
use crate::tokens::{radius, spacing, text};

/// A state's tone: a badge, a banner, a message under a field.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GTone {
    Success,
    Warning,
    Error,
    Info,
}

impl GTone {
    pub fn base(self, cx: &App) -> Hsla {
        let colors = &cx.theme().colors;
        match self {
            GTone::Success => colors.success,
            GTone::Warning => colors.warning,
            GTone::Error => colors.error,
            GTone::Info => colors.info,
        }
    }

    /// The translucent ground of a badge in this state.
    pub fn tint(self, cx: &App) -> Hsla {
        alpha(self.base(cx), 0.14)
    }

    /// This state's text on the page: a step darker in light, for a 4.5:1 contrast at least.
    pub fn text(self, cx: &App) -> Hsla {
        let colors = &cx.theme().colors;
        match self {
            GTone::Success => colors.success_text,
            GTone::Warning => colors.warning_text,
            GTone::Error => colors.error_text,
            GTone::Info => colors.info_text,
        }
    }

    /// A readable text on this state's tint (a badge's label).
    pub fn tint_text(self, cx: &App) -> Hsla {
        let colors = &cx.theme().colors;
        match self {
            GTone::Success => colors.success_on_tint,
            GTone::Warning => colors.warning_on_tint,
            GTone::Error => colors.error_on_tint,
            GTone::Info => colors.info_on_tint,
        }
    }

    fn symbol(self) -> &'static str {
        match self {
            GTone::Success => "check-circle",
            GTone::Warning => "warning",
            GTone::Error => "warning-circle",
            GTone::Info => "info",
        }
    }
}

/// A small label: a state's tint, or the hover's veil with no state (`GBadge`).
#[derive(IntoElement)]
pub struct GBadge {
    title: SharedString,
    icon: Option<&'static str>,
    tone: Option<GTone>,
}

impl GBadge {
    pub fn new(title: impl Into<SharedString>) -> Self {
        GBadge {
            title: title.into(),
            icon: None,
            tone: None,
        }
    }

    pub fn icon(mut self, name: &'static str) -> Self {
        self.icon = Some(name);
        self
    }

    pub fn tone(mut self, tone: GTone) -> Self {
        self.tone = Some(tone);
        self
    }
}

impl RenderOnce for GBadge {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let foreground = self
            .tone
            .map_or(colors.text_secondary, |tone| tone.tint_text(cx));
        div()
            .flex()
            .flex_none()
            .items_center()
            .gap(px(4.))
            .px(px(spacing::XS))
            .py(px(spacing::XXS / 2.0))
            .rounded(px(radius::SM))
            .bg(self.tone.map_or(colors.hover, |tone| tone.tint(cx)))
            .text_color(foreground)
            .g_text(text::CAPTION_2)
            .font_weight(gpui::FontWeight::SEMIBOLD)
            .whitespace_nowrap()
            .when_some(self.icon, |this, name| {
                this.child(icon(name, px(11.), foreground))
            })
            .child(self.title)
    }
}

/// A count on an icon, "99+" beyond 99.
pub fn badge_text(count: usize) -> String {
    if count > 99 {
        "99+".into()
    } else {
        count.to_string()
    }
}

/// The unread count: a rust pill with its number, on an avatar or a row.
#[derive(IntoElement)]
pub struct GUnreadBadge {
    count: usize,
}

impl GUnreadBadge {
    pub fn new(count: usize) -> Self {
        GUnreadBadge { count }
    }
}

impl RenderOnce for GUnreadBadge {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let label = badge_text(self.count);
        div()
            .id(SharedString::from(format!("unread-{}", self.count)))
            .role(Role::Status)
            .aria_label(SharedString::from(format!("{label} unread")))
            .flex()
            .flex_none()
            .items_center()
            .justify_center()
            .min_w(px(18.))
            .h(px(18.))
            .px(px(5.))
            .rounded_full()
            .bg(colors.accent)
            .text_color(gpui::white())
            .g_text(text::CAPTION_2)
            .font_weight(gpui::FontWeight::SEMIBOLD)
            .child(gpui::Text::new_inaccessible(label.into()))
    }
}

/// A banner across a page: a state's tint, its icon, a sentence, and what to do about it.
#[derive(IntoElement)]
pub struct GBanner {
    tone: GTone,
    title: SharedString,
    message: Option<SharedString>,
    action: Option<GButton>,
}

impl GBanner {
    pub fn new(tone: GTone, title: impl Into<SharedString>) -> Self {
        GBanner {
            tone,
            title: title.into(),
            message: None,
            action: None,
        }
    }

    pub fn message(mut self, message: impl Into<SharedString>) -> Self {
        self.message = Some(message.into());
        self
    }

    pub fn action(mut self, button: GButton) -> Self {
        self.action = Some(button);
        self
    }
}

impl RenderOnce for GBanner {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let tone = self.tone;
        div()
            .id(SharedString::from(format!("banner-{}", self.title)))
            .role(Role::Alert)
            .aria_label(self.title.clone())
            .flex()
            .items_center()
            .gap(px(12.))
            .px(px(14.))
            .py(px(10.))
            .rounded(px(radius::MD))
            .bg(alpha(tone.base(cx), 0.1))
            .border_1()
            .border_color(alpha(tone.base(cx), 0.35))
            .child(icon(tone.symbol(), px(16.), tone.text(cx)))
            .child(
                div()
                    .flex()
                    .flex_col()
                    .flex_1()
                    .gap(px(2.))
                    .child(
                        div()
                            .g_text(text::HEADLINE)
                            .text_color(colors.text_primary)
                            .child(self.title),
                    )
                    .when_some(self.message, |this, message| {
                        this.child(
                            div()
                                .g_text(text::CALLOUT)
                                .text_color(colors.text_secondary)
                                .child(message),
                        )
                    }),
            )
            .children(self.action)
    }
}

/// A passing message, as it shows: the ink of a primary button, a floating shadow (`GToast`).
#[derive(IntoElement)]
pub struct GToastView {
    text: SharedString,
    icon: &'static str,
}

impl GToastView {
    pub fn new(text: impl Into<SharedString>, icon: &'static str) -> Self {
        GToastView {
            text: text.into(),
            icon,
        }
    }
}

impl RenderOnce for GToastView {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        div()
            .id("g-toast")
            .role(Role::Status)
            .aria_label(self.text.clone())
            .flex()
            .flex_none()
            .items_center()
            .gap(px(8.))
            .px(px(spacing::LG))
            .py(px(spacing::SM))
            .rounded(px(radius::MD))
            .bg(colors.primary)
            .shadow(floating_shadow())
            .text_color(colors.on_primary)
            .g_text(text::SUBHEADLINE)
            .font_weight(gpui::FontWeight::MEDIUM)
            .child(icon(self.icon, px(13.), colors.on_primary))
            .child(gpui::Text::new_inaccessible(self.text))
    }
}

/// A window's passing messages: one at a time, gone after a few seconds (`GToastCenter`). Hold it in an entity; draw
/// `toast_center.read(cx).view()` at the bottom of the window.
pub struct GToastCenter {
    current: Option<(SharedString, &'static str)>,
    dismissal: Option<Task<()>>,
}

impl GToastCenter {
    pub fn new() -> Self {
        GToastCenter {
            current: None,
            dismissal: None,
        }
    }

    pub fn show(
        &mut self,
        text: impl Into<SharedString>,
        icon: &'static str,
        cx: &mut Context<Self>,
    ) {
        self.current = Some((text.into(), icon));
        self.dismissal = Some(cx.spawn(async move |this, cx| {
            cx.background_executor()
                .timer(Duration::from_millis(2500))
                .await;
            this.update(cx, |this, cx| {
                this.current = None;
                cx.notify();
            })
            .ok();
        }));
        cx.notify();
    }

    pub fn dismiss(&mut self, cx: &mut Context<Self>) {
        self.current = None;
        self.dismissal = None;
        cx.notify();
    }
}

impl Default for GToastCenter {
    fn default() -> Self {
        Self::new()
    }
}

impl Render for GToastCenter {
    fn render(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
        // Over the bottom of the window, centred; it rises into place.
        div()
            .absolute()
            .bottom(px(spacing::XXL))
            .left_0()
            .right_0()
            .flex()
            .justify_center()
            .children(self.current.clone().map(|(text, icon)| {
                div()
                    .id(SharedString::from(format!("toast-{text}")))
                    .child(GToastView::new(text, icon))
                    .with_animation(
                        "g-toast-in",
                        Animation::new(Duration::from_millis(250))
                            .with_easing(gpui::ease_out_quint()),
                        |this, delta| this.relative().top(px(24. * (1. - delta))).opacity(delta),
                    )
            }))
    }
}

/// A tooltip: a small card in the caption style.
pub struct GTooltip {
    text: SharedString,
}

impl GTooltip {
    pub fn new(text: impl Into<SharedString>) -> Self {
        GTooltip { text: text.into() }
    }
}

impl Render for GTooltip {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let colors = cx.theme().colors;
        div()
            .px(px(8.))
            .py(px(4.))
            .rounded(px(radius::SM))
            .bg(colors.surface)
            .border_1()
            .border_color(colors.hairline)
            .shadow(floating_shadow())
            .g_text(text::CAPTION)
            .text_color(colors.text_secondary)
            .child(self.text.clone())
    }
}

/// A placeholder while content loads: a soft shape with a slow shimmer (still when motion is reduced).
#[derive(IntoElement)]
pub struct GSkeleton {
    id: SharedString,
    height: f32,
    radius: f32,
}

impl GSkeleton {
    pub fn new(id: impl Into<SharedString>, height: f32) -> Self {
        GSkeleton {
            id: id.into(),
            height,
            radius: radius::SM,
        }
    }

    pub fn radius(mut self, radius: f32) -> Self {
        self.radius = radius;
        self
    }
}

impl RenderOnce for GSkeleton {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let still = cx.theme().reduce_motion;
        let shimmer = alpha(colors.surface, 0.6);
        div()
            .relative()
            .overflow_hidden()
            .h(px(self.height))
            .w_full()
            .rounded(px(self.radius))
            .bg(colors.track)
            .when(!still, |this| {
                // A band of light, rising then falling, that crosses the shape (in two halves: GPUI's gradients
                // have two stops).
                let half = |rising: bool| {
                    let (from, to) = if rising {
                        (alpha(shimmer, 0.0), shimmer)
                    } else {
                        (shimmer, alpha(shimmer, 0.0))
                    };
                    div().h_full().w(relative(0.5)).bg(linear_gradient(
                        90.0,
                        linear_color_stop(from, 0.0),
                        linear_color_stop(to, 1.0),
                    ))
                };
                this.child(
                    div()
                        .absolute()
                        .top_0()
                        .h_full()
                        .w(relative(0.6))
                        .flex()
                        .child(half(true))
                        .child(half(false))
                        .with_animation(
                            SharedString::from(format!("{}-shimmer", self.id)),
                            Animation::new(Duration::from_millis(1400)).repeat(),
                            |this, delta| this.left(relative(1.4 * delta - 0.6)),
                        ),
                )
            })
    }
}

/// Three dots that wave while an answer is being written. `label`: what a screen reader says.
#[derive(IntoElement)]
pub struct GTypingDots {
    label: SharedString,
}

impl GTypingDots {
    pub fn new(label: impl Into<SharedString>) -> Self {
        GTypingDots {
            label: label.into(),
        }
    }
}

impl RenderOnce for GTypingDots {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let accent = cx.theme().colors.accent;
        let still = cx.theme().reduce_motion;
        div()
            .id("g-typing")
            .role(Role::Status)
            .aria_label(self.label)
            .flex()
            .items_center()
            .gap(px(4.))
            .h(px(12.))
            .children((0..3).map(move |index| {
                let dot = div().size(px(6.)).rounded_full().bg(accent).relative();
                if still {
                    dot.opacity(0.6).into_any_element()
                } else {
                    dot.with_animation(
                        ("g-typing-dot", index as usize),
                        Animation::new(Duration::from_millis(1047)).repeat(),
                        move |this, delta| {
                            let wave = ((delta * std::f32::consts::TAU - index as f32 * 0.9).sin()
                                + 1.0)
                                / 2.0;
                            this.opacity(0.35 + 0.65 * wave).top(px(-3. * wave))
                        },
                    )
                    .into_any_element()
                }
            }))
    }
}

/// An empty page: an icon in a framed square, a title, a sentence, and what to do (a primary button).
#[derive(IntoElement)]
pub struct GEmptyState {
    icon: &'static str,
    title: SharedString,
    message: SharedString,
    action: Option<GButton>,
}

impl GEmptyState {
    pub fn new(
        icon: &'static str,
        title: impl Into<SharedString>,
        message: impl Into<SharedString>,
    ) -> Self {
        GEmptyState {
            icon,
            title: title.into(),
            message: message.into(),
            action: None,
        }
    }

    pub fn action(mut self, button: GButton) -> Self {
        self.action = Some(button);
        self
    }
}

impl RenderOnce for GEmptyState {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        div()
            .flex()
            .flex_col()
            .items_center()
            .justify_center()
            .gap(px(spacing::XL))
            .size_full()
            .child(
                card(px(radius::LG), cx)
                    .flex()
                    .items_center()
                    .justify_center()
                    .size(px(80.))
                    .child(icon(self.icon, px(32.), colors.text_secondary)),
            )
            .child(
                div()
                    .flex()
                    .flex_col()
                    .items_center()
                    .gap(px(spacing::XS))
                    .child(
                        div()
                            .id("g-empty-title")
                            .role(Role::Heading)
                            .aria_label(self.title.clone())
                            .g_text(text::TITLE_3)
                            .text_color(colors.text_primary)
                            .child(gpui::Text::new_inaccessible(self.title)),
                    )
                    .child(
                        div()
                            .max_w(px(320.))
                            .text_center()
                            .g_text(text::SUBHEADLINE)
                            .text_color(colors.text_secondary)
                            .child(self.message),
                    ),
            )
            .children(self.action)
    }
}

/// Keeps `Entity` in the public surface for toasts.
pub type GToasts = Entity<GToastCenter>;
