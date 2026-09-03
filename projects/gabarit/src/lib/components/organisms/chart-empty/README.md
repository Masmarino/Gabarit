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

## Example

```html
<gbt-chart-empty message="Aucune donnée pour cette période" />
```
