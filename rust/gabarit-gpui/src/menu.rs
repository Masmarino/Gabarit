//! Gabarit's menus, from SkollN's iPhone context menu brought to a computer: a card with large rounded corners, lit at
//! its top edge, on a soft wide shadow; rows of 34 points from edge to edge, the text (14 points) on the left, the
//! outlined icon in the text's colour on the right (a shortcut in grey before it, an arrow for a submenu), a fine line
//! across the card between rows and a narrow grey band between groups, small grey section titles; the row under the
//! pointer or the keyboard is lit across the card, softly (faded in, and out when the light moves on), only once the
//! pointer moves (a menu opened under it does not light the row it lands on); a destructive row in red, its icon too;
//! a tick on the left of a choice; a disabled row greyed.
//!
//! The menus open faded in and dropping slightly into place (GPUI has no transform for a box: no scale), and close
//! faded out. The keyboard: the arrows move (right opens a submenu, left closes it), Return or Space chooses, Escape
//! closes, a letter goes to the next row that starts with it, a row's shortcut chooses it. A submenu opens under the
//! pointer after a short delay. A click outside closes the menu, which stays inside the window near its edges.
//!
//! Three hosts open a `GMenu`: `GContextMenu` (the right button), `GMenuButton` (a click on a button: « … », « + »)
//! and `GPicker`'s list (`picker.rs`).
//!
//! A context menu can also lift what it wraps out of the page, as the iPhone does with a message held down
//! (`GContextMenu::spotlight`, `GSpotlight`): the window veiled, the thing in front at its place (moved, or cut with a
//! fade, for all to fit), the menu's pill above it and its card below, opening on a light spring. `open_request` opens
//! a context menu without the pointer (the keyboard, a button elsewhere).

use std::cell::RefCell;
use std::rc::Rc;
use std::time::Duration;

use gpui::{
    Anchor, Animation, AnimationExt, AnyElement, App, Bounds, ClickEvent, CursorStyle, ElementId,
    Entity, FocusHandle, Hsla, InteractiveElement, IntoElement, KeyDownEvent, Keystroke,
    MouseButton, ParentElement, Pixels, Point, RenderOnce, Role, ScrollHandle, SharedString, Size,
    Styled, Task, WeakEntity, Window, anchored, canvas, deferred, div, linear_color_stop,
    linear_gradient, point, prelude::*, px, size,
};

use crate::assets::icon;
use crate::button::ClickHandler;
use crate::relief::GPointer;
use crate::theme::{ActiveTheme, GTextExt, alpha, black, mix, white};
use crate::tokens::{opacity, text};

/// Closes a menu (and its submenus): what a host hands to the builder of its menu.
pub type GMenuClose = Rc<dyn Fn(&mut Window, &mut App)>;

/// Builds a menu each time it opens; its argument closes it.
pub type GMenuBuilder = Rc<dyn Fn(GMenuClose, &mut Window, &mut App) -> GMenu>;

/// The menus' measures, in points.
pub mod metrics {
    /// A row's height (48 on the iPhone, under a finger; 22 in a Mac's own menus).
    pub const ROW: f32 = 34.;
    /// The card's corners (22 on the iPhone).
    pub const RADIUS: f32 = 16.;
    /// The rows run from edge to edge, as on the iPhone: the lit one too, its outer corners following the card's.
    pub const INSET: f32 = 0.;
    pub const ROW_RADIUS: f32 = RADIUS - 1.;
    /// The row's text and its icon from the card's edges.
    pub const ROW_PADDING: f32 = 14.;
    /// The row's text (17 on the iPhone), its icon, its shortcut.
    pub const TEXT: f32 = 14.;
    pub const ICON: f32 = 17.;
    pub const SHORTCUT: f32 = 12.;
    /// The band between two groups (8 on the iPhone).
    pub const GROUP_GAP: f32 = 6.;
    pub const MIN_WIDTH: f32 = 232.;
    pub const MAX_WIDTH: f32 = 380.;
    /// Taller lists scroll.
    pub const MAX_HEIGHT: f32 = 600.;
    /// From the window's edges.
    pub const WINDOW_MARGIN: f32 = 8.;
    /// Before a submenu opens or closes under the pointer, in milliseconds.
    pub const SUBMENU_DELAY: u64 = 180;
    /// Opening and closing, in milliseconds.
    pub const OPEN: u64 = 180;
    pub const CLOSE: u64 = 120;
    /// A row lit softly, in milliseconds; put out a little slower.
    pub const LIGHT_IN: u64 = 90;
    pub const LIGHT_OUT: u64 = 160;
}

/// A line of a menu: its name, its icon on the right; a tick on the left for a choice, a shortcut in grey, an arrow
/// to a submenu.
#[derive(IntoElement)]
pub struct GMenuItem {
    id: ElementId,
    title: SharedString,
    icon: Option<&'static str>,
    shortcut: Option<&'static str>,
    destructive: bool,
    checked: Option<bool>,
    disabled: bool,
    preview: Option<GPointer>,
    on_click: Option<ClickHandler>,
    submenu: Option<GMenuBuilder>,
}

impl GMenuItem {
    pub fn new(id: impl Into<ElementId>, title: impl Into<SharedString>) -> Self {
        GMenuItem {
            id: id.into(),
            title: title.into(),
            icon: None,
            shortcut: None,
            destructive: false,
            checked: None,
            disabled: false,
            preview: None,
            on_click: None,
            submenu: None,
        }
    }

    /// An outlined icon, on the right (as on the iPhone).
    pub fn icon(mut self, name: &'static str) -> Self {
        self.icon = Some(name);
        self
    }

    /// The keys that do the same, written as GPUI's (`"secondary-c"`, `"cmd-shift-z"`, `"backspace"`): shown in grey
    /// on the right (« ⌘C » on the Mac, « Ctrl + C » elsewhere), and they choose the row while the menu is open.
    pub fn shortcut(mut self, keys: &'static str) -> Self {
        self.shortcut = Some(keys);
        self
    }

    pub fn destructive(mut self) -> Self {
        self.destructive = true;
        self
    }

    /// A choice: a tick on the left when on (the menu keeps the room for it on every row).
    pub fn checked(mut self, checked: bool) -> Self {
        self.checked = Some(checked);
        self
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }

    /// Drawn under a pointer that is not there (a gallery).
    pub fn preview(mut self, preview: Option<GPointer>) -> Self {
        self.preview = preview;
        self
    }

    /// What the row does. The menu closes after it.
    pub fn on_click(
        mut self,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.on_click = Some(Rc::new(handler));
        self
    }

    /// A submenu, built when it opens; its argument closes the whole menu.
    pub fn submenu(
        mut self,
        builder: impl Fn(GMenuClose, &mut Window, &mut App) -> GMenu + 'static,
    ) -> Self {
        self.submenu = Some(Rc::new(builder));
        self
    }

    fn enabled(&self) -> bool {
        !self.disabled && (self.on_click.is_some() || self.submenu.is_some())
    }
}

/// How a row is drawn.
#[derive(Clone, Copy, Default)]
struct RowLook {
    lit: bool,
    pressed: bool,
    /// Room on the left for the ticks of a menu's choices.
    tick_column: bool,
    /// The first or the last row of the card: its outer corners follow the card's.
    top: bool,
    bottom: bool,
}

/// What a lit row is grounded on (pressed, a little stronger; a destructive row, in its red).
fn row_ground(item: &GMenuItem, pressed: bool, cx: &App) -> Hsla {
    let colors = cx.theme().colors;
    let dark = cx.theme().is_dark();
    if item.destructive {
        alpha(colors.error, if pressed { 0.2 } else { 0.11 })
    } else if pressed {
        if dark { white(0.13) } else { black(0.10) }
    } else if dark {
        white(0.075)
    } else {
        black(0.052)
    }
}

