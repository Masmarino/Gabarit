//! The text input as the platform drives it: an input method's composition (marked text), UTF-16 offsets (what macOS,
//! Windows and IBus speak), the emoji made of several characters, Arabic and Hebrew, the clipboard, the moves.

use gabarit_gpui::text_field::{self, Backspace, Copy, Left, Paste, SelectAll, SelectLeft};
use gabarit_gpui::{GTextInput, theme};
use gpui::{Action, EntityInputHandler, Focusable, TestAppContext, WindowHandle};

fn field(cx: &mut TestAppContext, text: &str) -> WindowHandle<GTextInput> {
    cx.update(|cx| {
        theme::init(cx);
        text_field::bind_keys(cx);
    });
    let text = text.to_string();
    let window = cx.add_window(move |_, cx| GTextInput::new(cx).with_text(text));
    window
        .update(cx, |input, window, cx| {
            let focus = input.focus_handle(cx);
            window.focus(&focus, cx);
        })
        .unwrap();
    cx.run_until_parked();
    window
}

/// A key's action, as the keyboard sends it to the focused field.
fn press(cx: &mut TestAppContext, window: WindowHandle<GTextInput>, action: impl Action) {
    cx.dispatch_action(window.into(), action);
    cx.run_until_parked();
}

#[gpui::test]
fn composition_replaces_its_marked_text(cx: &mut TestAppContext) {
    let window = field(cx, "Bonjour ");
    window
        .update(cx, |input, window, cx| {
            // Japanese: "nihon" composed, then committed as 日本.
            input.replace_and_mark_text_in_range(None, "に", Some(1..1), window, cx);
            input.replace_and_mark_text_in_range(None, "にほ", Some(2..2), window, cx);
            input.replace_and_mark_text_in_range(None, "にほん", Some(3..3), window, cx);
            assert_eq!(input.marked_text_range(window, cx), Some(8..11));
            input.replace_text_in_range(None, "日本", window, cx);
            assert_eq!(input.text(), "Bonjour 日本");
            assert_eq!(input.marked_text_range(window, cx), None);
            // A dead key (é on a US keyboard): ´ marked, then e.
            input.replace_and_mark_text_in_range(None, "´", None, window, cx);
            input.replace_text_in_range(None, "é", window, cx);
            assert_eq!(input.text(), "Bonjour 日本é");
        })
        .unwrap();
}

#[gpui::test]
fn offsets_are_utf16_for_the_platform(cx: &mut TestAppContext) {
    let window = field(cx, "a👨‍👩‍👧‍👦b");
    window
        .update(cx, |input, window, cx| {
            // The family: 7 characters, 11 UTF-16 units, 25 bytes.
            assert_eq!(input.text_length_utf16(window, cx), Some(13));
            input.set_selected_text_range(1..12, window, cx);
            assert_eq!(input.selection(), 1..26);
            let mut actual = None;
            assert_eq!(input.text_for_range(1..12, &mut actual, window, cx).as_deref(), Some("👨‍👩‍👧‍👦"));
        })
        .unwrap();
}

#[gpui::test]
fn a_composed_emoji_is_one_character(cx: &mut TestAppContext) {
    let window = field(cx, "x👨‍👩‍👧‍👦🇫🇷👍🏽e\u{301}");
    // Backspace takes e with its accent, then the thumb with its skin, the flag, the family: one press each.
    for expected in ["x👨‍👩‍👧‍👦🇫🇷👍🏽", "x👨‍👩‍👧‍👦🇫🇷", "x👨‍👩‍👧‍👦", "x"] {
        press(cx, window, Backspace);
        window.update(cx, |input, _, _| assert_eq!(input.text(), expected)).unwrap();
    }
}

#[gpui::test]
fn moves_and_selection_by_grapheme(cx: &mut TestAppContext) {
    let window = field(cx, "مرحبا 🇫🇷");
    press(cx, window, Left);
    // Before the flag: one step over its two regional indicators.
    window.update(cx, |input, _, _| assert_eq!(input.selection(), "مرحبا ".len().."مرحبا ".len())).unwrap();
    press(cx, window, SelectLeft);
    window.update(cx, |input, _, _| assert_eq!(input.selection(), "مرحبا".len().."مرحبا ".len())).unwrap();
}

#[gpui::test]
fn copy_and_paste(cx: &mut TestAppContext) {
    let window = field(cx, "שלום");
    press(cx, window, SelectAll);
    press(cx, window, Copy);
    assert_eq!(cx.read_from_clipboard().and_then(|item| item.text()).as_deref(), Some("שלום"));
    cx.write_to_clipboard(gpui::ClipboardItem::new_string("one\ntwo".into()));
    press(cx, window, Paste);
    // On one line, a pasted return becomes a space.
    window.update(cx, |input, _, _| assert_eq!(input.text(), "one two")).unwrap();
}
