# DateRangePicker

Two-date selection (start + end) — a trigger button showing the
formatted range, and a calendar dropdown for picking both ends.
Integrates with Angular forms via `ControlValueAccessor`, like
`DatePicker`.

**Selector**: `gbt-date-range-picker`

## Inputs

| Input                | Type                | Default                     | Role                                                              |
| --------------------- | -------------------- | ------------------------------ | -------------------------------------------------------------------- |
| `label`              | `string`            | `''`                          | Field label.                                                       |
| `placeholder`        | `string`            | `'Select a date range…'`      | Shown in the trigger when no range is selected.                    |
| `locale`             | `string`            | `'en-US'`                     | Passed to `Intl.DateTimeFormat` for the trigger's range, the month/year heading, and weekday names. |
| `weekStartsOn`       | `0 \| 1`             | `1` (Monday)                  | `0` for a Sunday-first week.                                        |
| `disabled`           | `boolean`           | `false`                        | —                                                                    |
| `required`           | `boolean`           | `false`                        | Appends `*` to the label.                                          |
| `errorMessage`       | `string \| null`     | `null`                        | Rendered as `role="alert"` below the field.                        |
| `previousMonthLabel` | `string`            | `'Previous month'`            | Accessible name of the "go back a month" button.                   |
| `nextMonthLabel`     | `string`            | `'Next month'`                | Accessible name of the "go forward a month" button.                |
| `clearable`          | `boolean`           | `false`                        | Shows a clear button in place of the calendar icon once a range is selected. |
| `clearLabel`         | `string`            | `'Clear date range'`          | Accessible name of the clear button.                                |
| `visibleMonths`      | `1 \| 2`             | `2`                            | Shows one or two consecutive months side by side — `2` by default, so both ends of a range are visible at once. |
| `monthSelectLabel`   | `string`            | `'Month'`                      | Accessible name of the month dropdown.                              |
| `yearSelectLabel`    | `string`            | `'Year'`                       | Accessible name of the year dropdown.                               |
| `minYear`/`maxYear`  | `number`            | current year ∓ 100/+10          | Bounds the year dropdown's options.                                 |
| `rangeStatus`        | `(start: string \| null, end: string \| null) => string` | see below | Formats the live-region message announced as the range is built.    |

## Value

```ts
interface DateRangeValue {
  start: Date
  end: Date | null
}
```

The `ControlValueAccessor` value is `DateRangeValue | null` — `null`
while nothing is selected. `end` is only ever `null` in a value written
in *from the outside* (e.g. resuming a saved, incomplete filter); once
the user picks both ends themselves, `onChange` fires exactly once,
with both set.

## Example

```html
<gbt-date-range-picker label="Audit period" [formControl]="period" />
```

## Behavior

- First click picks the start, second click picks the end — the panel
  stays open in between, and closes once both ends are set. If the
  second click lands *before* the first, the two are swapped rather
  than rejected, so clicking in either order always produces a valid
  range.
- Clicking again after a range is already complete starts a brand-new
  range at that day, discarding the old one — there's no "adjust one
  end of an existing range" mode.
- Hovering between the first click and the second previews the
  would-be range (a lighter fill, `--preview`) across every day
  between the picked start and the hovered day, correctly whichever
  side of the start the hover lands on. The same visual states
  (`--start-cap`/`--end-cap`/`--in-range`) render a *committed* range
  identically, just without the preview's lighter fill.
- Keyboard: identical navigation to `DatePicker`
  (arrows/Home/End/PageUp/PageDown/Shift+PageUp/PageDown to move
  focus), and `Enter`/`Space` do exactly what a click on the focused
  day would — pick a start, then an end. No separate modifier-key
  mechanic; see `AUDIT.md` for why.
- A visually-hidden, `aria-live="polite"` region announces the
  in-progress state ("start picked, choose an end") and, right up
  until the panel closes, the completed range — `DatePicker` itself
  doesn't need this (a single click is atomic), but a two-step
  selection benefits from confirming what's been picked so far.
- `Escape` and an outside click close the panel without completing or
  changing the value.
- Same grid conventions as `DatePicker`: no adjacent-month days shown,
  wholly-blank trailing weeks trimmed (but kept level between the two
  visible months), month/year `<select>`s on the first visible month
  only.

## Why a separate component, not a `range` mode on `DatePicker`

`DatePicker` is already the heaviest, most keyboard-complex component
in this library. Bolting a second selection model onto it would mean
every input, every rendering branch, and every existing test gains an
implicit "…and in range mode?" question — for a shape of value
(`DateRangeValue`) and an interaction (two-step, hover-preview) that
share almost nothing with `DatePicker`'s own `Date | null`/single-click
model beyond the calendar grid underneath. Keeping them separate
components keeps both single-purpose and both testable in isolation;
the actual duplication this creates is small, and confined to pure
date math (`date-picker-calendar.ts`), which `DateRangePicker` imports
and reuses as-is rather than forking.

## Scope

No `min`/`max` bounds, no minimum/maximum range length — left out for
the same reason `DatePicker` leaves out `min`/`max`: nothing in the
current use cases needs them yet.