/// A row: `ground`, when given, is drawn under it instead of its plain lit ground (the menu's, faded in and out).
fn row_element(
    item: &GMenuItem,
    look: RowLook,
    ground: Option<AnyElement>,
    cx: &App,
) -> gpui::Stateful<gpui::Div> {
    let colors = cx.theme().colors;
    let disabled = item.disabled;
    let foreground = if disabled {
        colors.text_discret
    } else if item.destructive {
        colors.error
    } else {
        colors.text_primary
    };
    let lit = look.lit && !disabled;
    let plain_ground = if lit && ground.is_none() {
        row_ground(item, look.pressed, cx)
    } else {
        alpha(colors.hover, 0.0)
    };
    let radius = px(metrics::ROW_RADIUS);
    div()
        .id(item.id.clone())
        .relative()
        .flex()
        .flex_none()
        .items_center()
        .gap(px(10.))
        .h(px(metrics::ROW))
        .px(px(metrics::ROW_PADDING))
        .when(look.top, |this| this.rounded_t(radius))
        .when(look.bottom, |this| this.rounded_b(radius))
        .bg(plain_ground)
        .children(ground)
        .text_color(foreground)
        .g_text(text::BODY)
        .text_size(px(metrics::TEXT))
        .line_height(px(metrics::TEXT * 1.3))
        .whitespace_nowrap()
        .role(if item.checked.is_some() {
            Role::MenuItemCheckBox
        } else {
            Role::MenuItem
        })
        .aria_label(item.title.clone())
        .when_some(item.checked, |this, checked| this.aria_selected(checked))
        .when_some(item.shortcut, |this, keys| {
            this.aria_keyshortcuts(shortcut_label(keys))
        })
        .when(item.submenu.is_some(), |this| this.aria_expanded(false))
        .when(disabled, |this| this.opacity(0.75))
        .when(look.tick_column, |this| {
            let on = item.checked == Some(true);
            this.child(
                div()
                    .w(px(16.))
                    .flex()
                    .flex_none()
                    .justify_center()
                    .opacity(if on { 1. } else { 0. })
                    .child(icon(
                        "check",
                        px(14.),
                        if disabled {
                            colors.text_discret
                        } else {
                            colors.accent
                        },
                    )),
            )
        })
        .child(
            // The whole title: the card grows to it (up to its widest).
            div().flex_1().child(item.title.clone()),
        )
        .when_some(item.shortcut, |this, keys| {
            this.child(
                div()
                    .flex_none()
                    .pl(px(14.))
                    .g_text(text::CALLOUT)
                    .text_size(px(metrics::SHORTCUT))
                    .text_color(colors.text_discret)
                    .when(disabled, |this| this.opacity(opacity::DISABLED))
                    .child(shortcut_label(keys)),
            )
        })
        .when_some(
            item.icon.filter(|_| item.submenu.is_none()),
            |this, name| {
                // The icon in the text's colour, as on the iPhone, its right edge on the text's margin.
                this.child(
                    div()
                        .w(px(20.))
                        .ml(px(4.))
                        .flex()
                        .flex_none()
                        .justify_end()
                        .child(icon(name, px(metrics::ICON), foreground)),
                )
            },
        )
        .when(item.submenu.is_some(), |this| {
            this.child(
                div()
                    .w(px(20.))
                    .ml(px(4.))
                    .flex()
                    .flex_none()
                    .justify_end()
                    .child(icon("caret-right", px(13.), colors.text_discret)),
            )
        })
}

/// A row alone (a gallery): lit when forced under the pointer.
impl RenderOnce for GMenuItem {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let look = RowLook {
            lit: self.preview.is_some(),
            pressed: self.preview == Some(GPointer::Pressed),
            tick_column: self.checked.is_some(),
            ..RowLook::default()
        };
        let interactive = !self.disabled && self.preview.is_none();
        let handler = self.on_click.clone();
        let (hover, press) = (cx.theme().colors.hover, cx.theme().colors.press);
        row_element(&self, look, None, cx).when(interactive, |this| {
            this.cursor(CursorStyle::PointingHand)
                .hover(move |style| style.bg(hover))
                .active(move |style| style.bg(press))
                .when_some(handler, |this, handler| {
                    this.on_click(move |event, window, cx| handler(event, window, cx))
                })
        })
    }
}

enum Entry {
    Item(GMenuItem),
    Separator,
    Section(SharedString),
    Element(AnyElement),
}

/// The bounds of the cards of an open menu and its submenus, by depth: a click in a submenu is not a click outside.
type CardBounds = Rc<RefCell<Vec<(usize, Bounds<Pixels>)>>>;

/// What a host gives the menu it opens.
#[derive(Clone)]
struct Hosted {
    /// Closes everything.
    close: GMenuClose,
    /// Closes this level only (a submenu), back to its parent.
    back: Option<GMenuClose>,
    /// The pointer entered this submenu: its parent keeps it open.
    entered: Option<GMenuClose>,
    cards: CardBounds,
    depth: usize,
    focus: Option<FocusHandle>,
}

/// A menu's state while it is open.
struct MenuState {
    focus: FocusHandle,
    /// The lit row (an entry's index): the pointer's, or the keyboard's.
    lit: Option<usize>,
    /// The lit row is the pointer's (it goes out with it), not the keyboard's.
    pointer: bool,
    /// The open submenu (its row's index), opened by the keyboard or the pointer.
    submenu: Option<usize>,
    submenu_by_keyboard: bool,
    /// Bumped when a submenu reopens by the keyboard: a fresh submenu, its first row lit.
    submenu_generation: usize,
    /// The rows' bounds, for the submenus' placement.
    rows: Rc<RefCell<Vec<Bounds<Pixels>>>>,
    scroll: ScrollHandle,
    /// The submenu's timer, dropped (cancelled) when the pointer moves on.
    timer: Option<Task<()>>,
    /// The submenu's focus, so the parent can hand the keyboard over to it.
    submenu_focus: FocusHandle,
    /// The lit row as last drawn, and how many times the light moved: a row lit is faded in, the one it left
    /// faded out (`faded`: its index and the light's count then).
    drawn_lit: Option<usize>,
    light_count: usize,
    faded: Option<(usize, usize)>,
}

/// A menu: a card of rows, separators and section titles; above it, optionally, a pill of its own (the reactions of
/// a message).
#[derive(IntoElement)]
pub struct GMenu {
    id: ElementId,
    entries: Vec<Entry>,
    above: Option<AnyElement>,
    min_width: Pixels,
    max_height: Pixels,
    initial: Option<usize>,
    hosted: Option<Hosted>,
    spotlit: Option<Spotlit>,
}

impl GMenu {
    pub fn new() -> Self {
        GMenu {
            id: "g-menu".into(),
            entries: Vec::new(),
            above: None,
            min_width: px(metrics::MIN_WIDTH),
            max_height: px(metrics::MAX_HEIGHT),
            initial: None,
            hosted: None,
            spotlit: None,
        }
    }

    pub fn item(mut self, item: GMenuItem) -> Self {
        self.entries.push(Entry::Item(item));
        self
    }

    pub fn items(mut self, items: impl IntoIterator<Item = GMenuItem>) -> Self {
        self.entries.extend(items.into_iter().map(Entry::Item));
        self
    }

    /// A line between two groups (none at the top, the bottom, or twice in a row).
    pub fn separator(mut self) -> Self {
        self.entries.push(Entry::Separator);
        self
    }

    /// A small grey title over the rows that follow (a line before it, after other rows).
    pub fn section(mut self, title: impl Into<SharedString>) -> Self {
        self.entries.push(Entry::Section(title.into()));
        self
    }

    /// Anything else, as a row of its own (not reached by the keyboard).
    pub fn element(mut self, element: impl IntoElement) -> Self {
        self.entries
            .push(Entry::Element(element.into_any_element()));
        self
    }

    /// A pill above the card, of the same material: the reactions above a message's menu.
    pub fn above(mut self, element: impl IntoElement) -> Self {
        self.above = Some(element.into_any_element());
        self
    }

    pub fn min_width(mut self, width: Pixels) -> Self {
        self.min_width = width;
        self
    }

    pub fn max_height(mut self, height: Pixels) -> Self {
        self.max_height = height;
        self
    }

