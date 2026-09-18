# RGAA Audit — DatePicker

Verified against RGAA 4.1.2 by exercising `Molecules/DatePicker` in
Storybook (stories `Empty`, `WithValue`, `Clearable`, `TwoMonths`,
`SundayStart`, `FrenchLocale`, `WithError`, `Disabled`, `Dark`) — real
keyboard use and
`getBoundingClientRect` run in the browser console — and by code
review (`date-picker.ts`, `date-picker.html`, `date-picker.scss`,
`date-picker-calendar.ts`). This is the most complex keyboard pattern
in the library so far, per the issue's own warning; the checklist
below is correspondingly more detailed than most.

## Checklist

| Criterion   | Short title                                             | Verification                                                                                                                                                                                                                                                                                                                                                                                            | Result                                     |
| ----------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 7.1         | Scripts compatible with assistive technology              | `role="dialog"` on the panel, `role="grid"`/`row`/`gridcell`/`columnheader` on the calendar, `aria-haspopup="dialog"` + `aria-expanded` on the trigger, `aria-selected`/`aria-current="date"` on day cells — 0 axe violations, both closed and open (`date-picker.spec.ts`, "has no a11y violations" ×2).                                                                                              | Compliant                                  |
| 7.3         | Keyboard- and pointer-operable                             | Full WAI-ARIA "Date Picker Dialog" keyboard set: arrows (day/week, rolling across month boundaries), `Home`/`End` (start/end of the focused week), `PageUp`/`PageDown` (month), `Shift+PageUp`/`PageDown` (year), `Enter`/`Space` (select). Every one tested individually in `date-picker.spec.ts` ("grid keyboard navigation" describe block, 12 cases), reproduced with real keyboard input in Storybook (`WithValue` story: focus day 18, `PageDown` → view moves to July, day 18 stays focused, not yet selected). | Compliant — verified under real conditions |
| 7.4         | No uncontrolled context change                             | Moving focus in the grid never changes the selected value or submits anything — confirmed live (pressing `PageDown` moved the displayed month without marking any day as selected); only `Enter`/`Space`/click commit a value.                                                                                                                                                                        | Compliant — verified under real conditions |
| 10.7        | Visible focus indicator                                    | `.gbt-date-picker__day:focus-visible`/`.gbt-date-picker__trigger:focus-visible`/`.gbt-date-picker__nav-button:focus-visible` all set a dedicated outline; a mouse click leaves none, confirming `:focus-visible`, not `:focus`.                                                                                                                                                                          | Compliant                                  |
| 12.8        | Consistent tab order                                        | Roving tabindex over the 42 day cells: exactly one (`isFocused`) is `[tabIndex]="0"`, the rest `-1` — the grid itself is a single tab stop, matching the WAI-ARIA composite widget pattern (like `Tabs`' trigger list, `SegmentedControl`'s options). The container `role="grid"` carries `tabindex="-1"` only to satisfy `interactive-supports-focus` for its delegated `(keydown)` — it is never itself a tab stop.                        | Compliant                                  |
| 12.9        | No keyboard trap                                            | `Escape` closes the panel and returns focus to the trigger from anywhere inside it (grid or nav buttons) — tested independently of arrow-key navigation.                                                                                                                                                                                                                                                | Compliant                                  |
| 11.1        | Label presence                                              | `previousMonthLabel`/`nextMonthLabel` name the two icon-only nav buttons (no visible text); the panel is labelled by `panelLabel()` ("June 2024", or "June 2024 – July 2024" with two visible months), so a screen reader announces which month(s) it's in.                                                                                                                                            | Compliant                                  |
| WCAG 2.5.8  | 24×24px target size                                         | Measured in Storybook (`getBoundingClientRect`): day cell **32 × 32px**, month-nav button **28 × 28px**, month/year select **~101 × 28px** (`Dark` story), clear button **24 × 24px** (`Clearable` story) — all meet the threshold, the clear button exactly at it.                                                                                                                                     | Compliant                                  |
| 11.1        | Label presence (clear button)                                | `clearLabel` (default `'Clear date'`) names the icon-only clear button — tested ("uses the provided clear label"), and 0 axe violations with it visible ("has no a11y violations with the clear button visible").                                                                                                                                                                                     | Compliant                                  |
| 11.1        | Label presence (month/year selects)                          | `monthSelectLabel`/`yearSelectLabel` (default `'Month'`/`'Year'`) name the two native `<select>` elements — tested indirectly via the a11y pass, since axe's `select-name` rule already catches an unlabelled select.                                                                                                                                                                                 | Compliant                                  |
| 7.3         | Keyboard- and pointer-operable (two visible months)           | With `visibleMonths="2"`, arrowing past the last day of the first visible month moves focus into the already-visible second month without shifting the view; arrowing past the last day of the *last* visible month slides the view forward by exactly one month. Both directions tested (`date-picker.spec.ts`, "moves focus into the second visible month without shifting the view", "slides the view forward by one month when focus moves past the last visible month"), reproduced live in Storybook (`TwoMonths` story: jumping the month select to October shows October/November side by side). | Compliant — verified under real conditions |
| 3.2         | Text contrast                                                | The selected day reuses `--primary`/`--text-on-primary` — the same pair already measured ≥7:1 (AAA) for `Avatar`'s fallback. Unselected days, the trigger, and the month/year selects reuse the base `--text-primary`/`--text-secondary` on `--bg-principal`, also already covered by the generic pairing check in `token-usage.spec.ts`.                                                              | Compliant                                  |

