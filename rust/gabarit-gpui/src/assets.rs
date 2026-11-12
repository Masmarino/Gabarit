//! The icons: Phosphor's (MIT, version in icons/VERSION), the ones GabaritGtk draws, embedded. GPUI draws an SVG
//! as a mask, in the text's colour.

use std::borrow::Cow;

use gpui::{AssetSource, Hsla, Pixels, SharedString, Styled, Svg, svg};

/// Each icon by its Phosphor name.
const ICONS: &[(&str, &[u8])] = &[
    (
        "arrow-bend-up-left",
        include_bytes!("../icons/arrow-bend-up-left.svg"),
    ),
    ("bell", include_bytes!("../icons/bell.svg")),
    ("bell-slash", include_bytes!("../icons/bell-slash.svg")),
    ("caret-down", include_bytes!("../icons/caret-down.svg")),
    ("caret-left", include_bytes!("../icons/caret-left.svg")),
    ("caret-right", include_bytes!("../icons/caret-right.svg")),
    (
        "caret-up-down",
        include_bytes!("../icons/caret-up-down.svg"),
    ),
    ("chat-circle", include_bytes!("../icons/chat-circle.svg")),
    ("chats-circle", include_bytes!("../icons/chats-circle.svg")),
    ("check", include_bytes!("../icons/check.svg")),
    ("check-circle", include_bytes!("../icons/check-circle.svg")),
    ("copy", include_bytes!("../icons/copy.svg")),
    ("dots-three", include_bytes!("../icons/dots-three.svg")),
    ("ear", include_bytes!("../icons/ear.svg")),
    (
        "envelope-open",
        include_bytes!("../icons/envelope-open.svg"),
    ),
    ("file-text", include_bytes!("../icons/file-text.svg")),
    ("gear-six", include_bytes!("../icons/gear-six.svg")),
    ("info", include_bytes!("../icons/info.svg")),
    ("link", include_bytes!("../icons/link.svg")),
    ("lock", include_bytes!("../icons/lock.svg")),
    (
        "magnifying-glass",
        include_bytes!("../icons/magnifying-glass.svg"),
    ),
    ("minus", include_bytes!("../icons/minus.svg")),
    ("note-pencil", include_bytes!("../icons/note-pencil.svg")),
    (
        "paper-plane-right",
        include_bytes!("../icons/paper-plane-right.svg"),
    ),
    ("paperclip", include_bytes!("../icons/paperclip.svg")),
    ("plus", include_bytes!("../icons/plus.svg")),
    ("seal", include_bytes!("../icons/seal.svg")),
    ("seal-fill", include_bytes!("../icons/seal-fill.svg")),
    ("sign-out", include_bytes!("../icons/sign-out.svg")),
    ("smiley", include_bytes!("../icons/smiley.svg")),
    ("sparkle", include_bytes!("../icons/sparkle.svg")),
    ("squares-four", include_bytes!("../icons/squares-four.svg")),
    ("sun", include_bytes!("../icons/sun.svg")),
    ("translate", include_bytes!("../icons/translate.svg")),
    ("trash", include_bytes!("../icons/trash.svg")),
    ("tray", include_bytes!("../icons/tray.svg")),
    ("user", include_bytes!("../icons/user.svg")),
    ("user-circle", include_bytes!("../icons/user-circle.svg")),
    ("warning", include_bytes!("../icons/warning.svg")),
    (
        "warning-circle",
        include_bytes!("../icons/warning-circle.svg"),
    ),
    ("x", include_bytes!("../icons/x.svg")),
    // Drawn for Gabarit (no Phosphor file): the close cross, bold as SF Symbols' xmark in GCloseButton.
    ("x-bold", include_bytes!("../icons/x-bold.svg")),
    // Drawn for Gabarit: a window's buttons under Windows and Linux (the window draws them itself).
    ("window-close", include_bytes!("../icons/window-close.svg")),
    (
        "window-maximize",
        include_bytes!("../icons/window-maximize.svg"),
    ),
    (
        "window-minimize",
        include_bytes!("../icons/window-minimize.svg"),
    ),
    ("x-circle", include_bytes!("../icons/x-circle.svg")),
];

/// Gabarit's assets, for `Application::with_assets`: `icons/<name>.svg`.
pub struct GAssets;

impl AssetSource for GAssets {
    fn load(&self, path: &str) -> gpui::Result<Option<Cow<'static, [u8]>>> {
        let name = path
            .strip_prefix("icons/")
            .and_then(|file| file.strip_suffix(".svg"));
        Ok(name
            .and_then(|name| ICONS.iter().find(|(icon, _)| *icon == name))
            .map(|(_, bytes)| Cow::Borrowed(*bytes)))
    }

    fn list(&self, path: &str) -> gpui::Result<Vec<SharedString>> {
        Ok(ICONS
            .iter()
            .map(|(name, _)| SharedString::from(format!("icons/{name}.svg")))
            .filter(|file| file.starts_with(path))
            .collect())
    }
}

/// A Phosphor icon (`"bell"`, `"caret-up-down"`), `size` square, in `color` (GPUI's SVG does not take its parent's).
pub fn icon(name: &str, size: Pixels, color: Hsla) -> Svg {
    svg()
        .path(SharedString::from(format!("icons/{name}.svg")))
        .size(size)
        .flex_none()
        .text_color(color)
}

/// Whether Gabarit has this icon.
pub fn has_icon(name: &str) -> bool {
    ICONS.iter().any(|(icon, _)| *icon == name)
}
