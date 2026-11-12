//! Gabarit's sheet (GabaritApple's `GSheet.swift`): always the title large in the sheet and the cross on the right, on
//! the page's grey, never the dark frame: what tells a sheet from a page (SkollN's rule). What it does ("Create",
//! "Start") is a button in the sheet. Escape closes it.

use std::rc::Rc;
use std::sync::Arc;

use gpui::{
    AnyElement, App, ClickEvent, CursorStyle, ElementId, FocusHandle, IntoElement, KeyDownEvent,
    ParentElement, RenderOnce, Role, SharedString, Styled, Window, div, prelude::*, px,
};

use crate::assets::icon;
use crate::button::{ClickHandler, GCloseButton};
use crate::form::metrics;
use crate::motion::{self, GMotion, GMotionExt};
use crate::relief::{Live, floating_shadow, page_ground, raised};
use crate::theme::{ActiveTheme, GTextExt, alpha, black};
use crate::tokens::{radius, text};

/// A sheet's title (`GSheetTitle`): large in the sheet, its sentence below, the cross on the right; a page pushed in
/// the sheet has the arrow back before the title.
#[derive(IntoElement)]
pub struct GSheetTitle {
    title: SharedString,
    summary: SharedString,
    close: SharedString,
    back: Option<ClickHandler>,
    on_close: Option<ClickHandler>,
}

impl GSheetTitle {
    pub fn new(title: impl Into<SharedString>, summary: impl Into<SharedString>) -> Self {
        GSheetTitle {
            title: title.into(),
            summary: summary.into(),
            close: "Cancel".into(),
            back: None,
            on_close: None,
        }
    }

    pub fn close_label(mut self, label: impl Into<SharedString>) -> Self {
        self.close = label.into();
        self
    }

    pub fn back(mut self, handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static) -> Self {
        self.back = Some(Rc::new(handler));
        self
    }

    pub fn on_close(
        mut self,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_close = Some(Rc::new(handler));
        self
    }
}

impl RenderOnce for GSheetTitle {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let back = self.back.map(|handler| {
            let (rest, hover, press) = (
                colors.track,
                alpha(colors.border, 0.3),
                alpha(colors.border, 0.5),
            );
            let live = Live::new("g-sheet-back", None, true);
            raised(
                div()
                    .id("g-sheet-back")
                    .group("g-sheet-back")
                    .relative()
                    .mt(px(4.))
                    .flex()
                    .flex_none()
                    .items_center()
                    .justify_center()
                    .size(px(30.))
                    .rounded_full()
                    .bg(rest)
                    .cursor(CursorStyle::PointingHand)
                    .role(Role::Button)
                    .aria_label("Back")
                    .hover(move |style| style.bg(hover))
                    .active(move |style| style.bg(press))
                    .on_click(move |event, window, cx| handler(event, window, cx)),
                px(15.),
                false,
                live,
                cx,
            )
            .child(icon("caret-left", px(14.), colors.text_secondary))
        });
        let close = GCloseButton::new("g-sheet-close").label(self.close.clone());
        let close = match self.on_close {
            Some(handler) => close.on_click(move |event, window, cx| handler(event, window, cx)),
            None => close,
        };
        div()
            .flex()
            .items_start()
            .gap(px(16.))
            .w_full()
            .px(px(metrics::SHEET_MARGIN))
            .pt(px(22.))
            .pb(px(8.))
            .children(back)
            .child(
                div()
                    .flex()
                    .flex_col()
                    .flex_1()
                    .gap(px(4.))
                    .child(
                        div()
                            .id("g-sheet-heading")
                            .role(Role::Heading)
                            .aria_level(1)
                            .aria_label(self.title.clone())
                            .g_text(text::TITLE)
                            .text_color(colors.text_primary)
                            .line_clamp(2)
                            .child(gpui::Text::new_inaccessible(self.title)),
                    )
                    .child(
                        div()
                            .g_text(text::CALLOUT)
                            .text_color(colors.text_discret)
                            .child(self.summary),
                    ),
            )
            .child(close)
    }
}

