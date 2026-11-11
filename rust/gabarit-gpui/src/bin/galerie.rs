//! Gabarit's gallery for GPUI: every component, light and dark, as `galerie/apple` draws them for SwiftUI.
//!
//!     cargo run --bin galerie                       the gallery, in the system's appearance
//!     cargo run --bin galerie -- --page states --dark
//!     cargo run --release --bin galerie -- --measure-list     scrolls the 10,000 messages and prints the frames
//!     cargo run --release --bin galerie -- --measure-start    prints the time to the first frame, then quits
//!
//! Pages: controls, states, forms, frame, feedback, sheet, menus, text, list. `--journal <file>`: what it says goes
//! to that file (under Windows, a release build has no console).

// Under Windows, a window of its own, without a console beside it.
#![cfg_attr(all(windows, not(debug_assertions)), windows_subsystem = "windows")]

use std::cell::RefCell;
use std::io::Write;
use std::sync::OnceLock;
use std::rc::Rc;
use std::time::{Duration, Instant};

use gabarit_gpui::feedback::GToastView;
use gabarit_gpui::text_field::GFieldFrame;
use gabarit_gpui::*;
use gabarit_gpui::{form, relief, theme, tokens};
use gpui::{
    AnyElement, App, Bounds, Context, Entity, FocusHandle, KeyBinding, ListState, SharedString, TitlebarOptions,
    Window, WindowBounds, WindowOptions, actions, canvas, div, point, prelude::*, px, size,
};

actions!(galerie, [Quit, FocusNext, FocusPrevious]);

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Page {
    Controls,
    States,
    Forms,
    Frame,
    Feedback,
    Sheet,
    Menus,
    Text,
    List,
}

impl Page {
    const ALL: [Page; 9] =
        [Page::Controls, Page::States, Page::Forms, Page::Frame, Page::Feedback, Page::Sheet, Page::Menus, Page::Text, Page::List];

    fn name(self) -> &'static str {
        match self {
            Page::Controls => "controls",
            Page::States => "states",
            Page::Forms => "forms",
            Page::Frame => "frame",
            Page::Feedback => "feedback",
            Page::Sheet => "sheet",
            Page::Menus => "menus",
            Page::Text => "text",
            Page::List => "list",
        }
    }

    fn title(self) -> &'static str {
        match self {
            Page::Controls => "Controls",
            Page::States => "States",
            Page::Forms => "Forms",
            Page::Frame => "Frame",
            Page::Feedback => "Feedback",
            Page::Sheet => "Sheet",
            Page::Menus => "Menus",
            Page::Text => "Text input",
            Page::List => "Long list",
        }
    }

    fn icon(self) -> &'static str {
        match self {
            Page::Controls => "squares-four",
            Page::States => "sparkle",
            Page::Forms => "gear-six",
            Page::Frame => "sun",
            Page::Feedback => "bell",
            Page::Sheet => "note-pencil",
            Page::Menus => "dots-three",
            Page::Text => "translate",
            Page::List => "chats-circle",
        }
    }
}

/// A conversation's message, made up for the long list.
struct Message {
    author: &'static str,
    time: String,
    body: String,
    grouped: bool,
}

const AUTHORS: [&str; 5] = ["Marie Curie", "Paul Langevin", "Irène Joliot", "Florian Simon", "Léa Martin"];
const WORDS: [&str; 24] = [
    "the", "relay", "keeps", "every", "message", "until", "your", "phone", "reads", "it", "and", "nothing", "is",
    "lost", "when", "the", "network", "drops", "for", "a", "while", "même", "hors", "ligne",
];

fn messages(count: usize) -> Vec<Message> {
    // A small linear congruential generator: the same conversation every time.
    let mut seed: u64 = 0x5EED;
    let mut next = move || {
        seed = seed.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        (seed >> 33) as usize
    };
    let mut previous = usize::MAX;
    (0..count)
        .map(|index| {
            let author = if next() % 3 == 0 && previous < AUTHORS.len() { previous } else { next() % AUTHORS.len() };
            let grouped = author == previous;
            previous = author;
            // From a few words to a paragraph: rows of one to eight lines.
            let length = match next() % 10 {
                0..=4 => 3 + next() % 8,
                5..=7 => 12 + next() % 20,
                _ => 40 + next() % 60,
            };
            let mut body: String = (0..length).map(|_| WORDS[next() % WORDS.len()]).collect::<Vec<_>>().join(" ");
            if index % 97 == 0 {
                body.push_str(" 👨‍👩‍👧‍👦 🇫🇷");
            }
            let minutes = index * 3;
            Message { author: AUTHORS[author], time: format!("{:02}:{:02}", (minutes / 60) % 24, minutes % 60), body, grouped }
        })
        .collect()
}

