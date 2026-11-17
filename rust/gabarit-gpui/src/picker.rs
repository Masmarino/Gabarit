//! A choice among options (GabaritApple's `GPicker`): the title on the left, Gabarit's menu or chips on the right.
//! The menu: the current choice in a field, the two arrows on the right; the list opens below it as Gabarit's menu
//! (`GMenu`), the current choice ticked and lit; the arrows move along it, Return chooses, Escape closes.

use std::rc::Rc;
use std::sync::Arc;

use gpui::{
    App, CursorStyle, ElementId, IntoElement, KeyDownEvent, ParentElement, RenderOnce, Role,
    SharedString, Styled, Window, div, prelude::*, px,
};

use crate::assets::icon;
use crate::button::metrics;
use crate::controls::{ChangeHandler, row_label};
use crate::glass::{GMaterial, accent_glass, control_glass, hover_light, thin_glass_ink};
use crate::menu::{
    GMenu, GMenuItem, GMenuPlacement, host_closer, host_open, host_overlay, host_state,
    trigger_probe,
};
use crate::motion;
use crate::relief::{GPointer, Live};
use crate::theme::{ActiveTheme, GTextExt, alpha, black, white};
use crate::tokens::{opacity, radius, text};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum GPickerStyle {
    /// The current choice in a capsule of liquid glass (4.1), the list in a menu.
    #[default]
    Menu,
    /// Chips side by side (4.1: thin liquid glass), the current one in liquid glass tinted with the accent.
    Chips,
}

/// A choice among options: `GPicker::new("theme", "Appearance", options, current)`.
#[derive(IntoElement)]
pub struct GPicker {
    id: ElementId,
    title: SharedString,
    detail: Option<SharedString>,
    options: Vec<SharedString>,
    selected: usize,
    style: GPickerStyle,
    disabled: bool,
    preview: Option<GPointer>,
    on_change: Option<ChangeHandler<usize>>,
}

impl GPicker {
    pub fn new(
        id: impl Into<ElementId>,
        title: impl Into<SharedString>,
        options: impl IntoIterator<Item = impl Into<SharedString>>,
        selected: usize,
    ) -> Self {
        GPicker {
            id: id.into(),
            title: title.into(),
            detail: None,
            options: options.into_iter().map(Into::into).collect(),
            selected,
            style: GPickerStyle::Menu,
            disabled: false,
            preview: None,
            on_change: None,
        }
    }

    pub fn chips(mut self) -> Self {
        self.style = GPickerStyle::Chips;
        self
    }

