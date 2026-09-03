# ChartLegend

Legend for a multi-series chart — a dataviz-base building block.

**Selector**: `gbt-chart-legend`

## Inputs

| Input     | Type            | Role                                                                                                        |
| --------- | --------------- | ----------------------------------------------------------------------------------------------------------- |
| `entries` | `LegendEntry[]` | Required. `{ label, pattern?, value? }[]` — one entry per series. `value` is updated on hovering the chart. |

## Example

```html
<gbt-chart-legend [entries]="[{ label: 'Requêtes', pattern: 'solid' }]" />
```