/// The frames counted while the list scrolls by itself.
struct Measure {
    started: Instant,
    last: Option<Instant>,
    render_start: Rc<RefCell<Option<Instant>>>,
    intervals: Vec<f64>,
    cpu: Rc<RefCell<Vec<f64>>>,
    speed: f32,
}

struct Gallery {
    page: Page,
    focus: FocusHandle,
    notifications: bool,
    previews: bool,
    sounds: bool,
    agree: bool,
    appearance_choice: usize,
    size_choice: usize,
    volume: f64,
    reminders: i64,
    tab: usize,
    sheet_open: bool,
    sheet_name: Entity<GTextInput>,
    name: Entity<GTextInput>,
    bio: Entity<GTextInput>,
    arabic: Entity<GTextInput>,
    hebrew: Entity<GTextInput>,
    emoji: Entity<GTextInput>,
    disabled_field: Entity<GTextInput>,
    state_fields: Vec<Entity<GTextInput>>,
    toasts: Entity<GToastCenter>,
    list: ListState,
    messages: Rc<Vec<Message>>,
    measure: Option<Measure>,
}

fn input(cx: &mut Context<Gallery>, build: impl FnOnce(GTextInput) -> GTextInput) -> Entity<GTextInput> {
    let entity = cx.new(|cx| build(GTextInput::new(cx)));
    cx.observe(&entity, |_, _, cx| cx.notify()).detach();
    entity
}

impl Gallery {
    fn new(page: Page, cx: &mut Context<Self>) -> Self {
        let messages = Rc::new(messages(10_000));
        let state_fields = (0..4).map(|_| input(cx, |field| field.with_text("Florian"))).collect::<Vec<_>>();
        state_fields[3].update(cx, |field, cx| field.set_disabled(true, cx));
        let disabled_field = input(cx, |field| field.with_text("Read only"));
        disabled_field.update(cx, |field, cx| field.set_disabled(true, cx));
        Gallery {
            page,
            focus: cx.focus_handle(),
            notifications: true,
            previews: false,
            sounds: true,
            agree: true,
            appearance_choice: 1,
            size_choice: 1,
            volume: 0.6,
            reminders: 3,
            tab: 0,
            sheet_open: false,
            sheet_name: input(cx, |field| field.placeholder("Name of the space")),
            name: input(cx, |field| field.with_text("Florian").placeholder("Your name")),
            bio: input(cx, |field| {
                field.multi_line(3, 6).with_text(
                    "Several lines, wrapped at the field's width. Return goes to the line; the field grows up to six lines, then scrolls.",
                )
            }),
            arabic: input(cx, |field| field.with_text("مرحبا بالعالم، هذا نص عربي مع SkollN في الوسط")),
            hebrew: input(cx, |field| field.with_text("שלום עולם, זה טקסט בעברית 2026")),
            emoji: input(cx, |field| field.with_text("Family 👨‍👩‍👧‍👦 flag 🇫🇷 thumb 👍🏽 e + ◌́: é")),
            disabled_field,
            state_fields,
            toasts: cx.new(|_| GToastCenter::new()),
            list: GLongList::state(messages.len(), true),
            messages,
            measure: None,
        }
    }

    fn set_page(&mut self, page: Page, cx: &mut Context<Self>) {
        self.page = page;
        cx.notify();
    }

    fn sidebar(&self, cx: &mut Context<Self>) -> impl IntoElement + use<> {
        let colors = cx.theme().colors;
        let dark = cx.theme().is_dark();
        div()
            .flex()
            .flex_col()
            .flex_none()
            .w(px(220.))
            .h_full()
            .p(px(8.))
            .gap(px(2.))
            .bg(colors.sidebar)
            .border_r_1()
            .border_color(colors.hairline)
            .children(Page::ALL.iter().map(|page| {
                let page = *page;
                GSidebarRow::new(page.name(), page.title(), page.icon(), self.page == page)
                    .on_click(cx.listener(move |this, _, _, cx| this.set_page(page, cx)))
            }))
            .child(div().flex_1())
            .child(
                div().px(px(8.)).pb(px(8.)).child(
                    GPicker::new("appearance", "", ["Light", "Dark"], dark as usize).chips().on_change(|choice, _, cx| {
                        theme::set_appearance(if *choice == 1 { GAppearance::Dark } else { GAppearance::Light }, cx)
                    }),
                ),
            )
    }

    fn heading(title: &str, cx: &App) -> impl IntoElement + use<> {
        div().g_text(tokens::text::TITLE_2).text_color(cx.theme().colors.text_primary).child(SharedString::from(title.to_string()))
    }

