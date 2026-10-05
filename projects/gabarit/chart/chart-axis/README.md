# ChartAxis

An axis's ticks — a dataviz-base building block, placed inside a
`gbt-chart-frame`'s `[gbtChartLayer]`.

**Selector**: `g[gbtChartAxis]` (an attribute selector on a `g`, not an
element — see [`../chart-frame/README.md`](../chart-frame/README.md)).

## Inputs

| Input       | Type                                 | Default  | Role                                   |
| ----------- | ------------------------------------ | -------- | -------------------------------------- |
| `axis`      | `'x' \| 'y'`                         | required | The axis being ticked.                 |
| `locale`    | `string`                             | required | Locale used to format ticks.           |
| `tickCount` | `number`                             | `5`      | Target number of ticks.                |
| `format`    | `((value: never) => string) \| null` | `null`   | Custom formatting function for a tick. |
| `grid`      | `boolean`                            | `false`  | Extends each tick into a grid line.    |

`tickCount` must match the value passed to `niceXDomain`/`niceYDomain`
upstream, otherwise the two computations diverge.

## Example

```html
<svg:g gbtChartAxis axis="x" locale="fr-FR" [tickCount]="5" />
```
