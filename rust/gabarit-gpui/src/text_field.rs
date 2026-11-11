//! Gabarit's text field (GabaritApple's `GTextField` and `GFieldFrame`): the ground, a fine rim, rust when it has the
//! focus; on one line or several.
//!
//! GPUI has no text field of its own: it gives the platform's text input (`EntityInputHandler`: the input methods,
//! the composition of Chinese or Japanese, dictation, the emoji palette) and the shaping of text; the editing is ours,
//! from GPUI's input example: a selection in UTF-8 bytes, moves by grapheme (a family emoji is one character), lines
//! wrapped at the field's width.

use std::ops::Range;
use std::rc::Rc;
use std::time::Duration;

use gpui::{
    App, AvailableSpace, Bounds, ClipboardItem, Context, CursorStyle, Element, ElementId, ElementInputHandler, Entity,
    EntityInputHandler, EventEmitter, FocusHandle, Focusable, GlobalElementId, Hsla, InspectorElementId, IntoElement,
    KeyBinding, LayoutId, MouseButton, MouseDownEvent, MouseMoveEvent, MouseUpEvent, PaintQuad, ParentElement, Pixels,
    Point, Render, RenderOnce, Role, SharedString, Style, Styled, Task, TextAlign, TextRun, UTF16Selection,
    UnderlineStyle, Window, WrappedLine, actions, div, fill, point, prelude::*, px, relative, size,
};
use unicode_segmentation::UnicodeSegmentation;

use crate::button::metrics;
use crate::relief::hollow;
use crate::theme::{ActiveTheme, GTextExt, alpha};
use crate::tokens::{self, opacity, radius, text};

actions!(
    g_text_input,
    [
        Backspace,
        Delete,
        DeleteWordLeft,
        Left,
        Right,
        Up,
        Down,
        WordLeft,
        WordRight,
        SelectLeft,
        SelectRight,
        SelectUp,
        SelectDown,
        SelectWordLeft,
        SelectWordRight,
        SelectAll,
        Home,
        End,
        SelectHome,
        SelectEnd,
        Enter,
        Newline,
        Paste,
        Cut,
        Copy,
        ShowCharacterPalette,
    ]
);

const CONTEXT: &str = "GTextInput";

/// A key with ⌘ on the Mac, Ctrl elsewhere: `secondary!("c")`.
#[macro_export]
macro_rules! secondary {
    ($key:literal) => {
        if cfg!(target_os = "macos") { concat!("cmd-", $key) } else { concat!("ctrl-", $key) }
    };
}

/// The text fields' keys: call once at start-up.
pub fn bind_keys(cx: &mut App) {
    let context = Some(CONTEXT);
    let mut bindings = vec![
        KeyBinding::new("backspace", Backspace, context),
        KeyBinding::new("delete", Delete, context),
        KeyBinding::new("left", Left, context),
        KeyBinding::new("right", Right, context),
        KeyBinding::new("up", Up, context),
        KeyBinding::new("down", Down, context),
        KeyBinding::new("shift-left", SelectLeft, context),
        KeyBinding::new("shift-right", SelectRight, context),
        KeyBinding::new("shift-up", SelectUp, context),
        KeyBinding::new("shift-down", SelectDown, context),
        KeyBinding::new(secondary!("a"), SelectAll, context),
        KeyBinding::new(secondary!("v"), Paste, context),
        KeyBinding::new(secondary!("c"), Copy, context),
        KeyBinding::new(secondary!("x"), Cut, context),
        KeyBinding::new("home", Home, context),
        KeyBinding::new("end", End, context),
        KeyBinding::new("shift-home", SelectHome, context),
        KeyBinding::new("shift-end", SelectEnd, context),
        KeyBinding::new("enter", Enter, context),
        KeyBinding::new("shift-enter", Newline, context),
    ];
    if cfg!(target_os = "macos") {
        bindings.extend([
            KeyBinding::new("cmd-left", Home, context),
            KeyBinding::new("cmd-right", End, context),
            KeyBinding::new("cmd-shift-left", SelectHome, context),
            KeyBinding::new("cmd-shift-right", SelectEnd, context),
            KeyBinding::new("alt-left", WordLeft, context),
            KeyBinding::new("alt-right", WordRight, context),
            KeyBinding::new("alt-shift-left", SelectWordLeft, context),
            KeyBinding::new("alt-shift-right", SelectWordRight, context),
            KeyBinding::new("alt-backspace", DeleteWordLeft, context),
            KeyBinding::new("ctrl-cmd-space", ShowCharacterPalette, context),
        ]);
    } else {
        bindings.extend([
            KeyBinding::new("ctrl-left", WordLeft, context),
            KeyBinding::new("ctrl-right", WordRight, context),
            KeyBinding::new("ctrl-shift-left", SelectWordLeft, context),
            KeyBinding::new("ctrl-shift-right", SelectWordRight, context),
            KeyBinding::new("ctrl-backspace", DeleteWordLeft, context),
        ]);
        if cfg!(target_os = "windows") {
            bindings.push(KeyBinding::new("win-.", ShowCharacterPalette, context));
        }
    }
    cx.bind_keys(bindings);
}

/// What a text input says to its owner.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum GTextInputEvent {
    /// The text changed (typed, pasted, composed).
    Changed,
    /// Return in a single line, or in several when `submit_on_enter` (a message's field).
    Submitted,
}