    fn controls(&self, cx: &mut Context<Self>) -> AnyElement {
        let colors = cx.theme().colors;
        relief::card(px(tokens::radius::LG), cx)
            .flex()
            .flex_col()
            .gap(px(14.))
            .p(px(24.))
            .max_w(px(640.))
            .child(Self::heading("Controls", cx))
            .child(
                div()
                    .flex()
                    .items_center()
                    .gap(px(10.))
                    .child(GButton::new("primary", "Primary").primary())
                    .child(GButton::new("secondary", "Secondary"))
                    .child(GButton::new("ghost", "Ghost").ghost())
                    .child(GButton::new("danger", "Danger").danger())
                    .child(GButton::new("delete", "Delete").destructive())
                    .child(GCloseButton::new("close")),
            )
            .child(
                GToggle::new("notifications", "Notifications", self.notifications)
                    .detail("A sentence that explains the setting.")
                    .on_change(cx.listener(|this, on, _, cx| {
                        this.notifications = *on;
                        cx.notify();
                    })),
            )
            .child(GToggle::new("off", "Off", self.previews).on_change(cx.listener(|this, on, _, cx| {
                this.previews = *on;
                cx.notify();
            })))
            .child(GCheckbox::new("agree", "I agree to the house rules", self.agree).on_change(cx.listener(|this, on, _, cx| {
                this.agree = *on;
                cx.notify();
            })))
            .child(GTextField::new("Name", self.name.clone()))
            .child(GPicker::new("appearance-menu", "Appearance", ["System", "Light", "Dark"], self.appearance_choice).on_change(
                cx.listener(|this, choice, _, cx| {
                    this.appearance_choice = *choice;
                    cx.notify();
                }),
            ))
            .child(GPicker::new("size", "Size", ["Small", "Medium", "Large"], self.size_choice).chips().on_change(cx.listener(
                |this, choice, _, cx| {
                    this.size_choice = *choice;
                    cx.notify();
                },
            )))
            .child(GSlider::new("volume", self.volume, 0., 1.).label("Volume").on_change(cx.listener(|this, value, _, cx| {
                this.volume = *value;
                cx.notify();
            })))
            .child(GStepper::new("reminders", "Reminders", self.reminders, 0, 10).on_change(cx.listener(|this, value, _, cx| {
                this.reminders = *value;
                cx.notify();
            })))
            .child(div().flex().gap(px(8.)).children([GTone::Success, GTone::Warning, GTone::Error, GTone::Info].map(|tone| {
                div()
                    .px(px(6.))
                    .py(px(6.))
                    .rounded_full()
                    .bg(tone.tint(cx))
                    .text_color(tone.tint_text(cx))
                    .g_text(tokens::text::CAPTION)
                    .child("state")
            })))
            .child(div().h(px(1.)).bg(colors.hairline))
            .child(
                div()
                    .flex()
                    .items_center()
                    .gap(px(16.))
                    .child(GAvatar::new("Marie Curie").size(40.).unread(3))
                    .child(GAvatar::new("Paul Langevin").size(40.).online(true))
                    .child(GAvatar::new("Irène Joliot").size(32.))
                    .child(GAvatar::new("Florian Simon").size(24.))
                    .child(GUnreadBadge::new(7))
                    .child(GUnreadBadge::new(128)),
            )
            .into_any_element()
    }

