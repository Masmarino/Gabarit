# GaugeBar

Progress gauge with alert thresholds — standalone, outside the dataviz
base (no tooltip, no keyboard navigation).

**Selector**: `gbt-gauge-bar`

## Inputs

| Input            | Type                                    | Default                         | Role                                                       |
| ---------------- | --------------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| `value`          | `number`                                | required                        | Current value.                                             |
| `max`            | `number`                                | required                        | Maximum value.                                             |
| `label`          | `string`                                | required                        | Accessible name of the gauge (`role="progressbar"`).       |
| `formattedValue` | `string`                                | required                        | Displayed value, **already formatted** — "62 GB / 100 GB". |
| `warningLabel`   | `string`                                | required                        | Label announced at the warning threshold.                  |
| `criticalLabel`  | `string`                                | required                        | Label announced at the critical threshold.                 |
| `thresholds`     | `{ warning: number; critical: number }` | `{ warning: 70, critical: 90 }` | Thresholds as a percentage of `max`.                       |

`GaugeBar` accepts no formatting function: `formattedValue`,
`warningLabel`, and `criticalLabel` are strings already ready to
display — Gabarit ships no translation mechanism.

## Example

```html
<gbt-gauge-bar
  [value]="257"
  [max]="500"
  label="Quota du registre Docker"
  formattedValue="257 Gio / 500 Gio"
  warningLabel="Avertissement"
  criticalLabel="Critique"
/>
```
