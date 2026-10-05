# Sparkline

Fixed-size trend mini-chart — built to live in a table cell, where a
`ResizeObserver` per row would be expensive for a width the caller
already knows.

**Selector**: `gbt-sparkline`

Standalone, outside the dataviz base — no tooltip or keyboard
navigation in the base's sense, but **focusable** and given an
accessible name, with its own visually-hidden `gbt-chart-table`.

## Inputs

| Input          | Type       | Default  | Role                                        |
| -------------- | ---------- | -------- | ------------------------------------------- |
| `values`       | `number[]` | required | Series values, in order.                    |
| `tableCaption` | `string`   | required | Caption of the component's `sr-only` table. |
| `xColumn`      | `string`   | required | Header of that table's x-axis column.       |
| `yColumn`      | `string`   | required | Header of that table's value column.        |
| `locale`       | `string`   | required | Locale used to format numbers.              |
| `emptyMessage` | `string`   | required | Message shown when `values` is empty.       |
| `width`        | `number`   | `80`     | Width in pixels.                            |
| `height`       | `number`   | `24`     | Height in pixels.                           |

## Example

```html
<gbt-sparkline
  [values]="[12, 18, 9, 24, 30]"
  tableCaption="Requêtes des 7 derniers jours"
  xColumn="Jour"
  yColumn="Requêtes"
  locale="fr-FR"
  emptyMessage="Aucune donnée"
/>
```
