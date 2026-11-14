//! Gabarit's settings pages (GabaritApple's `GForm.swift`), like Discord's or the Mac's System Settings: the page's
//! title large in the page (no band), its sections as crisp cards on the ground, a reading width aligned left, rows
//! of a constant height split by a fine line, a section's sentence discreet below.

use std::rc::Rc;

use gpui::{
    AnyElement, App, ClickEvent, CursorStyle, ElementId, IntoElement, ParentElement, RenderOnce,
    Role, SharedString, Styled, Window, div, prelude::*, px,
};

use crate::assets::icon;
use crate::button::{ClickHandler, GButton};
use crate::relief::{GPointer, card, page_ground};
use crate::theme::{ActiveTheme, GTextExt, alpha};
use crate::tokens::{opacity, radius, text};

/// The settings pages' measures, the Mac's: a 4-point grid.
pub mod metrics {
    /// The content's reading width.
    pub const READABLE: f32 = 680.0;
    /// A single column of cards (a narrow window): a little wider than the settings'.
    pub const COLUMN: f32 = 760.0;
    /// The maximum width of a wide page, or of a tool.
    pub const WIDE: f32 = 1160.0;
    /// A page's left margin (settings); a sheet's (editors), tighter.
    pub const PAGE_MARGIN: f32 = 40.0;
    pub const SHEET_MARGIN: f32 = 24.0;
    /// A simple row's height.
    pub const ROW_HEIGHT: f32 = 44.0;
    /// The space between two sections.
    pub const SECTION_SPACING: f32 = 32.0;
    /// The margin above a page's title.
    pub const PAGE_TOP: f32 = 36.0;
}

/// A page's title (`GPageTitle`): large, the sentence that says what it is for more discreet below.
#[derive(IntoElement)]
pub struct GPageTitle {
    title: SharedString,
    summary: SharedString,
}

impl GPageTitle {
    pub fn new(title: impl Into<SharedString>, summary: impl Into<SharedString>) -> Self {
        GPageTitle {
            title: title.into(),
            summary: summary.into(),
        }
    }
}

impl RenderOnce for GPageTitle {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        div()
            .flex()
            .flex_col()
            .gap(px(6.))
            .w_full()
            .child(
                div()
                    .id(SharedString::from(format!("g-page-title-{}", self.title)))
                    .role(Role::Heading)
                    .aria_level(1)
                    .aria_label(self.title.clone())
                    .g_text(text::LARGE_TITLE)
                    .text_color(colors.text_primary)
                    .child(gpui::Text::new_inaccessible(self.title)),
            )
            .when(!self.summary.is_empty(), |this| {
                this.child(
                    div()
                        .g_text(text::BODY)
                        .text_color(colors.text_discret)
                        .child(self.summary),
                )
            })
    }
}

/// A value and its title (`GLabeledContentStyle`): the title on the left, the value on the right, more discreet.
#[derive(IntoElement)]
pub struct GLabeledContent {
    title: SharedString,
    value: AnyElement,
}

impl GLabeledContent {
    pub fn new(title: impl Into<SharedString>, value: impl IntoElement) -> Self {
        GLabeledContent {
            title: title.into(),
            value: value.into_any_element(),
        }
    }
}

impl RenderOnce for GLabeledContent {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        div()
            .flex()
            .items_center()
            .gap(px(12.))
            .w_full()
            .g_text(text::BODY)
            .child(
                div()
                    .flex_1()
                    .text_color(colors.text_primary)
                    .child(self.title),
            )
            .child(div().text_color(colors.text_secondary).child(self.value))
    }
}

/// A card's row that is a button (`GFormRowButtonStyle`): its text in the accent (red if it destroys), the whole row
/// clickable, the veil on hover, dimmed while pressed.
#[derive(IntoElement)]
pub struct GFormRowButton {
    id: ElementId,
    title: SharedString,
    icon: Option<&'static str>,
    destructive: bool,
    disabled: bool,
    preview: Option<GPointer>,
    on_click: Option<ClickHandler>,
}

