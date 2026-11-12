//! A choice among options (GabaritApple's `GPicker`): the title on the left, Gabarit's menu or chips on the right.
//! The menu: the current choice in a field, the two arrows on the right; the list opens in a bubble below it, the
//! current choice ticked in rust; the arrows move along it, Return chooses, Escape closes.

use std::rc::Rc;

use gpui::{
    App, CursorStyle, ElementId, Entity, IntoElement, KeyDownEvent, ParentElement, RenderOnce,
    Role, SharedString, Styled, Window, anchored, deferred, div, point, prelude::*, px,
};

use crate::assets::icon;
use crate::button::metrics;
use crate::controls::{ChangeHandler, row_label};
use crate::relief::{GPointer, Live, glow_through, over, raised, raised_shadow};
use crate::theme::{ActiveTheme, GTextExt, alpha};
use crate::tokens::{opacity, radius, text};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum GPickerStyle {
    /// The current choice in a field, the list in a bubble.
    #[default]
    Menu,
    /// Chips side by side: the current one tinted rust.
    Chips,
}

/// The open list's state, held by the picker.
#[derive(Default)]
struct MenuState {
    open: bool,
    highlighted: Option<usize>,
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
        let state: Entity<MenuState> =
            window.use_keyed_state(self.id.clone(), cx, |_, _| MenuState::default());
        let open = state.read(cx).open;
        let highlighted = state.read(cx).highlighted;
        let live = Live::new("g-menu-face", self.preview, !self.disabled);
        let shape = px(radius::SM);
        let current = self
            .options
            .get(self.selected)
            .cloned()
            .unwrap_or_else(|| "—".into());
        let count = self.options.len();
        let selected = self.selected;
        let rim = if open {
            colors.accent
        } else if live.hovered() {
            alpha(colors.border, 0.7)
        } else {
            colors.hairline
        };
        let ground = if live.pressed() {
            over(colors.background, colors.press)
        } else if live.hovered() {
            over(colors.background, colors.hover)
        } else {
            colors.background
        };
        let mut face = div()
            .id("g-menu-face")
            .group("g-menu-face")
            .relative()
            .flex()
            .flex_none()
            .items_center()
            .gap(px(8.))
            .h(px(metrics::COMPACT))
            .pl(px(10.))
            .pr(px(8.))
            .rounded(shape)
            .bg(ground)
            .border(px(if open { 1.5 } else { 1. }))
            .border_color(rim)
            .role(Role::ComboBox)
            .aria_label(self.title.clone())
            .aria_value(current.clone())
            .aria_expanded(open)
            .when(self.disabled, |this| this.opacity(opacity::DISABLED));
        if live.follows() {
            let (hover, press) = (
                over(colors.background, colors.hover),
                over(colors.background, colors.press),
            );
            let hover_rim = if open {
                colors.accent
            } else {
                alpha(colors.border, 0.7)
            };
            let hover_shadow = raised_shadow(true, cx);
            let toggle = state.clone();
            let keys = state.clone();
            let on_change = self.on_change.clone();
            face = face
                .cursor(CursorStyle::PointingHand)
                .focusable()
                .tab_stop(true)
                .hover(move |style| style.bg(hover).border_color(hover_rim).shadow(hover_shadow))
                .active(move |style| style.bg(press).shadow(vec![]))
                .on_click(move |_, _, cx| {
                    toggle.update(cx, |state, cx| {
                        state.open = !state.open;
                        state.highlighted = Some(selected);
                        cx.notify();
                    })
                })
                // As the Mac's pop-up button: the arrows change the choice with the list closed; open, they move
                // along it, Return chooses, Escape closes.
                .on_key_down(move |event: &KeyDownEvent, window, cx| {
                    let (open, highlighted) = {
                        let state = keys.read(cx);
                        (state.open, state.highlighted)
                    };
                    let step = match event.keystroke.key.as_str() {
                        "up" => -1,
                        "down" => 1,
                        "enter" | "space" if open => {
                            if let (Some(index), Some(handler)) = (highlighted, on_change.as_ref())
                            {
                                handler(index, window, cx);
                            }
                            keys.update(cx, |state, cx| {
                                state.open = false;
                                cx.notify();
                            });
                            return;
                        }
                        "escape" if open => {
                            keys.update(cx, |state, cx| {
                                state.open = false;
                                cx.notify();
                            });
                            return;
                        }
                        _ => return,
                    };
                    if open {
                        keys.update(cx, |state, cx| {
                            let next = (state.highlighted.unwrap_or(selected) as i64 + step)
                                .clamp(0, count as i64 - 1);
                            state.highlighted = Some(next as usize);
                            cx.notify();
                        });
                    } else if let Some(handler) = on_change.as_ref() {
                        handler(
                            (selected as i64 + step).clamp(0, count as i64 - 1) as usize,
                            window,
                            cx,
                        );
                    }
                });
        }
        let face = if open {
            face
        } else {
            raised(face, shape, false, live, cx)
        };
        let face = face
            .child(
                div()
                    .relative()
                    .g_text(text::BODY)
                    .text_color(colors.text_primary)
                    .whitespace_nowrap()
                    .child(current),
            )
            .child(icon("caret-up-down", px(12.), colors.text_discret));

