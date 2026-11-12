//! Gabarit's frame (GabaritApple's `GBars.swift`, `GFrame.swift`, `GRows.swift`): the header and the left rail are
//! always dark (graphite 950), whatever the appearance; the content follows light or dark. Bar buttons are flat, the
//! title in IBM Plex, the selection underlined in rust. And the side column's rows.

use std::rc::Rc;

use gpui::{
    AnyElement, App, ClickEvent, CursorStyle, Div, ElementId, IntoElement, ParentElement,
    RenderOnce, Role, SharedString, Styled, Window, WindowControlArea, div, linear_color_stop,
    linear_gradient, prelude::*, px,
};

use crate::assets::icon;
use crate::button::ClickHandler;
use crate::controls::ChangeHandler;
use crate::feedback::badge_text;
use crate::relief::{GPointer, bar_shadow, glow, glow_through};
use crate::theme::{ActiveTheme, GTextExt, alpha, white};
use crate::tokens::{opacity, radius, text};

/// The dark frame's ground, with the light on it: a soft sheen from above (`gFrameSheen`).
pub fn frame_ground(cx: &App) -> Div {
    let frame = cx.theme().frame;
    div().bg(linear_gradient(
        180.0,
        linear_color_stop(crate::theme::mix(frame.ground, white(1.0), 0.07), 0.0),
        linear_color_stop(frame.ground, 0.7),
    ))
}

/// A bar's title (`GBarTitle`): IBM Plex, light on the frame, dark on a sheet's grey.
#[derive(IntoElement)]
pub struct GBarTitle {
    title: SharedString,
    subtitle: Option<SharedString>,
    in_sheet: bool,
}

impl GBarTitle {
    pub fn new(title: impl Into<SharedString>) -> Self {
        GBarTitle {
            title: title.into(),
            subtitle: None,
            in_sheet: false,
        }
    }

    pub fn subtitle(mut self, subtitle: impl Into<SharedString>) -> Self {
        self.subtitle = Some(subtitle.into());
        self
    }

    pub fn in_sheet(mut self) -> Self {
        self.in_sheet = true;
        self
    }
}

impl RenderOnce for GBarTitle {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let theme = cx.theme();
        let (title, discret) = if self.in_sheet {
            (theme.colors.text_primary, theme.colors.text_discret)
        } else {
            (theme.frame.text, theme.frame.text_discret)
        };
        div()
            .id(SharedString::from(format!("g-bar-title-{}", self.title)))
            .role(Role::Heading)
            .aria_label(self.title.clone())
            .flex()
            .flex_col()
            .flex_none()
            .child(
                div()
                    .g_text(text::TITLE_3)
                    .text_color(title)
                    .child(gpui::Text::new_inaccessible(self.title)),
            )
            .when_some(
                self.subtitle.filter(|subtitle| !subtitle.is_empty()),
                |this, subtitle| {
                    this.child(
                        div()
                            .g_text(text::CAPTION_2)
                            .text_color(discret)
                            .child(subtitle),
                    )
                },
            )
    }
}

/// Underlined tabs (`GNavTabs`, instead of a segmented control): the text, a rust line under the current tab.
#[derive(IntoElement)]
pub struct GNavTabs {
    id: ElementId,
    tabs: Vec<SharedString>,
    selected: usize,
    preview: Option<(usize, GPointer)>,
    on_change: Option<ChangeHandler<usize>>,
}

impl GNavTabs {
    pub fn new(
        id: impl Into<ElementId>,
        tabs: impl IntoIterator<Item = impl Into<SharedString>>,
        selected: usize,
    ) -> Self {
        GNavTabs {
            id: id.into(),
            tabs: tabs.into_iter().map(Into::into).collect(),
            selected,
            preview: None,
            on_change: None,
        }
    }

    /// Draws one tab hovered or pressed (a gallery).
    pub fn preview(mut self, tab: usize, pointer: GPointer) -> Self {
        self.preview = Some((tab, pointer));
        self
    }

    pub fn on_change(mut self, handler: impl Fn(&usize, &mut Window, &mut App) + 'static) -> Self {
        self.on_change = Some(Rc::new(move |value, window, cx| {
            handler(&value, window, cx)
        }));
        self
    }
}

