//! Gabarit's menus (GabaritApple's `GMenus.swift`): a bubble of flat lines on the surface, split by a fine line; the
//! line under the pointer under the veil; a tick in rust; a destructive line in red. A context menu opens one where
//! the right button was pressed.

use std::rc::Rc;

use gpui::{
    AnyElement, App, ClickEvent, CursorStyle, ElementId, Entity, IntoElement, MouseButton,
    ParentElement, Pixels, Point, RenderOnce, Role, SharedString, Styled, Window, anchored,
    deferred, div, prelude::*, px,
};

use crate::assets::icon;
use crate::button::ClickHandler;
use crate::relief::{GPointer, floating_shadow};
use crate::theme::{ActiveTheme, GTextExt};
use crate::tokens::{radius, text};

/// A line of a menu: its icon and its name; a tick on the right for a setting that turns on or off.
#[derive(IntoElement)]
pub struct GMenuItem {
    id: ElementId,
    title: SharedString,
    icon: Option<&'static str>,
    destructive: bool,
    checked: Option<bool>,
    disabled: bool,
    preview: Option<GPointer>,
    on_click: Option<ClickHandler>,
}

impl GMenuItem {
    pub fn new(id: impl Into<ElementId>, title: impl Into<SharedString>) -> Self {
        GMenuItem {
            id: id.into(),
            title: title.into(),
            icon: None,
            destructive: false,
            checked: None,
            disabled: false,
            preview: None,
            on_click: None,
        }
    }

    pub fn icon(mut self, name: &'static str) -> Self {
        self.icon = Some(name);
        self
    }

    pub fn destructive(mut self) -> Self {
        self.destructive = true;
        self
    }

    pub fn checked(mut self, checked: bool) -> Self {
        self.checked = Some(checked);
        self
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
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

impl RenderOnce for GMenuItem {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let foreground = if self.destructive {
            colors.error_text
        } else {
            colors.text_primary
        };
        let (hover, press) = (colors.hover, colors.press);
        let ground = match self.preview {
            Some(GPointer::Pressed) => press,
            Some(GPointer::Hover) => hover,
            None => crate::theme::alpha(hover, 0.0),
        };
        div()
            .id(self.id)
            .flex()
            .items_center()
            .gap(px(10.))
            .px(px(14.))
            .py(px(12.))
            .w_full()
            .bg(ground)
            .text_color(foreground)
            .g_text(text::BODY)
            .role(Role::MenuItem)
            .aria_label(self.title.clone())
            .when_some(self.checked, |this, checked| this.aria_selected(checked))
            .when(self.disabled, |this| {
                this.opacity(crate::tokens::opacity::DISABLED)
            })
            .when(!self.disabled && self.preview.is_none(), |this| {
                this.cursor(CursorStyle::PointingHand)
                    .hover(move |style| style.bg(hover))
                    .active(move |style| style.bg(press))
                    .when_some(self.on_click, |this, handler| {
                        this.on_click(move |event, window, cx| handler(event, window, cx))
                    })
            })
            .when_some(self.icon, |this, name| {
                this.child(div().w(px(20.)).flex().justify_center().child(icon(
                    name,
                    px(15.),
                    foreground,
                )))
            })
            .child(div().flex_1().child(self.title))
            .when_some(self.checked, |this, checked| {
                // Always there, hidden when unticked: the lines keep the same width.
                this.child(
                    div()
                        .w(px(16.))
                        .opacity(if checked { 1. } else { 0. })
                        .child(icon("check", px(14.), colors.accent)),
                )
            })
    }
}

/// A bubble menu: flat lines on the surface, split by a fine line, a floating shadow.
#[derive(IntoElement)]
pub struct GMenu {
    items: Vec<AnyElement>,
    min_width: Pixels,
}

impl GMenu {
    pub fn new() -> Self {
        GMenu {
            items: Vec::new(),
            min_width: px(240.),
        }
    }

    pub fn item(mut self, item: impl IntoElement) -> Self {
        self.items.push(item.into_any_element());
        self
    }

    pub fn min_width(mut self, width: Pixels) -> Self {
        self.min_width = width;
        self
    }
}

impl Default for GMenu {
    fn default() -> Self {
        Self::new()
    }
}

impl RenderOnce for GMenu {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let count = self.items.len();
        div()
            .id("g-menu")
            .role(Role::Menu)
            .flex()
            .flex_col()
            .min_w(self.min_width)
            .rounded(px(radius::MD))
            .overflow_hidden()
            .bg(colors.surface)
            .border_1()
            .border_color(colors.hairline)
            .shadow(floating_shadow())
            .children(
                self.items
                    .into_iter()
                    .enumerate()
                    .flat_map(move |(index, item)| {
                        let line = (index > 0 && index < count).then(|| {
                            div()
                                .h(px(1.))
                                .w_full()
                                .bg(colors.hairline)
                                .into_any_element()
                        });
                        line.into_iter().chain([item])
                    }),
            )
    }
}

/// Where a context menu is open, held by the element that opens it.
#[derive(Default)]
pub struct GContextMenuState {
    position: Option<Point<Pixels>>,
}

/// A context menu on what it wraps: the right button (or Ctrl-click on the Mac) opens `menu` there; a click
/// elsewhere, a choice or Escape closes it.
#[derive(IntoElement)]
pub struct GContextMenu {
    id: ElementId,
    child: AnyElement,
    menu: Rc<dyn Fn(Rc<dyn Fn(&mut Window, &mut App)>, &mut Window, &mut App) -> GMenu>,
}

impl GContextMenu {
    /// `menu` builds the menu each time it opens; its argument closes it (call it from a line's action).
    pub fn new(
        id: impl Into<ElementId>,
        child: impl IntoElement,
        menu: impl Fn(Rc<dyn Fn(&mut Window, &mut App)>, &mut Window, &mut App) -> GMenu + 'static,
    ) -> Self {
        GContextMenu {
            id: id.into(),
            child: child.into_any_element(),
            menu: Rc::new(menu),
        }
    }
}

impl RenderOnce for GContextMenu {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let state: Entity<GContextMenuState> =
            window.use_keyed_state(self.id.clone(), cx, |_, _| GContextMenuState::default());
        let position = state.read(cx).position;
        let close: Rc<dyn Fn(&mut Window, &mut App)> = {
            let state = state.clone();
            Rc::new(move |_, cx| {
                state.update(cx, |state, cx| {
                    state.position = None;
                    cx.notify();
                })
            })
        };
        let open = state.clone();
        div()
            .id(self.id)
            .on_mouse_down(MouseButton::Right, move |event, _, cx| {
                open.update(cx, |state, cx| {
                    state.position = Some(event.position);
                    cx.notify();
                });
                cx.stop_propagation();
            })
            .child(self.child)
            .when_some(position, |this, position| {
                let menu = (self.menu)(close.clone(), window, cx);
                let dismiss = close.clone();
                let escape = close.clone();
                this.child(deferred(
                    anchored()
                        .position(position)
                        .snap_to_window_with_margin(px(8.))
                        .child(
                            div()
                                .id("g-context-menu")
                                .occlude()
                                .on_mouse_down_out(move |_, window, cx| dismiss(window, cx))
                                .on_key_down(move |event, window, cx| {
                                    if event.keystroke.key == "escape" {
                                        escape(window, cx)
                                    }
                                })
                                .child(menu),
                        ),
                ))
            })
    }
}
