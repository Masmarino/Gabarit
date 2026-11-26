//! A text input's presentation (4.3): the field shows its text as its owner describes it, while the text itself, the
//! one that is typed, saved and sent, stays as it is. A note written in Markdown shows its titles larger and without
//! their `#`, its bold without its `**`, its tasks as circles that check, as Apple Notes does.
//!
//! The owner gives, for the field's text (the *source*):
//! - segments (`GSegment`): parts of the source hidden (`**`), or shown as another text (`- ` as `• `); the rest shows
//!   as it is. A hidden or replaced part is one block for the caret: it never stops inside it; a *lead* (a line's mark,
//!   `## `, `- [ ] `) is never stepped before either, and Backspace right after it takes it away (the formatting goes,
//!   the text stays);
//! - styles (`GStyleSpan`) on parts of the source: bold, italic, struck, underlined, monospace, colour, background;
//! - a scale per line (`GLineStyle`: a title's larger text);
//! - marks (`GMark`) drawn on the text: a circle (a task, which checks when clicked), a bar (a quote), a rule;
//! - links (`GLink`): a click opens them.
//!
//! Segments never hide nor replace a return: the shown text has the source's lines, one for one.

use std::ops::Range;

use gpui::{Hsla, SharedString};

/// How a text input shows its text: see the module. Built by the owner's presenter
/// (`GTextInput::presenter`) each time the text changes.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct GPresentation {
    pub segments: Vec<GSegment>,
    pub styles: Vec<GStyleSpan>,
    pub lines: Vec<GLineStyle>,
    pub marks: Vec<GMark>,
    pub links: Vec<GLink>,
}

/// A part of the source shown otherwise: hidden (`shown` empty) or as another text, as one block for the caret.
#[derive(Clone, Debug, PartialEq)]
pub struct GSegment {
    pub source: Range<usize>,
    pub shown: SharedString,
    /// A line's mark (`## `, `- [ ] `): the caret never stands before it, Backspace after it takes it away.
    pub lead: bool,
}

impl GSegment {
    /// Hidden: `**`, `](https://…)`.
    pub fn hidden(source: Range<usize>) -> Self {
        GSegment {
            source,
            shown: SharedString::default(),
            lead: false,
        }
    }

    /// Shown as another text: `- ` as `• `.
    pub fn replaced(source: Range<usize>, shown: impl Into<SharedString>) -> Self {
        GSegment {
            source,
            shown: shown.into(),
            lead: false,
        }
    }

    /// A line's mark: see `lead`.
    pub fn lead(mut self) -> Self {
        self.lead = true;
        self
    }
}

/// A style on a part of the source.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct GStyleSpan {
    pub source: Range<usize>,
    pub bold: bool,
    pub italic: bool,
    pub strikethrough: bool,
    pub underline: bool,
    pub monospace: bool,
    pub color: Option<Hsla>,
    pub background: Option<Hsla>,
}

/// A line's text size, as a multiple of the field's (a title: 1.5).
#[derive(Clone, Debug, PartialEq)]
pub struct GLineStyle {
    /// The line, from 0 (as the source's returns count them).
    pub line: usize,
    pub scale: f32,
}

/// A mark drawn on the text, at a place of the source (where its segment starts).
#[derive(Clone, Debug, PartialEq)]
pub struct GMark {
    pub at: usize,
    pub kind: GMarkKind,
}

#[derive(Clone, Debug, PartialEq)]
pub enum GMarkKind {
    /// A task's circle, drawn over the text shown there (a replaced segment, two spaces wide): empty, or filled with
    /// `color` and checked with `check`. Clicked: `toggle`'s part of the source becomes its text (`[ ]` → `[x]`).
    Circle {
        checked: bool,
        color: Hsla,
        check: Hsla,
        toggle: Option<(Range<usize>, SharedString)>,
    },
    /// A quote's bar, on the line's height, at the mark's place.
    Bar { color: Hsla },
    /// A rule across the field, in the middle of the line.
    Rule { color: Hsla },
}

/// A link: a click on its text opens `url`.
#[derive(Clone, Debug, PartialEq)]
pub struct GLink {
    pub source: Range<usize>,
    pub url: SharedString,
}