impl RenderOnce for GNavTabs {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        div()
            .id(self.id)
            .role(Role::TabList)
            .flex()
            .items_end()
            .gap(px(20.))
            .w_full()
            .border_b_1()
            .border_color(colors.hairline)
            .children(self.tabs.into_iter().enumerate().map(|(index, title)| {
                let current = index == self.selected;
                let pointer = self
                    .preview
                    .filter(|(tab, _)| *tab == index)
                    .map(|(_, pointer)| pointer);
                let foreground = match pointer {
                    Some(GPointer::Pressed) => colors.text_discret,
                    Some(GPointer::Hover) => colors.text_primary,
                    None if current => colors.text_primary,
                    None => colors.text_secondary,
                };
                let line = if current {
                    Some(colors.accent)
                } else if pointer.is_some() {
                    Some(alpha(colors.border, 0.5))
                } else {
                    None
                };
                let (primary, discret, hover_line) = (
                    colors.text_primary,
                    colors.text_discret,
                    alpha(colors.border, 0.5),
                );
                let follows = self.preview.is_none();
                let handler = self.on_change.clone();
                div()
                    .id(("g-tab", index))
                    .group("g-tab")
                    .relative()
                    .py(px(8.))
                    .mb(px(-1.))
                    .g_text(text::BODY)
                    .font_weight(if current {
                        gpui::FontWeight::SEMIBOLD
                    } else {
                        gpui::FontWeight::MEDIUM
                    })
                    .text_color(foreground)
                    .role(Role::Tab)
                    .aria_label(title.clone())
                    .aria_selected(current)
                    .when(follows, |this| {
                        this.cursor(CursorStyle::PointingHand)
                            .focusable()
                            .tab_stop(true)
                            .hover(move |style| style.text_color(primary))
                            .active(move |style| style.text_color(discret))
                            .when_some(handler, |this, handler| {
                                this.on_click(move |_, window, cx| handler(index, window, cx))
                            })
                    })
                    .child(gpui::Text::new_inaccessible(title))
                    .child(
                        div()
                            .id("g-tab-line")
                            .absolute()
                            .bottom_0()
                            .left_0()
                            .right_0()
                            .h(px(2.))
                            .when_some(line, |this, color| this.bg(color))
                            .when(current, |this| this.shadow(vec![glow(colors.accent, 4.)]))
                            .when(follows && !current, |this| {
                                this.group_hover("g-tab", move |style| style.bg(hover_line))
                            }),
                    )
            }))
    }
}

/// The header of a window drawn by the app (`GWindowHeader`): the dark frame, an icon, a title and a subtitle, and on
/// the right what one puts there (the close cross). A fine line borders it at the bottom; it casts a shadow on the page.
#[derive(IntoElement)]
pub struct GWindowHeader {
    title: SharedString,
    subtitle: Option<SharedString>,
    icon: Option<&'static str>,
    leading: f32,
    trailing: Vec<AnyElement>,
    radius: f32,
    top_radius: f32,
    window_controls: bool,
    window_buttons: bool,
}

impl GWindowHeader {
    pub fn new(title: impl Into<SharedString>) -> Self {
        GWindowHeader {
            title: title.into(),
            subtitle: None,
            icon: None,
            leading: 16.,
            trailing: Vec::new(),
            radius: 0.,
            top_radius: 0.,
            window_controls: false,
            window_buttons: true,
        }
    }

    pub fn subtitle(mut self, subtitle: impl Into<SharedString>) -> Self {
        self.subtitle = Some(subtitle.into());
        self
    }

    pub fn icon(mut self, name: &'static str) -> Self {
        self.icon = Some(name);
        self
    }

    /// The left margin: room for the window's buttons when they sit on the header (the Mac's, 78).
    pub fn leading(mut self, margin: f32) -> Self {
        self.leading = margin;
        self
    }

    pub fn trailing(mut self, element: impl IntoElement) -> Self {
        self.trailing.push(element.into_any_element());
        self
    }

    /// The header is the window's title bar: it moves the window and, under Windows and Linux, carries the window's
    /// buttons (minimize, maximize, close), drawn by Gabarit on the dark frame. On the Mac, the system's buttons sit on
    /// it (leave them room with `leading(84.)`).
    pub fn window_title_bar(mut self) -> Self {
        self.window_controls = true;
        self
    }