    /// The row lit when the menu opens (a picker's current choice).
    pub fn highlight(mut self, index: Option<usize>) -> Self {
        self.initial = index;
        self
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    fn hosted(mut self, hosted: Hosted) -> Self {
        self.hosted = Some(hosted);
        self
    }

    /// The entries' index as the keyboard goes: the rows that can be chosen.
    fn reachable(&self) -> Vec<usize> {
        self.entries
            .iter()
            .enumerate()
            .filter_map(|(index, entry)| match entry {
                Entry::Item(item) if item.enabled() => Some(index),
                _ => None,
            })
            .collect()
    }
}

impl Default for GMenu {
    fn default() -> Self {
        Self::new()
    }
}

/// The band between two groups of rows.
fn group_band(cx: &App) -> gpui::Div {
    let dark = cx.theme().is_dark();
    div()
        .flex_none()
        .h(px(metrics::GROUP_GAP))
        .bg(if dark { black(0.22) } else { black(0.035) })
        .border_t_1()
        .border_b_1()
        .border_color(row_line(cx))
}

/// The fine line between two rows.
fn row_line(cx: &App) -> Hsla {
    let colors = cx.theme().colors;
    if cx.theme().is_dark() {
        colors.hairline
    } else {
        alpha(colors.hairline, 0.7)
    }
}

/// A lit row's ground, faded in (or out, the light gone elsewhere), its outer corners the card's.
fn light(item: &GMenuItem, look: RowLook, on: bool, count: usize, cx: &App) -> AnyElement {
    let radius = px(metrics::ROW_RADIUS);
    let (name, duration) = if on {
        ("g-menu-light", metrics::LIGHT_IN)
    } else {
        ("g-menu-unlight", metrics::LIGHT_OUT)
    };
    div()
        .absolute()
        .top(px(0.))
        .left(px(0.))
        .size_full()
        .when(look.top, |this| this.rounded_t(radius))
        .when(look.bottom, |this| this.rounded_b(radius))
        .bg(row_ground(item, false, cx))
        .with_animation(
            ElementId::NamedInteger(name.into(), count as u64),
            Animation::new(Duration::from_millis(duration)).with_easing(gpui::ease_in_out),
            move |this, t| this.opacity(if on { t } else { 1. - t }),
        )
        .into_any_element()
}

/// The card's material, for the menu and the pill above it.
pub(crate) fn card_material(base: gpui::Div, radius: Pixels, cx: &App) -> gpui::Div {
    let colors = cx.theme().colors;
    let dark = cx.theme().is_dark();
    // No blur behind in GPUI: a little translucent, lifted a touch from the surface in dark.
    let ground = if dark {
        alpha(mix(colors.surface, white(1.0), 0.035), 1.0)
    } else {
        alpha(colors.surface, 1.0)
    };
    let rim = if dark {
        white(0.10)
    } else {
        alpha(colors.hairline, 0.6)
    };
    base.relative()
        .rounded(radius)
        .bg(ground)
        .border_1()
        .border_color(rim)
        .shadow(menu_shadow(dark))
        // The light on the top edge, just inside the rim.
        .child(
            div()
                .absolute()
                .top(px(0.))
                .left(px(0.))
                .right(px(0.))
                .bottom(px(0.))
                .rounded(radius - px(1.))
                .border_t_1()
                .border_color(if dark { white(0.07) } else { white(0.9) }),
        )
}

/// A tight contact shadow, a middle one and a wide soft one: the card floats above the page, as on the iPhone.
pub fn menu_shadow(dark: bool) -> Vec<gpui::BoxShadow> {
    vec![
        gpui::BoxShadow::new(px(0.), px(1.), black(if dark { 0.45 } else { 0.07 }))
            .blur_radius(px(2.)),
        gpui::BoxShadow::new(px(0.), px(4.), black(if dark { 0.30 } else { 0.06 }))
            .blur_radius(px(10.)),
        gpui::BoxShadow::new(px(0.), px(16.), black(if dark { 0.45 } else { 0.13 }))
            .blur_radius(px(40.)),
    ]
}

impl RenderOnce for GMenu {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let reachable = self.reachable();
        let initial = self.initial.filter(|i| reachable.contains(i));
        let hosted = self.hosted.clone();
        let wants_focus = hosted.as_ref().map(|h| h.focus.clone());
        let state: Entity<MenuState> = window.use_keyed_state(self.id.clone(), cx, |window, cx| {
            let focus = wants_focus.flatten().unwrap_or_else(|| cx.focus_handle());
            if hosted.is_some() {
                let focus = focus.clone();
                window.defer(cx, move |window, cx| window.focus(&focus, cx));
            }
            let scroll = ScrollHandle::new();
            if let Some(index) = initial {
                scroll.scroll_to_item(index);
            }
            MenuState {
                focus,
                lit: initial,
                pointer: false,
                submenu: None,
                submenu_by_keyboard: false,
                submenu_generation: 0,
                rows: Rc::new(RefCell::new(Vec::new())),
                scroll,
                timer: None,
                submenu_focus: cx.focus_handle(),
                drawn_lit: initial,
                light_count: 0,
                faded: None,
            }
        });
        let hosted = self.hosted.clone();
        let (lit, submenu, focus, scroll, rows_bounds, light_count, faded) =
            state.update(cx, |s, _| {
                if s.drawn_lit != s.lit {
                    s.faded = s.drawn_lit.map(|index| (index, s.light_count));
                    s.light_count += 1;
                    s.drawn_lit = s.lit;
                }
                (
                    s.lit,
                    s.submenu,
                    s.focus.clone(),
                    s.scroll.clone(),
                    s.rows.clone(),
                    s.light_count,
                    s.faded,
                )
            });
        // The ticks' room, only when a row is ticked: a lone switch off (« Sourdine ») does not push every row right.
        let tick_column = self
            .entries
            .iter()
            .any(|e| matches!(e, Entry::Item(item) if item.checked == Some(true)));
        // The separators: none at the ends, never twice in a row, nor right before a section's own line.
        let mut entries: Vec<Entry> = Vec::with_capacity(self.entries.len());
        for entry in self.entries {
            let previous_is_line = matches!(entries.last(), None | Some(Entry::Separator));
            match entry {
                Entry::Separator if previous_is_line => {}
                Entry::Section(_) if matches!(entries.last(), Some(Entry::Separator)) => {
                    entries.pop();
                    entries.push(entry);
                }
                other => entries.push(other),
            }
        }
        while matches!(entries.last(), Some(Entry::Separator)) {
            entries.pop();
        }
        // The indices changed with the separators dropped: count anew.
        let count = entries.len();
        let keys: Rc<Vec<Option<RowKeys>>> = Rc::new(
            entries
                .iter()
                .map(|entry| match entry {
                    Entry::Item(item) if item.enabled() => Some(RowKeys {
                        title: item.title.clone(),
                        handler: item.on_click.clone(),
                        submenu: item.submenu.is_some(),
                        shortcut: item.shortcut.and_then(parse_shortcut),
                    }),
                    _ => None,
                })
                .collect(),
        );
        rows_bounds.borrow_mut().resize(count, Bounds::default());
        let lit = lit.filter(|i| *i < count);
        let submenu = submenu.filter(|i| *i < count);

        let mut children: Vec<AnyElement> = Vec::with_capacity(count);
        let mut previous_row = false;
        for (index, entry) in entries.into_iter().enumerate() {
            match entry {
                Entry::Separator => {
                    previous_row = false;
                    children.push(group_band(cx).into_any_element());
                }
                Entry::Section(title) => {
                    let first = index == 0;
                    previous_row = false;
                    children.push(
                        div()
                            .flex_none()
                            .flex()
                            .flex_col()
                            .when(!first, |this| this.child(group_band(cx)))
                            .child(
                                div()
                                    .px(px(metrics::ROW_PADDING))
                                    .pt(px(8.))
                                    .pb(px(4.))
                                    .g_text(text::SUBHEADLINE)
                                    .font_weight(gpui::FontWeight::SEMIBOLD)
                                    .text_color(colors.text_discret)
                                    .child(title),
                            )
                            .into_any_element(),
                    );
                }
                Entry::Element(element) => {
                    previous_row = false;
                    children.push(div().flex_none().child(element).into_any_element());
                }
                Entry::Item(item) => {
                    let this_lit = lit == Some(index) || submenu == Some(index);
                    let line = previous_row;
                    previous_row = true;
                    let look = RowLook {
                        lit: this_lit || item.preview.is_some(),
                        pressed: item.preview == Some(GPointer::Pressed),
                        tick_column,
                        top: index == 0,
                        bottom: index + 1 == count,
                    };
                    // Lit by the pointer or the keyboard: its ground fades in; the row the light left fades out.
                    let ground = if item.preview.is_some() || item.disabled {
                        None
                    } else if this_lit {
                        Some(light(&item, look, true, light_count, cx))
                    } else if let Some((_, count)) = faded.filter(|(i, _)| *i == index) {
                        Some(light(&item, look, false, count, cx))
                    } else {
                        None
                    };
                    let mut row = row_element(&item, look, ground, cx);
                    // The fine line between two rows, from edge to edge, as on the iPhone.
                    if line {
                        row = row.child(
                            div()
                                .absolute()
                                .top(px(0.))
                                .left(px(0.))
                                .right(px(0.))
                                .h(px(1.))
                                .bg(row_line(cx)),
                        );
                    }
                    // Its bounds, for its submenu.
                    let bounds = rows_bounds.clone();
                    row = row.child(
                        canvas(
                            move |b, _, _| {
                                if let Some(slot) = bounds.borrow_mut().get_mut(index) {
                                    *slot = b;
                                }
                            },
                            |_, _, _, _| {},
                        )
                        .absolute()
                        .top(px(0.))
                        .left(px(0.))
                        .size_full(),
                    );
                    if item.enabled() && item.preview.is_none() {
                        row = interactive_row(row, index, &item, state.clone(), hosted.clone());
                    }
                    if let (Some(builder), true, Some(host)) =
                        (item.submenu.clone(), submenu == Some(index), hosted.clone())
                    {
                        row = row.child(open_submenu(
                            builder,
                            index,
                            &state,
                            host,
                            rows_bounds.borrow().get(index).copied().unwrap_or_default(),
                            window,
                            cx,
                        ));
                    }
                    children.push(row.into_any_element());
                }
            }
        }

