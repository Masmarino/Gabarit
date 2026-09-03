# RGAA Audit — Table

Verified against RGAA 4.1.2 by exercising `Molecules/Table` in
Storybook (stories `Empty`, `Nominal`, `Interactive`, `Dense`, `Dark`)
and by code review (`table.ts`, `table.html`, `table.scss`).

`gbt-table` sets no ARIA attribute on its own host — `<caption>`,
`<th scope="col">`, and the rows' `tabindex` all live on native HTML
elements inside the template. The native tabular semantics (`<table>`,
`<caption>`, `<th>`) are carried by the browser, not by an axe pass.

Interactive rows are `tabindex="0"` with a `keydown` handler
(`onRowKeydown`, `Enter`/`Space`) rather than `role="button"`: that
role is "Children Presentational" in ARIA 1.2, and carrying it on a
`<tr>` would erase the row's own semantics and its cells' association
with `<th scope="col">` — exactly the association criteria 5.6/5.7
depend on. Tested (`never sets role="button" on a row…`,
`table.spec.ts`).

## Checklist

| Criterion | Short title                              | Verification                                                                                                                                                                                                                                                                                                                                                                                                                  | Result                                                                |
| --------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 5.4       | Caption associated with the table        | `caption = input.required<string>()` — a `<gbt-table>` with no title fails to compile/run (`NG0950` at runtime if the input isn't bound), so the criterion is impossible to violate rather than merely recommended. Tested (`renders the caption element with the provided title`, `associates a caption with the table...`).                                                                                                 | Compliant — enforced by the type                                      |
| 5.5       | Relevant caption                         | Text entirely delegated to the consumer — nothing to check on the component's side, the same delegation as 11.2 elsewhere in the library.                                                                                                                                                                                                                                                                                     | Compliant (delegated)                                                 |
| 5.6       | Column headers declared                  | `<th scope="col">` for each column of `columns()` — verified in `table.html` and by `renders one row per data item with the configured columns`. No row header (`th scope="row"`): the `TableColumn<T>` API only models column headers, a documented limitation here rather than a defect — a consumer needing row headers would need to format their own first column.                                                       | Compliant for column headers; no row header (outside the API's scope) |
| 5.7       | Relevant `scope` attribute               | `scope="col"` set only on `<th>`, never on a `<td>` — verified by reading the template, no conditional logic that could omit or misplace it.                                                                                                                                                                                                                                                                                  | Compliant                                                             |
| 5.8       | Complex-table technique (`id`/`headers`) | Not applicable — `gbt-table` only renders a single level of headers (no `rowspan`/`colspan`, no multi-level headers); the `id`/`headers` technique, reserved for complex tables, doesn't apply to this API.                                                                                                                                                                                                                   | Not applicable to this component                                      |
| 7.3       | Keyboard- and pointer-operable           | `clickableRows = input(false, { transform: booleanAttribute })` gates both `(click)` and `(keydown)` on a row, so click and keyboard activate it under exactly the same conditions; `onRowKeydown` responds to `Enter`/`Space`. Verified under real conditions in Storybook (`Interactive` story): real keyboard `Tab` moves focus to the first row, `row.matches(':focus-visible')` → `true`, then `Enter` fires `rowClick`. | Compliant                                                             |
| 10.7      | Visible focus indicator                  | `tr:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px }`. Verified under real conditions (not just by reading the CSS): real keyboard `Tab` in Storybook (`Interactive` story) → `getComputedStyle` on the active row gives `outline: 2px solid`, `outline-offset: -2px`, screenshot on file.                                                                                                           | Compliant — verified under real conditions                            |
| 10.11     | 320px reflow                             | Viewport set to 320×600 in Storybook on the `Dense` story (50 rows, 2 columns): `scrollWidth === clientWidth === 320`, no horizontal scroll — the table grows vertically, no truncation.                                                                                                                                                                                                                                      | Compliant — verified                                                  |

## Externalized strings

`emptyMessage` defaults to `'No data'`. Tested by "shows the provided
empty-state message" and "shows an English default empty-state
message".

## Cursor and hover scoped to interactive rows

`cursor: pointer` and the hover `background: var(--bg-hover)` in
`table.scss` are scoped to the `tr.gbt-table__row--clickable` selector,
which only matches rows where `clickableRows` is `true` — a
non-interactive row therefore never looks clickable.

Dark mode is visually confirmed in Storybook (`Dark` story) —
caption and rows legible.