    /// A title bar without the window's buttons (minimize, maximize, close) under Windows and Linux: a secondary window
    /// closed by the round cross one puts on the right (`trailing`), and Escape. The header still moves the window. On
    /// the Mac, the app hides the system's buttons itself (and gives the title the same `leading` as elsewhere).
    pub fn without_window_buttons(mut self) -> Self {
        self.window_buttons = false;
        self
    }

    /// Rounded corners (laid on a page rather than across a window). GPUI clips a child to a rectangle, not to its
    /// parent's rounded corners: the band rounds itself.
    pub fn rounded(mut self, radius: f32) -> Self {
        self.radius = radius;
        self
    }

    /// The top corners rounded with the window's (under Linux, a window that draws its own decorations: see
    /// [`window_corner_radius`]). GPUI clips to rectangles: the band at the top of a window rounds itself.
    pub fn window_corners(mut self, radius: f32) -> Self {
        self.top_radius = radius;
        self
    }
}

/// The corners of a window that draws its own decorations (`WindowDecorations::Client`, under Linux), like Zed's.
pub const WINDOW_CORNER_RADIUS: f32 = 10.;

/// The radius of the window's corners that the app draws itself: [`WINDOW_CORNER_RADIUS`] for a window that draws its
/// own decorations, not maximized, tiled nor full screen (under Linux); 0 elsewhere (the system rounds the window).
pub fn window_corner_radius(window: &Window) -> gpui::Corners<gpui::Pixels> {
    match window.window_decorations() {
        gpui::Decorations::Server => gpui::Corners::default(),
        gpui::Decorations::Client { tiling } => {
            let r = |a: bool, b: bool| {
                if a || b {
                    px(0.)
                } else {
                    px(WINDOW_CORNER_RADIUS)
                }
            };
            gpui::Corners {
                top_left: r(tiling.top, tiling.left),
                top_right: r(tiling.top, tiling.right),
                bottom_left: r(tiling.bottom, tiling.left),
                bottom_right: r(tiling.bottom, tiling.right),
            }
        }
    }
}

/// Whether the app draws the window's buttons (minimize, maximize, close) in its title bar: under Windows, and under
/// Linux when the window draws its own decorations (not when the window manager frames it, with its own buttons).
pub fn draws_window_buttons(window: &Window) -> bool {
    if cfg!(target_os = "macos") {
        return false;
    }
    !cfg!(any(target_os = "linux", target_os = "freebsd"))
        || matches!(
            window.window_decorations(),
            gpui::Decorations::Client { .. }
        )
}

/// Under Linux, GPUI leaves a window's title bar to the app (`window_control_area` acts on Windows and the Mac only):
/// a press on `element` then a move moves the window (Zed does the same). Elsewhere, `element` as it is.
pub fn window_drag<E: InteractiveElement>(
    element: E,
    key: impl Into<ElementId>,
    window: &mut Window,
    cx: &mut App,
) -> E {
    if !cfg!(any(target_os = "linux", target_os = "freebsd")) {
        return element;
    }
    let pressed = window.use_keyed_state(key, cx, |_, _| false);
    let (down, out, up) = (pressed.clone(), pressed.clone(), pressed.clone());
    element
        .on_mouse_down(gpui::MouseButton::Left, move |_, _, cx| {
            down.update(cx, |p, _| *p = true)
        })
        .on_mouse_down_out(move |_, _, cx| out.update(cx, |p, _| *p = false))
        .on_mouse_up(gpui::MouseButton::Left, move |_, _, cx| {
            up.update(cx, |p, _| *p = false)
        })
        .on_mouse_move(move |event, window, cx| {
            if !*pressed.read(cx) {
                return;
            }
            pressed.update(cx, |p, _| *p = false);
            if event.pressed_button == Some(gpui::MouseButton::Left) {
                window.start_window_move();
            }
        })
}

/// Under Linux, what a window button does on a click (minimize, maximize, close); elsewhere nothing (the system acts on
/// its `window_control_area`).
pub fn window_button_click(area: WindowControlArea, window: &mut Window) {
    if !cfg!(any(target_os = "linux", target_os = "freebsd")) {
        return;
    }
    match area {
        WindowControlArea::Min => window.minimize_window(),
        WindowControlArea::Max => window.zoom_window(),
        WindowControlArea::Close => window.remove_window(),
        WindowControlArea::Drag => {}
    }
}