/// A part of the source and what shows of it.
#[derive(Clone, Debug, PartialEq)]
pub(crate) struct Piece {
    pub source: Range<usize>,
    pub shown: Range<usize>,
    /// Shown as it is, letter for letter; otherwise one block (hidden or replaced).
    pub literal: bool,
    pub lead: bool,
}

/// A presentation laid on its source: the shown text and the way between the two.
#[derive(Clone, Debug)]
pub(crate) struct Presented {
    /// The source it was made for.
    pub source: String,
    pub text: String,
    pub pieces: Vec<Piece>,
    /// Styles on the shown text.
    pub styles: Vec<(Range<usize>, GStyleSpan)>,
    /// The scale of each line (1 when none is given).
    pub scales: Vec<f32>,
    pub marks: Vec<(usize, GMarkKind)>,
    pub links: Vec<(Range<usize>, SharedString)>,
}

impl Presented {
    pub fn new(source: &str, presentation: GPresentation) -> Presented {
        // The segments kept: within the text, on letters' boundaries, without a return, one after the other.
        let mut segments: Vec<GSegment> = presentation
            .segments
            .into_iter()
            .filter(|s| {
                s.source.start < s.source.end
                    && s.source.end <= source.len()
                    && source.is_char_boundary(s.source.start)
                    && source.is_char_boundary(s.source.end)
                    && !source[s.source.clone()].contains('\n')
                    && !s.shown.contains('\n')
            })
            .collect();
        segments.sort_by_key(|s| s.source.start);
        let mut pieces = Vec::new();
        let mut text = String::with_capacity(source.len());
        let mut at = 0;
        let literal = |pieces: &mut Vec<Piece>, text: &mut String, range: Range<usize>| {
            if range.is_empty() {
                return;
            }
            let start = text.len();
            text.push_str(&source[range.clone()]);
            pieces.push(Piece {
                source: range,
                shown: start..text.len(),
                literal: true,
                lead: false,
            });
        };
        for segment in segments {
            if segment.source.start < at {
                continue;
            }
            literal(&mut pieces, &mut text, at..segment.source.start);
            let start = text.len();
            text.push_str(&segment.shown);
            pieces.push(Piece {
                source: segment.source.clone(),
                shown: start..text.len(),
                literal: false,
                lead: segment.lead,
            });
            at = segment.source.end;
        }
        literal(&mut pieces, &mut text, at..source.len());
        let mut presented = Presented {
            source: source.to_string(),
            text,
            pieces,
            styles: Vec::new(),
            scales: Vec::new(),
            marks: Vec::new(),
            links: Vec::new(),
        };
        let lines = source.split('\n').count();
        presented.scales = vec![1.; lines];
        for line in presentation.lines {
            if let Some(scale) = presented.scales.get_mut(line.line)
                && line.scale.is_finite()
                && line.scale > 0.
            {
                *scale = line.scale;
            }
        }
        let shown = |p: &Presented, range: &Range<usize>| {
            let start = p.shown_start(range.start.min(source.len()));
            let end = p.shown_end(range.end.min(source.len()));
            (start < end).then_some(start..end)
        };
        presented.styles = presentation
            .styles
            .into_iter()
            .filter_map(|s| shown(&presented, &s.source).map(|r| (r, s)))
            .collect();
        presented.links = presentation
            .links
            .into_iter()
            .filter_map(|l| shown(&presented, &l.source).map(|r| (r, l.url)))
            .collect();
        presented.marks = presentation
            .marks
            .into_iter()
            .filter(|m| m.at <= source.len())
            .map(|m| (presented.shown_start(m.at), m.kind))
            .collect();
        presented
    }

    /// The piece holding the source's `offset` (its start included, its end not; the text's end: the last piece).
    fn piece_of_source(&self, offset: usize) -> Option<&Piece> {
        let index = self
            .pieces
            .partition_point(|piece| piece.source.end <= offset);
        self.pieces.get(index).or(self.pieces.last())
    }

