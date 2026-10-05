# Skeleton

Animated placeholder that echoes the shape of content still loading —
a line of text, a circle, or a rectangle. Combine several to mimic a
table row, a list item, or a card, instead of a generic spinner
unrelated to what's about to appear.

**Selector**: `gbt-skeleton`

## Inputs

| Input     | Type                          | Default | Role                                                                 |
| --------- | ----------------------------- | ------- | --------------------------------------------------------------------- |
| `variant` | `'text' \| 'circle' \| 'rect'` | `'text'` | Shape: rounded line, perfect circle (`aspect-ratio: 1`, sized by `width`), or rounded rectangle. |
| `width`   | `string`                      | `'100%'` | Any CSS length (`'240px'`, `'60%'`, …).                              |
| `height`  | `string \| null`               | `null`  | Any CSS length. Left unset, each variant falls back to a sensible default (`1em` for `text`, matches `width` for `circle`, `100px` for `rect`). |

## Example

```html
<gbt-skeleton variant="text" width="60%" />
<gbt-skeleton variant="circle" width="40px" />
<gbt-skeleton variant="rect" width="100%" height="140px" />
```

## Composing a placeholder layout

There's no dedicated `TableSkeleton` or `CardSkeleton` — combine plain
`gbt-skeleton`s instead, e.g. a card:

```html
<div role="status" aria-label="Loading">
  <gbt-skeleton variant="rect" width="100%" height="140px" />
  <gbt-skeleton variant="text" width="80%" />
  <gbt-skeleton variant="text" width="50%" />
</div>
```

## Behavior

- A soft highlight band sweeps left to right across the shape to
  signal "loading"; the animation is disabled under
  `prefers-reduced-motion: reduce` (the shape stays visible, flat,
  with no motion).
- Each `gbt-skeleton` sets `aria-hidden="true"` on itself — a screen
  reader is never told about a dozen individual placeholder shapes.
  Wrap the group in a single `role="status"` container with a label
  (as in the example above) so "Loading" is announced once for the
  whole layout, not once per shape.
