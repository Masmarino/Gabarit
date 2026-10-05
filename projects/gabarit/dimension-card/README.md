# DimensionCard

Dimension table, with the hovered row accented — a decorative accent
only, everything it highlights is already in the visible table; its rows
are therefore not focusable.

**Selector**: `gbt-dimension-card`

Standalone, outside the dataviz base: no tooltip, no keyboard
navigation, no separate `sr-only` table — `gbt-dimension-card` **is**
already a real, visible table.

## Inputs

| Input          | Type             | Role                                          |
| -------------- | ---------------- | --------------------------------------------- |
| `rows`         | `DimensionRow[]` | Required. `{ label, value, display? }` rows.  |
| `caption`      | `string`         | Required. Table caption.                      |
| `labelColumn`  | `string`         | Required. Header of the label column.         |
| `valueColumn`  | `string`         | Required. Header of the value column.         |
| `emptyMessage` | `string`         | Required. Message shown when `rows` is empty. |
| `locale`       | `string`         | Required. Locale used to format numbers.      |

A row's `display` replaces the formatted number in the value column, for
values a locale-aware number format can't express — bytes, durations, a
currency. The bar still scales on `value`, so the comparison stays honest.

## Example

```html
<gbt-dimension-card
  [rows]="[{ label: 'Europe', value: 4200 }, { label: 'Amériques', value: 3100 }]"
  caption="Requêtes par région"
  labelColumn="Région"
  valueColumn="Requêtes"
  emptyMessage="Aucune donnée"
  locale="fr-FR"
/>
```