/// A text input's state: its text, its selection, the composition under way. Hold it in an entity:
/// `cx.new(|cx| GTextInput::new(cx))`; draw it in a `GTextField`, or alone in a `GFieldFrame`.
pub struct GTextInput {
    focus_handle: FocusHandle,
    content: String,
    placeholder: SharedString,
    label: SharedString,
    /// The selection, in UTF-8 bytes; empty: the caret.
    selected_range: Range<usize>,
    selection_reversed: bool,
    /// The text being composed by an input method (marked), underlined.
    marked_range: Option<Range<usize>>,
    multi_line: bool,
    /// In several lines, Return sends and Shift-Return goes to the line (a message); otherwise Return goes to the
    /// line.
    submit_on_enter: bool,
    min_rows: usize,
    max_rows: usize,
    disabled: bool,
    /// The x a vertical move aims at, kept across moves (as on every system).
    goal_x: Option<Pixels>,
    is_selecting: bool,
    /// The last layout, for the pointer and the input methods.
    layout: Option<TextLayout>,
    /// How far the text is scrolled (horizontally on one line, vertically on several).
    scroll: Point<Pixels>,
    /// The caret blinks while the field has the focus.
    caret_visible: bool,
    blink: Option<Task<()>>,
}

/// A laid-out text: one wrapped line per hard line, and where each starts.
struct TextLayout {
    lines: Rc<Vec<(usize, WrappedLine)>>,
    line_height: Pixels,
    /// Where the text's origin was painted (scroll included).
    origin: Point<Pixels>,
    width: Pixels,
    text: String,
}

impl TextLayout {
    fn line_index(&self, offset: usize) -> usize {
        self.lines.iter().rposition(|(start, _)| *start <= offset).unwrap_or(0)
    }

    fn line_top(&self, index: usize) -> Pixels {
        self.lines[..index].iter().map(|(_, line)| line.size(self.line_height).height).sum()
    }

    fn height(&self) -> Pixels {
        self.line_top(self.lines.len())
    }

    /// Where `offset` is drawn, from the text's origin (the top of its row).
    fn position(&self, offset: usize) -> Point<Pixels> {
        let index = self.line_index(offset);
        let (start, line) = &self.lines[index];
        let local = line.position_for_index(offset - start, self.line_height).unwrap_or_default();
        point(local.x, local.y + self.line_top(index))
    }

    /// The offset nearest to a point, from the text's origin.
    fn offset(&self, position: Point<Pixels>) -> usize {
        let mut top = px(0.);
        for (index, (start, line)) in self.lines.iter().enumerate() {
            let height = line.size(self.line_height).height;
            if position.y < top + height || index == self.lines.len() - 1 {
                let local = point(position.x.max(px(0.)), (position.y - top).clamp(px(0.), height - px(0.5)));
                let found = match line.closest_index_for_position(local, self.line_height) {
                    Ok(found) | Err(found) => found,
                };
                return start + found.min(line.len());
            }
            top += height;
        }
        self.text.len()
    }
}

impl GTextInput {
    pub fn new(cx: &mut Context<Self>) -> Self {
        GTextInput {
            focus_handle: cx.focus_handle(),
            content: String::new(),
            placeholder: SharedString::default(),
            label: SharedString::default(),
            selected_range: 0..0,
            selection_reversed: false,
            marked_range: None,
            multi_line: false,
            submit_on_enter: false,
            min_rows: 1,
            max_rows: 1,
            disabled: false,
            goal_x: None,
            is_selecting: false,
            layout: None,
            scroll: Point::default(),
            caret_visible: true,
            blink: None,
        }
    }

    /// Several lines, wrapped at the field's width: `min_rows` high at first, growing to `max_rows`, then scrolling.
    pub fn multi_line(mut self, min_rows: usize, max_rows: usize) -> Self {
        self.multi_line = true;
        self.min_rows = min_rows.max(1);
        self.max_rows = max_rows.max(self.min_rows);
        self
    }

    /// Return sends (`Submitted`), Shift-Return goes to the line.
    pub fn submit_on_enter(mut self) -> Self {
        self.submit_on_enter = true;
        self
    }

    pub fn placeholder(mut self, placeholder: impl Into<SharedString>) -> Self {
        self.placeholder = placeholder.into();
        self
    }

    /// What a screen reader calls it (the field's title).
    pub fn label(mut self, label: impl Into<SharedString>) -> Self {
        self.label = label.into();
        self
    }

    pub fn with_text(mut self, text: impl Into<String>) -> Self {
        self.content = text.into();
        self.selected_range = self.content.len()..self.content.len();
        self
    }

    pub fn text(&self) -> &str {
        &self.content
    }

    pub fn selection(&self) -> Range<usize> {
        self.selected_range.clone()
    }

    pub fn is_multi_line(&self) -> bool {
        self.multi_line
    }

    pub fn set_text(&mut self, text: impl Into<String>, cx: &mut Context<Self>) {
        self.content = text.into();
        self.selected_range = self.content.len()..self.content.len();
        self.marked_range = None;
        cx.emit(GTextInputEvent::Changed);
        cx.notify();
    }

    pub fn set_disabled(&mut self, disabled: bool, cx: &mut Context<Self>) {
        self.disabled = disabled;
        cx.notify();
    }

    pub fn is_disabled(&self) -> bool {
        self.disabled
    }

    fn cursor_offset(&self) -> usize {
        if self.selection_reversed { self.selected_range.start } else { self.selected_range.end }
    }

    fn move_to(&mut self, offset: usize, window: &mut Window, cx: &mut Context<Self>) {
        self.selected_range = offset..offset;
        self.selection_reversed = false;
        self.selection_changed(window, cx);
    }

    fn select_to(&mut self, offset: usize, window: &mut Window, cx: &mut Context<Self>) {
        if self.selection_reversed {
            self.selected_range.start = offset
        } else {
            self.selected_range.end = offset
        }
        if self.selected_range.end < self.selected_range.start {
            self.selection_reversed = !self.selection_reversed;
            self.selected_range = self.selected_range.end..self.selected_range.start;
        }
        self.selection_changed(window, cx);
    }

