# Spinner

A standalone loading indicator, for use anywhere `Button`'s own
internal spinner doesn't reach — a card, a panel, a whole page section
— and `Skeleton` (which echoes the shape of content still loading)
isn't a fit, typically because there's no known destination layout to
echo yet.

**Selector**: `gbt-spinner`

## Inputs

| Input   | Type                   | Default      | Role                                           |
| ------- | ----------------------- | -------------- | ------------------------------------------------- |
| `size`  | `'sm' \| 'md' \| 'lg'`   | `'md'`         | 16px / 24px / 40px.                                |
| `label` | `string`                | `'Loading…'`   | Announced once via `role="status"`, visually hidden. |

## Example

```html
<gbt-spinner size="lg" label="Loading results…" />
```

## Behavior

- `role="status"` with a visually-hidden label — announced once,
  unlike `Skeleton`'s "no live announcement per shape" stance, since a
  spinner is usually the *only* loading cue on screen, not one of a
  dozen placeholder shapes needing a single shared announcement.
- The ring inherits `color` (`--primary` by default) — set `color` on
  an ancestor to recolor it, e.g. inside a button with a colored
  background.
- The ring is two layers: a faint static track (`::before`, 15%
  opacity) and the spinning arc on top (`::after`) — an arc alone,
  with no track, reads as "a circle with a bite taken out of it"
  rather than as motion over a fixed shape.

## Relationship to `Button`'s own spinner

`Button`'s internal loading spinner stays private and independent —
not migrated to reuse this component, the same call made for
`AppShell`'s mobile drawer versus `Drawer`: no functional gain, and a
needless regression risk on an already-shipped, stable component.
