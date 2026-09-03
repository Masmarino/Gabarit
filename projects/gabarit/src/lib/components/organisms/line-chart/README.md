# LineChart

Line(s) on the dataviz base — measures its container, reacts to the
pointer and keyboard, carries its own visually-hidden
`gbt-chart-table`.

**Selector**: `gbt-line-chart`

## Inputs

| Input          | Type                                        | Default  | Role                                                        |
| -------------- | ------------------------------------------- | -------- | ----------------------------------------------------------- |
| `series`       | `ChartSeries<X>[]`                          | required | `{ label, points, pattern? }[]` — one or more series.       |
| `xKind`        | `'linear' \| 'time'`                        | required | Nature of the x-axis.                                       |
| `locale`       | `string`                                    | required | Locale used to format numbers and dates.                    |
| `label`        | `string`                                    | required | Accessible name of the chart.                               |
| `tableCaption` | `string`                                    | required | Caption of the `sr-only` table.                             |
| `xColumn`      | `string`                                    | required | Header of that table's x-axis column.                       |
| `emptyMessage` | `string`                                    | required | Message shown when the series are empty.                    |
| `area`         | `boolean`                                   | `false`  | Fills the area under the line.                              |
| `yZero`        | `boolean`                                   | `true`   | Forces the y-axis domain to contain zero.                   |
| `yTickCount`   | `number`                                    | `5`      | Target number of ticks on the y-axis.                       |
| `xTickCount`   | `number`                                    | `5`      | Target number of ticks on the x-axis.                       |
| `size`         | `{ width: number; height: number } \| null` | `null`   | Explicit dimensions — reserved for server rendering, tests. |
| `heading`      | `string`                                    | `''`     | Block title. Empty by default.                              |
| `headingLevel` | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                | `2`      | Level of the rendered heading.                              |
| `headline`     | `string`                                    | `''`     | Current value, already formatted.                           |
| `trend`        | `string`                                    | `''`     | Change over the period, already formatted.                  |

`x` is a number on a linear axis, a `Date` on a time axis — `xKind`
must match the actual type of `series`' `x` values.

**Fluid width with a chosen height** — the common case — is achieved by
setting the height in CSS on the wrapping container, without passing
`[size]`. See [`../chart-frame/README.md`](../chart-frame/README.md) for
the full sizing contract and hover behavior.

## Example

```html
<div style="height: 18rem">
  <gbt-line-chart
    [series]="[{ label: 'Requêtes', points: [{ x: 0, y: 12 }, { x: 1, y: 40 }] }]"
    xKind="linear"
    locale="fr-FR"
    label="Requêtes"
    tableCaption="Détail des requêtes"
    xColumn="Jour"
    emptyMessage="Aucune donnée"
  />
</div>
```