    fn selection_changed(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        window.notify_text_selection_changed(&self.focus_handle);
        self.restart_blink(cx);
        cx.notify();
    }

    fn previous_boundary(&self, offset: usize) -> usize {
        self.content.grapheme_indices(true).rev().find_map(|(index, _)| (index < offset).then_some(index)).unwrap_or(0)
    }

    fn next_boundary(&self, offset: usize) -> usize {
        self.content
            .grapheme_indices(true)
            .find_map(|(index, _)| (index > offset).then_some(index))
            .unwrap_or(self.content.len())
    }

    fn previous_word(&self, offset: usize) -> usize {
        self.content
            .unicode_word_indices()
            .rev()
            .find_map(|(index, _)| (index < offset).then_some(index))
            .unwrap_or(0)
    }

    fn next_word(&self, offset: usize) -> usize {
        self.content
            .unicode_word_indices()
            .find_map(|(index, word)| (index + word.len() > offset).then_some(index + word.len()))
            .unwrap_or(self.content.len())
    }

    /// The start and the end of the line holding `offset` (a hard line: up to a return).
    fn line_bounds(&self, offset: usize) -> Range<usize> {
        let start = self.content[..offset].rfind('\n').map_or(0, |index| index + 1);
        let end = self.content[offset..].find('\n').map_or(self.content.len(), |index| offset + index);
        start..end
    }

    /// The offset one row above or below the caret, at the goal's x; at the ends, the start or the end.
    fn vertical(&mut self, rows: f32) -> usize {
        let cursor = self.cursor_offset();
        let Some(layout) = self.layout.as_ref() else { return cursor };
        let position = layout.position(cursor);
        let x = *self.goal_x.get_or_insert(position.x);
        let y = position.y + layout.line_height * rows + layout.line_height / 2.;
        if y < px(0.) {
            0
        } else if y >= layout.height() {
            self.content.len()
        } else {
            layout.offset(point(x, y))
        }
    }

    fn left(&mut self, _: &Left, window: &mut Window, cx: &mut Context<Self>) {
        self.goal_x = None;
        if self.selected_range.is_empty() {
            self.move_to(self.previous_boundary(self.cursor_offset()), window, cx);
        } else {
            self.move_to(self.selected_range.start, window, cx)
        }
    }

    fn right(&mut self, _: &Right, window: &mut Window, cx: &mut Context<Self>) {
        self.goal_x = None;
        if self.selected_range.is_empty() {
            self.move_to(self.next_boundary(self.selected_range.end), window, cx);
        } else {
            self.move_to(self.selected_range.end, window, cx)
        }
    }

    fn up(&mut self, _: &Up, window: &mut Window, cx: &mut Context<Self>) {
        let offset = self.vertical(-1.);
        self.move_to(offset, window, cx);
    }

    fn down(&mut self, _: &Down, window: &mut Window, cx: &mut Context<Self>) {
        let offset = self.vertical(1.);
        self.move_to(offset, window, cx);
    }

    fn word_left(&mut self, _: &WordLeft, window: &mut Window, cx: &mut Context<Self>) {
        self.goal_x = None;
        self.move_to(self.previous_word(self.cursor_offset()), window, cx);
    }

    fn word_right(&mut self, _: &WordRight, window: &mut Window, cx: &mut Context<Self>) {
        self.goal_x = None;
        self.move_to(self.next_word(self.cursor_offset()), window, cx);
    }

    fn select_left(&mut self, _: &SelectLeft, window: &mut Window, cx: &mut Context<Self>) {
        self.goal_x = None;
        self.select_to(self.previous_boundary(self.cursor_offset()), window, cx);
    }

    fn select_right(&mut self, _: &SelectRight, window: &mut Window, cx: &mut Context<Self>) {
        self.goal_x = None;
        self.select_to(self.next_boundary(self.cursor_offset()), window, cx);
    }

    fn select_up(&mut self, _: &SelectUp, window: &mut Window, cx: &mut Context<Self>) {
        let offset = self.vertical(-1.);
        self.select_to(offset, window, cx);
    }

    fn select_down(&mut self, _: &SelectDown, window: &mut Window, cx: &mut Context<Self>) {
        let offset = self.vertical(1.);
        self.select_to(offset, window, cx);
    }

    fn select_word_left(&mut self, _: &SelectWordLeft, window: &mut Window, cx: &mut Context<Self>) {
        self.select_to(self.previous_word(self.cursor_offset()), window, cx);
    }

    fn select_word_right(&mut self, _: &SelectWordRight, window: &mut Window, cx: &mut Context<Self>) {
        self.select_to(self.next_word(self.cursor_offset()), window, cx);
    }

    fn select_all(&mut self, _: &SelectAll, window: &mut Window, cx: &mut Context<Self>) {
        self.move_to(0, window, cx);
        self.select_to(self.content.len(), window, cx)
    }

    fn home(&mut self, _: &Home, window: &mut Window, cx: &mut Context<Self>) {
        self.goal_x = None;
        let start = self.line_bounds(self.cursor_offset()).start;
        self.move_to(start, window, cx);
    }

    fn end(&mut self, _: &End, window: &mut Window, cx: &mut Context<Self>) {
        self.goal_x = None;
        let end = self.line_bounds(self.cursor_offset()).end;
        self.move_to(end, window, cx);
    }

    fn select_home(&mut self, _: &SelectHome, window: &mut Window, cx: &mut Context<Self>) {
        let start = self.line_bounds(self.cursor_offset()).start;
        self.select_to(start, window, cx);
    }

