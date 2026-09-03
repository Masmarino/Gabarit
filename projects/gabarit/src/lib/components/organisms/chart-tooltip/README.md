# ChartTooltip

A chart's tooltip — a dataviz-base building block, placed inside a
`gbt-chart-frame`. Opened and positioned by the base itself, on the
active point of the shared pointer/keyboard signal.

**Selector**: `gbt-chart-tooltip`

## Inputs

| Input    | Type                | Role                                                                                                |
| -------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `points` | `TooltipPoint<X>[]` | Required. `{ x, header, rows }[]` — one point per x-value; `rows` is `{ label, value, series? }[]`. |

## Example

```html
<gbt-chart-tooltip
  [points]="[{ x: 0, header: 'Lundi', rows: [{ label: 'Requêtes', value: '12', series: 1 }] }]"
/>
```
