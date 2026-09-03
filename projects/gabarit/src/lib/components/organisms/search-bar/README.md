# SearchBar

Search field with grouped or flat results, keyboard navigation, and a
blurred backdrop over the rest of the page while searching.

**Selector**: `gbt-search-bar`

Up/down arrows to move through results, Enter to select, Escape to
close. The trigger and the results panel stay sharp above the backdrop;
the rest of the page blurs behind it.

## Inputs

| Input                 | Type                                | Default                        | Role                                                                 |
| --------------------- | ----------------------------------- | ------------------------------ | -------------------------------------------------------------------- |
| `id`                  | `string`                            | generated (`gbt-search-bar-N`) | Prefix of the generated DOM ids.                                     |
| `results`             | `T[] \| null`                       | `null`                         | Flat results — an alternative to `groupedResults`.                   |
| `groupedResults`      | `SearchResultCategory<T>[] \| null` | `null`                         | Results grouped by category — `{ label, icon?, items }`.             |
| `placeholder`         | `string`                            | `'Search…'`                    | Field placeholder text.                                              |
| `ariaLabel`           | `string`                            | `''`                           | Accessible name of the field, when the placeholder isn't enough.     |
| `displayFn`           | `(item: T) => string`               | `String(item)`                 | Formats a result into displayed text.                                |
| `itemTemplate`        | `TemplateRef<unknown>`              | —                              | Custom template for rendering a result.                              |
| `keepQueryOnSelect`   | `boolean`                           | `false`                        | Keeps the chosen result's text in the field, instead of clearing it. |
| `noResultsMessage`    | `string`                            | `'No results'`                 | Message when there are no results.                                   |
| `noResultsHint`       | `string`                            | `'Try a different search.'`    | Subtext under the "no results" message.                              |
| `clearLabel`          | `string`                            | `'Clear search'`               | Accessible name of the clear button.                                 |
| `resultsAnnouncement` | `(count: number) => string`         | `` `${count} result(s)` ``     | Live ARIA announcement of the result count.                          |
| `navigateHint`        | `string`                            | `'Navigate'`                   | Footer text, keyboard hint.                                          |
| `selectHint`          | `string`                            | `'Select'`                     | Footer text, keyboard hint.                                          |
| `closeHint`           | `string`                            | `'Close'`                      | Footer text, keyboard hint.                                          |

## Outputs

| Output         | Type     | Role                                  |
| -------------- | -------- | ------------------------------------- |
| `queryChange`  | `string` | Emitted on every keystroke.           |
| `itemSelected` | `T`      | Emitted when a result is selected.    |
| `clear`        | `void`   | Emitted on click of the clear button. |

## Example

```html
<gbt-search-bar
  [groupedResults]="categories"
  [displayFn]="(depot) => depot.nom"
  ariaLabel="Rechercher un dépôt"
  placeholder="Rechercher…"
  (itemSelected)="ouvrir($event)"
/>
```