        let card = card_material(div(), px(metrics::RADIUS), cx)
            .min_w(self.min_width)
            .max_w(px(metrics::MAX_WIDTH))
            .child(
                div()
                    .id("g-menu-rows")
                    .relative()
                    .flex()
                    .flex_col()
                    .max_h(self.max_height)
                    .overflow_y_scroll()
                    .track_scroll(&scroll)
                    .children(children),
            );
        let cards = hosted.as_ref().map(|h| (h.cards.clone(), h.depth));
        let card = card.child(
            canvas(
                move |b, _, _| {
                    if let Some((cards, depth)) = &cards {
                        let mut cards = cards.borrow_mut();
                        cards.retain(|(d, _)| d != depth);
                        cards.push((*depth, b));
                    }
                },
                |_, _, _, _| {},
            )
            .absolute()
            .top(px(0.))
            .left(px(0.))
            .size_full(),
        );

        let above = self.above.map(|element| {
            card_material(div(), px(100.), cx)
                .flex()
                .items_center()
                .px(px(6.))
                .py(px(4.))
                .child(element)
        });

        let mut menu = match self.spotlit {
            Some(spotlit) => spotlit.lay(self.id, above, card),
            None => div()
                .id(self.id)
                .role(Role::Menu)
                .occlude()
                .flex()
                .flex_col()
                .items_start()
                .gap(px(8.))
                .children(above)
                .child(card),
        };
        if let Some(host) = hosted {
            let keys_state = state.clone();
            let leave_state = state.clone();
            let host_keys = host.clone();
            menu = menu
                .track_focus(&focus)
                .on_key_down(move |event: &KeyDownEvent, window, cx| {
                    on_key(event, &keys, &keys_state, &host_keys, window, cx)
                })
                .on_hover(move |hovered, _, cx| {
                    if !*hovered {
                        leave_state.update(cx, |state, cx| {
                            if state.submenu.is_none() && state.pointer {
                                state.lit = None;
                                cx.notify();
                            }
                        });
                    }
                });
            if host.depth == 0 {
                let cards = host.cards.clone();
                let close = host.close.clone();
                menu = menu.on_mouse_down_out(move |event, window, cx| {
                    let inside = cards
                        .borrow()
                        .iter()
                        .any(|(_, b)| b.contains(&event.position));
                    if !inside {
                        close(window, cx)
                    }
                });
            }
            if let Some(entered) = host.entered.clone() {
                menu = menu.on_mouse_move(move |_, window, cx| entered(window, cx));
            }
        }
        menu
    }
}