        let list = open.then(|| {
            let close = state.clone();
            let hover_state = state.clone();
            let on_change = self.on_change.clone();
            let rows = self.options.iter().enumerate().map(move |(index, title)| {
                let checked = index == selected;
                let lit = highlighted == Some(index);
                let choose = on_change.clone();
                let close = close.clone();
                let hover_state = hover_state.clone();
                div()
                    .id(("g-menu-row", index))
                    .flex()
                    .items_center()
                    .gap(px(10.))
                    .px(px(14.))
                    .py(px(9.))
                    .when(index > 0, |this| {
                        this.border_t_1().border_color(colors.hairline)
                    })
                    .bg(if lit {
                        colors.hover
                    } else {
                        alpha(colors.hover, 0.0)
                    })
                    .cursor(CursorStyle::PointingHand)
                    .role(Role::MenuItemRadio)
                    .aria_label(title.clone())
                    .aria_selected(checked)
                    // The pointer moves the keyboard's line too: one lit line.
                    .on_hover(move |hovered, _, cx| {
                        if *hovered {
                            hover_state.update(cx, |state, cx| {
                                state.highlighted = Some(index);
                                cx.notify();
                            });
                        }
                    })
                    .on_click(move |_, window, cx| {
                        if let Some(handler) = choose.as_ref() {
                            handler(index, window, cx);
                        }
                        close.update(cx, |state, cx| {
                            state.open = false;
                            cx.notify();
                        });
                    })
                    .child(
                        div()
                            .flex_1()
                            .g_text(text::BODY)
                            .when(checked, |this| this.font_weight(gpui::FontWeight::SEMIBOLD))
                            .text_color(colors.text_primary)
                            .child(title.clone()),
                    )
                    .child(div().opacity(if checked { 1. } else { 0. }).child(icon(
                        "check",
                        px(13.),
                        colors.accent,
                    )))
            });
            let dismiss = state.clone();
            deferred(
                anchored()
                    .offset(point(px(0.), px(metrics::COMPACT + 4.)))
                    .snap_to_window_with_margin(px(8.))
                    .child(
                        div()
                            .id("g-menu-list")
                            .occlude()
                            .role(Role::ListBox)
                            .min_w(px(220.))
                            .max_h(px(340.))
                            .overflow_y_scroll()
                            .rounded(px(radius::MD))
                            .bg(colors.surface)
                            .border_1()
                            .border_color(colors.hairline)
                            .shadow(crate::relief::floating_shadow())
                            .on_mouse_down_out(move |_, _, cx| {
                                dismiss.update(cx, |state, cx| {
                                    state.open = false;
                                    cx.notify();
                                })
                            })
                            .children(rows),
                    ),
            )
            .with_priority(1)
        });
        div().relative().flex_none().child(face).children(list)
    }

    fn chip_row(&self, cx: &mut App) -> impl IntoElement + use<> {
        let colors = cx.theme().colors;
        let shape = px(radius::SM);
        let disabled = self.disabled;
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
                // A chosen chip is a tint only, as on the Mac: the page shows through it.
                let ground = if current {
                    colors.selected_fill
                } else {
                    colors.background
                };
                let pressed_ground = over(ground, colors.press);
                let hover_ground = if current {
                    ground
                } else {
                    over(ground, colors.hover)
                };
                let rim = if current {
                    alpha(colors.accent, 0.7)
                } else if live.hovered() {
                    alpha(colors.border, 0.5)
                } else {
                    colors.hairline
                };
                let foreground = if current {
                    colors.accent_text
                } else if live.hovered() {
                    colors.text_primary
                } else {
                    colors.text_secondary
                };
                let mut chip = div()
                    .id(("g-chip", index))
                    .group("g-chip")
                    .relative()
                    .flex()
                    .items_center()
                    .h(px(metrics::COMPACT))
                    .px(px(12.))
                    .rounded(shape)
                    .bg(if live.pressed() {
                        pressed_ground
                    } else if live.hovered() {
                        hover_ground
                    } else {
                        ground
                    })
                    .border_1()
                    .border_color(rim)
                    .g_text(text::CALLOUT)
                    .font_weight(if current {
                        gpui::FontWeight::SEMIBOLD
                    } else {
                        gpui::FontWeight::MEDIUM
                    })
                    .text_color(foreground)
                    .role(Role::RadioButton)
                    .aria_label(title.clone())
                    .aria_selected(current);
                // The current chip glows a little; the others are raised.
                let glow_shadow = vec![glow_through(
                    colors.accent,
                    if live.hovered() { 5. } else { 3. },
                    colors.selected_fill,
                )];
                if live.follows() {
                    let (primary, hover_rim) = (colors.text_primary, alpha(colors.border, 0.5));
                    let hover_shadow = if current {
                        vec![glow_through(colors.accent, 5., colors.selected_fill)]
                    } else {
                        raised_shadow(true, cx)
                    };
                    chip = chip
                        .cursor(CursorStyle::PointingHand)
                        .focusable()
                        .tab_stop(true)
                        .hover(move |style| {
                            let style = style.bg(hover_ground).shadow(hover_shadow);
                            if current {
                                style
                            } else {
                                style.text_color(primary).border_color(hover_rim)
                            }
                        })
                        .active(move |style| style.bg(pressed_ground).shadow(vec![]))
                        .when_some(self.on_change.clone(), |this, handler| {
                            this.on_click(move |_, window, cx| handler(index, window, cx))
                        });
                }
                let chip = if current && !live.pressed() {
                    chip.shadow(glow_shadow)
                } else {
                    raised(chip, shape, false, live, cx)
                };
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
                let chips = self.chip_row(cx);
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