    fn select_end(&mut self, _: &SelectEnd, window: &mut Window, cx: &mut Context<Self>) {
        let end = self.line_bounds(self.cursor_offset()).end;
        self.select_to(end, window, cx);
    }

    fn backspace(&mut self, _: &Backspace, window: &mut Window, cx: &mut Context<Self>) {
        if self.disabled {
            return;
        }
        if self.selected_range.is_empty() {
            let previous = self.previous_boundary(self.cursor_offset());
            if self.cursor_offset() == previous {
                return;
            }
            self.select_to(previous, window, cx)
        }
        self.replace_text_in_range(None, "", window, cx)
    }

    fn delete(&mut self, _: &Delete, window: &mut Window, cx: &mut Context<Self>) {
        if self.disabled {
            return;
        }
        if self.selected_range.is_empty() {
            let next = self.next_boundary(self.cursor_offset());
            if self.cursor_offset() == next {
                return;
            }
            self.select_to(next, window, cx)
        }
        self.replace_text_in_range(None, "", window, cx)
    }

    fn delete_word_left(&mut self, _: &DeleteWordLeft, window: &mut Window, cx: &mut Context<Self>) {
        if self.disabled {
            return;
        }
        if self.selected_range.is_empty() {
            self.select_to(self.previous_word(self.cursor_offset()), window, cx);
        }
        self.replace_text_in_range(None, "", window, cx)
    }

    fn enter(&mut self, _: &Enter, window: &mut Window, cx: &mut Context<Self>) {
        if self.multi_line && !self.submit_on_enter {
            self.replace_text_in_range(None, "\n", window, cx);
        } else {
            cx.emit(GTextInputEvent::Submitted);
        }
    }

    fn newline(&mut self, _: &Newline, window: &mut Window, cx: &mut Context<Self>) {
        if self.multi_line {
            self.replace_text_in_range(None, "\n", window, cx);
        }
    }

    fn paste(&mut self, _: &Paste, window: &mut Window, cx: &mut Context<Self>) {
        if self.disabled {
            return;
        }
        if let Some(text) = cx.read_from_clipboard().and_then(|item| item.text()) {
            // On one line, the returns of a pasted text become spaces.
            let text = if self.multi_line { text.replace("\r\n", "\n") } else { text.replace(['\r', '\n'], " ") };
            self.replace_text_in_range(None, &text, window, cx);
        }
    }

    fn copy(&mut self, _: &Copy, _: &mut Window, cx: &mut Context<Self>) {
        if !self.selected_range.is_empty() {
            cx.write_to_clipboard(ClipboardItem::new_string(self.content[self.selected_range.clone()].to_string()));
        }
    }

    fn cut(&mut self, _: &Cut, window: &mut Window, cx: &mut Context<Self>) {
        if !self.selected_range.is_empty() && !self.disabled {
            cx.write_to_clipboard(ClipboardItem::new_string(self.content[self.selected_range.clone()].to_string()));
            self.replace_text_in_range(None, "", window, cx)
        }
    }

    fn show_character_palette(&mut self, _: &ShowCharacterPalette, window: &mut Window, _: &mut Context<Self>) {
        window.show_character_palette();
    }

    fn on_mouse_down(&mut self, event: &MouseDownEvent, window: &mut Window, cx: &mut Context<Self>) {
        if self.disabled {
            return;
        }
        self.is_selecting = true;
        self.goal_x = None;
        window.focus(&self.focus_handle, cx);
        let offset = self.offset_for_point(event.position);
        if event.modifiers.shift {
            self.select_to(offset, window, cx);
        } else if event.click_count == 2 {
            // A double click: the word.
            let start = self.previous_word(self.next_boundary(offset));
            let end = self.next_word(start);
            self.move_to(start, window, cx);
            self.select_to(end, window, cx);
        } else if event.click_count >= 3 {
            let line = self.line_bounds(offset);
            self.move_to(line.start, window, cx);
            self.select_to(line.end, window, cx);
        } else {
            self.move_to(offset, window, cx)
        }
    }

    fn on_mouse_up(&mut self, _: &MouseUpEvent, _window: &mut Window, _: &mut Context<Self>) {
        self.is_selecting = false;
    }

    fn on_mouse_move(&mut self, event: &MouseMoveEvent, window: &mut Window, cx: &mut Context<Self>) {
        if self.is_selecting {
            self.select_to(self.offset_for_point(event.position), window, cx);
        }
    }

    fn offset_for_point(&self, position: Point<Pixels>) -> usize {
        let Some(layout) = self.layout.as_ref() else { return self.content.len() };
        if layout.text != self.content {
            return self.content.len();
        }
        layout.offset(position - layout.origin)
    }

    /// The caret shows at once after a key or a click, then blinks.
    fn restart_blink(&mut self, cx: &mut Context<Self>) {
        self.caret_visible = true;
        self.blink = Some(cx.spawn(async move |this, cx| {
            loop {
                cx.background_executor().timer(Duration::from_millis(530)).await;
                let alive = this.update(cx, |this, cx| {
                    this.caret_visible = !this.caret_visible;
                    cx.notify();
                });
                if alive.is_err() {
                    break;
                }
            }
        }));
    }

    fn offset_from_utf16(&self, offset: usize) -> usize {
        let mut utf8_offset = 0;
        let mut utf16_count = 0;
        for character in self.content.chars() {
            if utf16_count >= offset {
                break;
            }
            utf16_count += character.len_utf16();
            utf8_offset += character.len_utf8();
        }
        utf8_offset
    }

