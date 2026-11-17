//! The long list in Gabarit's style: the base of a conversation's messages. GPUI's `list` draws only the rows in
//! view, measures each one once (any height) and keeps its place when rows above it change; this adds Gabarit's thin
//! scroll bar (it widens under the pointer, it can be dragged) and the message row.

use std::rc::Rc;

use gpui::{
    AnyElement, App, Bounds, ElementId, Empty, IntoElement, ListAlignment, ListState,
    ParentElement, Pixels, RenderOnce, Role, SharedString, Styled, Window, canvas, div, list,
    point, prelude::*, px,
};

use crate::avatar::GAvatar;
use crate::theme::{ActiveTheme, GTextExt, alpha};
use crate::tokens::{radius, text};

type RenderRow = Rc<dyn Fn(usize, &mut Window, &mut App) -> AnyElement>;

/// The scroll bar's drag: nothing to draw while it moves.
struct ThumbDrag {
    /// Where in the thumb it was taken.
    grab: Pixels,
}

/// A long list of rows of any height: `GLongList::new("messages", state, |index, window, cx| row)`. Hold the
/// `ListState` in the view (`GLongList::state(count, true)` for a conversation, which starts at its end).
#[derive(IntoElement)]
pub struct GLongList {
    id: ElementId,
    state: ListState,
    render_row: RenderRow,
    label: SharedString,
}

impl GLongList {
    /// A list's state: `count` rows; `from_end`: it starts at the bottom and follows what arrives (a conversation).
    pub fn state(count: usize, from_end: bool) -> ListState {
        let alignment = if from_end {
            ListAlignment::Bottom
        } else {
            ListAlignment::Top
        };
        ListState::new(count, alignment, px(600.))
    }

    pub fn new(
        id: impl Into<ElementId>,
        state: ListState,
        render_row: impl Fn(usize, &mut Window, &mut App) -> AnyElement + 'static,
    ) -> Self {
        GLongList {
            id: id.into(),
            state,
            render_row: Rc::new(render_row),
            label: SharedString::default(),
        }
    }

    /// What a screen reader calls it.
    pub fn label(mut self, label: impl Into<SharedString>) -> Self {
        self.label = label.into();
        self
    }
}

impl RenderOnce for GLongList {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let state = self.state.clone();
        let render_row = self.render_row.clone();
        let track = window.use_keyed_state(self.id.clone(), cx, |_, _| Bounds::<Pixels>::default());

        // The thumb: as tall as the part in view, where the view is.
        let viewport = state.viewport_bounds().size.height;
        let max_offset = state.max_offset_for_scrollbar().y;
        let offset = -state.scroll_px_offset_for_scrollbar().y;
        let total = viewport + max_offset;
        let thumb = (max_offset > px(0.) && viewport > px(0.)).then(|| {
            let height = (viewport * (viewport / total)).max(px(32.));
            let top = (viewport - height) * (offset / max_offset).clamp(0., 1.);
            (top, height)
        });

        let thumb_color = alpha(colors.border, 0.45);
        let thumb_hover = alpha(colors.border, 0.75);
        let scrollbar = thumb.map(|(top, height)| {
            let drag_state = state.clone();
            let end_state = state.clone();
            let track = track.clone();
            div()
                .id("g-scrollbar")
                .group("g-scrollbar")
                .absolute()
                .top_0()
                .right_0()
                .bottom_0()
                .w(px(12.))
                .child({
                    let track = track.clone();
                    canvas(
                        move |bounds, _, cx| track.update(cx, |stored, _| *stored = bounds),
                        |_, _, _, _| {},
                    )
                    .absolute()
                    .size_full()
                })
                .child(
                    div()
                        .id("g-scrollbar-thumb")
                        .absolute()
                        .top(top)
                        .right(px(3.))
                        .w(px(5.))
                        .h(height)
                        .rounded_full()
                        .bg(thumb_color)
                        .group_hover("g-scrollbar", move |style| style.w(px(7.)).bg(thumb_hover))
                        .on_drag(ThumbDrag { grab: px(0.) }, move |_, offset, _, cx| {
                            let _ = offset;
                            cx.new(|_| Empty)
                        })
                        .on_drag_move::<ThumbDrag>(move |event, window, cx| {
                            if !drag_state.is_scrollbar_dragging() {
                                drag_state.scrollbar_drag_started();
                            }
                            let bounds = *track.read(cx);
                            let grab = event.drag(cx).grab;
                            let span = (bounds.size.height - height).max(px(1.));
                            let fraction =
                                ((event.event.position.y - bounds.top() - grab - height / 2.)
                                    / span)
                                    .clamp(0., 1.);
                            drag_state
                                .set_offset_from_scrollbar(point(px(0.), -(max_offset * fraction)));
                            window.refresh();
                        })
                        .on_mouse_up_out(gpui::MouseButton::Left, move |_, _, _| {
                            end_state.scrollbar_drag_ended()
                        })
                        .on_mouse_up(gpui::MouseButton::Left, {
                            let state = state.clone();
                            move |_, _, _| state.scrollbar_drag_ended()
                        }),
                )
        });

        div()
            .id(self.id)
            .role(Role::List)
            .aria_label(self.label)
            .relative()
            .size_full()
            .child(
                list(self.state, move |index, window, cx| {
                    render_row(index, window, cx)
                })
                .size_full(),
            )
            .children(scrollbar)
    }
}