    /// Where the source's `offset` shows, as the caret: inside a block, after it; at a block's start, before it (not
    /// before a lead).
    pub fn to_shown(&self, offset: usize) -> usize {
        let Some(piece) = self.piece_of_source(offset) else {
            return 0;
        };
        if offset >= piece.source.end {
            piece.shown.end
        } else if piece.literal {
            piece.shown.start + (offset - piece.source.start)
        } else if offset == piece.source.start && !piece.lead {
            piece.shown.start
        } else {
            piece.shown.end
        }
    }

    /// Where a style starting at the source's `offset` starts in the shown text (a block: its start).
    fn shown_start(&self, offset: usize) -> usize {
        match self.piece_of_source(offset) {
            Some(piece) if offset < piece.source.end && piece.literal => {
                piece.shown.start + (offset - piece.source.start)
            }
            Some(piece) if offset < piece.source.end => piece.shown.start,
            Some(piece) => piece.shown.end,
            None => 0,
        }
    }

    /// Where a style ending at the source's `offset` ends in the shown text (a block it cuts: its end).
    fn shown_end(&self, offset: usize) -> usize {
        if offset == 0 {
            return 0;
        }
        match self.piece_of_source(offset - 1) {
            Some(piece) if piece.literal => {
                piece.shown.start + (offset.min(piece.source.end) - piece.source.start)
            }
            Some(piece) => piece.shown.end,
            None => 0,
        }
    }

    /// The source's place for the shown `offset`: of all those that show there, the first (before a hidden mark that
    /// closes a style rather than after it), but the last at a line's end (after the marks that close the line); never
    /// before a lead.
    pub fn to_source(&self, offset: usize) -> usize {
        let offset = offset.min(self.text.len());
        // At a line's end, after the marks that close it (a return there leaves the style closed on its line).
        let at_line_end = self.text[offset..].starts_with('\n') || offset == self.text.len();
        let mut best: Option<usize> = None;
        let first = self
            .pieces
            .partition_point(|piece| piece.shown.end < offset);
        for piece in &self.pieces[first..] {
            if piece.shown.start > offset {
                break;
            }
            // A block's start (not a lead's), and its end (inside a replaced block: its end too).
            let places = if piece.literal {
                [
                    Some(piece.source.start + (offset - piece.shown.start)),
                    None,
                ]
            } else {
                [
                    (offset == piece.shown.start && !piece.lead).then_some(piece.source.start),
                    (offset == piece.shown.end || offset > piece.shown.start)
                        .then_some(piece.source.end),
                ]
            };
            for place in places.into_iter().flatten() {
                best = Some(best.map_or(place, |best| {
                    if at_line_end {
                        best.max(place)
                    } else {
                        best.min(place)
                    }
                }));
            }
        }
        // A lead that starts here: the caret goes after it, never before (nor at the end of the line above).
        let floor = self.pieces[first..]
            .iter()
            .take_while(|piece| piece.shown.start <= offset)
            .filter(|piece| piece.lead && piece.shown.start == offset)
            .map(|piece| piece.source.end)
            .max();
        match (best, floor) {
            (Some(best), Some(floor)) => best.max(floor),
            (Some(best), None) => best,
            (None, Some(floor)) => floor,
            (None, None) => self.source.len(),
        }
    }

    /// The piece showing the letter at the shown `offset` (`offset` within its shown text, its end excluded).
    pub fn piece_showing(&self, offset: usize) -> Option<&Piece> {
        self.pieces
            .iter()
            .find(|piece| piece.shown.start <= offset && offset < piece.shown.end)
    }

    /// The lead that ends right where the caret stands (`cursor`, in the source).
    pub fn lead_before(&self, cursor: usize) -> Option<Range<usize>> {
        self.pieces
            .iter()
            .find(|piece| piece.lead && piece.source.end == cursor)
            .map(|piece| piece.source.clone())
    }