## Why the clear button is a sibling of the trigger, not nested inside it

A `<button>` cannot legally contain another interactive element — the
clear button is a separate `<button>` positioned to visually overlap
the trigger's icon slot (`position: absolute`, same coordinates the
calendar icon uses), not a descendant of the trigger. The calendar
icon itself gets `pointer-events: none` so it never intercepts a click
meant for the trigger underneath it when the clear button isn't shown.
Clicking the clear button cannot bubble into the trigger's own click
handler (they're siblings), so clearing a date never also opens the
panel — verified directly (`date-picker.spec.ts`, "does not open the
panel when the clear button is clicked") and live in Storybook.

## Why the month/year selects are plain native `<select>`s, not `gbt-select`

Nesting the library's own `Select` (itself a floating panel positioned
via `getBoundingClientRect`) inside `DatePicker`'s own floating panel
would multiply the positioning, z-index, and outside-click-detection
concerns for two components that would then both need to coexist
correctly while open — for no material benefit over a native
`<select>`, which is already fully keyboard- and screen-reader-
operable without any of that. This mirrors the same reasoning
`Popover`'s README gives for not auto-focusing into arbitrary
projected content: prefer the simpler, already-correct native
behavior over composing two complex widgets when nothing requires it.

## Why only the first visible month is select-driven

With `visibleMonths="2"`, only the first (leftmost) month has its
heading replaced by the month/year selects; the second keeps a plain
text heading. The two visible months are never independently
navigable — the second is always "the first's next month" — so giving
it its own selects would let the two get out of sync with each other,
which the component's whole navigation model (a single `anchorDate`)
deliberately prevents.

**Fixed during review**: the first version placed the selects in the
shared nav row (alongside the previous/next buttons), leaving the
second month's plain-text heading as the only heading above *its*
grid — a heading the first month didn't have in that row, so the two
calendars' weekday rows landed 25px apart instead of level with each
other (measured via `getBoundingClientRect` in Storybook). Moving the
previous/next buttons to their own full-width row, and giving every
month's heading (whether selects or text) the same fixed height via
`.gbt-date-picker__month-heading`, fixed it — re-measured at identical
`top` values for both grids.

## Why the trigger is a button, not an editable `<input>`

A freely-typed date needs locale-aware parsing ("18/06/2024" vs
"06/18/2024" vs "18 juin 2024") this component doesn't attempt — a
half-correct parser would be worse than none. Rendering the trigger
as a `<button>` showing the formatted value (exactly `Select`'s own
trigger pattern) sidesteps that entirely: the calendar is the only way
to set a value, and every keyboard interaction that matters for a date
field (open, navigate, pick, cancel) still works without typing.

## Calendar math correctness

`date-picker-calendar.ts` is unit-tested in isolation
(`date-picker-calendar.spec.ts`) for the two failure modes date math
is notorious for: leap years (`addYears` clamping Feb 29 → Feb 28) and
DST transitions (the grid-continuity test spans the US spring-forward
date on purpose, comparing calendar dates rather than raw millisecond
diffs, which would be off by an hour on that one day).

## Externalized strings

`previousMonthLabel`/`nextMonthLabel` default to English, `placeholder`
to `'Select a date…'` — all overridable, tested ("uses Monday-start
weekdays by default" and the `FrenchLocale`/`SundayStart` stories cover
the two other localizable surfaces: weekday/month names via `locale`,
and week order via `weekStartsOn`).

Dark mode is visually confirmed in Storybook (`Dark` story) — trigger,
panel, weekday header, and the selected-day circle all legible, no
contrast regression.