/// What the keyboard needs of a row.
struct RowKeys {
    title: SharedString,
    handler: Option<ClickHandler>,
    submenu: bool,
    shortcut: Option<(Modifiers, String)>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
struct Modifiers {
    control: bool,
    alt: bool,
    shift: bool,
    platform: bool,
}

fn interactive_row(
    row: gpui::Stateful<gpui::Div>,
    index: usize,
    item: &GMenuItem,
    state: Entity<MenuState>,
    hosted: Option<Hosted>,
) -> gpui::Stateful<gpui::Div> {
    let has_submenu = item.submenu.is_some();
    let handler = item.on_click.clone();
    let hover_state = state.clone();
    let click_state = state;
    let close = hosted.as_ref().map(|h| h.close.clone());
    // Lit by the pointer only once it moves: a menu opened under it does not light the row it lands on.
    row.cursor(CursorStyle::PointingHand)
        .on_mouse_move(move |_, _, cx| {
            let already = {
                let state = hover_state.read(cx);
                state.pointer && state.lit == Some(index)
            };
            if !already {
                pointer_on(&hover_state, index, has_submenu, cx);
            }
        })
        .on_click(move |event, window, cx| {
            if has_submenu {
                click_state.update(cx, |state, cx| {
                    state.timer = None;
                    state.submenu = Some(index);
                    state.lit = Some(index);
                    state.pointer = true;
                    cx.notify();
                });
                return;
            }
            if let Some(handler) = handler.as_ref() {
                handler(event, window, cx);
            }
            if let Some(close) = close.as_ref() {
                close(window, cx);
            }
        })
}

/// The pointer on a row: lit now; its submenu opens (another one closes) after a short delay.
fn pointer_on(state: &Entity<MenuState>, index: usize, has_submenu: bool, cx: &mut App) {
    let weak = state.downgrade();
    state.update(cx, |state, cx| {
        state.lit = Some(index);
        state.pointer = true;
        let wanted = has_submenu.then_some(index);
        if state.submenu == wanted {
            state.timer = None;
        } else {
            state.timer = Some(cx.spawn(async move |_, cx| {
                cx.background_executor()
                    .timer(Duration::from_millis(metrics::SUBMENU_DELAY))
                    .await;
                let _ = weak.update(cx, |state, cx| {
                    if state.lit == Some(index) {
                        state.submenu = wanted;
                        state.submenu_by_keyboard = false;
                        cx.notify();
                    }
                });
            }));
        }
        cx.notify();
    });
}

fn open_submenu(
    builder: GMenuBuilder,
    index: usize,
    state: &Entity<MenuState>,
    host: Hosted,
    row: Bounds<Pixels>,
    window: &mut Window,
    cx: &mut App,
) -> AnyElement {
    let (generation, by_keyboard, focus) = {
        let s = state.read(cx);
        (
            s.submenu_generation,
            s.submenu_by_keyboard,
            s.submenu_focus.clone(),
        )
    };
    let back: GMenuClose = {
        let weak = state.downgrade();
        let cards = host.cards.clone();
        let depth = host.depth;
        Rc::new(move |window, cx| {
            cards.borrow_mut().retain(|(d, _)| *d <= depth);
            let _ = weak.update(cx, |state, cx| {
                state.submenu = None;
                window.focus(&state.focus, cx);
                cx.notify();
            });
        })
    };
    let entered: GMenuClose = {
        let weak = state.downgrade();
        Rc::new(move |_, cx| {
            let _ = weak.update(cx, |state, cx| {
                if state.lit != Some(index) || state.timer.is_some() {
                    state.timer = None;
                    state.lit = Some(index);
                    state.pointer = true;
                    cx.notify();
                }
            });
        })
    };
    let menu = builder(host.close.clone(), window, cx);
    let first = menu.reachable().first().copied();
    let menu = GMenu {
        id: ElementId::NamedInteger("g-submenu".into(), (generation << 16 | index) as u64),
        initial: if by_keyboard { first } else { menu.initial },
        ..menu
    }
    .hosted(Hosted {
        close: host.close.clone(),
        back: Some(back),
        entered: Some(entered),
        cards: host.cards.clone(),
        depth: host.depth + 1,
        focus: by_keyboard.then_some(focus),
    });
    deferred(
        anchored()
            .attach(row, Anchor::TopRight)
            .anchor(Anchor::TopLeft)
            .offset(point(px(5.), px(-1.)))
            .snap_to_window_with_margin(px(metrics::WINDOW_MARGIN))
            .child(fade_in(
                ElementId::NamedInteger("g-submenu-in".into(), generation as u64),
                menu,
            )),
    )
    .with_priority(2 + host.depth)
    .into_any_element()
}

fn on_key(
    event: &KeyDownEvent,
    keys: &Rc<Vec<Option<RowKeys>>>,
    state: &Entity<MenuState>,
    host: &Hosted,
    window: &mut Window,
    cx: &mut App,
) {
    let keystroke = &event.keystroke;
    let reachable: Vec<usize> = keys
        .iter()
        .enumerate()
        .filter_map(|(i, k)| k.as_ref().map(|_| i))
        .collect();
    let (lit, submenu) = {
        let s = state.read(cx);
        (s.lit, s.submenu)
    };
    let choose = |index: usize, window: &mut Window, cx: &mut App| {
        let Some(Some(row)) = keys.get(index) else {
            return;
        };
        if row.submenu {
            state.update(cx, |state, cx| {
                state.timer = None;
                state.lit = Some(index);
                state.pointer = false;
                state.submenu = Some(index);
                state.submenu_by_keyboard = true;
                state.submenu_generation += 1;
                cx.notify();
            });
            return;
        }
        if let Some(handler) = row.handler.as_ref() {
            handler(&ClickEvent::default(), window, cx);
        }
        (host.close)(window, cx);
    };
    let plain =
        !keystroke.modifiers.control && !keystroke.modifiers.alt && !keystroke.modifiers.platform;
    let step = |delta: Step, cx: &mut App| {
        let next = move_lit(&reachable, lit, delta);
        state.update(cx, |state, cx| {
            state.lit = next;
            state.pointer = false;
            state.timer = None;
            if let Some(index) = next {
                state.scroll.scroll_to_item(index);
            }
            cx.notify();
        });
    };
    match keystroke.key.as_str() {
        "down" if plain => step(Step::Next, cx),
        "up" if plain => step(Step::Previous, cx),
        "home" | "pageup" if plain => step(Step::First, cx),
        "end" | "pagedown" if plain => step(Step::Last, cx),
        "enter" | "space" if plain => {
            if let Some(index) = lit {
                choose(index, window, cx);
            }
        }
        "right" if plain => {
            if let Some(index) = lit.filter(|i| {
                keys.get(*i)
                    .is_some_and(|k| k.as_ref().is_some_and(|k| k.submenu))
            }) {
                if submenu == Some(index) {
                    let focus = state.read(cx).submenu_focus.clone();
                    // Already open under the pointer: a fresh one, its first row lit.
                    state.update(cx, |state, cx| {
                        state.submenu_by_keyboard = true;
                        state.submenu_generation += 1;
                        cx.notify();
                    });
                    window.focus(&focus, cx);
                } else {
                    choose(index, window, cx);
                }
            }
        }
        "left" if plain => {
            if let Some(back) = host.back.as_ref() {
                back(window, cx);
            }
        }
        "escape" => match host.back.as_ref() {
            Some(back) => back(window, cx),
            None => (host.close)(window, cx),
        },
        "tab" => {}
        key => {
            // A row's shortcut chooses it.
            let pressed = Modifiers {
                control: keystroke.modifiers.control,
                alt: keystroke.modifiers.alt,
                shift: keystroke.modifiers.shift,
                platform: keystroke.modifiers.platform,
            };
            let by_shortcut = keys.iter().position(|k| {
                k.as_ref()
                    .and_then(|k| k.shortcut.as_ref())
                    .is_some_and(|(m, k)| *m == pressed && k == key)
            });
            if let Some(index) = by_shortcut {
                choose(index, window, cx);
            } else if plain && let Some(letter) = typed_letter(keystroke) {
                let titles: Vec<(usize, &str)> = reachable
                    .iter()
                    .filter_map(|i| keys[*i].as_ref().map(|k| (*i, k.title.as_ref())))
                    .collect();
                if let Some(index) = next_starting_with(&titles, lit, letter) {
                    state.update(cx, |state, cx| {
                        state.lit = Some(index);
                        state.pointer = false;
                        state.scroll.scroll_to_item(index);
                        cx.notify();
                    });
                }
            } else {
                return;
            }
        }
    }
    cx.stop_propagation();
}

fn typed_letter(keystroke: &Keystroke) -> Option<char> {
    let text = keystroke
        .key_char
        .as_deref()
        .unwrap_or(keystroke.key.as_str());
    let mut chars = text.chars();
    let letter = chars.next()?;
    (chars.next().is_none() && letter.is_alphanumeric()).then_some(letter)
}

#[derive(Clone, Copy, Debug)]
enum Step {
    Next,
    Previous,
    First,
    Last,
}

/// The next lit row, among those the keyboard reaches: no wrapping, as on the Mac; from none, down goes to the first
/// row and up to the last.
fn move_lit(reachable: &[usize], lit: Option<usize>, step: Step) -> Option<usize> {
    let (first, last) = (reachable.first().copied()?, reachable.last().copied()?);
    Some(match (step, lit) {
        (Step::First, _) => first,
        (Step::Last, _) => last,
        (Step::Next, None) => first,
        (Step::Previous, None) => last,
        (Step::Next, Some(i)) => reachable.iter().copied().find(|r| *r > i).unwrap_or(last),
        (Step::Previous, Some(i)) => reachable
            .iter()
            .rev()
            .copied()
            .find(|r| *r < i)
            .unwrap_or(first),
    })
}

/// A letter without its accent, in lower case: « É » is « e ».
fn fold(letter: char) -> char {
    let lower = letter.to_lowercase().next().unwrap_or(letter);
    match lower {
        'à' | 'â' | 'ä' | 'á' | 'ã' => 'a',
        'é' | 'è' | 'ê' | 'ë' => 'e',
        'î' | 'ï' | 'í' | 'ì' => 'i',
        'ô' | 'ö' | 'ó' | 'ò' | 'õ' => 'o',
        'ù' | 'û' | 'ü' | 'ú' => 'u',
        'ç' => 'c',
        'ÿ' => 'y',
        'œ' => 'o',
        'æ' => 'a',
        other => other,
    }
}

/// The next row after the lit one whose title starts with `letter`, going round.
fn next_starting_with(titles: &[(usize, &str)], lit: Option<usize>, letter: char) -> Option<usize> {
    let wanted = fold(letter);
    let starts =
        |title: &str| title.chars().find(|c| c.is_alphanumeric()).map(fold) == Some(wanted);
    let after = titles
        .iter()
        .filter(|(i, _)| lit.is_none_or(|l| *i > l))
        .find(|(_, t)| starts(t));
    after
        .or_else(|| titles.iter().find(|(_, t)| starts(t)))
        .map(|(i, _)| *i)
}

/// `"secondary-shift-z"` as modifiers and a key; `secondary` is ⌘ on the Mac, Ctrl elsewhere.
fn parse_shortcut(keys: &str) -> Option<(Modifiers, String)> {
    let mut modifiers = Modifiers::default();
    let mut parts: Vec<&str> = keys.split('-').collect();
    let key = parts.pop()?;
    for part in parts {
        match part {
            "ctrl" | "control" => modifiers.control = true,
            "alt" | "option" => modifiers.alt = true,
            "shift" => modifiers.shift = true,
            "cmd" | "platform" | "super" | "win" => modifiers.platform = true,
            "secondary" => {
                if cfg!(target_os = "macos") {
                    modifiers.platform = true
                } else {
                    modifiers.control = true
                }
            }
            _ => return None,
        }
    }
    (!key.is_empty()).then(|| (modifiers, key.to_lowercase()))
}

/// The keys as the system writes them: « ⇧⌘Z » on the Mac, « Ctrl + Maj + Z » under Windows and Linux.
pub fn shortcut_label(keys: &str) -> String {
    shortcut_label_for(keys, cfg!(target_os = "macos"))
}

fn shortcut_label_for(keys: &str, mac: bool) -> String {
    let Some((modifiers, key)) = parse_shortcut_for(keys, mac) else {
        return keys.to_owned();
    };
    let key = key_name(&key, mac);
    if mac {
        let mut label = String::new();
        if modifiers.control {
            label.push('⌃');
        }
        if modifiers.alt {
            label.push('⌥');
        }
        if modifiers.shift {
            label.push('⇧');
        }
        if modifiers.platform {
            label.push('⌘');
        }
        label.push_str(&key);
        label
    } else {
        let mut parts: Vec<String> = Vec::new();
        if modifiers.control {
            parts.push("Ctrl".into());
        }
        if modifiers.alt {
            parts.push("Alt".into());
        }
        if modifiers.shift {
            parts.push("Maj".into());
        }
        if modifiers.platform {
            parts.push(if cfg!(windows) { "Win" } else { "Super" }.into());
        }
        parts.push(key);
        parts.join(" + ")
    }
}

fn parse_shortcut_for(keys: &str, mac: bool) -> Option<(Modifiers, String)> {
    let secondary = if mac { "cmd" } else { "ctrl" };
    parse_shortcut(&keys.replace("secondary", secondary))
}

fn key_name(key: &str, mac: bool) -> String {
    let (on_mac, elsewhere) = match key {
        "enter" => ("↩", "Entrée"),
        "escape" => ("⎋", "Échap"),
        "backspace" => ("⌫", "Retour arrière"),
        "delete" => ("⌦", "Suppr"),
        "tab" => ("⇥", "Tab"),
        "space" => ("Espace", "Espace"),
        "up" => ("↑", "↑"),
        "down" => ("↓", "↓"),
        "left" => ("←", "←"),
        "right" => ("→", "→"),
        "home" => ("↖", "Début"),
        "end" => ("↘", "Fin"),
        other => return other.to_uppercase(),
    };
    (if mac { on_mac } else { elsewhere }).to_owned()
}

/// Fades in, dropping a few points into place.
fn fade_in(id: ElementId, element: impl IntoElement) -> impl IntoElement {
    div().relative().child(element).with_animation(
        id,
        Animation::new(Duration::from_millis(metrics::OPEN)).with_easing(gpui::ease_out_quint()),
        |this, t| this.opacity(t).top(px(-6. * (1. - t))),
    )
}

fn fade_out(id: ElementId, element: impl IntoElement) -> impl IntoElement {
    div().relative().child(element).with_animation(
        id,
        Animation::new(Duration::from_millis(metrics::CLOSE)),
        |this, t| this.opacity(1. - t).top(px(-2. * t)),
    )
}

// MARK: The hosts

/// Where an open menu is, held by what opens it.
#[derive(Default)]
pub(crate) struct HostState {
    pub(crate) open: bool,
    closing: bool,
    position: Option<Point<Pixels>>,
    generation: usize,
    previous_focus: Option<FocusHandle>,
    cards: CardBounds,
    trigger: Rc<RefCell<Bounds<Pixels>>>,
    timer: Option<Task<()>>,
    /// The pill's and the card's sizes, measured once laid (a spotlight places them by them).
    spot_sizes: Rc<RefCell<SpotSizes>>,
    /// The last request to open honoured (`GContextMenu::open_request`).
    request_seen: u64,
}

impl HostState {
    pub(crate) fn is_open(&self) -> bool {
        self.open && !self.closing
    }
}

pub(crate) fn host_state(id: ElementId, window: &mut Window, cx: &mut App) -> Entity<HostState> {
    window.use_keyed_state(id, cx, |_, _| HostState::default())
}

/// Opens the menu (at `position` for a context menu, by its trigger otherwise).
pub(crate) fn host_open(
    state: &Entity<HostState>,
    position: Option<Point<Pixels>>,
    window: &mut Window,
    cx: &mut App,
) {
    let previous = window.focused(cx);
    state.update(cx, |state, cx| {
        state.open = true;
        state.closing = false;
        state.timer = None;
        state.position = position;
        state.generation += 1;
        state.previous_focus = previous;
        state.cards.borrow_mut().clear();
        cx.notify();
    });
}

/// Closes it, faded out; the keyboard goes back where it was.
pub(crate) fn host_closer(state: &Entity<HostState>) -> GMenuClose {
    let weak: WeakEntity<HostState> = state.downgrade();
    Rc::new(move |window, cx| {
        let weak_timer = weak.clone();
        let _ = weak.update(cx, |state, cx| {
            if !state.open || state.closing {
                return;
            }
            state.closing = true;
            if let Some(previous) = state.previous_focus.take() {
                window.focus(&previous, cx);
            }
            state.timer = Some(cx.spawn(async move |_, cx| {
                // The longer of the two closings: a spotlight's preview goes back to its place.
                cx.background_executor()
                    .timer(Duration::from_millis(metrics::CLOSE.max(spot::CLOSE)))
                    .await;
                let _ = weak_timer.update(cx, |state, cx| {
                    state.open = false;
                    state.closing = false;
                    state.cards.borrow_mut().clear();
                    cx.notify();
                });
            }));
            cx.notify();
        });
    })
}

/// Where a host's menu is laid: at a point, or by its trigger.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum GMenuPlacement {
    /// Below the trigger, their left edges together (above it if there is no room below).
    #[default]
    Below,
    /// Below, their right edges together.
    BelowRight,
    /// Above the trigger, their left edges together.
    Above,
    /// Above, their right edges together.
    AboveRight,
}

