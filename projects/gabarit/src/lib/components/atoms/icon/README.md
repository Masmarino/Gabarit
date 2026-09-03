# Icon

Renders an SVG icon registered in `IconRegistry` — always `aria-hidden`,
never meaningful on its own.

**Selector**: `gbt-icon`

## Inputs

| Input  | Type     | Role                                                                           |
| ------ | -------- | ------------------------------------------------------------------------------ |
| `name` | `string` | Name of the registered icon. Required. Nothing renders if the name is unknown. |

## Built-in icons

`search`, `x`, `eye`, `eye-off`, `chevron-down`, `check` — the ones
Gabarit's own components use. The application registers its own at
startup:

```typescript
inject(IconRegistry).registerAll({
  package: '<path d="…" />',
  user: '<circle cx="12" cy="7" r="4" />',
})
```

The expected markup is the **inner** content of an `<svg>` — without
the `<svg>` tag itself.

## Example

```html
<gbt-icon name="check" />
```