impl GFormRowButton {
    pub fn new(id: impl Into<ElementId>, title: impl Into<SharedString>) -> Self {
        GFormRowButton {
            id: id.into(),
            title: title.into(),
            icon: None,
            destructive: false,
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

impl RenderOnce for GFormRowButton {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let foreground = if self.destructive {
            colors.error_text
        } else {
            colors.accent_text
        };
        let veil = colors.row_hover;
        let follows = !self.disabled && self.preview.is_none();
        // The veil, rounded, centred in the row's cell, inset from the card's edges and its lines.
        let lit = !self.disabled && self.preview.is_some();
        div()
            .id(self.id)
            .group("g-row-button")
            .relative()
            .flex()
            .items_center()
            .w_full()
            .min_h(px(metrics::ROW_HEIGHT))
            .px(px(16.))
            .role(Role::Button)
            .aria_label(self.title.clone())
            .when(self.disabled, |this| this.opacity(opacity::DISABLED))
            .child(
                div()
                    .id("g-row-veil")
                    .absolute()
                    .top(px(5.))
                    .bottom(px(5.))
                    .left(px(8.))
                    .right(px(8.))
                    .rounded(px(radius::MD))
                    .bg(veil)
                    .opacity(if lit { 1. } else { 0. })
                    .when(follows, |this| {
                        this.group_hover("g-row-button", |style| style.opacity(1.))
                    }),
            )
            .child(
                div()
                    .id("g-row-label")
                    .relative()
                    .flex()
                    .items_center()
                    .gap(px(8.))
                    .g_text(text::BODY)
                    .text_color(foreground)
                    .when(self.preview == Some(GPointer::Pressed), |this| {
                        this.opacity(0.6)
                    })
                    .when(follows, |this| {
                        this.group_active("g-row-button", |style| style.opacity(0.6))
                    })
                    .when_some(self.icon, |this, name| {
                        this.child(icon(name, px(15.), foreground))
                    })
                    .child(self.title),
            )
            .when(follows, |this| {
                this.cursor(CursorStyle::PointingHand)
                    .focusable()
                    .tab_stop(true)
                    .when_some(self.on_click, |this, handler| {
                        this.on_click(move |event, window, cx| handler(event, window, cx))
                    })
            })
    }
}

enum Row {
    /// In the card, at the row's height, with its margins.
    Card(AnyElement),
    /// A button that is the whole row.
    Button(AnyElement),
    /// Right on the ground, out of the card (a preview, an empty state, a sheet's main button).
    Bare(AnyElement),
}

/// A section: its title, its rows in a card (or right on the ground), its sentence discreet below.
#[derive(IntoElement)]
pub struct GFormSection {
    header: Option<SharedString>,
    header_icon: Option<&'static str>,
    footer: Option<SharedString>,
    rows: Vec<Row>,
}

impl GFormSection {
    pub fn new() -> Self {
        GFormSection {
            header: None,
            header_icon: None,
            footer: None,
            rows: Vec::new(),
        }
    }

    pub fn header(mut self, header: impl Into<SharedString>) -> Self {
        self.header = Some(header.into());
        self
    }

    /// An icon before the title, discreet.
    pub fn header_icon(mut self, name: &'static str) -> Self {
        self.header_icon = Some(name);
        self
    }

    pub fn footer(mut self, footer: impl Into<SharedString>) -> Self {
        self.footer = Some(footer.into());
        self
    }

    pub fn row(mut self, row: impl IntoElement) -> Self {
        self.rows.push(Row::Card(row.into_any_element()));
        self
    }

    pub fn button(mut self, button: GFormRowButton) -> Self {
        self.rows.push(Row::Button(button.into_any_element()));
        self
    }

    pub fn bare(mut self, row: impl IntoElement) -> Self {
        self.rows.push(Row::Bare(row.into_any_element()));
        self
    }
}

impl Default for GFormSection {
    fn default() -> Self {
        Self::new()
    }
}

impl RenderOnce for GFormSection {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let all_bare =
            !self.rows.is_empty() && self.rows.iter().all(|row| matches!(row, Row::Bare(_)));
        let mut section = div().flex().flex_col().gap(px(8.)).w_full();
        if let Some(header) = self.header.clone() {
            section = section.child(
                div()
                    .id(SharedString::from(format!("g-section-{header}")))
                    .role(Role::Heading)
                    .aria_level(2)
                    .aria_label(header.clone())
                    .flex()
                    .items_center()
                    .gap(px(6.))
                    .pb(px(4.))
                    .g_text(text::HEADLINE)
                    .text_color(colors.text_primary)
                    .when_some(self.header_icon, |this, name| {
                        this.child(icon(name, px(12.), colors.text_discret))
                    })
                    .child(gpui::Text::new_inaccessible(header)),
            );
        }
        if all_bare {
            section = section.child(div().flex().flex_col().gap(px(12.)).children(
                self.rows.into_iter().map(|row| match row {
                    Row::Bare(element) | Row::Card(element) | Row::Button(element) => element,
                }),
            ));
        } else if !self.rows.is_empty() {
            let shape = px(radius::LG);
            let mut card = card(shape, cx).flex().flex_col();
            for (index, row) in self.rows.into_iter().enumerate() {
                if index > 0 {
                    card = card.child(div().pl(px(16.)).child(div().h(px(1.)).bg(colors.hairline)));
                }
                card = card.child(match row {
                    Row::Card(element) => div()
                        .flex()
                        .items_center()
                        .min_h(px(metrics::ROW_HEIGHT))
                        .px(px(16.))
                        .py(px(8.))
                        .child(element)
                        .into_any_element(),
                    Row::Button(element) => element,
                    Row::Bare(element) => div().p(px(12.)).child(element).into_any_element(),
                });
            }
            section = section.child(card);
        }
        section.when_some(self.footer, |this, footer| {
            this.child(
                div()
                    .px(px(2.))
                    .g_text(text::CALLOUT)
                    .text_color(colors.text_discret)
                    .child(footer),
            )
        })
    }
}

/// A form section's buttons: side by side and aligned right on a single row, as in System Settings.
#[derive(IntoElement)]
pub struct GFormButtons {
    buttons: Vec<GButton>,
    leading: bool,
}

impl GFormButtons {
    pub fn new(buttons: impl IntoIterator<Item = GButton>) -> Self {
        GFormButtons {
            buttons: buttons.into_iter().collect(),
            leading: false,
        }
    }