    fn states(&self, cx: &mut Context<Self>) -> AnyElement {
        let colors = cx.theme().colors;
        let states: [(Option<GPointer>, bool); 4] =
            [(None, false), (Some(GPointer::Hover), false), (Some(GPointer::Pressed), false), (None, true)];
        let fields = self.state_fields.clone();
        let row = |name: &str, build: &dyn Fn(usize, Option<GPointer>, bool) -> AnyElement| {
            div()
                .flex()
                .items_center()
                .gap(px(14.))
                .min_h(px(34.))
                .child(
                    div()
                        .w(px(90.))
                        .g_text(tokens::text::CAPTION)
                        .text_color(colors.text_discret)
                        .child(SharedString::from(name.to_string())),
                )
                .children(states.iter().enumerate().map(|(index, (preview, disabled))| {
                    div().w(px(150.)).flex().items_center().child(build(index, *preview, *disabled))
                }))
        };
        div()
            .flex()
            .flex_col()
            .gap(px(14.))
            .child(div().flex().gap(px(14.)).pl(px(104.)).children(["Rest", "Hover", "Pressed", "Disabled"].map(|title| {
                div().w(px(150.)).g_text(tokens::text::HEADLINE).text_color(colors.text_primary).child(title)
            })))
            .child(row("Primary", &|i, p, d| GButton::new(("s-primary", i), "Save").primary().preview(p).disabled(d).into_any_element()))
            .child(row("Secondary", &|i, p, d| GButton::new(("s-secondary", i), "Reset").preview(p).disabled(d).into_any_element()))
            .child(row("Ghost", &|i, p, d| GButton::new(("s-ghost", i), "Later").ghost().preview(p).disabled(d).into_any_element()))
            .child(row("Danger", &|i, p, d| GButton::new(("s-danger", i), "Delete").danger().preview(p).disabled(d).into_any_element()))
            .child(row("Destructive", &|i, p, d| {
                GButton::new(("s-destructive", i), "Leave").destructive().preview(p).disabled(d).into_any_element()
            }))
            .child(row("Close", &|i, p, _| GCloseButton::new(("s-close", i)).preview(p).into_any_element()))
            .child(row("Chips", &|i, p, d| {
                GPicker::new(("s-chips", i), "", ["On", "Off"], 0).chips().preview(p).disabled(d).into_any_element()
            }))
            .child(row("Menu", &|i, p, d| GPicker::new(("s-menu", i), "", ["Light", "Dark"], 0).preview(p).disabled(d).into_any_element()))
            .child(row("Switch", &|i, p, d| {
                div().w(px(60.)).child(GToggle::new(("s-switch", i), "", true).preview(p).disabled(d)).into_any_element()
            }))
            .child(row("Checkbox", &|i, p, d| GCheckbox::new(("s-check", i), "Agree", i % 2 == 0).preview(p).disabled(d).into_any_element()))
            .child(row("Slider", &|i, p, d| {
                div().w(px(110.)).child(GSlider::new(("s-slider", i), 0.5, 0., 1.).preview(p).disabled(d)).into_any_element()
            }))
            .child(row("Stepper", &|i, _, _| {
                div().w(px(150.)).child(GStepper::new(("s-stepper", i), "", 3, 0, 9)).into_any_element()
            }))
            .child(row("Field", &|i, p, _| {
                let frame = GFieldFrame::new(fields[i].clone());
                let frame = if p.is_some() { frame.preview_hover() } else { frame };
                div().w(px(110.)).child(frame).into_any_element()
            }))
            .child(row("Sidebar", &|i, p, _| {
                div().w(px(130.)).child(GSidebarRow::new(("s-side", i), "Privacy", "lock", false).preview(p)).into_any_element()
            }))
            .child(row("Selected", &|i, p, _| {
                div().w(px(130.)).child(GSidebarRow::new(("s-selected", i), "Profile", "user", true).preview(p)).into_any_element()
            }))
            .child(row("Menu line", &|i, p, d| {
                div()
                    .w(px(140.))
                    .child(GMenuItem::new(("s-line", i), "Reply").icon("arrow-bend-up-left").preview(p).disabled(d))
                    .into_any_element()
            }))
            .child(row("Row button", &|i, p, d| {
                div().w(px(150.)).child(GFormRowButton::new(("s-row", i), "Invite").preview(p).disabled(d)).into_any_element()
            }))
            .into_any_element()
    }

    fn forms(&self, cx: &mut Context<Self>) -> AnyElement {
        div()
            .flex()
            .gap(px(24.))
            .items_start()
            .child(
                div().w(px(560.)).child(
                    GForm::new("form")
                        .static_layout()
                        .without_ground()
                        .title("Notifications", "What reaches you, and when.")
                        .back("Settings", |_, _, _| {})
                        .section(
                            GFormSection::new()
                                .header("Messages")
                                .footer("Muted conversations never ring.")
                                .row(
                                    GToggle::new("previews", "Show previews", self.previews)
                                        .detail("The first words of a message.")
                                        .on_change(cx.listener(|this, on, _, cx| {
                                            this.previews = *on;
                                            cx.notify();
                                        })),
                                )
                                .row(GToggle::new("sounds", "Sounds", self.sounds).on_change(cx.listener(|this, on, _, cx| {
                                    this.sounds = *on;
                                    cx.notify();
                                })))
                                .row(GLabeledContent::new("Devices", "3"))
                                .row(GPicker::new("form-menu", "Ring", ["Always", "Mentions", "Never"], 1))
                                .row(GFormButtons::new([GButton::new("reset", "Reset"), GButton::new("save", "Save").primary()])),
                        )
                        .section(
                            GFormSection::new()
                                .header("Members")
                                .header_icon("user")
                                .footer("They can leave at any time.")
                                .button(GFormRowButton::new("invite", "Invite people").icon("plus"))
                                .button(GFormRowButton::new("leave", "Leave the space").destructive()),
                        )
                        .section(GFormSection::new().bare(form::sheet_button("create", "Create"))),
                ),
            )
            .child(
                div()
                    .flex()
                    .flex_col()
                    .gap(px(2.))
                    .w(px(240.))
                    .p(px(8.))
                    .rounded(px(tokens::radius::LG))
                    .bg(cx.theme().colors.sidebar)
                    .child(GSidebarRow::new("profile", "Profile", "user-circle", true))
                    .child(GSidebarRow::new("notif", "Notifications", "bell", false).detail("12"))
                    .child(GSidebarRow::new("privacy", "Privacy", "lock", false).warns()),
            )
            .into_any_element()
    }

