# SkeletonList

The placeholder of a list while it loads: `rows` rows of an optional leading block (a status dot, an
avatar) and one to three text lines, at the rhythm of a real list row.

**Selector**: `gbt-skeleton-list`. Built on [`gbt-skeleton`](../skeleton/README.md). `gbt-list-card`
draws its own loading state; use this one in a settings section, a panel, a table body or any bordered box.

## Inputs

| Input          | Type                             | Default      | Role                                                                            |
| -------------- | -------------------------------- | ------------ | ------------------------------------------------------------------------------- |
| `rows`         | `number`                         | `4`          | Number of placeholder rows (`0` or less: none, only the status).                |
| `leading`      | `'circle' \| 'square' \| 'none'` | `'circle'`   | The block before the lines: a dot or avatar, a square, or nothing.              |
| `leadingSize`  | `string`                         | `'1rem'`     | Its size (`1rem` a status dot, `2.25rem` an avatar).                            |
| `lines`        | `1 \| 2 \| 3`                    | `2`          | Text lines per row. The first is the longest; its width varies from row to row. |
| `loadingLabel` | `string`                         | `'Loading…'` | Read out (visually hidden, polite) while loading.                               |
| `divided`      | `boolean`                        | `true`       | A hairline between rows.                                                        |
| `padded`       | `boolean`                        | `true`       | 1 rem of side padding (a row inside a card). Turn it off in a bare list.        |

## Behaviour and accessibility

- A `role="status"` region with `loadingLabel` is always rendered; the shapes are `aria-hidden`.
- **No `aria-busy`**: it would sit on an ancestor of the status region, and assistive technology may then hold
  the announcement back until the busy state ends, which is exactly when the announcement is useless.
- Placeholders animate with `gbt-skeleton`'s shimmer, which stops under `prefers-reduced-motion`.

## Example

```html
@if (loading()) {
<gbt-skeleton-list [rows]="3" leadingSize="2.25rem" loadingLabel="Chargement des membres…" />
} @else {
<ul>
  …
</ul>
}
```

See [AUDIT.md](AUDIT.md).
