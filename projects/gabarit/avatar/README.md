# Avatar

Visual representation of a user — an image, or a fallback of initials
computed from their name if there's no image, or the image fails to
load.

**Selector**: `gbt-avatar`

## Inputs

| Input  | Type                    | Default | Role                                                                 |
| ------ | ----------------------- | ------- | --------------------------------------------------------------------- |
| `name` | `string`                | required | Full name — drives the initials fallback and the image's `alt` text. |
| `src`  | `string \| null`        | `null`  | Image URL. Falls back to initials if absent, or if it fails to load. |
| `size` | `'sm' \| 'md' \| 'lg'`  | `'md'`  | 24px / 32px / 48px.                                                  |

## Example

```html
<gbt-avatar name="Ada Lovelace" [src]="user.avatarUrl" size="sm" />
```

## Behavior

- Initials: first letter of the first and last word of `name` (e.g.
  "Ada Lovelace" → "AL"), or the first two letters for a single-word
  name.
- A failed image load (`(error)`) switches to the initials fallback —
  the broken-image icon a browser would otherwise show is never
  visible.
- The fallback uses a single neutral color (`--primary`/
  `--text-on-primary`, already AAA-contrast), not a color hashed per
  user — simpler, and one fewer palette to audit. Revisit if visually
  distinguishing users in a dense list turns out to matter.