    fn frame(&self, cx: &mut Context<Self>) -> AnyElement {
        let frame = cx.theme().frame;
        div()
            .flex()
            .flex_col()
            .gap(px(18.))
            .max_w(px(640.))
            .child(GPageBand::new("bell", "Notifications", "What reaches you, and when.").rounded(tokens::radius::LG).top_padding(18.))
            .child(
                div()
                    .flex()
                    .items_start()
                    .gap(px(18.))
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .gap(px(6.))
                            .w(px(84.))
                            .p(px(8.))
                            .rounded(px(tokens::radius::LG))
                            .bg(frame.ground)
                            .child(GRailItem::new("today", "Today", "sun", false))
                            .child(GRailItem::new("messages", "Messages", "chats-circle", true).badge(4))
                            .child(GRailItem::new("spaces", "Spaces", "squares-four", false)),
                    )
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .flex_1()
                            .gap(px(18.))
                            .child(GNavTabs::new("tabs", ["Overview", "Members", "Roles"], self.tab).on_change(cx.listener(
                                |this, tab, _, cx| {
                                    this.tab = *tab;
                                    cx.notify();
                                },
                            )))
                            .child(
                                GMenu::new()
                                    .item(GMenuItem::new("read", "Mark as read").icon("envelope-open"))
                                    .item(GMenuItem::new("mute", "Mute").icon("bell-slash").checked(true))
                                    .item(GMenuItem::new("leave", "Leave").icon("sign-out").destructive()),
                            ),
                    ),
            )
            .child(
                GWindowHeader::new("Settings")
                    .subtitle("SkollN")
                    .icon("gear-six")
                    .rounded(tokens::radius::LG)
                    .trailing(GCloseButton::new("header-close").on_frame()),
            )
            .child(
                div()
                    .flex()
                    .items_center()
                    .gap(px(12.))
                    .h(px(52.))
                    .px(px(16.))
                    .rounded(px(tokens::radius::LG))
                    .bg(frame.ground)
                    .child(GBarTitle::new("Messages").subtitle("2 unread")),
            )
            .into_any_element()
    }

    fn feedback(&self, _cx: &mut Context<Self>) -> AnyElement {
        let toasts = self.toasts.clone();
        div()
            .flex()
            .flex_col()
            .gap(px(18.))
            .max_w(px(640.))
            .child(
                div()
                    .flex()
                    .gap(px(8.))
                    .child(GBadge::new("Article").icon("file-text"))
                    .child(GBadge::new("Synced").tone(GTone::Success))
                    .child(GBadge::new("Offline").tone(GTone::Warning))
                    .child(GBadge::new("Error").tone(GTone::Error))
                    .child(GBadge::new("New").icon("sparkle").tone(GTone::Info)),
            )
            .child(
                GBanner::new(GTone::Warning, "You are offline")
                    .message("Messages wait on this computer and leave as soon as the network is back.")
                    .action(GButton::new("retry", "Retry")),
            )
            .child(GBanner::new(GTone::Info, "A new version is ready").message("It installs when you quit SkollN."))
            .child(
                div()
                    .flex()
                    .flex_col()
                    .gap(px(8.))
                    .child(div().w(px(260.)).child(GSkeleton::new("sk1", 16.)))
                    .child(div().w(px(200.)).child(GSkeleton::new("sk2", 16.)))
                    .child(GSkeleton::new("sk3", 60.).radius(tokens::radius::MD)),
            )
            .child(GTypingDots::new("Writing"))
            .child(div().flex().items_center().gap(px(16.)).child(GToastView::new("Link copied", "link")).child(
                GButton::new("show-toast", "Show a toast")
                    .on_click(move |_, _, cx| toasts.update(cx, |toasts, cx| toasts.show("Link copied", "link", cx))),
            ))
            .child(
                div().h(px(260.)).child(
                    GEmptyState::new("tray", "No messages yet", "Start a conversation with a contact.")
                        .action(GButton::new("new-conversation", "New conversation").primary().icon("note-pencil")),
                ),
            )
            .into_any_element()
    }

    fn sheet_page(&self, cx: &mut Context<Self>) -> AnyElement {
        div()
            .flex()
            .flex_col()
            .gap(px(18.))
            .max_w(px(640.))
            .child(
                relief::page_ground(cx)
                    .rounded(px(tokens::radius::LG))
                    .border_1()
                    .border_color(cx.theme().colors.hairline)
                    .overflow_hidden()
                    .child(GSheetTitle::new("New space", "A place to share with a few people.").back(|_, _, _| {}))
                    .child(
                        GForm::new("sheet-preview").static_layout().without_ground().section(
                            GFormSection::new()
                                .header("Members")
                                .footer("They can leave at any time.")
                                .button(GFormRowButton::new("invite-2", "Invite people"))
                                .button(GFormRowButton::new("leave-2", "Leave the space").destructive()),
                        ),
                    ),
            )
            .child(div().child(GButton::new("open-sheet", "Open the sheet").primary().on_click(cx.listener(|this, _, _, cx| {
                this.sheet_open = true;
                cx.notify();
            }))))
            .into_any_element()
    }

    fn menus(&self, cx: &mut Context<Self>) -> AnyElement {
        div()
            .flex()
            .flex_col()
            .gap(px(18.))
            .child(
                div().w(px(260.)).child(
                    GMenu::new()
                        .item(GMenuItem::new("m-reply", "Reply").icon("arrow-bend-up-left"))
                        .item(GMenuItem::new("m-copy", "Copy the text").icon("copy"))
                        .item(GMenuItem::new("m-pin", "Notify me").icon("bell").checked(false))
                        .item(GMenuItem::new("m-mute", "Mute").icon("bell-slash").checked(true))
                        .item(GMenuItem::new("m-delete", "Delete").icon("trash").destructive()),
                ),
            )
            .child(GContextMenu::new(
                "context",
                relief::card(px(tokens::radius::LG), cx)
                    .w(px(360.))
                    .h(px(120.))
                    .flex()
                    .items_center()
                    .justify_center()
                    .g_text(tokens::text::BODY)
                    .text_color(cx.theme().colors.text_secondary)
                    .child("Right-click here"),
                |close, _, _| {
                    let (reply, copy, delete) = (close.clone(), close.clone(), close);
                    GMenu::new()
                        .item(GMenuItem::new("c-reply", "Reply").icon("arrow-bend-up-left").on_click(move |_, w, cx| reply(w, cx)))
                        .item(GMenuItem::new("c-copy", "Copy").icon("copy").on_click(move |_, w, cx| copy(w, cx)))
                        .item(GMenuItem::new("c-delete", "Delete").icon("trash").destructive().on_click(move |_, w, cx| delete(w, cx)))
                },
            ))
            .into_any_element()
    }

    fn text(&self, cx: &mut Context<Self>) -> AnyElement {
        let colors = cx.theme().colors;
        let selection = |field: &Entity<GTextInput>, cx: &App| {
            let field = field.read(cx);
            let range = field.selection();
            SharedString::from(format!("selection: bytes {}..{} of {}", range.start, range.end, field.text().len()))
        };
        let caption = |text: SharedString| div().g_text(tokens::text::CAPTION).text_color(colors.text_discret).child(text);
        relief::card(px(tokens::radius::LG), cx)
            .flex()
            .flex_col()
            .gap(px(14.))
            .p(px(24.))
            .max_w(px(640.))
            .child(Self::heading("Text input", cx))
            .child(GTextField::new("Name", self.name.clone()))
            .child(caption(selection(&self.name, cx)))
            .child(GTextField::new("About you", self.bio.clone()))
            .child(GTextField::new("Arabic", self.arabic.clone()))
            .child(caption(selection(&self.arabic, cx)))
            .child(GTextField::new("Hebrew", self.hebrew.clone()))
            .child(GTextField::new("Emoji and combining marks", self.emoji.clone()))
            .child(caption(selection(&self.emoji, cx)))
            .child(GTextField::new("Disabled", self.disabled_field.clone()))
            .into_any_element()
    }

    fn list(&self, cx: &mut Context<Self>) -> AnyElement {
        let messages = self.messages.clone();
        let colors = cx.theme().colors;
        div()
            .flex()
            .flex_col()
            .size_full()
            .child(
                div()
                    .flex()
                    .items_center()
                    .gap(px(10.))
                    .px(px(16.))
                    .h(px(52.))
                    .flex_none()
                    .border_b_1()
                    .border_color(colors.hairline)
                    .child(GAvatar::new("Marie Curie").size(28.).online(true))
                    .child(div().g_text(tokens::text::HEADLINE).text_color(colors.text_primary).child("Marie Curie"))
                    .child(GBadge::new(format!("{} messages", messages.len()))),
            )
            .child(
                div().flex_1().min_h_0().child(
                    GLongList::new("messages", self.list.clone(), move |index, _, _| {
                        let message = &messages[index];
                        GMessageRow::new(index, message.author, message.time.clone(), message.body.clone())
                            .grouped(message.grouped)
                            .into_any_element()
                    })
                    .label("Messages"),
                ),
            )
            .into_any_element()
    }

    /// One frame of the measure: the list scrolls up at its speed; after ten seconds, the figures.
    fn measure_frame(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let Some(measure) = self.measure.as_mut() else { return };
        let now = Instant::now();
        *measure.render_start.borrow_mut() = Some(now);
        if let Some(last) = measure.last {
            let interval = (now - last).as_secs_f64() * 1000.;
            measure.intervals.push(interval);
            self.list.scroll_by(px(-(measure.speed * interval as f32 / 1000.)));
        }
        measure.last = Some(now);
        if now - measure.started > Duration::from_secs(10) {
            say(&report(&measure.intervals, &measure.cpu.borrow()));
            cx.quit();
            return;
        }
        window.request_animation_frame();
    }
}

