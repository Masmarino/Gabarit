# AvatarGroup

A row of overlapping `Avatar`s — up to `max` shown, the rest folded
into a "+N" indicator that opens a menu listing them. Every avatar,
visible or in the overflow menu, is clickable — e.g. to filter a list
down to that one user.

**Selector**: `gbt-avatar-group`

## Inputs

| Input       | Type                       | Default   | Role                                                              |
| ----------- | -------------------------- | --------- | -------------------------------------------------------------------- |
| `items`     | `T[]` (`{ name, src? }`)   | required  | The users to show. `T` can carry extra fields (e.g. `id`) — the full item comes back on `itemClick`. |
| `max`       | `number`                   | `5`       | Avatars shown before folding the rest into "+N".                     |
| `ariaLabel` | `string`                   | `'Users'` | Accessible name of the avatar row.                                    |
| `moreLabel` | `(count: number) => string`| `` (count) => `${count} more` `` | Accessible name of the "+N" button, and the overflow menu's label. |
| `activeItem` | `T \| null`                | `null`    | The currently active filter, compared by reference against `items`. A visible avatar gets an outer ring; the matching row in the overflow menu gets a check icon (both also get `aria-current="true"`). |

## Outputs

| Output      | Type | Role                                                                 |
| ----------- | ---- | ----------------------------------------------------------------------- |
| `itemClick` | `T`  | Emitted when any avatar is clicked — the visible ones, or one from the overflow menu. |

## Example

```html
<gbt-avatar-group
  [items]="users"
  [max]="5"
  [activeItem]="selectedUser"
  (itemClick)="selectedUser = selectedUser === $event ? null : $event"
/>
```

```ts
users: User[] = [{ id: '1', name: 'Ada Lovelace', src: user.avatarUrl }, ...]
selectedUser: User | null = null
```

## Behavior

- Reuses `Avatar` for each item (`md` size in the row, `sm` size in the
  overflow menu) — no separate initials/fallback logic of its own.
- The overflow menu is positioned the same way as `Select`/`Menu`
  (`getBoundingClientRect`), closes on `Escape` or an outside click.
