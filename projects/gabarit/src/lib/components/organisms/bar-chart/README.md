# BarChart

Bar chart on the dataviz base — measures its container, reacts to the
pointer and keyboard, carries its own visually-hidden
`gbt-chart-table`.

**Selector**: `gbt-bar-chart`

## Inputs

| Input          | Type                                        | Default  | Role                                                             |
| -------------- | ------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `series`       | `ChartSeries<string>`                       | required | `{ label, points, pattern? }` — a series, category axis.         |
| `locale`       | `string`                                    | required | Locale used to format numbers.                                   |
| `label`        | `string`                                    | required | Accessible name of the chart.                                    |
| `tableCaption` | `string`                                    | required | Caption of the `sr-only` table.                                  |
| `xColumn`      | `string`                                    | required | Header of that table's x-axis column.                            |
| `emptyMessage` | `string`                                    | required | Message shown when the series is empty.                          |
| `yTickCount`   | `number`                                    | `5`      | Target number of ticks on the y-axis.                            |
| `size`         | `{ width: number; height: number } \| null` | `null`   | Explicit dimensions — reserved for server rendering, tests.      |
| `heading`      | `string`                                    | `''`     | Block title. Empty by default: no header is rendered without it. |
| `headingLevel` | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                | `2`      | Level of the rendered heading.                                   |
| `headline`     | `string`                                    | `''`     | Current value, already formatted — "360 GiB".                    |
| `trend`        | `string`                                    | `''`     | Change over the period, already formatted.                       |

**Fluid width with a chosen height** — the common case — is achieved by
setting the height in CSS on the wrapping container, without passing
`[size]`. See [`../chart-frame/README.md`](../chart-frame/README.md) for
the full sizing contract and hover behavior.

## Example

```html
<div style="height: 18rem">
  <gbt-bar-chart
    [series]="{ label: 'Requêtes', points: [{ x: 'Lun', y: 12 }, { x: 'Mar', y: 40 }] }"
    locale="fr-FR"
    label="Requêtes par jour"
    tableCaption="Détail des requêtes par jour"
    xColumn="Jour"
    emptyMessage="Aucune donnée"
  />
</div>
```