    /// A sentence under the title, like a switch's.
    pub fn detail(mut self, detail: impl Into<SharedString>) -> Self {
        self.detail = Some(detail.into());
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

    pub fn on_change(mut self, handler: impl Fn(&usize, &mut Window, &mut App) + 'static) -> Self {
        self.on_change = Some(Rc::new(move |value, window, cx| {
            handler(&value, window, cx)
        }));
        self
    }

    fn menu_field(&self, window: &mut Window, cx: &mut App) -> impl IntoElement + use<> {
        let colors = cx.theme().colors;
        let state = host_state(self.id.clone(), window, cx);
        let open = state.read(cx).is_open();
        let live = Live::new("g-menu-face", self.preview, !self.disabled);
        // 4.1: a capsule of liquid glass, as a secondary button; open, an accent outline.
        let shape = px(radius::PILL);
        let (held, press) = motion::use_press(
            ElementId::NamedChild(Arc::new(self.id.clone()), "g-menu-face".into()),
            window,
            cx,
        );
        let pressed = live.pressed() || (live.follows() && held);
        let current = self
            .options
            .get(self.selected)
            .cloned()
            .unwrap_or_else(|| "—".into());
        let count = self.options.len();
        let selected = self.selected;
        let veil = hover_light(cx);
        let mut face = div()
            .id("g-menu-face")
            .group("g-menu-face")
            .relative()
            .flex()
            .flex_none()
            .items_center()
            .gap(px(8.))
            .h(px(metrics::COMPACT))
            .pl(px(13.))
            .pr(px(10.))
            .rounded(shape)
            .when(open, |this| {
                this.border(px(1.5)).border_color(colors.accent)
            })
            .role(Role::ComboBox)
            .aria_label(self.title.clone())
            .aria_value(current.clone())
            .aria_expanded(open)
            .when(self.disabled, |this| this.opacity(opacity::DISABLED))
            .child(control_glass(
                "g-menu-face-glass",
                GMaterial::liquid(),
                shape,
                pressed,
                cx,
            ))
            .child(
                div()
                    .id("g-menu-face-veil")
                    .absolute()
                    .top_0()
                    .left_0()
                    .size_full()
                    .rounded(shape)
                    .when(live.hovered() && !pressed, |this| this.bg(veil))
                    .when(live.follows(), |this| {
                        this.group_hover("g-menu-face", move |style| style.bg(veil))
                    }),
            );
        if live.follows() {
            let toggle = state.clone();
            let close = host_closer(&state);
            let keys = state.clone();
            let on_change = self.on_change.clone();
            face = motion::on_press(face, &press)
                .cursor(CursorStyle::PointingHand)
                .focusable()
                .tab_stop(true)
                .focus_visible(move |style| {
                    style.border_2().border_color(alpha(colors.accent, 0.8))
                })
                .on_click(move |_, window, cx| {
                    if toggle.read(cx).is_open() {
                        close(window, cx);
                    } else {
                        host_open(&toggle, None, window, cx);
                    }
                })
                // As the Mac's pop-up button: the arrows change the choice with the list closed; Return or Space
                // opens it (the list then has the keyboard).
                .on_key_down(move |event: &KeyDownEvent, window, cx| {
                    if keys.read(cx).is_open() {
                        return;
                    }
                    let step = match event.keystroke.key.as_str() {
                        "up" => -1,
                        "down" => 1,
                        "enter" | "space" => {
                            host_open(&keys, None, window, cx);
                            cx.stop_propagation();
                            return;
                        }
                        _ => return,
                    };
                    if let Some(handler) = on_change.as_ref() {
                        handler(
                            (selected as i64 + step).clamp(0, count as i64 - 1) as usize,
                            window,
                            cx,
                        );
                    }
                    cx.stop_propagation();
                });
        }
        let face = face
            .child(
                div()
                    .relative()
                    .g_text(text::BODY)
                    .text_color(colors.ink)
                    .whitespace_nowrap()
                    .child(current),
            )
            .child(icon("caret-up-down", px(12.), colors.ink_3).relative())
            .child(trigger_probe(&state, cx));

        let list = if state.read(cx).open {
            let menu = GMenu::new()
                .items(self.options.iter().enumerate().map(|(index, title)| {
                    let choose = self.on_change.clone();
                    GMenuItem::new(("g-menu-row", index), title.clone())
                        .checked(index == selected)
                        .on_click(move |_, window, cx| {
                            if let Some(handler) = choose.as_ref() {
                                handler(index, window, cx);
                            }
                        })
                }))
                .highlight(Some(selected))
                .max_height(px(340.));
            host_overlay(&state, menu, GMenuPlacement::Below, window, cx)
        } else {
            None
        };
        // Its own id around the face: two pickers side by side in a container without one would share the face's
        // (`g-menu-face`), and only one of them would take clicks.
        div()
            .id(self.id.clone())
            .relative()
            .flex_none()
            .child(face)
            .children(list)
    }

    /// The chips (4.1): capsules of thin liquid glass, the chosen one in liquid glass tinted with the accent; held
    /// down, a chip lights and grows on the bouncy spring.
    fn chip_row(&self, window: &mut Window, cx: &mut App) -> impl IntoElement + use<> {
        let colors = cx.theme().colors;
        let shape = px(radius::PILL);
        let disabled = self.disabled;
        let (accent, accent_text) = accent_glass(cx);
        let rest_ink = thin_glass_ink(cx);
        let id = self.id.clone();
        div()
            .id(self.id.clone())
            .role(Role::RadioGroup)
            .aria_label(self.title.clone())
            .flex()
            .flex_none()
            .gap(px(6.))
            .when(disabled, |this| this.opacity(opacity::DISABLED))
            .children(self.options.iter().enumerate().map(|(index, title)| {
                let current = index == self.selected;
                let live = Live::new("g-chip", self.preview, !disabled);
                let (held, press) = motion::use_press(
                    ElementId::NamedChild(Arc::new(id.clone()), format!("g-chip-{index}").into()),
                    window,
                    cx,
                );
                let pressed = live.pressed() || (live.follows() && held);
                let (material, foreground) = if current {
                    (accent, accent_text)
                } else if live.hovered() || pressed {
                    (GMaterial::liquid_thin(), colors.ink)
                } else {
                    (GMaterial::liquid_thin(), rest_ink)
                };
                let veil = if current {
                    if accent_text.l > 0.5 {
                        black(0.1)
                    } else {
                        white(0.14)
                    }
                } else {
                    hover_light(cx)
                };
                let mut chip = div()
                    .id(("g-chip", index))
                    .group("g-chip")
                    .relative()
                    .flex()
                    .items_center()
                    .h(px(metrics::COMPACT))
                    .px(px(13.))
                    .rounded(shape)
                    .g_text(text::CALLOUT)
                    .font_weight(if current {
                        gpui::FontWeight::SEMIBOLD
                    } else {
                        gpui::FontWeight::MEDIUM
                    })
                    .text_color(foreground)
                    .role(Role::RadioButton)
                    .aria_label(title.clone())
                    .aria_selected(current)
                    .child(control_glass(
                        ("g-chip-glass", index),
                        material,
                        shape,
                        pressed,
                        cx,
                    ))
                    .child(
                        div()
                            .id("g-chip-veil")
                            .absolute()
                            .top_0()
                            .left_0()
                            .size_full()
                            .rounded(shape)
                            .when(live.hovered() && !pressed, |this| this.bg(veil))
                            .when(live.follows(), |this| {
                                this.group_hover("g-chip", move |style| style.bg(veil))
                            }),
                    );
                if live.follows() {
                    let ink = colors.ink;
                    chip = motion::on_press(
                        chip.cursor(CursorStyle::PointingHand)
                            .focusable()
                            .tab_stop(true)
                            .when(!current, |this| {
                                this.hover(move |style| style.text_color(ink))
                            })
                            .focus_visible(move |style| {
                                style.border_2().border_color(alpha(colors.accent, 0.8))
                            })
                            .when_some(self.on_change.clone(), |this, handler| {
                                this.on_click(move |_, window, cx| handler(index, window, cx))
                            }),
                        &press,
                    );
                }
                chip.child(div().relative().child(title.clone()))
            }))
    }
}

impl RenderOnce for GPicker {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let label = (!self.title.is_empty())
            .then(|| row_label(self.title.clone(), self.detail.clone(), cx));
        match self.style {
            // Chips always below their title: the rows of a card line up, whatever their width.
            GPickerStyle::Chips => {
                let chips = self.chip_row(window, cx);
                div()
                    .flex()
                    .flex_col()
                    .gap(px(10.))
                    .w_full()
                    .children(label)
                    .child(chips)
                    .into_any_element()
            }
            GPickerStyle::Menu => {
                let menu = self.menu_field(window, cx);
                div()
                    .flex()
                    .items_center()
                    .gap(px(12.))
                    .w_full()
                    .children(label)
                    .child(menu)
                    .into_any_element()
            }
        }
    }
}
