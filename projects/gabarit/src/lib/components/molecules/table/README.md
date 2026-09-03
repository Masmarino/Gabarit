# Table

Data table with optional clickable rows.

**Selector**: `gbt-table`

## Inputs

| Input           | Type                            | Default     | Role                                               |
| --------------- | ------------------------------- | ----------- | -------------------------------------------------- |
| `data`          | `T[]`                           | required    | The rows.                                          |
| `columns`       | `TableColumn<T>[]`              | required    | `{ key, label, format? }` — the columns, in order. |
| `trackBy`       | `((row: T) => unknown) \| null` | `null`      | Row tracking function.                             |
| `emptyMessage`  | `string`                        | `'No data'` | Message shown when `data` is empty.                |
| `caption`       | `string`                        | required    | Table caption.                                     |
| `clickableRows` | `boolean`                       | `false`     | Makes rows focusable and keyboard-activatable.     |

## Outputs

| Output     | Type | Role                                                                     |
| ---------- | ---- | ------------------------------------------------------------------------ |
| `rowClick` | `T`  | Emitted on click or keyboard activation of a row (`clickableRows` only). |

## Example

```html
<gbt-table
  caption="Dépôts"
  [data]="depots"
  [columns]="[{ key: 'nom', label: 'Nom' }, { key: 'taille', label: 'Taille' }]"
/>
```
