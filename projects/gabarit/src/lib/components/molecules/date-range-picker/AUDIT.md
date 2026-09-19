# RGAA Audit — DateRangePicker

Verified against RGAA 4.1.2 by exercising `Molecules/DateRangePicker`
in Storybook (stories `Empty`, `WithValue`, `Clearable`, `OneMonth`,
`FrenchLocale`, `WithError`, `Disabled`, `Dark`) and by code review
(`date-range-picker.ts`, `date-range-picker.html`,
`date-range-picker.scss`, and the reused `date-picker-calendar.ts`).
Given more time was budgeted for this audit than most, per the
issue's own warning that this is a two-step keyboard interaction built
on top of `DatePicker`'s already-complex one.

## Checklist

| Criterion   | Short title                                        | Verification                                                                                                                                                                                                                                                                    | Result   |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 7.1         | Scripts compatible with assistive technology          | `role="dialog"` on the panel, `role="grid"`/`row`/`gridcell`/`columnheader` on the calendar, `aria-haspopup="dialog"` + `aria-expanded` on the trigger — 0 axe violations closed, open with no selection, open mid-selection, and with a completed range (`date-range-picker.spec.ts`, "has no a11y violations" ×4). | Compliant |
| 7.3         | Keyboard- and pointer-operable                        | Same navigation set as `DatePicker` (arrows/Home/End/PageUp/PageDown/Shift+PageUp/PageDown), plus `Enter`/`Space` performing exactly what a click does — pick a start, then an end. Tested individually ("keyboard navigation" describe block).                                    | Compliant |
| 7.4         | No uncontrolled context change                        | Moving focus never changes the draft range; only `Enter`/`Space`/click do. Picking a start alone does not fire `onChange` — verified explicitly ("picks a start on the first click... does not commit yet").                                                                      | Compliant |
| 10.7        | Visible focus indicator                               | `.gbt-date-range-picker__day:focus-visible` sets a dedicated outline, same convention as `DatePicker`.                                                                                                                                                                            | Compliant |
| 12.8        | Consistent tab order                                  | Roving tabindex over the visible day cells: exactly one (`isFocused`) is `[tabIndex]="0"`, matching `DatePicker`'s own composite-widget pattern.                                                                                                                                    | Compliant |
| 12.9        | No keyboard trap                                       | `Escape` closes the panel and returns focus to the trigger from anywhere inside it.                                                                                                                                                                                              | Compliant |
| 11.1        | Label presence                                         | `previousMonthLabel`/`nextMonthLabel`/`clearLabel`/`monthSelectLabel`/`yearSelectLabel` all externalized, same as `DatePicker`; the panel is labelled by `panelLabel()`.                                                                                                          | Compliant |
| 3.1         | Information not conveyed by color alone                | The range fill (`--in-range`/`--start-cap`/`--end-cap`) is a visual aid, not the only source of the range — the trigger's text and the live region both state the two dates in words. See "Why no hatch pattern on the range fill" below.                                          | Compliant |
| 3.2         | Text contrast                                          | Cap days reuse `--primary`/`--text-on-primary` — the exact pair already audited for `DatePicker`'s own selected-day circle (≥7:1 AAA). In-range days keep the base `--text-primary` on a `color-mix(…, var(--primary) 12%, …)` tint, too light to threaten that pairing.             | Compliant |
| 4.1.2       | Name, role, value of the live region                  | `role="status" aria-live="polite" aria-atomic="true"`, pre-existing empty in the DOM before any selection (`"pre-exists empty, before anything is selected"`) — same pre-existence convention as `FunnelChart`'s/`PieChart`'s own live regions.                                    | Compliant |

## Why no `Shift+Arrow` to extend the selection

The originating issue suggested validating a `Shift+Arrow`-extends
mechanic against a WAI-ARIA "Date Range Picker Dialog" reference
pattern. No such pattern exists in the APG — only a single-date "Date
Picker Dialog" does — so there was nothing to validate against, and
adding a second, bespoke interaction path (click *or* modifier-arrow)
alongside the click-based one would double the surface a user has to
discover and this audit has to cover, for a capability the click model
already provides. `Enter`/`Space` on the focused day instead performs
exactly what a click does — pick a start, then an end — which is not
a new mechanic at all, just the existing "activate the focused cell"
convention `DatePicker` already established, extended to two steps.

## Why the range closes on completion rather than staying open for a separate "Apply"

This was flagged explicitly during design and kept for parity with
`DatePicker`, which also closes immediately on a single click. Keeping
the panel open after the second click would need a new "Apply" (or
"Confirm") button and label this component doesn't otherwise need —
Escape and an outside click already let a user back out *before*
completing without side effects; once both ends are picked, there is
nothing left to confirm.

## Why the live region duplicates the trigger's own update

Once a range completes, the panel — and with it the live region —
unmounts in the same tick (see above), so a screen reader's actual
confirmation comes from focus landing back on the trigger, whose label
now reads the completed range. The live region's job is narrower and
happens *before* that point: announcing the start once picked and
prompting for an end, a piece of information `DatePicker` never needed
(a single click is atomic; there is no intermediate state to narrate).

## Why no hatch pattern on the range fill

Other charts in this library (`LineChart`, `PieChart`) pair a
categorical color with a non-color differentiator (dash pattern,
direct labels) because they show multiple, simultaneously-visible
series that must stay distinguishable from each other. A date range
has exactly one range and two endpoints — nothing else on screen
competes with it for the same color, so RGAA 3.1 is satisfied by the
range's *content* being available in text (trigger, live region, and
each day's own visible number) rather than needing a second visual
channel on the fill itself.

## Why an adjacent-month blank cell is an empty `role="gridcell"`, not `aria-hidden`

Reuses `DatePicker`'s own fix verbatim, for the same reason: a
wholly-blank trailing week (here, also produced when a shorter visible
month is padded to match a taller sibling month's row count) can leave
an entire `role="row"` made of nothing but these filler cells: marking
them `aria-hidden` would make axe's `aria-required-children` rule see
a row with no valid children at all. An empty, non-`aria-hidden`
`gridcell` has no accessible-name requirement of its own, so it costs
nothing to leave in the tree.

## Calendar math correctness

`date-picker-calendar.ts` is reused unmodified, already unit-tested in
isolation for leap years and DST transitions
(`date-picker-calendar.spec.ts`) — nothing new to verify here beyond
`DateRangePicker`'s own range-specific logic (swap-if-reversed, shared
row-count trimming across two months), which is covered directly in
`date-range-picker.spec.ts`.

## Externalized strings

`previousMonthLabel`/`nextMonthLabel`/`clearLabel`/`placeholder`/
`rangeStatus` all default to English and are overridable, consistent
with `DatePicker`. `rangeStatus` is a formatter *function* rather than
a fixed string, like `FunnelChart`'s `stepAnnouncement`, since its
wording legitimately differs between the "start picked" and "range
complete" states.

Dark mode is visually confirmed in Storybook (`Dark` story) — the
range fill, both caps, the preview state, and the trigger all remain
legible, no contrast regression.
