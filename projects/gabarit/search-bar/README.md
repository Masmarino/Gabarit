# SearchBar

Search field with grouped or flat results, keyboard navigation, and a
blurred backdrop over the rest of the page while searching.

**Selector**: `gbt-search-bar`

Up/down arrows to move through results, Enter to select, Escape to
close. The trigger and the results panel stay sharp above the backdrop;
the rest of the page blurs behind it.

## Inputs

| Input                 | Type                                | Default                        | Role                                                                     |
| --------------------- | ----------------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| `id`                  | `string`                            | generated (`gbt-search-bar-N`) | Prefix of the generated DOM ids.                                         |
| `results`             | `T[] \| null`                       | `null`                         | Flat results — an alternative to `groupedResults`.                       |
| `groupedResults`      | `SearchResultCategory<T>[] \| null` | `null`                         | Results grouped by category — `{ label, icon?, items }`.                 |
| `placeholder`         | `string`                            | `'Search…'`                    | Field placeholder text.                                                  |
| `ariaLabel`           | `string`                            | `''`                           | Accessible name of the field, when the placeholder isn't enough.         |
| `displayFn`           | `(item: T) => string`               | `String(item)`                 | Formats a result into displayed text.                                    |
| `itemTemplate`        | `TemplateRef<unknown>`              | —                              | Custom template for rendering a result.                                  |
| `keepQueryOnSelect`   | `boolean`                           | `false`                        | Keeps the chosen result's text in the field, instead of clearing it.     |
| `noResultsMessage`    | `string`                            | `'No results'`                 | Message when there are no results.                                       |
| `noResultsHint`       | `string`                            | `'Try a different search.'`    | Subtext under the "no results" message.                                  |
| `clearLabel`          | `string`                            | `'Clear search'`               | Accessible name of the clear button.                                     |
| `resultsAnnouncement` | `(count: number) => string`         | `` `${count} result(s)` ``     | Live ARIA announcement of the result count.                              |
| `navigateHint`        | `string`                            | `'Navigate'`                   | Footer text, keyboard hint.                                              |
| `selectHint`          | `string`                            | `'Select'`                     | Footer text, keyboard hint.                                              |
| `closeHint`           | `string`                            | `'Close'`                      | Footer text, keyboard hint.                                              |
| `collapsible`         | `boolean \| 'narrow'`               | `false`                        | Compact mode for a mobile header (see below).                            |
| `expanded`            | `boolean` (model)                   | `false`                        | Whether the field is shown while `collapsible`. Two-way: `[(expanded)]`. |
| `openLabel`           | `string`                            | `'Search'`                     | Accessible name of the compact icon button.                              |
| `closeLabel`          | `string`                            | `'Close search'`               | Accessible name of the compact field's back-arrow close button.          |

## Outputs

| Output         | Type     | Role                                  |
| -------------- | -------- | ------------------------------------- |
| `queryChange`  | `string` | Emitted on every keystroke.           |
| `itemSelected` | `T`      | Emitted when a result is selected.    |
| `clear`        | `void`   | Emitted on click of the clear button. |

## Compact mode (`collapsible`)

For a mobile header where the field cannot stay inline: the field is replaced by an icon button (44 px) that
expands it over the row and focuses it. Off by default: the field is always shown.

- `collapsible` (or `[collapsible]="true"`): always compact.
- `collapsible="narrow"`: compact only up to 768 px, the full field above (pure CSS: nothing to observe).
- `[(expanded)]` lets the header hide its other items (title, account menu) while the search has the row.
- Escape folds the field back (with results open, the first Escape closes them); so does leaving the field while it
  is empty, and choosing a result (unless `keepQueryOnSelect`). Escape returns focus to the icon button.
- The icon button is a native `<button aria-expanded="false" aria-controls>` named by `openLabel`; it is removed
  from the tree while the field is shown.
- While the field is shown, a back-arrow button named by `closeLabel` (default `'Close search'`) stands in for the
  search glyph and folds it back, keeping the typed text: on a phone there is no Escape key, and leaving a field
  that holds text does not fold it. It is not rendered above 768 px in `narrow` mode.

```html
<header class="app-header">
  @if (!searchOpen()) {
  <h1>Dashboard</h1>
  }
  <gbt-search-bar
    collapsible="narrow"
    [(expanded)]="searchOpen"
    openLabel="Rechercher"
    [groupedResults]="results()"
  />
</header>
```

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
