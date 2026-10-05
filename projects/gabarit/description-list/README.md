# DescriptionList

Label/value pairs for a detail page (owner, creation date, size…),
built on the semantic `<dl>`/`<dt>`/`<dd>` elements rather than a
`<table>`. For a list of _records_ instead of a single item's
attributes, use `Table` or `DimensionCard`.

**Selector**: `gbt-description-list`

## Inputs

| Input        | Type                                                        | Default      | Role                                                                                                                                                                                                                                                                                |
| ------------ | ----------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`      | `{ term: string; value: string \| TemplateRef<unknown> }[]` | required     | Each pair. `value` is either plain text, or a `TemplateRef` for rich content (a `Badge`, a link, …).                                                                                                                                                                                |
| `layout`     | `'stacked' \| 'inline'`                                     | `'stacked'`  | `stacked`: term above value. `inline`: term left, value right, in a two-column grid. Falls back to `stacked` below 768px either way (see `responsive`).                                                                                                                             |
| `valueAlign` | `'start' \| 'end'`                                          | `'start'`    | `end` right-aligns the values (the fact-sheet look: term on the left, value on the far edge of its row). When an inline list collapses to one column, values go back to the start edge. With `layout="stacked"` the values stay on the end edge at every width (under their terms). |
| `responsive` | `'viewport' \| 'container'`                                 | `'viewport'` | What an inline list stacks on. `viewport` (default): stacks below a 768px viewport. `container`: the list's own width — it stacks below 30rem, whatever the viewport.                                                                                                              |

### `responsive="container"`

The component becomes a size container (`display: block; container-type: inline-size`), so an inline
list in a narrow card or side panel stacks even on a wide screen, and keeps two columns in a
wide card even on a phone-sized viewport. Things to know:

- The host takes the width its parent gives it. In a flex row, give it `flex: 1` or a width (a size
  container has no intrinsic inline size of its own).
- Browsers without container queries (`@supports (container-type: inline-size)` false) ignore the
  option: the list stays on two columns at every width. Every evergreen browser has supported them
  since early 2023.
- It is opt-in: with the default `viewport`, the list only uses the plain viewport media query described above.

## Example

```html
<ng-template #statusValue>
  <gbt-badge variant="success">Actif</gbt-badge>
</ng-template>

<gbt-description-list
  layout="inline"
  [items]="[
    { term: 'Propriétaire', value: 'Ada Lovelace' },
    { term: 'Créé le', value: '12 mars 2024' },
    { term: 'Statut', value: statusValue },
  ]"
/>
```

```ts
statusValue = viewChild.required<TemplateRef<unknown>>('statusValue')
```

## Why `items` + `TemplateRef`, not projected `<gbt-description-list-item>`s

`<dl>` may only directly contain `<dt>`/`<dd>` (or a `<div>` wrapping a
pair) — axe flags any other element, including a custom element set to
`display: contents`, as an invalid child, because that CSS property
changes rendering, not the actual DOM parent/child relationship the HTML
content model and ARIA role mapping both depend on. Rendering every
`<dt>`/`<dd>` directly from this component's own template (via `items`)
keeps them genuine direct children of `<dl>` while still supporting rich
values, which is why `value` accepts a `TemplateRef` instead of a
projected `<gbt-description-list-item>`.