    /// On the left rather than the right (a lone button at the head of a page).
    pub fn leading(mut self) -> Self {
        self.leading = true;
        self
    }
}

impl RenderOnce for GFormButtons {
    fn render(self, _window: &mut Window, _cx: &mut App) -> impl IntoElement {
        div()
            .flex()
            .flex_wrap()
            .gap(px(8.))
            .w_full()
            .when(!self.leading, |this| this.justify_end())
            .children(self.buttons)
    }
}

/// A sheet's main button, full width (Gabarit's ink), laid right on the ground.
pub fn sheet_button(id: impl Into<ElementId>, title: impl Into<SharedString>) -> GButton {
    GButton::new(id, title).primary().regular().full_width()
}

/// Gabarit's form: the page's title, then each section as a card, in a reading width, on the page's ground. In a sheet
/// (no title), the sheet's margins.
#[derive(IntoElement)]
pub struct GForm {
    id: ElementId,
    title: Option<GPageTitle>,
    back: Option<(SharedString, ClickHandler)>,
    sections: Vec<GFormSection>,
    scrolls: bool,
    ground: bool,
}

impl GForm {
    pub fn new(id: impl Into<ElementId>) -> Self {
        GForm {
            id: id.into(),
            title: None,
            back: None,
            sections: Vec::new(),
            scrolls: true,
            ground: true,
        }
    }

    pub fn title(
        mut self,
        title: impl Into<SharedString>,
        summary: impl Into<SharedString>,
    ) -> Self {
        self.title = Some(GPageTitle::new(title, summary));
        self
    }

    /// A sub-page: "‹ Name" above the title, back to the page one comes from.
    pub fn back(
        mut self,
        name: impl Into<SharedString>,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.back = Some((name.into(), Rc::new(handler)));
        self
    }

    pub fn section(mut self, section: GFormSection) -> Self {
        self.sections.push(section);
        self
    }

    /// Laid in a page that scrolls already (a gallery): no scrolling of its own.
    pub fn static_layout(mut self) -> Self {
        self.scrolls = false;
        self
    }

    /// On the ground laid by its container (a sheet).
    pub fn without_ground(mut self) -> Self {
        self.ground = false;
        self
    }
}

impl RenderOnce for GForm {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let in_page = self.title.is_some();
        let margin = if in_page {
            metrics::PAGE_MARGIN
        } else {
            metrics::SHEET_MARGIN
        };
        let back = self.back.map(|(name, handler)| {
            let accent = colors.accent_text;
            div()
                .id("g-form-back")
                .flex()
                .items_center()
                .gap(px(3.))
                .pb(px(10.))
                .g_text(text::CALLOUT)
                .font_weight(gpui::FontWeight::MEDIUM)
                .text_color(accent)
                .cursor(CursorStyle::PointingHand)
                .role(Role::Link)
                .aria_label(format!("Back to {name}"))
                .active(|style| style.opacity(0.6))
                .on_click(move |event, window, cx| handler(event, window, cx))
                .child(icon("caret-left", px(11.), accent))
                .child(name)
        });
        let column = div()
            .flex()
            .flex_col()
            .w_full()
            .max_w(px(metrics::READABLE))
            .children(back)
            .when_some(self.title, |this, title| {
                this.child(div().pb(px(28.)).child(title))
            })
            .child(
                div()
                    .flex()
                    .flex_col()
                    .gap(px(metrics::SECTION_SPACING))
                    .children(self.sections),
            );
        let content = div()
            .w_full()
            .px(px(margin))
            .pt(px(if in_page { metrics::PAGE_TOP } else { 16. }))
            .pb(px(48.))
            .child(column);
        let base = if self.ground { page_ground(cx) } else { div() };
        let page = base.id(self.id).size_full().text_color(colors.text_primary);
        if self.scrolls {
            page.overflow_y_scroll().child(content)
        } else {
            page.child(content)
        }
    }
}

/// Keeps the veil's colour at hand for rows drawn elsewhere (a sidebar).
pub fn row_hover_fill(cx: &App) -> gpui::Hsla {
    alpha(cx.theme().colors.row_hover, 1.0)
}