/// Records the trigger's bounds (for a menu laid by it).
pub(crate) fn trigger_probe(state: &Entity<HostState>, cx: &App) -> impl IntoElement {
    let trigger = state.read(cx).trigger.clone();
    canvas(move |b, _, _| *trigger.borrow_mut() = b, |_, _, _, _| {})
        .absolute()
        .top(px(0.))
        .left(px(0.))
        .size_full()
}

/// The open menu, laid over the window, animated.
pub(crate) fn host_overlay(
    state: &Entity<HostState>,
    menu: GMenu,
    placement: GMenuPlacement,
    window: &mut Window,
    cx: &mut App,
) -> Option<AnyElement> {
    let (open, closing, position, generation, cards, trigger) = {
        let s = state.read(cx);
        (
            s.open,
            s.closing,
            s.position,
            s.generation,
            s.cards.clone(),
            *s.trigger.borrow(),
        )
    };
    if !open {
        return None;
    }
    let _ = window;
    let close = host_closer(state);
    let menu = menu.hosted(Hosted {
        close,
        back: None,
        entered: None,
        cards,
        depth: 0,
        focus: None,
    });
    // A fresh menu at each opening (its own state: nothing lit, no submenu).
    let menu = div()
        .id(ElementId::NamedInteger(
            "g-menu-host".into(),
            generation as u64,
        ))
        .child(menu);
    let animated = if closing {
        fade_out(
            ElementId::NamedInteger("g-menu-out".into(), generation as u64),
            menu,
        )
        .into_any_element()
    } else {
        fade_in(
            ElementId::NamedInteger("g-menu-in".into(), generation as u64),
            menu,
        )
        .into_any_element()
    };
    let gap = px(6.);
    let layer = match position {
        Some(position) => anchored()
            .position(position)
            .snap_to_window_with_margin(px(metrics::WINDOW_MARGIN)),
        None => {
            let (corner, anchor, offset) = match placement {
                GMenuPlacement::Below => (Anchor::BottomLeft, Anchor::TopLeft, point(px(0.), gap)),
                GMenuPlacement::BelowRight => {
                    (Anchor::BottomRight, Anchor::TopRight, point(px(0.), gap))
                }
                GMenuPlacement::Above => (Anchor::TopLeft, Anchor::BottomLeft, point(px(0.), -gap)),
                GMenuPlacement::AboveRight => {
                    (Anchor::TopRight, Anchor::BottomRight, point(px(0.), -gap))
                }
            };
            anchored()
                .attach(trigger, corner)
                .anchor(anchor)
                .offset(offset)
                .snap_to_window_with_margin(px(metrics::WINDOW_MARGIN))
        }
    };
    Some(
        deferred(layer.child(animated))
            .with_priority(1)
            .into_any_element(),
    )
}

/// A context menu on what it wraps: the right button (or Ctrl-click on the Mac) opens `menu` there; a click
/// elsewhere, a choice or Escape closes it.
#[derive(IntoElement)]
pub struct GContextMenu {
    id: ElementId,
    child: AnyElement,
    menu: GMenuBuilder,
    spotlight: Option<GSpotlight>,
    request: u64,
}

impl GContextMenu {
    /// `menu` builds the menu each time it opens; its argument closes it (a row's action closes it already).
    pub fn new(
        id: impl Into<ElementId>,
        child: impl IntoElement,
        menu: impl Fn(GMenuClose, &mut Window, &mut App) -> GMenu + 'static,
    ) -> Self {
        GContextMenu {
            id: id.into(),
            child: child.into_any_element(),
            menu: Rc::new(menu),
            spotlight: None,
            request: 0,
        }
    }

    /// Opens the menu when `request` grows past the last one honoured: from the keyboard, or a button elsewhere. It
    /// opens by what it wraps (around it, with a spotlight).
    pub fn open_request(mut self, request: u64) -> Self {
        self.request = request;
        self
    }

    /// Opens the menu around what it wraps, lifted out of the page, as the iPhone does with a message (see
    /// `GSpotlight`), instead of at the pointer.
    pub fn spotlight(mut self, spotlight: GSpotlight) -> Self {
        self.spotlight = Some(spotlight);
        self
    }
}

impl RenderOnce for GContextMenu {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let state = host_state(self.id.clone(), window, cx);
        if self.request > state.read(cx).request_seen {
            let request = self.request;
            state.update(cx, |state, _| state.request_seen = request);
            host_open(&state, None, window, cx);
        }
        let is_open = state.read(cx).open;
        let overlay = if is_open {
            let menu = (self.menu)(host_closer(&state), window, cx);
            match &self.spotlight {
                Some(spotlight) => spotlight_overlay(&state, menu, spotlight, window, cx),
                None => host_overlay(&state, menu, GMenuPlacement::Below, window, cx),
            }
        } else {
            None
        };
        let spotlit = self.spotlight.is_some();
        let open = state.clone();
        let ctrl_click = state.clone();
        div()
            .id(self.id)
            // Lifted out: its place stays, empty, under the veil (the preview stands in for it).
            .when(spotlit, |this| {
                this.relative()
                    .child(trigger_probe(&state, cx))
                    .when(is_open, |this| this.opacity(0.))
            })
            .on_mouse_down(MouseButton::Right, move |event, window, cx| {
                host_open(&open, Some(event.position), window, cx);
                cx.stop_propagation();
            })
            .when(cfg!(target_os = "macos"), |this| {
                this.on_mouse_down(MouseButton::Left, move |event, window, cx| {
                    if event.modifiers.control {
                        host_open(&ctrl_click, Some(event.position), window, cx);
                        cx.stop_propagation();
                    }
                })
            })
            .child(self.child)
            .children(overlay)
    }
}