fn percentile(values: &[f64], fraction: f64) -> f64 {
    let mut sorted = values.to_vec();
    sorted.sort_by(|a, b| a.total_cmp(b));
    sorted.get(((sorted.len() as f64 - 1.) * fraction).round() as usize).copied().unwrap_or(0.)
}

fn report(intervals: &[f64], cpu: &[f64]) -> String {
    let mean = intervals.iter().sum::<f64>() / intervals.len().max(1) as f64;
    let median = percentile(intervals, 0.5);
    let late = intervals.iter().filter(|interval| **interval > 1.5 * median).count();
    format!(
        "frames: {}\nframe interval, ms: mean {:.2} (≈ {:.1} frames/s), p50 {:.2}, p95 {:.2}, p99 {:.2}, max {:.2}\n\
         frames late (over 1.5 × the median): {}\nCPU per frame (render to paint), ms: p50 {:.2}, p95 {:.2}, p99 {:.2}, max {:.2}",
        intervals.len(),
        mean,
        1000. / mean,
        median,
        percentile(intervals, 0.95),
        percentile(intervals, 0.99),
        percentile(intervals, 1.),
        late,
        percentile(cpu, 0.5),
        percentile(cpu, 0.95),
        percentile(cpu, 0.99),
        percentile(cpu, 1.),
    )
}

