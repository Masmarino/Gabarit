# ChartEmpty

A chart's empty state — a dataviz-base building block, placed inside a
`gbt-chart-frame` in place of the chart when there's nothing to plot.

**Selector**: `gbt-chart-empty`

## Inputs

| Input         | Type     | Default  | Role                                    |
| ------------- | -------- | -------- | --------------------------------------- |
| `message`     | `string` | required | Message shown.                          |
| `actionLabel` | `string` | `''`     | Label of an action button, if provided. |

## Outputs

| Output   | Type   | Role                                                             |
| -------- | ------ | ---------------------------------------------------------------- |
| `action` | `void` | Emitted on click of the action button (`actionLabel` non-empty). |

## Optional icon

Project an `[gbtChartEmptyIcon]`-attributed SVG to show a small,
chart-specific illustration above the message — omit it entirely for
a text-only empty state (the icon wrapper collapses to nothing when
empty). Distinct from `EmptyState`'s own fixed illustration set: here
each consuming chart supplies its own icon, since `ChartEmpty` doesn't
know in advance which chart shape (pie, bars, a timeline…) is relevant.

## Example

```html
<gbt-chart-empty message="Aucune donnée pour cette période" />

<gbt-chart-empty message="Aucune donnée">
  <svg gbtChartEmptyIcon viewBox="0 0 96 96">...</svg>
</gbt-chart-empty>
```
