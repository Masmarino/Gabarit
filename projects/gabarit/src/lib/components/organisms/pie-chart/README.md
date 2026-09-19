# PieChart

A pie or donut chart for showing how a total splits across categories
— traffic sources, storage by type, budget allocation. One component
covers both shapes: `innerRadiusRatio` at `0` draws a full pie, a
value like `0.6` draws a donut.

Distinct from `BarChart`/`LineChart`/`TimelineChart`: those are
cartesian (an x/y axis, built on `ChartFrame`), while `PieChart` has
no axis at all — it shares that trait with `FunnelChart`, and follows
the same architecture (see "Why not `ChartFrame`" below).

**Selector**: `gbt-pie-chart`

## Inputs

| Input               | Type                                                            | Role                                                                 |
| -------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `slices`            | `{ label: string; value: number }[]`                              | Required. One entry per category.                                     |
| `label`             | `string`                                                          | Required. Accessible name of the chart (`<svg role="group">`).          |
| `locale`            | `string`                                                          | Required. Locale used to format numbers and percentages.                |
| `emptyMessage`      | `string`                                                          | Required. Message shown when `slices` is empty.                         |
| `tableCaption`      | `string`                                                          | Required. Caption of the `sr-only` data table.                          |
| `categoryColumn`    | `string`                                                          | Required. Header of that table's category column.                       |
| `valueColumn`       | `string`                                                          | Required. Header of that table's value column.                          |
| `shareColumn`       | `string`                                                          | Required. Header of that table's share-of-total column.                 |
| `sliceAnnouncement` | `(label: string, value: string, share: string) => string`         | Required. Formats the live-region message for the hovered/focused slice. |
| `innerRadiusRatio`  | `number`                                                          | Optional, defaults to `0`. `0` = pie, e.g. `0.6` = donut.                |

## Example

```html
<gbt-pie-chart
  [slices]="trafficSources"
  label="Répartition du trafic"
  locale="fr-FR"
  emptyMessage="Aucune donnée."
  tableCaption="Répartition du trafic"
  categoryColumn="Source"
  valueColumn="Visites"
  shareColumn="Part"
  [sliceAnnouncement]="sliceAnnouncement"
  [innerRadiusRatio]="0.6"
/>
```

## Behavior

- Each slice's angle is its share of the sum of all `slices` values.
  An all-zero total renders every slice at 0% rather than dividing by
  zero.
- A slice's percentage is written directly next to it only once it
  reaches 15% of the total — below that, the number on the slice would
  overlap its neighbors. Every slice's exact share is always available
  in the legend and in the `sr-only` table regardless of this
  threshold.
- Hovering or focusing a slice highlights it **and** its matching
  legend entry at the same time, in both directions — hovering the
  legend entry highlights the slice too. One shared `activeIndex`
  drives both.
- Up to 6 slices get a distinguishable color from `--chart-series-1`
  through `--chart-series-6`; beyond that the palette cycles and a
  console warning is logged in dev mode, the same convention
  `LineChart` uses for its own `MAX_SERIES`.
- The empty state (`ChartEmpty`) gets a small pie icon — a circle with
  one filled wedge, not a chart-agnostic placeholder — via
  `ChartEmpty`'s `[gbtChartEmptyIcon]` projection slot.

## Why not `ChartFrame`

The shared cartesian base (`ChartFrame`, `ChartContext`, `ChartAxis`,
`ChartTooltip`) computes everything — scales, tick positions, the
active point's pixel offset — from an x/y axis. A pie chart has
neither: its geometry is angles around a center, not positions along
axes. Forcing it through that base would mean fighting types built for
a different geometry rather than reusing anything real, so `PieChart`
instead follows the one existing precedent for a categorical,
axis-less chart in this library, `FunnelChart`: no `ChartFrame`, a
locally-owned `activeIndex` signal, and a hand-rolled `aria-live`
announcement, reusing only the genuinely generic building blocks
(`ChartEmpty`, `ChartTable`, and now `ChartLegend`).

## Accessibility

See `AUDIT.md` for the full RGAA checklist.
