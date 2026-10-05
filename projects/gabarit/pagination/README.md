# Pagination

Page navigation for a long list or table — fully controlled, like
`AppShell`'s `collapsed`: `Pagination` never slices your data or holds
its own page state, it only tells you which page the user picked.

**Selector**: `gbt-pagination`

## Inputs

| Input          | Type                         | Default                    | Role                                                                 |
| -------------- | ---------------------------- | --------------------------- | --------------------------------------------------------------------- |
| `page`         | `number`                     | `1`                         | The current page (1-indexed). Fully controlled — bind `[(page)]`.    |
| `pageSize`     | `number`                     | `10`                        | Items per page, used with `totalItems` to compute the page count.   |
| `totalItems`   | `number`                     | required                    | Total item count across all pages.                                  |
| `siblingCount` | `number`                     | `1`                         | Page numbers shown on each side of the current page before an ellipsis takes over. |
| `disabled`     | `boolean`                    | `false`                     | Disables every button and the page-size selector — e.g. while a page fetch is in flight, to prevent a second click from racing it. |
| `ariaLabel`    | `string`                     | `'Pagination'`               | Accessible name of the `<nav>`.                                     |
| `previousLabel`| `string`                     | `'Previous page'`            | Accessible name of the previous-page button.                        |
| `nextLabel`    | `string`                     | `'Next page'`                | Accessible name of the next-page button.                            |
| `pageLabel`    | `(page: number) => string`   | `` (page) => `Page ${page}` ``| Accessible name of each page-number button.                        |
| `pageSizeOptions` | `number[]`                | `[]`                         | Page-size choices (e.g. `[10, 20, 30, 50, 100]`). Empty (default) hides the page-size selector entirely. |
| `pageSizeLabel`   | `(size: number) => string`| `` (size) => `${size} / page` ``| Text for each option in the page-size selector.                  |
| `pageSizeSelectLabel` | `string`               | `'Rows per page'`             | Visible label of the page-size selector.                          |
| `showItemsSummary`| `boolean`                 | `false`                       | Shows "N of M items" next to the page-size selector.               |
| `itemsSummaryLabel`| `(shown: number, total: number) => string` | `` (shown, total) => `${shown} of ${total} items` `` | Text of the items summary — `shown` already accounts for a shorter last page. |

## Outputs

| Output           | Type     | Role                                                          |
| ---------------- | -------- | --------------------------------------------------------------- |
| `pageChange`     | `number` | Emitted when a page number, or previous/next, is clicked — `Pagination` does not update `page` itself. Also emitted with `1` right after `pageSizeChange`, and automatically whenever the current `page` ends up outside `[1, pageCount]` (e.g. `totalItems` shrinks under a filter) — `Pagination` self-corrects instead of getting stuck with no page marked current. |
| `pageSizeChange` | `number` | Emitted when a new page size is picked from the selector — `Pagination` does not update `pageSize` itself. |

## Example

```html
<gbt-pagination
  [totalItems]="users.length"
  [pageSize]="pageSize"
  [page]="page()"
  (pageChange)="page.set($event)"
/>
```

Long lists get a windowed display with an ellipsis (`1 … 4 5 6 7 8 … 20`)
instead of every page number — widen or narrow the window with
`siblingCount`.

With `pageSizeOptions` and `showItemsSummary`: the items summary sits on
the left, the page-size selector on the right, and the page numbers stay
truly centered on the row regardless of how wide either side is:

```html
<gbt-pagination
  [totalItems]="users.length"
  [pageSize]="pageSize()"
  [page]="page()"
  [pageSizeOptions]="[10, 20, 30, 50, 100]"
  [showItemsSummary]="true"
  (pageChange)="page.set($event)"
  (pageSizeChange)="pageSize.set($event)"
/>
```

## With Table

`Table` has no pagination logic of its own — it just renders whatever
`data` it's given — so it composes with `Pagination` without any extra
API on either side: slice the full dataset to the current page's slot
yourself and drive both from the same `page` value. See the `Table`
story `WithPagination` for a working example.