    fn offset_to_utf16(&self, offset: usize) -> usize {
        let mut utf16_offset = 0;
        let mut utf8_count = 0;
        for character in self.content.chars() {
            if utf8_count >= offset {
                break;
            }
            utf8_count += character.len_utf8();
            utf16_offset += character.len_utf16();
        }
        utf16_offset
    }

    fn range_to_utf16(&self, range: &Range<usize>) -> Range<usize> {
        self.offset_to_utf16(range.start)..self.offset_to_utf16(range.end)
    }

    fn range_from_utf16(&self, range_utf16: &Range<usize>) -> Range<usize> {
        self.offset_from_utf16(range_utf16.start)..self.offset_from_utf16(range_utf16.end)
    }

    fn insertion_text(&self, text: &str) -> String {
        if self.multi_line { text.to_string() } else { text.replace(['\r', '\n'], " ") }
    }
}

impl EventEmitter<GTextInputEvent> for GTextInput {}

impl EntityInputHandler for GTextInput {
    fn text_for_range(
        &mut self,
        range_utf16: Range<usize>,
        actual_range: &mut Option<Range<usize>>,
        _window: &mut Window,
        _cx: &mut Context<Self>,
    ) -> Option<String> {
        let range = self.range_from_utf16(&range_utf16);
        actual_range.replace(self.range_to_utf16(&range));
        Some(self.content[range].to_string())
    }

    fn selected_text_range(
        &mut self,
        _ignore_disabled_input: bool,
        _window: &mut Window,
        _cx: &mut Context<Self>,
    ) -> Option<UTF16Selection> {
        Some(UTF16Selection { range: self.range_to_utf16(&self.selected_range), reversed: self.selection_reversed })
    }

    fn set_selected_text_range(&mut self, range_utf16: Range<usize>, window: &mut Window, cx: &mut Context<Self>) {
        self.selected_range = self.range_from_utf16(&range_utf16);
        self.selection_reversed = false;
        self.selection_changed(window, cx);
    }

    fn text_length_utf16(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> Option<usize> {
        Some(self.content.encode_utf16().count())
    }

    fn marked_text_range(&self, _window: &mut Window, _cx: &mut Context<Self>) -> Option<Range<usize>> {
        self.marked_range.as_ref().map(|range| self.range_to_utf16(range))
    }

    fn unmark_text(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.marked_range = None;
        window.notify_text_input_changed(&self.focus_handle);
        cx.notify();
    }

    fn replace_text_in_range(
        &mut self,
        range_utf16: Option<Range<usize>>,
        new_text: &str,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        if self.disabled {
            return;
        }
        let new_text = self.insertion_text(new_text);
        let range = range_utf16
            .as_ref()
            .map(|range_utf16| self.range_from_utf16(range_utf16))
            .or(self.marked_range.clone())
            .unwrap_or(self.selected_range.clone());
        self.content.replace_range(range.clone(), &new_text);
        self.selected_range = range.start + new_text.len()..range.start + new_text.len();
        self.selection_reversed = false;
        self.marked_range = None;
        self.goal_x = None;
        window.notify_text_input_changed(&self.focus_handle);
        self.restart_blink(cx);
        cx.emit(GTextInputEvent::Changed);
        cx.notify();
    }

    fn replace_and_mark_text_in_range(
        &mut self,
        range_utf16: Option<Range<usize>>,
        new_text: &str,
        new_selected_range_utf16: Option<Range<usize>>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        if self.disabled {
            return;
        }
        let new_text = self.insertion_text(new_text);
        let range = range_utf16
            .as_ref()
            .map(|range_utf16| self.range_from_utf16(range_utf16))
            .or(self.marked_range.clone())
            .unwrap_or(self.selected_range.clone());
        self.content.replace_range(range.clone(), &new_text);
        self.marked_range = (!new_text.is_empty()).then(|| range.start..range.start + new_text.len());
        let insertion_start_utf16 = self.offset_to_utf16(range.start);
        let inserted_length_utf16 = new_text.encode_utf16().count();
        self.selected_range = new_selected_range_utf16
            .map(|selected| {
                self.range_from_utf16(
                    &(insertion_start_utf16 + selected.start.min(inserted_length_utf16)
                        ..insertion_start_utf16 + selected.end.min(inserted_length_utf16)),
                )
            })
            .unwrap_or_else(|| range.start + new_text.len()..range.start + new_text.len());
        self.selection_reversed = false;
        window.notify_text_input_changed(&self.focus_handle);
        cx.emit(GTextInputEvent::Changed);
        cx.notify();
    }

    fn bounds_for_range(
        &mut self,
        range_utf16: Range<usize>,
        _bounds: Bounds<Pixels>,
        _window: &mut Window,
        _cx: &mut Context<Self>,
    ) -> Option<Bounds<Pixels>> {
        let layout = self.layout.as_ref()?;
        if layout.text != self.content {
            return None;
        }
        let range = self.range_from_utf16(&range_utf16);
        let start = layout.position(range.start);
        let end = layout.position(range.end);
        let end = if end.y > start.y { point(layout.width, start.y) } else { end };
        Some(Bounds::from_corners(
            layout.origin + start,
            layout.origin + point(end.x.max(start.x), start.y + layout.line_height),
        ))
    }

    fn character_index_for_point(
        &mut self,
        point: Point<Pixels>,
        _window: &mut Window,
        _cx: &mut Context<Self>,
    ) -> Option<usize> {
        let layout = self.layout.as_ref()?;
        if layout.text != self.content {
            return None;
        }
        Some(self.offset_to_utf16(layout.offset(point - layout.origin)))
    }
}

impl Focusable for GTextInput {
    fn focus_handle(&self, _: &App) -> FocusHandle {
        self.focus_handle.clone()
    }
}

impl Render for GTextInput {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let focused = self.focus_handle.is_focused(window);
        if focused && self.blink.is_none() {
            self.restart_blink(cx);
        } else if !focused && self.blink.is_some() {
            self.blink = None;
        }
        div()
            .id("g-text-input")
            .key_context(CONTEXT)
            .track_focus(&self.focus_handle)
            .tab_stop(!self.disabled)
            .when(!self.disabled, |this| this.cursor(CursorStyle::IBeam))
            .on_action(cx.listener(Self::backspace))
            .on_action(cx.listener(Self::delete))
            .on_action(cx.listener(Self::delete_word_left))
            .on_action(cx.listener(Self::left))
            .on_action(cx.listener(Self::right))
            .on_action(cx.listener(Self::up))
            .on_action(cx.listener(Self::down))
            .on_action(cx.listener(Self::word_left))
            .on_action(cx.listener(Self::word_right))
            .on_action(cx.listener(Self::select_left))
            .on_action(cx.listener(Self::select_right))
            .on_action(cx.listener(Self::select_up))
            .on_action(cx.listener(Self::select_down))
            .on_action(cx.listener(Self::select_word_left))
            .on_action(cx.listener(Self::select_word_right))
            .on_action(cx.listener(Self::select_all))
            .on_action(cx.listener(Self::home))
            .on_action(cx.listener(Self::end))
            .on_action(cx.listener(Self::select_home))
            .on_action(cx.listener(Self::select_end))
            .on_action(cx.listener(Self::enter))
            .on_action(cx.listener(Self::newline))
            .on_action(cx.listener(Self::show_character_palette))
            .on_action(cx.listener(Self::paste))
            .on_action(cx.listener(Self::cut))
            .on_action(cx.listener(Self::copy))
            .on_mouse_down(MouseButton::Left, cx.listener(Self::on_mouse_down))
            .on_mouse_up(MouseButton::Left, cx.listener(Self::on_mouse_up))
            .on_mouse_up_out(MouseButton::Left, cx.listener(Self::on_mouse_up))
            .on_mouse_move(cx.listener(Self::on_mouse_move))
            .w_full()
            .g_text(text::BODY)
            .child(GTextElement { input: cx.entity() })
    }
}

