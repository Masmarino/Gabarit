# StatTile

A figure with its label: "12 open issues", "3.4 GB stored". The figure and an optional icon marker on
top, the label under them, then an optional hint and trend.

**Selector**: `gbt-stat-tile`, plus the router-agnostic link anchor `a[gbtStatTileLink]` (class `StatTileLink`,
import it to get the stretched hit area). Put tiles in a [`gbt-stat-grid`](../stat-grid/README.md).

## Inputs

| Input        | Type                                | Default     | Role                                                                                                   |
| ------------ | ----------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| `label`      | `string`                            | `''`        | The label under the figure. Not needed when a `gbtStatTileLink` is projected (its text is the label).  |
| `value`      | `string \| number`                  | —           | Required. The figure, shown as is (format it: `1,284`, `3.4 GB`).                                      |
| `icon`       | `string \| null`                    | `null`      | Registered icon name, on a tile-shaped [`gbt-icon-marker`](../../atoms/icon-marker/README.md).         |
| `iconTone`   | `IconMarkerTone`                    | `'info'`    | Tone of that marker.                                                                                   |
| `hint`       | `string \| null`                    | `null`      | A precision under the label ("last 30 days").                                                          |
| `trend`      | `'up' \| 'down' \| 'flat' \| null`  | `null`      | An arrow. Shown only with a `trendLabel`.                                                              |
| `trendLabel` | `string \| null`                    | `null`      | The trend as text, with its sign or wording ("+12 %"): an arrow alone says nothing to a screen reader. |
| `trendTone`  | `'neutral' \| 'success' \| 'error'` | `'neutral'` | Colours the trend by whether the movement is good or bad, whichever the direction.                     |
| `href`       | `string \| null`                    | `null`      | Turns the label into a link whose hit area is the whole tile.                                          |
| `muted`      | `boolean`                           | `false`     | The tile steps back (quiet figure, neutral marker): a category with nothing in it.                     |

## Reading order

The label comes **first in the DOM**, the figure second (the grid areas put the figure on top): a screen
reader says "Open issues, 12". Do not swap them.

## Link

`href` renders the label as an anchor. With a router, project the anchor and let it replace the label:

```html
<gbt-stat-tile [value]="issues().length" icon="circle-dot">
  <a gbtStatTileLink [routerLink]="['/issues']">Open issues</a>
</gbt-stat-tile>
```

If you forget to import `StatTileLink`, the projected anchor is still rendered with its text (the selector matches the
attribute), only unstyled: no stretched hit area and no tile hover, so a missing import is visible, never a silent empty label.

The anchor's `::after` covers the tile (the tile is `position: relative`); its keyboard focus outlines the
whole tile. No interactive element is nested in another.

## Narrow tiles

The tile is a size container named `gbt-stat-tile`: under 11 rem it tightens its padding and uses a smaller
figure (1.375 rem) so `1,284` is not cut, whatever the grid or the viewport. A figure that is still too long is
cut with an ellipsis, never overflowing. A tile outside a grid needs a definite width (a block).

**Containment side effect.** `container-type: inline-size` also applies layout containment to the host: a
`position: fixed` descendant (a popover, tooltip or menu panel projected into the tile) is placed against the tile,
not the viewport. Do not put a fixed-position overlay inside a tile; open it from outside (or use a native popover
in the top layer).

## Example

```html
<gbt-stat-grid ariaLabel="Summary">
  <gbt-stat-tile
    label="Repositories"
    value="1,284"
    icon="folder"
    hint="last 30 days"
    trend="up"
    trendLabel="+12 %"
    trendTone="success"
  />
  <gbt-stat-tile label="Storage used" value="3.4 GB" icon="database" />
</gbt-stat-grid>
```

## Accessibility

See [AUDIT.md](./AUDIT.md).