// MARK: The spotlight

/// What a context menu lifts out of the page while it is open, as the iPhone does with a message held down: the rest
/// of the window veiled, the thing itself in front, at its place (moved a little when need be, so that everything
/// fits), the menu's pill above it and its card below. A thing too tall to fit is cut, fading out at the cut.
///
/// GPUI cannot blur what lies behind a layer: the veil is a frosted wash of the page's own colour, then a shade, which
/// takes the page's contrast away as a blur would.
#[derive(Clone)]
pub struct GSpotlight {
    preview: Rc<dyn Fn(&mut Window, &mut App) -> AnyElement>,
    trailing: bool,
    fade: Option<Hsla>,
    radius: Pixels,
}

impl GSpotlight {
    /// `preview` draws the thing again (it is laid at the width it had in the page).
    pub fn new(preview: impl Fn(&mut Window, &mut App) -> AnyElement + 'static) -> Self {
        GSpotlight {
            preview: Rc::new(preview),
            trailing: false,
            fade: None,
            radius: px(14.),
        }
    }

    /// The pill and the card line up with its right edge (my own messages), not its left one.
    pub fn trailing(mut self, trailing: bool) -> Self {
        self.trailing = trailing;
        self
    }

    /// Cut, it fades into this colour (its own background; the surface's otherwise).
    pub fn fade(mut self, color: Hsla) -> Self {
        self.fade = Some(color);
        self
    }

    /// Its corners, for its shadow and its cut.
    pub fn corner_radius(mut self, radius: Pixels) -> Self {
        self.radius = radius;
        self
    }
}

/// The spotlight's measures, in points and milliseconds.
mod spot {
    /// From the window's edges.
    pub const MARGIN: f32 = 12.;
    /// Between the pill, the thing and the card (about 12 and 8 on the iPhone).
    pub const GAP: f32 = 10.;
    /// The least of a cut thing that stays seen.
    pub const MIN_PREVIEW: f32 = 72.;
    /// The fade at a cut.
    pub const FADE: f32 = 64.;
    /// How far the pill and the card come from.
    pub const TRAVEL: f32 = 14.;
    pub const OPEN: u64 = 340;
    pub const CLOSE: u64 = 170;
}

#[derive(Default, Clone, Copy)]
struct SpotSizes {
    pill: Option<Size<Pixels>>,
    card: Option<Size<Pixels>>,
}

/// Where a spotlight lays the menu's pill and card, and what it puts under them.
struct Spotlit {
    viewport: Size<Pixels>,
    backdrop: AnyElement,
    preview: AnyElement,
    pill_at: Point<Pixels>,
    card_at: Point<Pixels>,
    sizes: Rc<RefCell<SpotSizes>>,
    closing: bool,
    generation: usize,
}

impl Spotlit {
    fn lay(
        self,
        id: ElementId,
        pill: Option<gpui::Div>,
        card: gpui::Div,
    ) -> gpui::Stateful<gpui::Div> {
        let measure = |sizes: Rc<RefCell<SpotSizes>>, is_pill: bool| {
            canvas(
                move |b, _, _| {
                    let mut sizes = sizes.borrow_mut();
                    if is_pill {
                        sizes.pill = Some(b.size);
                    } else {
                        sizes.card = Some(b.size);
                    }
                },
                |_, _, _, _| {},
            )
            .absolute()
            .top(px(0.))
            .left(px(0.))
            .size_full()
        };
        let (generation, closing) = (self.generation, self.closing);
        let piece = |name: &'static str, at: Point<Pixels>, from: f32, element: gpui::Div| {
            spot_animated(
                div().absolute().left(at.x).top(at.y).child(element),
                spot_id(name, generation, closing),
                closing,
                move |this, e| {
                    this.top(at.y + px(from * (1. - e)))
                        .opacity(e.clamp(0., 1.))
                },
            )
        };
        let pill = pill.map(|pill| {
            piece(
                "g-spot-pill",
                self.pill_at,
                spot::TRAVEL,
                pill.child(measure(self.sizes.clone(), true)),
            )
        });
        let card = piece(
            "g-spot-card",
            self.card_at,
            -spot::TRAVEL,
            div()
                .relative()
                .child(card)
                .child(measure(self.sizes.clone(), false)),
        );
        div()
            .id(id)
            .role(Role::Menu)
            .relative()
            .w(self.viewport.width)
            .h(self.viewport.height)
            .child(self.backdrop)
            .child(self.preview)
            .children(pill)
            .child(card)
    }
}

/// A piece's animation, fresh at each opening and at its closing.
fn spot_id(name: &'static str, generation: usize, closing: bool) -> ElementId {
    ElementId::NamedInteger(
        SharedString::new_static(name),
        generation as u64 * 2 + closing as u64,
    )
}

/// Out with a light spring on opening (a touch past, then back), back softly on closing: `e` goes from 0 to 1 when
/// opening, from 1 to 0 when closing.
fn spot_animated(
    element: gpui::Div,
    id: ElementId,
    closing: bool,
    animate: impl Fn(gpui::Div, f32) -> gpui::Div + 'static,
) -> AnyElement {
    if closing {
        element
            .with_animation(
                id,
                Animation::new(Duration::from_millis(spot::CLOSE)).with_easing(gpui::quadratic),
                move |this, t| animate(this, 1. - t),
            )
            .into_any_element()
    } else {
        element
            .with_animation(
                id,
                Animation::new(Duration::from_millis(spot::OPEN)).with_easing(spring_out),
                animate,
            )
            .into_any_element()
    }
}

/// A spring that settles quickly: a little past the end, then back (a mild « back out »).
fn spring_out(t: f32) -> f32 {
    let (c1, u) = (1.1_f32, t - 1.);
    1. + (c1 + 1.) * u * u * u + c1 * u * u
}

/// What the menu's card should measure, before it has been laid once.
fn estimated_height(menu: &GMenu) -> f32 {
    let rows: f32 = menu
        .entries
        .iter()
        .map(|entry| match entry {
            Entry::Item(_) | Entry::Element(_) => metrics::ROW,
            Entry::Separator => metrics::GROUP_GAP,
            Entry::Section(_) => 30. + metrics::GROUP_GAP,
        })
        .sum();
    rows + 2.
}

/// The veil over the window: a frosted wash of the page's colour, then a shade (`ultraThinMaterial` and a black of
/// 12 % on the iPhone).
fn veil(cx: &App) -> (Hsla, Hsla) {
    let colors = cx.theme().colors;
    if cx.theme().is_dark() {
        (alpha(colors.background, 0.74), black(0.32))
    } else {
        (
            alpha(mix(colors.background, white(1.0), 0.30), 0.85),
            black(0.18),
        )
    }
}