impl Render for Gallery {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        self.measure_frame(window, cx);
        let colors = cx.theme().colors;
        let page = match self.page {
            Page::Controls => self.controls(cx),
            Page::States => self.states(cx),
            Page::Forms => self.forms(cx),
            Page::Frame => self.frame(cx),
            Page::Feedback => self.feedback(cx),
            Page::Sheet => self.sheet_page(cx),
            Page::Menus => self.menus(cx),
            Page::Text => self.text(cx),
            Page::List => self.list(cx),
        };
        let content = if self.page == Page::List {
            div().id("page").size_full().child(page)
        } else {
            div().id("page").size_full().overflow_y_scroll().child(div().p(px(24.)).child(page))
        };
        let sheet = self.sheet_open.then(|| {
            GSheet::new(
                "new-space",
                "New space",
                "A place to share with a few people.",
                cx.listener(|this, _, _, cx| {
                    this.sheet_open = false;
                    cx.notify();
                }),
            )
            .child(
                GForm::new("sheet-form")
                    .static_layout()
                    .without_ground()
                    .section(GFormSection::new().header("Name").row(GFieldFrame::new(self.sheet_name.clone()).bare()))
                    .section(
                        GFormSection::new()
                            .header("Who can join")
                            .footer("You can change it later.")
                            .row(GToggle::new("invite-only", "Invitation only", true).detail("Members invite the others."))
                            .row(GPicker::new("sheet-kind", "Kind", ["Friends", "Family", "Club"], 0)),
                    )
                    .section(GFormSection::new().bare(form::sheet_button("sheet-create", "Create"))),
            )
        });
        let cpu = self.measure.as_ref().map(|measure| (measure.render_start.clone(), measure.cpu.clone()));
        let label = format!("{} · {}", self.page.title(), if cx.theme().is_dark() { "dark" } else { "light" });
        div()
            .id("gallery")
            .track_focus(&self.focus)
            .on_action(|_: &Quit, _, cx| cx.quit())
            .on_action(|_: &FocusNext, window, cx| window.focus_next(cx))
            .on_action(|_: &FocusPrevious, window, cx| window.focus_prev(cx))
            .relative()
            .flex()
            .flex_col()
            .size_full()
            .bg(colors.background)
            .font_family("IBM Plex Sans")
            .text_color(colors.text_primary)
            .child(
                GWindowHeader::new(match std::env::var("GABARIT_TEXTE").as_deref() {
                    Ok("cleartype") => "Gabarit — ClearType",
                    Ok("gris") => "Gabarit — lissage en gris",
                    _ => "Gabarit",
                })
                    .subtitle("GPUI gallery")
                    .leading(if cfg!(target_os = "macos") { 84. } else { 16. })
                    .window_title_bar()
                    .trailing(GBadge::new(label)),
            )
            .child(
                div()
                    .flex()
                    .flex_1()
                    .min_h_0()
                    .child(self.sidebar(cx))
                    .child(relief::page_ground(cx).flex_1().min_w_0().h_full().child(content)),
            )
            .child(self.toasts.clone())
            .children(sheet)
            .when_some(cpu, |this, (start, cpu)| {
                // Painted last: the time from the start of the frame's render to the end of its paint.
                this.child(
                    canvas(
                        |_, _, _| {},
                        move |_, _, _, _| {
                            if let Some(start) = *start.borrow() {
                                cpu.borrow_mut().push(start.elapsed().as_secs_f64() * 1000.);
                            }
                        },
                    )
                    .absolute()
                    .size_0(),
                )
            })
    }
}