/// Draws a text input's text, its selection and its caret, and hands GPUI the platform's input.
struct GTextElement {
    input: Entity<GTextInput>,
}

struct Prepaint {
    lines: Rc<Vec<(usize, WrappedLine)>>,
    origin: Point<Pixels>,
    line_height: Pixels,
    selections: Vec<PaintQuad>,
    caret: Option<PaintQuad>,
    placeholder: bool,
    a11y: A11yText,
}

/// What a screen reader reads of the field: its text, its selection.
#[derive(Clone, Default)]
struct A11yText {
    label: SharedString,
    value: String,
    selection: Range<usize>,
    multi_line: bool,
    disabled: bool,
}

impl IntoElement for GTextElement {
    type Element = Self;

    fn into_element(self) -> Self::Element {
        self
    }
}

fn runs_for(input: &GTextInput, text: &str, window: &Window, color: Hsla) -> Vec<TextRun> {
    let style = window.text_style();
    let run = TextRun {
        len: text.len(),
        font: style.font(),
        color,
        background_color: None,
        underline: None,
        strikethrough: None,
    };
    match input.marked_range.as_ref() {
        Some(marked) if !input.content.is_empty() => vec![
            TextRun { len: marked.start, ..run.clone() },
            TextRun {
                len: marked.end - marked.start,
                underline: Some(UnderlineStyle { color: Some(color), thickness: px(1.0), wavy: false }),
                ..run.clone()
            },
            TextRun { len: text.len() - marked.end, ..run },
        ]
        .into_iter()
        .filter(|run| run.len > 0)
        .collect(),
        _ => vec![run],
    }
}

/// Shapes `text`, hard line by hard line, wrapped at `wrap` (none on one line).
fn shape(text: &str, runs: &[TextRun], wrap: Option<Pixels>, window: &Window) -> Vec<(usize, WrappedLine)> {
    let style = window.text_style();
    let font_size = style.font_size.to_pixels(window.rem_size());
    let mut lines = Vec::new();
    let mut start = 0;
    for line in text.split('\n') {
        // The runs of this line alone.
        let mut line_runs = Vec::new();
        let mut position = 0;
        for run in runs {
            let (run_start, run_end) = (position, position + run.len);
            position = run_end;
            let from = run_start.max(start);
            let to = run_end.min(start + line.len());
            if from < to {
                line_runs.push(TextRun { len: to - from, ..run.clone() });
            }
        }
        if line_runs.is_empty() {
            line_runs.push(TextRun { len: 0, ..runs[0].clone() });
        }
        let shaped = window
            .text_system()
            .shape_text(SharedString::from(line.to_string()), font_size, &line_runs, wrap, None)
            .ok()
            .and_then(|mut shaped| shaped.pop())
            .unwrap_or_default();
        lines.push((start, shaped));
        start += line.len() + 1;
    }
    lines
}

impl Element for GTextElement {
    type RequestLayoutState = ();
    type PrepaintState = Prepaint;

    fn id(&self) -> Option<ElementId> {
        Some(ElementId::Name("g-text".into()))
    }

    fn source_location(&self) -> Option<&'static core::panic::Location<'static>> {
        None
    }