impl RenderOnce for GWindowHeader {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let frame = cx.theme().frame;
        let buttons = self.window_controls && self.window_buttons && draws_window_buttons(window);
        let drag = self.window_controls;
        let header = frame_ground(cx)
            .id("g-window-header")
            .role(Role::Banner)
            .flex()
            .flex_none()
            .items_center()
            .gap(px(10.))
            .w_full()
            .h(px(52.))
            .pl(px(self.leading))
            .pr(px(14.))
            .rounded(px(self.radius))
            .when(self.top_radius > 0., |this| {
                this.rounded_t(px(self.top_radius))
            })
            .border_b_1()
            .border_color(frame.line)
            .shadow(bar_shadow(false))
            .when_some(self.icon, |this, name| {
                this.child(icon(name, px(18.), frame.text))
            })
            .child(
                div()
                    .id("g-window-title")
                    .role(Role::Heading)
                    .aria_label(self.title.clone())
                    .flex()
                    .flex_col()
                    .flex_1()
                    .child(
                        div()
                            .g_text(text::HEADLINE)
                            .text_color(frame.text)
                            .child(gpui::Text::new_inaccessible(self.title)),
                    )
                    .when_some(self.subtitle, |this, subtitle| {
                        this.child(
                            div()
                                .g_text(text::CAPTION)
                                .text_color(frame.text_discret)
                                .child(subtitle),
                        )
                    }),
            )
            // On a title bar, what sits on the right takes its clicks from the area that moves the window: under Windows,
            // the header answers the system's hit test as the caption, and a press there would move the window.
            .when(!self.trailing.is_empty(), |this| {
                if self.window_controls {
                    this.child(
                        div()
                            .flex()
                            .flex_none()
                            .items_center()
                            .gap(px(10.))
                            .occlude()
                            .children(self.trailing),
                    )
                } else {
                    this.children(self.trailing)
                }
            })
            .when(self.window_controls, |this| {
                this.window_control_area(WindowControlArea::Drag)
            })
            .when(buttons, |this| {
                let button = |id: &'static str,
                              symbol: &'static str,
                              area: WindowControlArea,
                              close: bool| {
                    let hover = if close {
                        cx.theme().colors.error
                    } else {
                        frame.hover
                    };
                    div()
                        .id(id)
                        .flex()
                        .items_center()
                        .justify_center()
                        .w(px(40.))
                        .h(px(32.))
                        .rounded(px(radius::SM))
                        .role(Role::Button)
                        .aria_label(match area {
                            WindowControlArea::Min => "Minimize",
                            WindowControlArea::Max => "Maximize",
                            _ => "Close",
                        })
                        .hover(move |style| style.bg(hover))
                        .window_control_area(area)
                        .on_click(move |_, window, _| window_button_click(area, window))
                        .child(icon(symbol, px(14.), frame.text))
                };
                this.child(
                    div()
                        .flex()
                        .gap(px(2.))
                        .ml(px(8.))
                        .child(button(
                            "g-window-min",
                            "window-minimize",
                            WindowControlArea::Min,
                            false,
                        ))
                        .child(button(
                            "g-window-max",
                            "window-maximize",
                            WindowControlArea::Max,
                            false,
                        ))
                        .child(button(
                            "g-window-close",
                            "window-close",
                            WindowControlArea::Close,
                            true,
                        )),
                )
            });
        if drag {
            window_drag(header, "g-window-header-drag", window, cx)
        } else {
            header
        }
    }
}

/// The dark band at the head of a page (`GPageBand`): an icon in a framed square, the title, the sentence.
#[derive(IntoElement)]
pub struct GPageBand {
    icon: &'static str,
    title: SharedString,
    summary: SharedString,
    radius: f32,
    top: f32,
}

impl GPageBand {
    pub fn new(
        icon: &'static str,
        title: impl Into<SharedString>,
        summary: impl Into<SharedString>,
    ) -> Self {
        GPageBand {
            icon,
            title: title.into(),
            summary: summary.into(),
            radius: 0.,
            top: 6.,
        }
    }

    /// The margin above (GabaritApple's `top`): 6 under a bar, more alone on a page.
    pub fn top_padding(mut self, top: f32) -> Self {
        self.top = top;
        self
    }

    /// Rounded corners (laid on a page).
    pub fn rounded(mut self, radius: f32) -> Self {
        self.radius = radius;
        self
    }
}

