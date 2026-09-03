# ChartFrame

The dataviz base — measures its container, computes geometry and
scales, carries the tooltip's keyboard navigation. Reserved for anyone
assembling a chart that Gabarit doesn't provide; an ordinary consumer
uses `gbt-line-chart`, `gbt-bar-chart`, or `gbt-timeline-chart`, never
`gbt-chart-frame` directly.

**Selector**: `gbt-chart-frame`

A custom building block reads the base's geometry and scales via
`inject(CHART_CONTEXT)` — a read-only token.

## Inputs

| Input          | Type                                        | Default  | Role                                                                                                                                                        |
| -------------- | ------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`        | `string`                                    | required | Accessible name of the chart.                                                                                                                               |
| `heading`      | `string`                                    | `''`     | Block title. Empty by default.                                                                                                                              |
| `headingLevel` | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                | `2`      | Level of the rendered heading.                                                                                                                              |
| `headline`     | `string`                                    | `''`     | Current value, already formatted.                                                                                                                           |
| `trend`        | `string`                                    | `''`     | Change over the period, already formatted.                                                                                                                  |
| `x`            | `AxisSpec`                                  | required | `{ kind: 'linear' \| 'time' \| 'band', domain }` — the x-axis.                                                                                              |
| `y`            | `LinearAxisSpec`                            | required | `{ kind: 'linear', domain: [number, number] }` — the y-axis.                                                                                                |
| `margin`       | `Partial<ChartMargin>`                      | `{}`     | `{ top, right, bottom, left }` — replaces the default margin, side by side.                                                                                 |
| `size`         | `{ width: number; height: number } \| null` | `null`   | Explicit dimensions — reserved for server rendering, tests.                                                                                                 |
| `pointValues`  | `PointValue[]`                              | `[]`     | Navigable x-values, **within their domain**, **sorted in ascending order of the domain** — the base looks up the point under the pointer via binary search. |

## Outputs

| Output              | Type             | Role                                                                       |
| ------------------- | ---------------- | -------------------------------------------------------------------------- |
| `activeIndexChange` | `number \| null` | Emitted on every change of the active index (hover, keyboard, focus loss). |

## Projected content

| Selector            | Role                                                    |
| ------------------- | ------------------------------------------------------- |
| `[gbtChartLayer]`   | The building block(s) that draw the series (`<svg:g>`). |
| `gbt-chart-tooltip` | The tooltip, if the chart has one.                      |
| `gbt-chart-empty`   | The empty state, shown in place of the chart if needed. |
| `gbt-chart-table`   | The `sr-only` table, the chart's non-visual path.       |

**SVG tags projected into `[gbtChartLayer]` are written with the `svg:`
prefix** — `<svg:g>`, `<svg:path>`. Angular resolves the SVG namespace
lexically, template by template: `gbt-chart-frame`'s `<svg>` living in a
different file than yours, a bare `<g>` fails to compile with `NG8001`.

**A building block meant to live in `[gbtChartLayer]` carries an
attribute selector on a `g`**, never an element selector — a custom
element would inherit the SVG namespace, where it would be unknown.

## Constraints on `x`

- **Its bounds must be ticks.** `gbt-chart-axis` ticks via `niceTicks`,
  which extends the domain to round values; if `x` projects a raw
  domain, the outermost tick falls outside the frame — 78px past the
  right edge on a domain from 0 to 63, measured.
- **The `y` domain must contain zero** for a bar chart, otherwise the
  baseline projects outside the usable box and the bars cross the axis.

`niceXDomain` and `niceYDomain` are exported to compute these bounds:

```typescript
const x = { kind: 'linear', domain: niceXDomain(series, 5) }
const y = { kind: 'linear', domain: niceYDomain(series, true, 5) }
```

The third argument of each is the target number of ticks: pass the same
value to `gbt-chart-axis` via its `tickCount` input, otherwise the two
computations diverge.

## Sizing

**Under server rendering, pass `[size]` explicitly**: without a layout
engine, the base can't measure and would render no SVG.

**Fluid width with a chosen height** — the common case — is achieved by
setting the height in CSS on a wrapping container, and **without**
passing `[size]`:

```css
.my-container {
  height: 18rem;
}
```

```html
<div class="my-container">
  <gbt-line-chart ... />
</div>
```

The height is set on the wrapping container, **not on the chart
itself**: `gbt-line-chart` already carries `height: 100%` on its own
host to pass this height down to the `gbt-chart-frame` it wraps — a
rule set directly on `gbt-line-chart` from the outside would lose to it
on specificity and have no effect.

`ResizeObserver` then reports both dimensions and the chart follows its
container's width. `[size]` disables measurement: reserve it for server
rendering, tests, and cases where you already know both dimensions.

## Hover and keyboard

The pointer and the keyboard write into **the same signal**, the base's
active index: a mouse move and an arrow key produce exactly the same
state — vertical marker, dots on the active point, tooltip, and the
hovered point's value in the legend. `Escape` closes the tooltip,
whether it was opened by mouse or keyboard, and so does losing focus.
Moving the mouse off the chart **does not clear** the state a user just
established with the arrow keys on a focused surface: the keyboard
takes priority.

`ChartPoint.display` and `LegendEntry.value` carry a point's value
**already formatted**, used by the tooltip and the non-visual table; by
default, both fall back to the numeric value formatted with the locale
passed to the chart.
