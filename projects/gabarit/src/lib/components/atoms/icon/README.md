# Icon

Renders an SVG icon registered in `IconRegistry` — always `aria-hidden`,
never meaningful on its own.

**Selector**: `gbt-icon`

## Inputs

| Input  | Type     | Role                                                                           |
| ------ | -------- | ------------------------------------------------------------------------------ |
| `name` | `string` | Name of the registered icon. Required. Nothing renders if the name is unknown. |

## Built-in icons

Gabarit ships the icons its own components use plus the generic UI glyphs
most applications need (Lucide, inner markup only). Browse them in Storybook
(`Atoms/Icon`, story `Gallery`).

- Components' own: `search`, `x`, `eye`, `eye-off`, `chevron-down`,
  `chevron-left`, `chevron-right`, `chevrons-left`, `chevrons-right`,
  `ellipsis-vertical`, `check`, `copy`, `check-circle`, `alert-circle`,
  `alert-triangle`, `info`, `arrow-up`, `arrow-down`, `calendar`, `upload`,
  `folder`, `file`.
- General-purpose UI glyphs: `home`, `folders`, `folder-open`, `server`, `lock`, `key`,
  `settings`, `log-out`, `user`, `users`, `user-plus`, `bell`, `activity`,
  `layout-dashboard`, `arrow-left`, `plus`, `list`, `kanban`, `layers`,
  `download`, `refresh-cw`, `trash-2`, `pencil`, `send`, `mail`,
  `message-circle`, `star`, `flag`, `tag`, `globe`, `book-open`, `bug`,
  `sparkles`, `play`, `clock`, `database`, `hard-drive`, `smartphone`,
  `shield-check`, `shield-alert`, `square-check`, `flask-conical`, and the
  circled `circle-dot`, `circle-check`, `circle-x`, `circle-play`,
  `circle-slash`.

Domain glyphs (a `git-branch`, an issue ring…) stay with the application. An
application overrides any of them, or adds its own, at startup:

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
