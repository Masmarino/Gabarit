# ChartTable

Visually-hidden table — the main non-visual path of any chart, since an
SVG is invisible to a screen reader. A dataviz-base building block,
independent of `gbt-chart-frame`.

**Selector**: `gbt-chart-table`

## Inputs

| Input     | Type                     | Role                      |
| --------- | ------------------------ | ------------------------- |
| `caption` | `string`                 | Required. Table caption.  |
| `columns` | `string[]`               | Required. Column headers. |
| `rows`    | `(string \| number)[][]` | Required. Data rows.      |

## Example

```html
<gbt-chart-table
  caption="Détail des requêtes par jour"
  [columns]="['Jour', 'Requêtes']"
  [rows]="[['Lun', 12], ['Mar', 40]]"
/>
```
