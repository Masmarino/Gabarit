# DatePicker

Single-date selection — a trigger button showing the chosen date, and
a calendar grid dropdown, positioned like `Select`/`Menu`. Integrates
with Angular forms via `ControlValueAccessor`, like `Select` and
`Textarea`.

**Selector**: `gbt-date-picker`

## Inputs

| Input                | Type                | Default              | Role                                                              |
| --------------------- | -------------------- | ---------------------- | -------------------------------------------------------------------- |
| `label`              | `string`            | `''`                  | Field label.                                                       |
| `placeholder`        | `string`            | `'Select a date…'`    | Shown in the trigger when no date is selected.                     |
| `locale`             | `string`            | `'en-US'`             | Passed to `Intl.DateTimeFormat` for the trigger's date, the month/year heading, and weekday names. |
| `weekStartsOn`       | `0 \| 1`             | `1` (Monday)          | `0` for a Sunday-first week.                                        |
| `disabled`           | `boolean`           | `false`                | —                                                                    |
| `required`           | `boolean`           | `false`                | Appends `*` to the label.                                          |
| `errorMessage`       | `string \| null`     | `null`                | Rendered as `role="alert"` below the field.                        |
| `previousMonthLabel` | `string`            | `'Previous month'`    | Accessible name of the "go back a month" button.                   |
| `nextMonthLabel`     | `string`            | `'Next month'`        | Accessible name of the "go forward a month" button.                |
| `clearable`          | `boolean`           | `false`                | Shows a clear button in place of the calendar icon once a date is selected. |
| `clearLabel`         | `string`            | `'Clear date'`         | Accessible name of the clear button.                                |
| `visibleMonths`      | `1 \| 2`             | `1`                     | Shows one or two consecutive months side by side.                   |
| `monthSelectLabel`   | `string`            | `'Month'`               | Accessible name of the month dropdown.                              |
| `yearSelectLabel`    | `string`            | `'Year'`                | Accessible name of the year dropdown.                               |
| `minYear`/`maxYear`  | `number`            | current year ∓ 100/+10  | Bounds the year dropdown's options.                                 |

## Example

```html
<gbt-date-picker label="Appointment date" [formControl]="date" />
```

## Behavior

- The trigger is a plain button showing the formatted date (or the
  placeholder) — not an editable text field. Typing a date string
  would need locale-aware parsing this component doesn't attempt; the
  calendar is the only way to set a value.
- Keyboard, inside the open grid: `ArrowLeft`/`Right`/`Up`/`Down` move
  focus by a day/week, rolling into the next or previous month at the
  edges; `Home`/`End` jump to the start/end of the focused week;
  `PageUp`/`PageDown` shift the view a month; `Shift+PageUp`/`PageDown`
  shift a year; `Enter`/`Space` select the focused day. This matches
  the WAI-ARIA "Date Picker Dialog" pattern.
- Clicking a leading/trailing day from an adjacent month (shown dimmed)
  selects it and shifts the view to that month.
- `Escape` and an outside click close the panel without changing the
  value; `Escape` also returns focus to the trigger.
- With `clearable`, a clear button replaces the calendar icon once a
  date is selected — same position, so nothing shifts. It's a separate
  button next to the trigger, not inside it (a `<button>` can't
  contain another interactive element), overlapping the trigger's icon
  slot visually. Hidden while `disabled`.
- The previous/next buttons sit on their own full-width row above the
  calendar(s), one at each outer edge — not tied to either month's own
  heading. With `visibleMonths="2"`, they move both visible months
  together (the second is always the first's next month — the two
  aren't independently navigable). Arrowing past the last day of the
  first visible month moves focus into the second (already visible)
  month without shifting the view; only arrowing past the *last*
  visible month, or before the first, slides the view by one month.
- The first visible month's heading is two native `<select>` dropdowns
  (month, year) for jumping directly anywhere, instead of plain text —
  reused as-is rather than nesting the library's own `Select` (a
  floating-panel component) inside this panel's own floating panel,
  which would multiply the positioning/z-index/outside-click concerns
  for no real benefit here. A second visible month (with
  `visibleMonths="2"`) keeps a plain-text heading, sized to match the
  selects' height exactly so both calendars stay aligned.

## Scope

Single date only. A range picker (start/end) is a separate, larger
feature — deliberately left out of this component rather than
half-built in, per the issue's own recommendation. `min`/`max` date
bounds (disabling out-of-range days) were also left out: nothing in
the current use cases needed them, and they're a straightforward
addition later if one does.

No date library (day.js, date-fns) is used — calendar math (month
grid, leap years) is hand-rolled in `date-picker-calendar.ts` on top of
native `Date`/`Intl`, consistent with the rest of this library having
no such dependency.
