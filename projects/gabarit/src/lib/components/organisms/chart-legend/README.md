# ChartLegend

Legend for a multi-series chart — a dataviz-base building block.

**Selector**: `gbt-chart-legend`

## Inputs

| Input          | Type                | Default | Role                                                                                                                              |
| --------------- | --------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `entries`      | `LegendEntry[]`      | required  | `{ label, pattern?, color?, value? }[]` — one entry per series. `value` is updated on hovering the chart.                             |
| `interactive`  | `boolean`            | `false`   | Makes each entry focusable/hoverable, emitting `activeIndexChange` — opt-in so existing static legends (`BarChart`, `LineChart`) keep their current, non-interactive behavior. |
| `activeIndex`  | `number \| null`      | `null`    | The entry to highlight, typically the chart's own hovered/focused data point — only meaningful with `interactive`.                  |

## Output

| Output              | Type              | Role                                                             |
| -------------------- | ------------------- | ------------------------------------------------------------------- |
| `activeIndexChange` | `number \| null`   | Emitted on hover/focus/blur/leave of an entry, only if `interactive`. |

## Swatches

An entry with `pattern` (`'solid' | 'dashed' | 'dotted'`) gets a
dashed-line swatch — for a line/area series, where the pattern is the
non-color differentiator (RGAA 3.1). An entry with `color` instead
gets a filled swatch — for categories with no line to draw, like
`PieChart`'s slices.

## Example

```html
<gbt-chart-legend [entries]="[{ label: 'Requêtes', pattern: 'solid' }]" />

<!-- synced with the chart's own hovered/focused point -->
<gbt-chart-legend
  [entries]="entries()"
  interactive
  [activeIndex]="activeIndex()"
  (activeIndexChange)="activeIndex.set($event)"
/>
```