    fn request_layout(
        &mut self,
        _id: Option<&GlobalElementId>,
        _inspector_id: Option<&InspectorElementId>,
        window: &mut Window,
        cx: &mut App,
    ) -> (LayoutId, Self::RequestLayoutState) {
        let input = self.input.read(cx);
        let line_height = window.line_height();
        let mut style = Style::default();
        style.size.width = relative(1.).into();
        if !input.multi_line {
            style.size.height = line_height.into();
            return (window.request_layout(style, [], cx), ());
        }
        // Several lines: as high as the wrapped text, between its least and its most rows.
        let (min_rows, max_rows) = (input.min_rows as f32, input.max_rows as f32);
        let text = if input.content.is_empty() { input.placeholder.to_string() } else { input.content.clone() };
        let color = window.text_style().color;
        let runs = runs_for(input, &text, window, color);
        let layout_id = window.request_measured_layout(style, move |known, available, window, _cx| {
            let width = known.width.unwrap_or(match available.width {
                AvailableSpace::Definite(width) => width,
                _ => px(10_000.),
            });
            let lines = shape(&text, &runs, Some(width), window);
            let rows = lines.iter().map(|(_, line)| line.wrap_boundaries().len() + 1).sum::<usize>() as f32;
            size(width, line_height * rows.clamp(min_rows, max_rows))
        });
        (layout_id, ())
    }

    fn prepaint(
        &mut self,
        _id: Option<&GlobalElementId>,
        _inspector_id: Option<&InspectorElementId>,
        bounds: Bounds<Pixels>,
        _request_layout: &mut Self::RequestLayoutState,
        window: &mut Window,
        cx: &mut App,
    ) -> Self::PrepaintState {
        let colors = cx.theme().colors;
        let input = self.input.read(cx);
        let line_height = window.line_height();
        let placeholder = input.content.is_empty();
        let (text, color) = if placeholder {
            (input.placeholder.to_string(), colors.text_discret)
        } else {
            (input.content.clone(), window.text_style().color)
        };
        let runs = runs_for(input, &text, window, color);
        let wrap = input.multi_line.then_some(bounds.size.width);
        let lines = Rc::new(shape(&text, &runs, wrap, window));
        let layout = TextLayout {
            lines: Rc::new(Vec::new()),
            line_height,
            origin: bounds.origin,
            width: bounds.size.width,
            text: input.content.clone(),
        };
        // Measured on the real text (the placeholder's positions mean nothing).
        let layout = TextLayout { lines: if placeholder { Rc::new(vec![(0, WrappedLine::default())]) } else { lines.clone() }, ..layout };
        let cursor = input.cursor_offset();
        let caret_at = if placeholder { point(px(0.), px(0.)) } else { layout.position(cursor) };

        // Scrolled so that the caret shows: sideways on one line, up and down on several.
        let mut scroll = input.scroll;
        if input.multi_line {
            let height = layout.height();
            if caret_at.y + scroll.y < px(0.) {
                scroll.y = -caret_at.y;
            } else if caret_at.y + line_height + scroll.y > bounds.size.height {
                scroll.y = bounds.size.height - caret_at.y - line_height;
            }
            scroll.y = scroll.y.min(px(0.)).max((bounds.size.height - height).min(px(0.)));
            scroll.x = px(0.);
        } else {
            let width = lines.first().map_or(px(0.), |(_, line)| line.width());
            let margin = px(2.);
            if caret_at.x + scroll.x < px(0.) {
                scroll.x = -caret_at.x;
            } else if caret_at.x + scroll.x > bounds.size.width - margin {
                scroll.x = bounds.size.width - margin - caret_at.x;
            }
            scroll.x = scroll.x.min(px(0.)).max((bounds.size.width - margin - width).min(px(0.)));
            scroll.y = px(0.);
        }
        let origin = bounds.origin + scroll;

        let focused = input.focus_handle.is_focused(window);
        let mut selections = Vec::new();
        let selection = input.selected_range.clone();
        if !selection.is_empty() && !placeholder {
            let ground = alpha(colors.accent, if focused { 0.25 } else { 0.12 });
            let start = layout.position(selection.start);
            let end = layout.position(selection.end);
            let mut row = start.y;
            while row <= end.y {
                let from = if row == start.y { start.x } else { px(0.) };
                let to = if row == end.y {
                    end.x
                } else {
                    // To the end of the row: the line's width, or the field's when it wraps.
                    let index = layout.line_index(layout.offset(point(px(0.), row + line_height / 2.)));
                    let line = &layout.lines[index].1;
                    if line.wrap_boundaries().is_empty() { line.width() + px(4.) } else { bounds.size.width }
                };
                if to > from {
                    selections.push(fill(
                        Bounds::from_corners(origin + point(from, row), origin + point(to, row + line_height)),
                        ground,
                    ));
                }
                row += line_height;
            }
        }
        let caret = (focused && selection.is_empty() && input.caret_visible && !input.disabled).then(|| {
            fill(Bounds::new(origin + caret_at + point(px(0.), px(1.)), size(px(2.), line_height - px(2.))), colors.text_primary)
        });
        let a11y = A11yText {
            label: input.label.clone(),
            value: input.content.clone(),
            selection: input.selected_range.clone(),
            multi_line: input.multi_line,
            disabled: input.disabled,
        };
        let stored = TextLayout { origin, ..layout };
        self.input.update(cx, |input, _| {
            input.scroll = scroll;
            input.layout = Some(stored);
        });
        Prepaint { lines, origin, line_height, selections, caret, placeholder, a11y }
    }

