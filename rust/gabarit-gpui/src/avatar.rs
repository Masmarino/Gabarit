//! The round avatar: a person's initials on a ground of their own colour (or their picture, later), with the unread
//! count or the presence on its corner.

use gpui::{App, IntoElement, ParentElement, RenderOnce, Role, SharedString, Styled, Window, div, prelude::*, px};

use crate::feedback::GUnreadBadge;
use crate::theme::{ActiveTheme, GTextExt, hsla, mix};
use crate::tokens::{palette, text};

/// A person's grounds: the palette's deep tones, each person always the same.
const GROUNDS: [crate::tokens::GRgba; 6] =
    [palette::RUST_500, palette::PATINA_600, palette::INDIGO_600, palette::AMBER_600, palette::RED_600, palette::SLATE_600];

#[derive(IntoElement)]
pub struct GAvatar {
    name: SharedString,
    size: f32,
    unread: usize,
    online: bool,
}

impl GAvatar {
    pub fn new(name: impl Into<SharedString>) -> Self {
        GAvatar { name: name.into(), size: 32., unread: 0, online: false }
    }

    pub fn size(mut self, size: f32) -> Self {
        self.size = size;
        self
    }

    /// The unread count, on the top right corner.
    pub fn unread(mut self, count: usize) -> Self {
        self.unread = count;
        self
    }

    /// A green dot on the bottom right corner.
    pub fn online(mut self, online: bool) -> Self {
        self.online = online;
        self
    }
}

/// "Marie Curie" → "MC"; "florian" → "F".
pub fn initials(name: &str) -> String {
    name.split_whitespace().filter_map(|word| word.chars().next()).take(2).flat_map(char::to_uppercase).collect()
}

impl RenderOnce for GAvatar {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let hash = self.name.bytes().fold(5381u32, |hash, byte| hash.wrapping_mul(33) ^ byte as u32);
        let ground = hsla(GROUNDS[hash as usize % GROUNDS.len()]);
        // A little lighter in dark, so that it does not sink into the page.
        let ground = if cx.theme().is_dark() { mix(ground, gpui::white(), 0.12) } else { ground };
        let font = if self.size >= 40. { text::HEADLINE } else { text::CAPTION };
        div()
            .id(SharedString::from(format!("g-avatar-{}", self.name)))
            .role(Role::Image)
            .aria_label(self.name.clone())
            .relative()
            .flex_none()
            .size(px(self.size))
            .child(
                div()
                    .size_full()
                    .rounded_full()
                    .flex()
                    .items_center()
                    .justify_center()
                    .bg(ground)
                    .text_color(gpui::white())
                    .g_text(font)
                    .text_size(px(self.size * 0.38))
                    .font_weight(gpui::FontWeight::SEMIBOLD)
                    .child(gpui::Text::new_inaccessible(initials(&self.name).into())),
            )
            .when(self.unread > 0, |this| {
                this.child(div().absolute().top(px(-4.)).right(px(-6.)).child(GUnreadBadge::new(self.unread)))
            })
            .when(self.online, |this| {
                let dot = (self.size * 0.3).max(8.);
                this.child(
                    div()
                        .absolute()
                        .bottom(px(-1.))
                        .right(px(-1.))
                        .size(px(dot))
                        .rounded_full()
                        .bg(colors.success)
                        .border_2()
                        .border_color(colors.background),
                )
            })
    }
}
