# TimelineChart

Timeline on the dataviz base — a time series and annotated intervals,
measures its container, reacts to the pointer and keyboard, carries its
own visually-hidden `gbt-chart-table`.

**Selector**: `gbt-timeline-chart`

## Inputs

| Input              | Type                                        | Default  | Role                                                        |
| ------------------ | ------------------------------------------- | -------- | ----------------------------------------------------------- |
| `series`           | `ChartSeries<Date>`                         | required | `{ label, points, pattern? }` — the series, time axis.      |
| `intervals`        | `ChartInterval[]`                           | required | `{ start, end, label }[]` — the annotated intervals.        |
| `locale`           | `string`                                    | required | Locale used to format dates.                                |
| `label`            | `string`                                    | required | Accessible name of the chart.                               |
| `tableCaption`     | `string`                                    | required | Caption of the series' `sr-only` table.                     |
| `intervalsCaption` | `string`                                    | required | Caption of the intervals' `sr-only` table.                  |
| `xColumn`          | `string`                                    | required | Header of the series table's x-axis column.                 |
| `emptyMessage`     | `string`                                    | required | Message shown when the series is empty.                     |
| `yZero`            | `boolean`                                   | `true`   | Forces the y-axis domain to contain zero.                   |
| `yTickCount`       | `number`                                    | `5`      | Target number of ticks on the y-axis.                       |
| `size`             | `{ width: number; height: number } \| null` | `null`   | Explicit dimensions — reserved for server rendering, tests. |
| `heading`          | `string`                                    | `''`     | Block title. Empty by default.                              |
| `headingLevel`     | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                | `2`      | Level of the rendered heading.                              |
| `headline`         | `string`                                    | `''`     | Current value, already formatted.                           |
| `trend`            | `string`                                    | `''`     | Change over the period, already formatted.                  |

**Fluid width with a chosen height** — the common case — is achieved by
setting the height in CSS on the wrapping container, without passing
`[size]`. See [`../chart-frame/README.md`](../chart-frame/README.md) for
the full sizing contract and hover behavior.

## Example

```html
<div style="height: 18rem">
  <gbt-timeline-chart
    [series]="{ label: 'Statut', points: [{ x: new Date('2026-01-01'), y: 1 }] }"
    [intervals]="[{ start: d1, end: d2, label: 'Incident' }]"
    locale="fr-FR"
    label="Chronologie des incidents"
    tableCaption="Détail de la chronologie"
    intervalsCaption="Détail des incidents"
    xColumn="Date"
    emptyMessage="Aucune donnée"
  />
</div>
```
