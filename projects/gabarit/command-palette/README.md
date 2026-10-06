# CommandPalette

A palette to search, jump and act from the keyboard: ⌘K on Apple systems, Ctrl+K on Windows and Linux. It
lists groups of commands, keeps those that match as one types, and runs the one chosen. Its trigger sits
where a header's search field would.

**Selectors**: `gbt-command-palette`, `gbt-command-palette-trigger`

## Inputs — `gbt-command-palette`

| Input                 | Type                          | Default                | Role                                                                                          |
| --------------------- | ----------------------------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| `open`                | `boolean` (two-way)           | `false`                | Whether the palette is shown.                                                                 |
| `groups`              | `CommandGroup[]`              | `[]`                   | What it offers, in order. Empty groups are left out.                                          |
| `shortcuts`           | `string[]`                    | `['mod+k']`            | Global keys that open and close it. `mod` is ⌘ or Ctrl; plain keys (`'/'`) wait while typing. |
| `maxItemsPerGroup`    | `number`                      | `8`                    | Items kept per filtered group once there is a query.                                          |
| `loading`             | `boolean`                     | `false`                | Shows a spinner in the field, and `loadingLabel` while no group has items.                    |
| `placeholder`         | `string`                      | `'Search or jump to…'` | The field's placeholder.                                                                      |
| `ariaLabel`           | `string`                      | `'Command palette'`    | Name of the dialog, the field and the list.                                                   |
| `emptyMessage`        | `string`                      | `'No results'`         | Shown when nothing matches.                                                                   |
| `loadingLabel`        | `string`                      | `'Searching…'`         | Spinner label and the empty list's text while loading.                                        |
| `navigateHint`, `selectHint`, `closeHint` | `string`  | English                | The footer's key hints.                                                                       |
| `closeLabel` | `string` | `'Close'` | Names the close button shown below 600 px, where there is no Escape key. |
| `resultsAnnouncement` | `(count: number) => string`   | English                | What the live region says after each change.                                                  |

| Output         | Payload       | When                                             |
| -------------- | ------------- | ------------------------------------------------ |
| `queryChange`  | `string`      | On opening (empty) and as one types: fetch here. |
| `itemSelected` | `CommandItem` | An option was chosen; the palette has closed.    |

`show()` and `close()` open and close it from code.

## Items and groups

```ts
interface CommandItem<T> { id; label; description?; icon?; keywords?; shortcut?; data? }
interface CommandGroup<T> { label; items; filter?: boolean }
```

Every word of the query must appear in an item's label, description or keywords, accents ignored ("depot"
finds "Dépôts"). A label starting with the query comes first, then one with a word that does. A group with
`filter: false` is shown as given: use it for results a server already matched. `shortcut` only displays keys
next to an item; binding them is the application's job.

## Trigger

`<gbt-command-palette-trigger [palette]="palette" label="…" />` is a button that looks like a search field,
names the shortcut for this system (`⌘K` or `Ctrl K`) and carries `aria-keyshortcuts`. Below 600 px it folds
to a 44 px icon button, its label kept as its accessible name.

## Example

```html
<gbt-command-palette-trigger [palette]="palette" label="Rechercher ou aller à…" />
<gbt-command-palette
  #palette
  [groups]="groups()"
  [loading]="searching()"
  [shortcuts]="['mod+k', '/']"
  (queryChange)="search($event)"
  (itemSelected)="run($event)"
/>
```

The helpers `matchCommand`, `shortcutLabel`, `ariaKeyshortcuts` and `matchesShortcut` are exported too.