impl RenderOnce for GPageBand {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let frame = cx.theme().frame;
        frame_ground(cx)
            .flex()
            .items_center()
            .gap(px(14.))
            .w_full()
            .px(px(20.))
            .pt(px(self.top))
            .pb(px(18.))
            .rounded(px(self.radius))
            .shadow(bar_shadow(false))
            .child(
                div()
                    .flex()
                    .flex_none()
                    .items_center()
                    .justify_center()
                    .size(px(48.))
                    .rounded(px(radius::MD))
                    .border_1()
                    .border_color(frame.rim)
                    .child(icon(self.icon, px(22.), frame.text)),
            )
            .child(
                div()
                    .flex()
                    .flex_col()
                    .gap(px(3.))
                    .child(
                        div()
                            .g_text(text::TITLE_2)
                            .text_color(frame.text)
                            .child(self.title),
                    )
                    .child(
                        div()
                            .g_text(text::SUBHEADLINE)
                            .text_color(frame.text_secondary)
                            .child(self.summary),
                    ),
            )
    }
}

/// A page of the dark rail (`GRailItem`): the icon and its name; the current page in rust, on a slight ground, with a
/// line on the left.
#[derive(IntoElement)]
pub struct GRailItem {
    id: ElementId,
    title: SharedString,
    icon: &'static str,
    current: bool,
    badge: usize,
    preview: Option<GPointer>,
    on_click: Option<ClickHandler>,
}

impl GRailItem {
    pub fn new(
        id: impl Into<ElementId>,
        title: impl Into<SharedString>,
        icon: &'static str,
        current: bool,
    ) -> Self {
        GRailItem {
            id: id.into(),
            title: title.into(),
            icon,
            current,
            badge: 0,
            preview: None,
            on_click: None,
        }
    }

    pub fn badge(mut self, count: usize) -> Self {
        self.badge = count;
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

impl RenderOnce for GRailItem {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let theme = cx.theme();
        let (frame, accent) = (theme.frame, theme.colors.accent);
        let lit = self.preview.is_some();
        let pressed = self.preview == Some(GPointer::Pressed);
        let foreground = if self.current {
            accent
        } else if lit {
            frame.text
        } else {
            frame.text_discret
        };
        let ground = if pressed || self.current {
            frame.selected
        } else if lit {
            frame.hover
        } else {
            alpha(frame.hover, 0.0)
        };
        let follows = self.preview.is_none();
        let (hover_ground, selected, hover_text) = (frame.hover, frame.selected, frame.text);
        let current = self.current;
        let label = if self.badge > 0 {
            format!("{}, {}", self.title, badge_text(self.badge))
        } else {
            self.title.to_string()
        };
        div()
            .id(self.id)
            .relative()
            .flex()
            .flex_col()
            .items_center()
            .justify_center()
            .gap(px(3.))
            .w_full()
            .min_h(px(52.))
            .rounded(px(radius::SM))
            .bg(ground)
            .text_color(foreground)
            .role(Role::Tab)
            .aria_label(label)
            .aria_selected(self.current)
            .when(follows, |this| {
                this.cursor(CursorStyle::PointingHand)
                    .focusable()
                    .tab_stop(true)
                    .hover(move |style| {
                        if current {
                            style
                        } else {
                            style.bg(hover_ground).text_color(hover_text)
                        }
                    })
                    .active(move |style| style.bg(selected))
                    .when_some(self.on_click, |this, handler| {
                        this.on_click(move |event, window, cx| handler(event, window, cx))
                    })
            })
            .when(self.current, |this| {
                this.child(
                    div()
                        .absolute()
                        .left_0()
                        .top(px(6.))
                        .bottom(px(6.))
                        .w(px(2.))
                        .bg(accent)
                        .shadow(vec![glow(accent, 5.)]),
                )
            })
            .child(
                div()
                    .relative()
                    .h(px(22.))
                    .flex()
                    .items_center()
                    .child(icon(self.icon, px(20.), foreground))
                    .when(self.badge > 0, |this| {
                        this.child(
                            div()
                                .absolute()
                                .top(px(-6.))
                                .left(px(14.))
                                .px(px(4.))
                                .py(px(1.))
                                .rounded(px(radius::XS))
                                .bg(frame.rim)
                                .text_color(frame.text)
                                .g_text(text::CAPTION_2)
                                .font_weight(gpui::FontWeight::SEMIBOLD)
                                .whitespace_nowrap()
                                .child(badge_text(self.badge)),
                        )
                    }),
            )
            .child(
                div()
                    .g_text(text::CAPTION_2)
                    .font_weight(if self.current {
                        gpui::FontWeight::SEMIBOLD
                    } else {
                        gpui::FontWeight::MEDIUM
                    })
                    .whitespace_nowrap()
                    .child(gpui::Text::new_inaccessible(self.title)),
            )
    }
}

/// A section in a column (`GSidebarRow`): a monochrome icon and its name, at a constant height; the chosen section on
/// a soft ground, in rust; the others, the veil on hover. `warns`: a warning dot on the right.
#[derive(IntoElement)]
pub struct GSidebarRow {
    id: ElementId,
    title: SharedString,
    icon: &'static str,
    selected: bool,
    warns: bool,
    detail: Option<SharedString>,
    preview: Option<GPointer>,
    on_click: Option<ClickHandler>,
}

pub const SIDEBAR_ROW_HEIGHT: f32 = 28.0;

impl GSidebarRow {
    pub fn new(
        id: impl Into<ElementId>,
        title: impl Into<SharedString>,
        icon: &'static str,
        selected: bool,
    ) -> Self {
        GSidebarRow {
            id: id.into(),
            title: title.into(),
            icon,
            selected,
            warns: false,
            detail: None,
            preview: None,
            on_click: None,
        }
    }

