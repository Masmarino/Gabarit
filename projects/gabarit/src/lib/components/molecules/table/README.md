# Table

Data table with optional clickable rows.

**Selector**: `gbt-table`

## Inputs

| Input           | Type                            | Default     | Role                                               |
| --------------- | ------------------------------- | ----------- | -------------------------------------------------- |
| `data`          | `T[]`                           | required    | The rows.                                          |
| `columns`       | `TableColumn<T>[]`              | required    | `{ key, label, format?, cellTemplate? }` — the columns, in order. |
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

## Rich cell content: `cellTemplate`

A column's `format`/`key` can only ever produce plain text — there is
no way to put a link, a `Badge`, or a `Menu` in a cell through them.
`cellTemplate` renders a `TemplateRef` instead, with the row projected
as the template's `$implicit` context (the same escape hatch
`DescriptionList` offers for a value, adapted here to run once per
row):

```html
<ng-template #actionsCell let-repo>
  <gbt-menu label="Actions" triggerIcon="ellipsis-vertical">
    <button role="menuitem" class="gbt-menu__item" type="button" (click)="delete(repo)">Supprimer</button>
  </gbt-menu>
</ng-template>

<gbt-table
  caption="Dépôts"
  [data]="depots"
  [columns]="[
    { key: 'nom', label: 'Nom' },
    { key: 'actions', label: 'Actions', cellTemplate: actionsCell },
  ]"
/>
```

`key` still identifies the column (for `@for` tracking) even on a
template-only column — it doesn't have to name a real property of `T`,
a synthetic name like `'actions'` is fine since `format`/`row[key]` is
never reached for that column.

A `cellTemplate` cell is the consumer's own content, so its
accessibility is the consumer's responsibility — same delegation
`Table` already applies to `format`'s plain text, extended to richer
markup. An interactive element inside a `cellTemplate` (a link, a
`Menu` trigger) works normally with `Tab`/`Enter` since it's ordinary
projected DOM inside a `<td>`, nothing about `Table` intercepts it —
but don't also set `clickableRows` on that table: a click on the
projected interactive element would bubble up and fire `rowClick` too,
which is generally not what's wanted when a cell already has its own
interactive content.
