//! Gabarit's components for GPUI, from SkollN's design (GabaritApple is the reference): the tokens, the relief, the
//! controls, the forms, the sheets, the frame's bars and menus, the feedback, the long list.
//!
//! At start-up: `theme::init(cx)` (IBM Plex, the theme), `text_field::bind_keys(cx)`, and the application's assets
//! from `GAssets` (the icons).

pub mod assets;
pub mod avatar;
pub mod bars;
pub mod button;
pub mod controls;
pub mod feedback;
pub mod form;
pub mod list;
pub mod menu;
pub mod picker;
pub mod relief;
pub mod sheet;
pub mod text_field;
pub mod theme;
pub mod tokens;

pub use assets::{GAssets, icon};
pub use avatar::GAvatar;
pub use bars::{GBarTitle, GNavTabs, GPageBand, GRailItem, GSidebarRow, GWindowHeader};
pub use button::{GButton, GButtonVariant, GCloseButton};
pub use controls::{GCheckbox, GSlider, GStepper, GToggle};
pub use feedback::{
    GBadge, GBanner, GEmptyState, GSkeleton, GToastCenter, GTone, GTypingDots, GUnreadBadge,
};
pub use form::{GForm, GFormButtons, GFormRowButton, GFormSection, GLabeledContent, GPageTitle};
pub use list::{GLongList, GMessageRow};
pub use menu::{
    GContextMenu, GMenu, GMenuBuilder, GMenuButton, GMenuClose, GMenuItem, GMenuPlacement,
    GSpotlight, shortcut_label,
};
pub use picker::GPicker;
pub use relief::GPointer;
pub use sheet::{GSheet, GSheetTitle};
pub use text_field::{GFieldFrame, GTextField, GTextInput, GTextInputEvent};
pub use theme::{ActiveTheme, GAppearance, GTextExt, GTheme};

/// Everything Gabarit needs at start-up: the fonts and the theme, the text fields' keys, the text smoothing.
pub fn init(cx: &mut gpui::App) {
    theme::init(cx);
    text_field::bind_keys(cx);
    // Grayscale text smoothing everywhere, the closest to the Mac's rendering (Windows would otherwise pick ClearType for
    // most sizes). An app can still choose otherwise after `init` (`cx.set_text_rendering_mode`).
    cx.set_text_rendering_mode(gpui::TextRenderingMode::Grayscale);
}