/// Where the gallery writes: its journal file, or the standard output.
static JOURNAL: OnceLock<std::sync::Mutex<std::fs::File>> = OnceLock::new();

fn say(line: &str) {
    match JOURNAL.get() {
        Some(file) => {
            let mut file = file.lock().unwrap();
            let _ = writeln!(file, "{line}");
            let _ = file.flush();
        }
        None => println!("{line}"),
    }
}

fn main() {
    let launched = Instant::now();
    let args: Vec<String> = std::env::args().collect();
    let journal = args.iter().position(|arg| arg == "--journal").and_then(|index| args.get(index + 1)).cloned();
    let mut logger = env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("warn"));
    if let Some(path) = journal {
        let file = std::fs::File::create(&path).expect("the journal file");
        logger.target(env_logger::Target::Pipe(Box::new(file.try_clone().expect("the journal file"))));
        let _ = JOURNAL.set(std::sync::Mutex::new(file));
    }
    logger.init();
    let flag = |name: &str| args.iter().any(|arg| arg == name);
    let value = |name: &str| args.iter().position(|arg| arg == name).and_then(|index| args.get(index + 1)).cloned();
    let measure_list = flag("--measure-list");
    let measure_start = flag("--measure-start");
    let page = value("--page")
        .and_then(|name| Page::ALL.iter().copied().find(|page| page.name() == name))
        .unwrap_or(if measure_list { Page::List } else { Page::Controls });
    let appearance = if flag("--dark") {
        Some(GAppearance::Dark)
    } else if flag("--light") {
        Some(GAppearance::Light)
    } else {
        None
    };
    let open_sheet = flag("--sheet");

    let stage = move |name: &str| {
        if measure_start || JOURNAL.get().is_some() {
            say(&format!("  {name}: {:.1} ms", launched.elapsed().as_secs_f64() * 1000.));
        }
    };
    let application = gpui_platform::application().with_assets(GAssets);
    stage("application");
    application.run(move |cx: &mut App| {
        stage("run");
        gabarit_gpui::init(cx);
        // Text smoothing, to compare on Windows: GABARIT_TEXTE=cleartype (subpixel, ClearType) or gris. Grayscale is
        // Gabarit's default (`gabarit_gpui::init`).
        match std::env::var("GABARIT_TEXTE").as_deref() {
            Ok("cleartype") => cx.set_text_rendering_mode(gpui::TextRenderingMode::Subpixel),
            Ok("gris") => cx.set_text_rendering_mode(gpui::TextRenderingMode::Grayscale),
            _ => {}
        }
        stage("fonts and keys");
        cx.bind_keys([
            KeyBinding::new(gabarit_gpui::secondary!("q"), Quit, None),
            KeyBinding::new("tab", FocusNext, None),
            KeyBinding::new("shift-tab", FocusPrevious, None),
        ]);
        let bounds = Bounds::centered(None, size(px(1100.), px(780.)), cx);
        let window = cx
            .open_window(
                WindowOptions {
                    window_bounds: Some(WindowBounds::Windowed(bounds)),
                    titlebar: Some(TitlebarOptions {
                        title: Some(match std::env::var("GABARIT_TEXTE").as_deref() {
                            Ok("cleartype") => "Gabarit — ClearType".into(),
                            Ok("gris") => "Gabarit — lissage en gris".into(),
                            _ => "Gabarit".into(),
                        }),
                        appears_transparent: true,
                        traffic_light_position: Some(point(px(18.), px(18.))),
                    }),
                    ..Default::default()
                },
                move |window, cx| {
                    match appearance {
                        Some(appearance) => theme::set_appearance(appearance, cx),
                        None => theme::follow_system_appearance(window, cx),
                    }
                    cx.new(|cx| {
                        let mut gallery = Gallery::new(page, cx);
                        gallery.sheet_open = open_sheet;
                        if measure_list {
                            gallery.measure = Some(Measure {
                                started: Instant::now(),
                                last: None,
                                render_start: Rc::new(RefCell::new(None)),
                                intervals: Vec::new(),
                                cpu: Rc::new(RefCell::new(Vec::new())),
                                speed: 3000.,
                            });
                        }
                        gallery
                    })
                },
            )
            .expect("the window opens");
        stage("window open");
        // The time to the first frame, said in the journal each time; with --measure-start, it quits there.
        window
            .update(cx, move |_, window, _| {
                window.on_next_frame(move |_, cx| {
                    say(&format!("first frame: {:.1} ms after the start of main", launched.elapsed().as_secs_f64() * 1000.));
                    if measure_start {
                        cx.quit();
                    }
                });
            })
            .ok();
        window.update(cx, |gallery, window, cx| window.focus(&gallery.focus, cx)).ok();
        cx.activate(true);
    });
}