    fn paint(
        &mut self,
        _id: Option<&GlobalElementId>,
        _inspector_id: Option<&InspectorElementId>,
        bounds: Bounds<Pixels>,
        _request_layout: &mut Self::RequestLayoutState,
        prepaint: &mut Self::PrepaintState,
        window: &mut Window,
        cx: &mut App,
    ) {
        let focus_handle = self.input.read(cx).focus_handle.clone();
        window.handle_input(&focus_handle, ElementInputHandler::new(bounds, self.input.clone()), cx);
        window.with_content_mask(Some(gpui::ContentMask { bounds }), |window| {
            for selection in prepaint.selections.drain(..) {
                window.paint_quad(selection);
            }
            let mut top = px(0.);
            for (_, line) in prepaint.lines.iter() {
                line.paint(prepaint.origin + point(px(0.), top), prepaint.line_height, TextAlign::Left, None, window, cx)
                    .ok();
                top += line.size(prepaint.line_height).height;
            }
            if let Some(caret) = prepaint.caret.take() {
                window.paint_quad(caret);
            }
        });
        let _ = prepaint.placeholder;
    }

    fn a11y_role(&self) -> Option<Role> {
        Some(Role::TextInput)
    }

    fn a11y_synthetic_children(&mut self, prepaint: &mut Self::PrepaintState, builder: &mut gpui::A11ySubtreeBuilder) {
        let text = &prepaint.a11y;
        // The text as one run: its characters' lengths in UTF-8, the caret and the selection in characters.
        let mut run = gpui::accesskit::Node::new(Role::TextRun);
        run.set_value(text.value.clone());
        run.set_character_lengths(text.value.chars().map(|c| c.len_utf8() as u8).collect::<Vec<_>>());
        let run_id = builder.synthetic_node_id(0);
        builder.push_child(run_id, run);
        let characters = |offset: usize| text.value[..offset.min(text.value.len())].chars().count();
        let parent = builder.parent_node();
        parent.set_role(if text.multi_line { Role::MultilineTextInput } else { Role::TextInput });
        if !text.label.is_empty() {
            parent.set_label(text.label.to_string());
        }
        parent.set_value(text.value.clone());
        if text.disabled {
            parent.set_disabled();
        }
        parent.set_text_selection(gpui::accesskit::TextSelection {
            anchor: gpui::accesskit::TextPosition { node: run_id, character_index: characters(text.selection.start) },
            focus: gpui::accesskit::TextPosition { node: run_id, character_index: characters(text.selection.end) },
        });
    }
}

/// A field's frame (`GFieldFrame`): the ground slightly hollow, a fine rim, rust when it has the focus. `bare` (a form
/// card's row): none, the card is its frame.
#[derive(IntoElement)]
pub struct GFieldFrame {
    input: Entity<GTextInput>,
    bare: bool,
    preview_hover: bool,
}

impl GFieldFrame {
    pub fn new(input: Entity<GTextInput>) -> Self {
        GFieldFrame { input, bare: false, preview_hover: false }
    }

    pub fn bare(mut self) -> Self {
        self.bare = true;
        self
    }

    /// Drawn under the pointer (a gallery).
    pub fn preview_hover(mut self) -> Self {
        self.preview_hover = true;
        self
    }
}

impl RenderOnce for GFieldFrame {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        let input = self.input.read(cx);
        let focused = input.focus_handle.contains_focused(window, cx);
        let disabled = input.disabled;
        let multi_line = input.multi_line;
        let focus = input.focus_handle.clone();
        if self.bare {
            return div()
                .id("g-field")
                .w_full()
                .min_h(px(metrics::HEIGHT - 16.))
                .when(disabled, |this| this.opacity(opacity::DISABLED))
                .child(self.input)
                .into_any_element();
        }
        let rim = if focused {
            colors.accent
        } else if self.preview_hover {
            alpha(colors.border, 0.7)
        } else {
            colors.hairline
        };
        div()
            .id("g-field")
            .flex()
            .items_center()
            .w_full()
            .min_h(px(metrics::HEIGHT))
            .px(px(10.))
            .py(px(if multi_line { 6. } else { 0. }))
            .rounded(px(radius::SM))
            .bg(colors.background)
            .shadow(vec![hollow(0.06)])
            .border(px(if focused { 1.5 } else { 1. }))
            .border_color(rim)
            .when(!focused && !disabled, |this| this.hover(move |style| style.border_color(alpha(colors.border, 0.7))))
            .when(!disabled, |this| this.cursor(CursorStyle::IBeam))
            // A click on the padding too puts the caret in the field.
            .on_click(move |_, window, cx| window.focus(&focus, cx))
            .when(disabled, |this| this.opacity(opacity::DISABLED))
            .child(self.input)
            .into_any_element()
    }
}

/// A Gabarit text field with its title: the title above (small, discreet) and the field below, full width.
#[derive(IntoElement)]
pub struct GTextField {
    title: SharedString,
    input: Entity<GTextInput>,
}

impl GTextField {
    pub fn new(title: impl Into<SharedString>, input: Entity<GTextInput>) -> Self {
        GTextField { title: title.into(), input }
    }
}

impl RenderOnce for GTextField {
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {
        let colors = cx.theme().colors;
        if self.input.read(cx).label.is_empty() {
            let title = self.title.clone();
            self.input.update(cx, |input, _| input.label = title);
        }
        div()
            .flex()
            .flex_col()
            .gap(px(6.))
            .py(px(2.))
            .w_full()
            // Said once, by the field below (its label).
            .child(
                div()
                    .g_text(text::CAPTION)
                    .font_weight(gpui::FontWeight::SEMIBOLD)
                    .text_color(colors.text_secondary)
                    .child(self.title),
            )
            .child(GFieldFrame::new(self.input))
    }
}

/// Line height of the body text, for layouts that align with a field.
pub fn body_line_height() -> Pixels {
    px(text::BODY.desktop * tokens::LINE_HEIGHT)
}