    pub fn warns(mut self) -> Self {
        self.warns = true;
        self
    }

    pub fn detail(mut self, detail: impl Into<SharedString>) -> Self {
        self.detail = Some(detail.into());
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

impl RenderOnce for GSidebarRow {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let selected = self.selected;
        let lit = self.preview.is_some();
        let pressed = self.preview == Some(GPointer::Pressed);
        let ground = if selected && pressed {
            crate::relief::over(colors.selected_fill, colors.press)
        } else if selected {
            colors.selected_fill
        } else if pressed {
            colors.press
        } else if lit {
            colors.row_hover
        } else {
            alpha(colors.row_hover, 0.0)
        };
        let foreground = if selected {
            colors.accent_text
        } else {
            colors.text_secondary
        };
        let follows = self.preview.is_none();
        let (hover, press) = (colors.row_hover, colors.press);
        div()
            .id(self.id)
            .flex()
            .items_center()
            .gap(px(10.))
            .w_full()
            .h(px(SIDEBAR_ROW_HEIGHT))
            .px(px(10.))
            .rounded(px(radius::MD))
            .bg(ground)
            .when(selected && !pressed, |this| {
                this.shadow(vec![glow_through(
                    colors.accent,
                    if lit { 6. } else { 4. },
                    colors.selected_fill,
                )])
            })
            .role(Role::Tab)
            .aria_label(self.title.clone())
            .aria_selected(selected)
            .when(follows, |this| {
                this.cursor(CursorStyle::PointingHand)
                    .focusable()
                    .tab_stop(true)
                    .when(!selected, |this| this.hover(move |style| style.bg(hover)))
                    .active(move |style| style.bg(press))
                    .when_some(self.on_click, |this, handler| {
                        this.on_click(move |event, window, cx| handler(event, window, cx))
                    })
            })
            .child(
                div()
                    .flex()
                    .items_center()
                    .justify_center()
                    .size(px(20.))
                    .child(icon(
                        self.icon,
                        px(16.),
                        if selected {
                            colors.accent
                        } else {
                            colors.text_discret
                        },
                    )),
            )
            .child(
                div()
                    .flex_1()
                    .g_text(text::BODY)
                    .when(selected, |this| {
                        this.font_weight(gpui::FontWeight::SEMIBOLD)
                    })
                    .text_color(foreground)
                    .whitespace_nowrap()
                    .overflow_hidden()
                    .text_ellipsis()
                    .child(gpui::Text::new_inaccessible(self.title)),
            )
            .when_some(self.detail, |this, detail| {
                this.child(
                    div()
                        .g_text(text::CALLOUT)
                        .text_color(if selected {
                            colors.accent_text
                        } else {
                            colors.text_discret
                        })
                        .child(detail),
                )
            })
            .when(self.warns, |this| {
                this.child(div().size(px(6.)).rounded_full().bg(colors.warning))
            })
    }
}

/// Dimmed when disabled, the same for every control.
pub fn dimmed<E: Styled>(element: E, disabled: bool) -> E {
    if disabled {
        element.opacity(opacity::DISABLED)
    } else {
        element
    }
}