/// A sheet over the window: the page dimmed behind it, the sheet on the page's grey with its title, its cross, and its
/// content (often a `GForm` without its own title). Draw it last in the window's root while it is open; `on_close`
/// says it must go (the cross, Escape, a click on the dimmed page).
#[derive(IntoElement)]
pub struct GSheet {
    id: ElementId,
    title: GSheetTitle,
    content: AnyElement,
    on_close: ClickHandler,
    width: f32,
    closing: bool,
}

impl GSheet {
    pub fn new(
        id: impl Into<ElementId>,
        title: impl Into<SharedString>,
        summary: impl Into<SharedString>,
        on_close: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        let on_close: ClickHandler = Rc::new(on_close);
        let close = on_close.clone();
        GSheet {
            id: id.into(),
            title: GSheetTitle::new(title, summary)
                .on_close(move |event, window, cx| close(event, window, cx)),
            content: div().into_any_element(),
            on_close,
            width: 520.,
            closing: false,
        }
    }

    pub fn close_label(mut self, label: impl Into<SharedString>) -> Self {
        self.title = self.title.close_label(label);
        self
    }

    pub fn back(mut self, handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static) -> Self {
        self.title = self.title.back(handler);
        self
    }

    pub fn child(mut self, content: impl IntoElement) -> Self {
        self.content = content.into_any_element();
        self
    }

    pub fn width(mut self, width: f32) -> Self {
        self.width = width;
        self
    }

    /// It is leaving: its owner keeps drawing it for [`motion::EXIT`] after `on_close`, it fades and sinks away (the
    /// veil with it), and takes no more clicks.
    pub fn closing(mut self, closing: bool) -> Self {
        self.closing = closing;
        self
    }
}

impl RenderOnce for GSheet {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        // The sheet takes the keyboard when it opens: Tab stays in it, Escape closes it.
        let focus = window.use_keyed_state(self.id.clone(), cx, |window, cx| {
            let handle: FocusHandle = cx.focus_handle();
            window.focus(&handle, cx);
            handle
        });
        let focus = focus.read(cx).clone();
        let (escape, outside) = (self.on_close.clone(), self.on_close.clone());
        let panel = page_ground(cx)
            .id("g-sheet")
            .track_focus(&focus)
            .role(Role::Dialog)
            .aria_label(SharedString::from("Sheet"))
            .occlude()
            .flex()
            .flex_col()
            .w(px(self.width))
            .max_h_full()
            .overflow_hidden()
            .rounded(px(radius::XXXL))
            .border_1()
            .border_color(colors.hairline)
            .shadow(floating_shadow())
            .text_color(colors.text_primary)
            .on_key_down(move |event: &KeyDownEvent, window, cx| {
                if event.keystroke.key == "escape" {
                    escape(&ClickEvent::default(), window, cx);
                    cx.stop_propagation();
                }
            })
            .child(self.title)
            .child(div().flex_1().min_h_0().child(self.content));
        // It opens on the panes' spring, rising a little as a slight zoom would, its veil fading in; it leaves
        // quicker, sinking. Less motion: plain fades (`GMotionExt`).
        let named =
            |name: &'static str| ElementId::NamedChild(Arc::new(self.id.clone()), name.into());
        let veil = div()
            .absolute()
            .top_0()
            .left_0()
            .size_full()
            .bg(black(if cx.theme().is_dark() { 0.45 } else { 0.25 }));
        let (veil, panel) = if self.closing {
            (
                veil.g_exit(named("veil-closing"), GMotion::fade(), cx)
                    .into_any_element(),
                panel
                    .g_exit(named("closing"), GMotion::rise(10.), cx)
                    .into_any_element(),
            )
        } else {
            (
                veil.g_enter(named("veil"), GMotion::fade().duration(motion::QUICK), cx)
                    .into_any_element(),
                panel
                    .g_enter(named("opening"), GMotion::present(), cx)
                    .into_any_element(),
            )
        };
        let closing = self.closing;
        div()
            .id(self.id)
            .absolute()
            .top_0()
            .left_0()
            .size_full()
            .flex()
            .flex_col()
            .items_center()
            .pt(px(40.))
            .pb(px(40.))
            .when(!closing, |this| {
                this.on_mouse_down(gpui::MouseButton::Left, move |_, window, cx| {
                    outside(&ClickEvent::default(), window, cx)
                })
            })
            .when(closing, |this| this.occlude())
            .child(veil)
            .child(panel)
    }
}
