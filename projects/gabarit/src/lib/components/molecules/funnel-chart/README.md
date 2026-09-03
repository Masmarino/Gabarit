# FunnelChart

Step-by-step conversion funnel.

**Selector**: `gbt-funnel-chart`

Standalone, outside the dataviz base — has its own hover behavior, with
the same keyboard/pointer parity, and its own visually-hidden
`gbt-chart-table`.

## Inputs

| Input              | Type                                            | Role                                                                                                                                                            |
| ------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `steps`            | `FunnelStep[]`                                  | Required. `{ label, value }` — the steps, in order.                                                                                                             |
| `label`            | `string`                                        | Required. Accessible name of the chart.                                                                                                                         |
| `locale`           | `string`                                        | Required. Locale used to format numbers.                                                                                                                        |
| `emptyMessage`     | `string`                                        | Required. Message shown when `steps` is empty.                                                                                                                  |
| `tableCaption`     | `string`                                        | Required. Caption of the `sr-only` table.                                                                                                                       |
| `stepColumn`       | `string`                                        | Required. Header of that table's step column.                                                                                                                   |
| `valueColumn`      | `string`                                        | Required. Header of that table's value column.                                                                                                                  |
| `conversionColumn` | `string`                                        | Required. Header of that table's conversion column.                                                                                                             |
| `stepAnnouncement` | `(label: string, conversion: string) => string` | Required. Builds the wording of the announcement region (hover/focus on a step) from the label and the **already formatted** conversion from the previous step. |

## Example

```html
<gbt-funnel-chart
  [steps]="[{ label: 'Visite', value: 1000 }, { label: 'Inscription', value: 320 }]"
  label="Tunnel d'inscription"
  locale="fr-FR"
  emptyMessage="Aucune donnée"
  tableCaption="Détail du tunnel d'inscription"
  stepColumn="Étape"
  valueColumn="Valeur"
  conversionColumn="Conversion"
  [stepAnnouncement]="(label, conversion) => label + ', ' + conversion"
/>
```