/// An open spotlight menu, over the whole window.
fn spotlight_overlay(
    state: &Entity<HostState>,
    menu: GMenu,
    spotlight: &GSpotlight,
    window: &mut Window,
    cx: &mut App,
) -> Option<AnyElement> {
    let (open, closing, generation, cards, trigger, sizes) = {
        let s = state.read(cx);
        (
            s.open,
            s.closing,
            s.generation,
            s.cards.clone(),
            *s.trigger.borrow(),
            s.spot_sizes.clone(),
        )
    };
    if !open {
        return None;
    }
    let viewport = window.viewport_size();
    let measured = *sizes.borrow();
    let margin = px(spot::MARGIN);
    let gap = px(spot::GAP);
    let pill = if menu.above.is_some() {
        measured.pill.unwrap_or(size(px(300.), px(48.)))
    } else {
        size(px(0.), -gap)
    };
    let card = measured
        .card
        .unwrap_or(size(px(metrics::MIN_WIDTH), px(estimated_height(&menu))));
    let (top, bottom) = (margin, viewport.height - margin);
    // The card scrolls rather than push the thing out: it keeps a few rows at least.
    let card_room = (bottom - top - pill.height - gap * 2. - px(spot::MIN_PREVIEW)).max(px(120.));
    let card_height = card.height.min(card_room);
    // The thing, cut when it is too tall for all to fit.
    let room = (bottom - top - pill.height - card_height - gap * 2.).max(px(spot::MIN_PREVIEW));
    let height = trigger.size.height.min(room);
    let cut = height < trigger.size.height;
    // It stays where it was, unless it must move for the pill and the card to fit.
    let total = pill.height + gap + height + gap + card_height;
    let wanted = trigger.origin.y - pill.height - gap;
    let start = wanted.max(top).min((bottom - total).max(top));
    let thing_y = start + pill.height + gap;
    let width = trigger.size.width.min(viewport.width - margin * 2.);
    let side = |w: Pixels| {
        let x = if spotlight.trailing {
            trigger.origin.x + trigger.size.width - w
        } else {
            trigger.origin.x
        };
        x.min(viewport.width - w - margin).max(margin)
    };
    let pill_at = point(side(pill.width), start);
    let card_at = point(side(card.width), thing_y + height + gap);
    let thing_x = side(width);

    let close = host_closer(state);
    let dark = cx.theme().is_dark();
    let (wash, shade) = veil(cx);
    let (left_close, right_close) = (close.clone(), close.clone());
    let backdrop = spot_animated(
        div().absolute().top(px(0.)).left(px(0.)).size_full().child(
            div()
                .id("g-spot-veil")
                .size_full()
                .bg(wash)
                .occlude()
                .on_mouse_down(MouseButton::Left, move |_, window, cx| {
                    left_close(window, cx)
                })
                .on_mouse_down(MouseButton::Right, move |_, window, cx| {
                    right_close(window, cx)
                })
                .on_scroll(|_, _, cx| cx.stop_propagation())
                .child(div().size_full().bg(shade)),
        ),
        spot_id("g-spot-veil", generation, closing),
        closing,
        |this, e| this.opacity(e.clamp(0., 1.)),
    );

    // The thing, drawn again over its place, lifted on a shadow; cut, it fades into its own colour.
    let fade = spotlight.fade.unwrap_or(cx.theme().colors.surface);
    let radius = spotlight.radius;
    let drawn = (spotlight.preview)(window, cx);
    let content = if cut {
        div()
            .relative()
            .size_full()
            .rounded(radius)
            .bg(fade)
            .child(
                div()
                    .absolute()
                    .top(px(0.))
                    .left(px(0.))
                    .w_full()
                    .h(height - radius)
                    .overflow_hidden()
                    .child(div().w_full().flex_none().child(drawn)),
            )
            .child(
                div()
                    .absolute()
                    .left(px(0.))
                    .w_full()
                    .bottom(px(0.))
                    .h(px(spot::FADE) + radius)
                    .rounded_b(radius)
                    .bg(linear_gradient(
                        180.,
                        linear_color_stop(alpha(fade, 0.), 0.),
                        linear_color_stop(fade, 0.8),
                    )),
            )
            .into_any_element()
    } else {
        drawn
    };
    let from_y = trigger.origin.y;
    let thing_close = close.clone();
    let preview = spot_animated(
        div()
            .absolute()
            .left(thing_x)
            .top(thing_y)
            .w(width)
            .h(height)
            .child(
                div()
                    .id("g-spot-thing")
                    .size_full()
                    .rounded(radius)
                    .occlude()
                    .on_mouse_down(MouseButton::Left, move |_, window, cx| {
                        thing_close(window, cx)
                    })
                    .child(content),
            ),
        spot_id("g-spot-thing", generation, closing),
        closing,
        move |this, e| {
            let shade = black((if dark { 0.45 } else { 0.20 }) * e.clamp(0., 1.));
            this.top(from_y + (thing_y - from_y) * e)
                .shadow(vec![
                    gpui::BoxShadow::new(px(0.), px(8.), shade).blur_radius(px(24.)),
                ])
                .rounded(radius)
        },
    );

    let mut menu = menu.max_height(card_room).hosted(Hosted {
        close,
        back: None,
        entered: None,
        cards,
        depth: 0,
        focus: None,
    });
    menu.spotlit = Some(Spotlit {
        viewport,
        backdrop,
        preview,
        pill_at,
        card_at,
        sizes,
        closing,
        generation,
    });
    Some(
        deferred(
            anchored().position(point(px(0.), px(0.))).child(
                div()
                    .id(ElementId::NamedInteger(
                        "g-spot-host".into(),
                        generation as u64,
                    ))
                    .child(menu),
            ),
        )
        .with_priority(1)
        .into_any_element(),
    )
}

/// A button that opens a menu (« … », « + »): `trigger` is drawn as it is, a click on it opens `menu` by it.
#[derive(IntoElement)]
pub struct GMenuButton {
    id: ElementId,
    trigger: AnyElement,
    menu: GMenuBuilder,
    placement: GMenuPlacement,
}

impl GMenuButton {
    pub fn new(
        id: impl Into<ElementId>,
        trigger: impl IntoElement,
        menu: impl Fn(GMenuClose, &mut Window, &mut App) -> GMenu + 'static,
    ) -> Self {
        GMenuButton {
            id: id.into(),
            trigger: trigger.into_any_element(),
            menu: Rc::new(menu),
            placement: GMenuPlacement::Below,
        }
    }

    pub fn placement(mut self, placement: GMenuPlacement) -> Self {
        self.placement = placement;
        self
    }
}

impl RenderOnce for GMenuButton {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let state = host_state(self.id.clone(), window, cx);
        let is_open = state.read(cx).is_open();
        let overlay = if state.read(cx).open {
            let menu = (self.menu)(host_closer(&state), window, cx);
            host_overlay(&state, menu, self.placement, window, cx)
        } else {
            None
        };
        let toggle = state.clone();
        let close = host_closer(&state);
        div()
            .id(self.id)
            .relative()
            .flex_none()
            .role(Role::Button)
            .aria_expanded(is_open)
            .on_click(move |_, window, cx| {
                if toggle.read(cx).is_open() {
                    close(window, cx);
                } else {
                    host_open(&toggle, None, window, cx);
                }
            })
            .child(self.trigger)
            .child(trigger_probe(&state, cx))
            .children(overlay)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_keyboard_stops_at_the_ends() {
        let rows = [1, 2, 4];
        assert_eq!(move_lit(&rows, None, Step::Next), Some(1));
        assert_eq!(move_lit(&rows, None, Step::Previous), Some(4));
        assert_eq!(move_lit(&rows, Some(2), Step::Next), Some(4));
        assert_eq!(move_lit(&rows, Some(4), Step::Next), Some(4));
        assert_eq!(move_lit(&rows, Some(1), Step::Previous), Some(1));
        assert_eq!(move_lit(&rows, Some(4), Step::First), Some(1));
        assert_eq!(move_lit(&[], None, Step::Next), None);
    }

    #[test]
    fn a_letter_goes_to_the_next_row_that_starts_with_it() {
        let titles = [(0, "Répondre"), (1, "Réagir"), (3, "Copier"), (4, "Écrire")];
        assert_eq!(next_starting_with(&titles, None, 'r'), Some(0));
        assert_eq!(next_starting_with(&titles, Some(0), 'r'), Some(1));
        assert_eq!(next_starting_with(&titles, Some(1), 'r'), Some(0));
        assert_eq!(next_starting_with(&titles, None, 'e'), Some(4));
        assert_eq!(next_starting_with(&titles, None, 'z'), None);
    }

    #[test]
    fn shortcuts_are_written_as_each_system_does() {
        assert_eq!(shortcut_label_for("secondary-c", true), "⌘C");
        assert_eq!(shortcut_label_for("secondary-c", false), "Ctrl + C");
        assert_eq!(shortcut_label_for("cmd-shift-z", true), "⇧⌘Z");
        assert_eq!(shortcut_label_for("ctrl-shift-z", false), "Ctrl + Maj + Z");
        assert_eq!(shortcut_label_for("secondary-backspace", true), "⌘⌫");
        assert_eq!(
            shortcut_label_for("secondary-backspace", false),
            "Ctrl + Retour arrière"
        );
        assert_eq!(shortcut_label_for("enter", false), "Entrée");
    }

    #[test]
    fn a_shortcut_is_read_as_gpui_writes_keys() {
        let (modifiers, key) = parse_shortcut("ctrl-alt-shift-k").unwrap();
        assert!(modifiers.control && modifiers.alt && modifiers.shift && !modifiers.platform);
        assert_eq!(key, "k");
        assert!(parse_shortcut("hyper-k").is_none());
    }
}
