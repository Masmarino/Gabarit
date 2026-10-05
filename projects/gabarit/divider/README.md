# Divider

A thin separating line between sections or list items, with an
optional centered label (e.g. "OR" between two sign-in buttons).

**Selector**: `gbt-divider`

## Inputs

| Input         | Type                          | Default        | Role                                                         |
| ------------- | ------------------------------ | ---------------- | --------------------------------------------------------------- |
| `orientation` | `'horizontal' \| 'vertical'`   | `'horizontal'`   | `vertical` needs a defined height from its context — it stretches to fill it (`align-self: stretch`), it doesn't invent one. |
| `label`       | `string`                       | `''`             | Optional text centered between two line segments.               |

## Example

```html
<gbt-divider />
<gbt-divider label="OR" />
<gbt-divider orientation="vertical" />
```

## Behavior

- `role="separator"`, with `aria-orientation="vertical"` only for the
  vertical case — `horizontal` is the ARIA default, so the attribute
  is omitted rather than stated redundantly.
- A vertical divider inside a flex row needs the row to give it a
  height (e.g. via `align-items: stretch`, the flex default, or an
  explicit height on the row) — it has none of its own to fall back
  on.