    /// The source's part to take away for the shown letters `shown` (a letter shown as it is; a whole replaced block).
    pub fn source_of_letters(&self, shown: Range<usize>) -> Option<Range<usize>> {
        let piece = self.piece_showing(shown.start)?;
        if piece.literal {
            let start = piece.source.start + (shown.start - piece.shown.start);
            let end = piece.source.start + (shown.end.min(piece.shown.end) - piece.shown.start);
            Some(start..end)
        } else {
            Some(piece.source.clone())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn presented(source: &str, segments: Vec<GSegment>) -> Presented {
        Presented::new(
            source,
            GPresentation {
                segments,
                ..Default::default()
            },
        )
    }

    #[test]
    fn hidden_marks_are_not_shown() {
        let p = presented(
            "## Titre **gras**",
            vec![
                GSegment::hidden(0..3).lead(),
                GSegment::hidden(9..11),
                GSegment::hidden(15..17),
            ],
        );
        assert_eq!(p.text, "Titre gras");
        // The line's start: after the lead, never before.
        assert_eq!(p.to_source(0), 3);
        assert_eq!(p.to_shown(0), 0);
        assert_eq!(p.to_shown(1), 0);
        assert_eq!(p.to_shown(3), 0);
        // Before the opening `**`, inside the closing one.
        assert_eq!(p.to_source(6), 9);
        assert_eq!(p.to_source(10), 17);
        assert_eq!(p.to_source(9), 14);
        assert_eq!(p.to_shown(17), 10);
        assert_eq!(p.to_shown(16), 10);
        assert_eq!(p.to_shown(11), 6);
    }

    #[test]
    fn every_shown_place_comes_back() {
        let source = "- [ ] pain **frais**\n# Titre\n> cité";
        let p = presented(
            source,
            vec![
                GSegment::replaced(0..6, "\u{2003} ").lead(),
                GSegment::hidden(11..13),
                GSegment::hidden(18..20),
                GSegment::hidden(21..23).lead(),
                GSegment::replaced(29..31, "\u{2003}").lead(),
            ],
        );
        assert_eq!(p.text, "\u{2003} pain frais\nTitre\n\u{2003}cité");
        // A line's start, after the return: after the title's `# `, not before it.
        let titre = p.text.find("Titre").unwrap();
        assert_eq!(p.to_source(titre), 23);
        for (offset, _) in p.text.char_indices().chain([(p.text.len(), ' ')]) {
            let back = p.to_shown(p.to_source(offset));
            // Within a replaced lead, the caret goes after it.
            let after = p
                .piece_showing(offset)
                .filter(|piece| !piece.literal)
                .map_or(offset, |piece| piece.shown.end);
            assert_eq!(back, after, "{offset}");
        }
        // Every source place shows somewhere, on a letter's boundary.
        for offset in 0..=source.len() {
            if source.is_char_boundary(offset) {
                assert!(p.text.is_char_boundary(p.to_shown(offset)), "{offset}");
            }
        }
    }

    #[test]
    fn backspace_after_a_lead_takes_it_away_and_letters_are_their_own_source() {
        let p = presented(
            "- [x] fait",
            vec![GSegment::replaced(0..6, "\u{2003} ").lead()],
        );
        assert_eq!(p.lead_before(6), Some(0..6));
        assert_eq!(p.lead_before(7), None);
        let em = "\u{2003}".len();
        assert_eq!(p.source_of_letters(em + 1..em + 2), Some(6..7));
        assert_eq!(p.source_of_letters(0..em), Some(0..6));
    }

    #[test]
    fn bad_segments_are_left_out() {
        let p = presented(
            "é\nab",
            vec![
                GSegment::hidden(1..2),
                GSegment::hidden(2..4),
                GSegment::hidden(3..9),
                GSegment::hidden(3..4),
                GSegment::hidden(3..5),
            ],
        );
        assert_eq!(p.text, "é\nb");
        assert_eq!(p.scales, vec![1., 1.]);
    }

    #[test]
    fn styles_follow_the_shown_text() {
        let p = Presented::new(
            "a **b** c",
            GPresentation {
                segments: vec![GSegment::hidden(2..4), GSegment::hidden(5..7)],
                styles: vec![GStyleSpan {
                    source: 2..7,
                    bold: true,
                    ..Default::default()
                }],
                links: vec![GLink {
                    source: 4..5,
                    url: "https://x".into(),
                }],
                ..Default::default()
            },
        );
        assert_eq!(p.text, "a b c");
        assert_eq!(p.styles[0].0, 2..3);
        assert_eq!(p.links[0].0, 2..3);
    }
}