/// A message in a conversation: the avatar, the name and the time, the text, wrapped. `grouped`: a message that
/// follows one of the same person, without its avatar or name.
#[derive(IntoElement)]
pub struct GMessageRow {
    index: usize,
    author: SharedString,
    time: SharedString,
    body: SharedString,
    grouped: bool,
}

impl GMessageRow {
    pub fn new(
        index: usize,
        author: impl Into<SharedString>,
        time: impl Into<SharedString>,
        body: impl Into<SharedString>,
    ) -> Self {
        GMessageRow {
            index,
            author: author.into(),
            time: time.into(),
            body: body.into(),
            grouped: false,
        }
    }

    pub fn grouped(mut self, grouped: bool) -> Self {
        self.grouped = grouped;
        self
    }
}

impl RenderOnce for GMessageRow {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let hover = colors.row_hover;
        let label = format!("{}, {}: {}", self.author, self.time, self.body);
        div()
            .id(("g-message", self.index))
            .role(Role::ListItem)
            .aria_label(label)
            .flex()
            .gap(px(12.))
            .w_full()
            .px(px(16.))
            .pt(px(if self.grouped { 2. } else { 10. }))
            .pb(px(2.))
            .rounded(px(radius::ROW))
            .hover(move |style| style.bg(hover))
            .child(div().w(px(36.)).flex_none().when(!self.grouped, |this| {
                this.child(GAvatar::new(self.author.clone()).size(36.))
            }))
            .child(
                div()
                    .flex()
                    .flex_col()
                    .flex_1()
                    .min_w_0()
                    .gap(px(2.))
                    .when(!self.grouped, |this| {
                        this.child(
                            div()
                                .flex()
                                .items_baseline()
                                .gap(px(8.))
                                .child(
                                    div()
                                        .g_text(text::HEADLINE)
                                        .text_color(colors.text_primary)
                                        .child(self.author.clone()),
                                )
                                .child(
                                    div()
                                        .g_text(text::CAPTION)
                                        .text_color(colors.text_discret)
                                        .child(self.time.clone()),
                                ),
                        )
                    })
                    .child(
                        div()
                            .g_text(text::BODY)
                            .text_color(colors.text_primary)
                            .child(self.body),
                    ),
            )
    }
}

/// A list laid in a glass, without lines (`GInsetList`, 4.0): rows two points apart, rounded (`radius::ROW`), the
/// pointer's row under a veil (`row_hover`), the chosen one on thick glass with its light. Each row is what one puts
/// in it (an avatar, a name, a sentence); `on_select` says which was clicked.
#[derive(IntoElement)]
pub struct GInsetList {
    id: ElementId,
    rows: Vec<AnyElement>,
    selected: Option<usize>,
    preview: Option<(usize, crate::relief::GPointer)>,
    on_select: Option<crate::controls::ChangeHandler<usize>>,
}

impl GInsetList {
    pub fn new(id: impl Into<ElementId>) -> Self {
        GInsetList {
            id: id.into(),
            rows: Vec::new(),
            selected: None,
            preview: None,
            on_select: None,
        }
    }

    pub fn row(mut self, row: impl IntoElement) -> Self {
        self.rows.push(row.into_any_element());
        self
    }

    pub fn rows(mut self, rows: impl IntoIterator<Item = impl IntoElement>) -> Self {
        self.rows
            .extend(rows.into_iter().map(IntoElement::into_any_element));
        self
    }

    /// The chosen row.
    pub fn selected(mut self, index: Option<usize>) -> Self {
        self.selected = index;
        self
    }

    /// Draws one row hovered or pressed (a gallery).
    pub fn preview(mut self, row: usize, pointer: crate::relief::GPointer) -> Self {
        self.preview = Some((row, pointer));
        self
    }

    pub fn on_select(mut self, handler: impl Fn(&usize, &mut Window, &mut App) + 'static) -> Self {
        self.on_select = Some(Rc::new(move |value, window, cx| {
            handler(&value, window, cx)
        }));
        self
    }
}

impl RenderOnce for GInsetList {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let (hover, press) = (colors.row_hover, alpha(colors.ink, 0.08));
        let shape = px(radius::ROW);
        let follows = self.preview.is_none();
        div()
            .id(self.id)
            .role(Role::List)
            .flex()
            .flex_col()
            .gap(px(2.))
            .w_full()
            .children(self.rows.into_iter().enumerate().map(|(index, row)| {
                let chosen = self.selected == Some(index);
                let forced = self
                    .preview
                    .filter(|(row, _)| *row == index)
                    .map(|(_, pointer)| match pointer {
                        crate::relief::GPointer::Hover => hover,
                        crate::relief::GPointer::Pressed => press,
                    });
                let handler = self.on_select.clone();
                div()
                    .id(("g-inset-row", index))
                    .relative()
                    .flex()
                    .items_center()
                    .gap(px(12.))
                    .w_full()
                    .px(px(12.))
                    .py(px(9.))
                    .rounded(shape)
                    .role(Role::ListItem)
                    .aria_selected(chosen)
                    .when(chosen, |this| {
                        this.child(crate::glass::selection_layer(shape))
                    })
                    .when(!chosen, |this| {
                        this.when_some(forced, |this, color| this.bg(color))
                            .when(follows, |this| {
                                this.hover(move |style| style.bg(hover))
                                    .active(move |style| style.bg(press))
                            })
                    })
                    .when(follows, |this| {
                        this.cursor(gpui::CursorStyle::PointingHand).when_some(
                            handler,
                            |this, handler| {
                                this.on_click(move |_, window, cx| handler(index, window, cx))
                            },
                        )
                    })
                    .child(row)
            }))
    }
}
