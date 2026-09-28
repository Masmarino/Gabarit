# UserChip

An avatar followed by a person's name, on one line: the identity of an
author, an assignee or a member in a list row, a meta line or a side
panel. Built on [`gbt-avatar`](../../atoms/avatar/README.md) (initials in
a coloured disc, or a picture).

**Selector**: `gbt-user-chip`

## Inputs

| Input  | Type             | Default | Role                                                                                     |
| ------ | ---------------- | ------- | ---------------------------------------------------------------------------------------- |
| `name` | `string`         | —       | Required. Shown next to the avatar, used for its initials and for the tooltip (`title`). |
| `size` | `'sm' \| 'md'`   | `'sm'`  | `sm`: 24 px avatar, 13 px name (rows, banners, meta lines). `md`: 32 px, 14 px (panels). |
| `src`  | `string \| null` | `null`  | A picture for the avatar. The initials show when it is absent or fails to load.          |

## Behaviour

- The name is one line: it truncates with an ellipsis when the space runs
  out, and the full name is in the `title` tooltip.
- The chip is `inline-flex` with `min-width: 0`, so it **shrinks** inside a
  flex row (that is what lets the name truncate). A row that must never
  squeeze the chip gives it `flex: none`.
- The avatar is decorative (`aria-hidden`): the name is read once.

## Example

```html
<gbt-user-chip name="Alice Martin" />
<gbt-user-chip name="florian" size="md" />

<ul>
  @for (member of members; track member.id) {
  <li><gbt-user-chip [name]="member.name" [src]="member.avatarUrl" size="md" /></li>
  }
</ul>
```

## Accessibility

See [AUDIT.md](./AUDIT.md).
