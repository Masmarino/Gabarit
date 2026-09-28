# StatGrid

A responsive grid of [`gbt-stat-tile`](../stat-tile/README.md)s: two columns, and up to `columns` once the grid
is 600 px wide.

**Selector**: `gbt-stat-grid`

## Inputs

| Input          | Type                    | Default      | Role                                                          |
| -------------- | ----------------------- | ------------ | ------------------------------------------------------------- |
| `ariaLabel`    | `string`                | `'Summary'`  | Names the list of tiles.                                      |
| `columns`      | `2 \| 3 \| 4 \| 5 \| 6` | `4`          | Columns once the grid is 600 px wide or more (below that: 2). |
| `loading`      | `boolean`               | `false`      | Shows placeholder tiles instead of the projected tiles.       |
| `loadingCount` | `number`                | `4`          | Number of placeholder tiles. `0` or less: none, only the status region (same convention as `SkeletonList`'s `rows`). |
| `loadingLabel` | `string`                | `'Loading…'` | Read out (visually hidden, polite) while `loading`.           |

## Behaviour

- **Container query**: `container: gbt-stat-grid / inline-size`, breakpoint at 600 px of the GRID's width (custom
  properties cannot be read in a container condition, so it is fixed). A grid in a 700 px column next to an aside
  behaves like a grid on a 700 px page. The `MediumFrame` and `NarrowFrame` stories show it.
- **Containment side effect**: `container-type: inline-size` also applies layout containment to the grid, so a
  `position: fixed` descendant (a popover or menu panel inside a tile) is placed against the grid, not the viewport.
  Keep fixed-position overlays out of the tiles.
- **List semantics**: `role="list"` named by `ariaLabel`; the tiles are its `role="listitem"`s (a tile detects
  its grid by injection: it gets the role only there).
- **Loading**: placeholders have a loaded tile's border, radius and padding, so nothing moves when the figures
  arrive. The real tiles are not rendered meanwhile; the list is `aria-hidden` and a `role="status"` region
  (outside the list, always in the DOM) says `loadingLabel`. No `aria-busy` is set: some assistive technology
  would hold the status back.
- Tiles project directly into the grid: `<gbt-stat-tile>` elements as direct children (a wrapper `div` would
  lose the list-item role).

## Example

```html
<gbt-stat-grid ariaLabel="Overview" [columns]="4" [loading]="!stats()">
  @for (tile of stats(); track tile.key) {
  <gbt-stat-tile [label]="tile.label" [value]="tile.value" [icon]="tile.icon" />
  }
</gbt-stat-grid>
```

## Accessibility

See [AUDIT.md](./AUDIT.md).
