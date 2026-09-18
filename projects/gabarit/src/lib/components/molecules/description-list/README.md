# DescriptionList

Label/value pairs for a detail page (owner, creation date, size…),
built on the semantic `<dl>`/`<dt>`/`<dd>` elements rather than a
`<table>`. For a list of *records* instead of a single item's
attributes, use `Table` or `DimensionCard`.

**Selector**: `gbt-description-list`

## Inputs

| Input    | Type                                 | Default   | Role                                                              |
| -------- | ------------------------------------- | --------- | -------------------------------------------------------------------- |
| `items`  | `{ term: string; value: string \| TemplateRef<unknown> }[]` | required  | Each pair. `value` is either plain text, or a `TemplateRef` for rich content (a `Badge`, a link, …). |
| `layout` | `'stacked' \| 'inline'`               | `'stacked'` | `stacked`: term above value. `inline`: term left, value right, in a two-column grid. Falls back to `stacked` below 768px either way. |

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

An earlier version of this component split `gbt-description-list`
(rendering `<dl>`) from a `gbt-description-list-item` rendering its own
`<dt>`/`<dd>` pair, content-projected into the list. It failed its own
accessibility test: `<dl>` may only directly contain `<dt>`/`<dd>` (or
`<div>` wrapping a pair) — axe correctly flags any other element,
including a custom element set to `display: contents`, as an invalid
child, because that CSS property changes rendering, not the actual DOM
parent/child relationship the HTML content model and ARIA role mapping
both depend on. Rendering every `<dt>`/`<dd>` directly from this
component's own template (via `items`) is the only way to keep them
genuine direct children of `<dl>` while still supporting rich values,
which is why `value` accepts a `TemplateRef` instead.
