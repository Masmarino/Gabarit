# ListToolbar

Search + sort controls for a local list or grid — a text filter, a
sort-field selector, and a direction toggle. Purely a set of controls:
it never filters or sorts anything itself, and takes no `data` input.

**Selector**: `gbt-list-toolbar`

## Inputs

| Input               | Type                        | Default                    | Role                                    |
| -------------------- | --------------------------- | --------------------------- | ---------------------------------------- |
| `searchValue`        | `string`                    | `''`                        | Current search text (controlled).       |
| `searchLabel`        | `string`                    | —                            | Required. Visible label for the search field. |
| `searchPlaceholder`  | `string`                    | `''`                        | Placeholder for the search field.       |
| `sortOptions`        | `ListToolbarSortOption<T>[]`| —                            | Required. `{ value, label }[]`.         |
| `sortValue`          | `T`                         | —                            | Required. Currently selected sort field.|
| `sortDirection`      | `'asc' \| 'desc'`           | `'asc'`                      | Current sort direction.                 |
| `sortLabel`          | `string`                    | `'Sort by'`                  | Visible label for the sort selector.    |
| `directionLabel`     | `string`                    | `'Reverse sort direction'`   | Accessible name for the direction button.|

## Outputs

| Output                 | Payload            | When                                    |
| ------------------------ | ------------------- | ------------------------------------------ |
| `searchValueChange`      | `string`            | On every keystroke in the search field.   |
| `sortValueChange`        | `T`                 | When a different sort field is selected.  |
| `sortDirectionChange`    | `'asc' \| 'desc'`   | When the direction button is clicked (flips the current direction). |

## Example

```html
<gbt-list-toolbar
  searchLabel="Rechercher un dépôt"
  [searchValue]="search()"
  [sortOptions]="[{ value: 'name', label: 'Nom' }, { value: 'date', label: 'Date' }]"
  [sortValue]="sort()"
  [sortDirection]="direction()"
  (searchValueChange)="search.set($event)"
  (sortValueChange)="sort.set($event)"
  (sortDirectionChange)="direction.set($event)"
/>
```

The consumer owns the actual filtering/sorting, typically as a
`computed()` over its own data driven by these three signals — the
same pattern used throughout consuming apps for local list filtering.
