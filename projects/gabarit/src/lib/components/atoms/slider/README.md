# Slider

A numeric value picked by dragging — a styled native
`<input type="range">`, integrated with Angular forms via
`ControlValueAccessor`, like `Select`.

**Selector**: `gbt-slider`

## Inputs

| Input         | Type                          | Default                | Role                                                    |
| -------------- | ------------------------------ | ------------------------- | ----------------------------------------------------------- |
| `label`       | `string`                       | required                  | Field label — also the accessible name of the range input. |
| `min`/`max`   | `number`                       | `0` / `100`                | Bounds.                                                      |
| `step`        | `number`                       | `1`                         | Increment.                                                   |
| `disabled`    | `boolean`                      | `false`                     | —                                                             |
| `errorMessage`| `string \| null`                | `null`                       | Rendered as `role="alert"` below the slider.                 |
| `showValue`   | `boolean`                      | `true`                       | Shows the current value next to the label.                   |
| `formatValue` | `(value: number) => string`    | `(v) => \`${v}\``            | Formats the displayed value (e.g. `€`, `%`).                  |

## Example

```html
<gbt-slider label="Budget" [min]="0" [max]="1000" [step]="50" [formatValue]="formatEuros" [formControl]="budget" />
```

## Behavior

- Built on a native `<input type="range">`, not a custom
  `role="slider"` widget — keyboard operability (arrows, Home/End,
  Page Up/Down) and screen reader support come from the browser for
  free, at the cost of styling it (done here via
  `::-webkit-slider-thumb`/`::-moz-range-thumb` and friends) rather
  than building a widget from scratch.
- `label` is required: a slider with no accessible name is
  meaningless to a screen reader, and there's no universal generic
  default text a value-picker could fall back to (unlike `Spinner`'s
  `'Loading…'`).

## Scope

Single value only. A two-handle range slider (min/max) was
deliberately left for a separate iteration if a real use case comes
up, the same reasoning `DatePicker` applied to a date-range picker.
