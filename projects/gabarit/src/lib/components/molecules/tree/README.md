# Tree

A hierarchical list of expandable/collapsible nodes — file trees,
nested categories, org charts — implementing the WAI-ARIA
[Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)
pattern. Distinct from nested `Accordion`s: a tree supports arrow-key
navigation across the whole hierarchy and a single-selection model,
where an accordion is a flat list of independently-toggled panels.

**Selector**: `gbt-tree`

## Inputs

| Input           | Type          | Default     | Role                                                          |
| ---------------- | --------------- | ------------- | ------------------------------------------------------------------ |
| `items`         | `TreeNode[]`   | *required*   | The hierarchy to render (see `TreeNode` below).                     |
| `ariaLabel`     | `string`       | `''`          | Accessible name of the tree, when there's no visible heading for it. |
| `selectedId`    | `string \| null` (model) | `null`        | The currently selected node's id. Two-way bindable.                  |
| `expandedIds`   | `string[]` (model)        | `[]`          | Ids of currently expanded nodes. Two-way bindable.                    |
| `expandLabel`   | `string`       | `'Expand'`    | Accessible name of a collapsed node's toggle button.                  |
| `collapseLabel` | `string`       | `'Collapse'`  | Accessible name of an expanded node's toggle button.                  |

```ts
interface TreeNode {
  id: string
  label: string
  icon?: string
  children?: TreeNode[]
}
```

## Example

```html
<gbt-tree
  [items]="repoTree"
  ariaLabel="Fichiers du dépôt"
  [(expandedIds)]="expanded"
  [(selectedId)]="selected"
/>
```

## Behavior

- Clicking a node with children both selects it **and** toggles its
  expanded state — the same one-click convenience VS Code's file
  explorer and most desktop file trees offer, rather than requiring a
  separate click on the chevron just to open a folder.
- Clicking the chevron button directly toggles expansion only, without
  changing the selection (`$event.stopPropagation()` keeps the row
  click from also firing).
- Full keyboard support per the WAI-ARIA pattern: `ArrowDown`/`ArrowUp`
  move focus to the next/previous visible row, `ArrowRight` expands a
  collapsed node (or moves into its first child if already expanded),
  `ArrowLeft` collapses an expanded node (or moves focus to its parent
  if already collapsed/a leaf), `Home`/`End` jump to the first/last
  visible row, `Enter`/`Space` select the focused row.
- Roving `tabindex`: only the active row is a `Tab` stop; arrow keys
  move focus without adding the whole tree to the tab order row by
  row.

## Why a flat list instead of nested groups

The WAI-ARIA pattern allows a tree to be built either as nested
`role="group"` containers per level, or as a single flat list where
each item's depth is conveyed by `aria-level`. This component uses the
flat form: `items` is flattened (respecting which nodes are currently
expanded) into one array rendered by a single `@for`, with `role="tree"`
on the `<ul>` and `role="treeitem"` + `aria-level`/`aria-expanded`
directly on each `<li>`. This avoids a recursive per-node component
(and the extra indirection that comes with it) and sidesteps relying
on native `<ul>`/`<li>` list semantics for a structure that isn't
actually a native nested list — the same reasoning that led to an
explicit ARIA role here rather than leaning on HTML's own content
model.

## Accessibility

See `AUDIT.md` for the full RGAA checklist.
