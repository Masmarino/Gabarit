# MenuItem

An item of a [`gbt-menu`](../menu/README.md): an action (`<button>`) or a link (`<a>`), with an
optional icon, a `danger` variant and a `disabled` state. It replaces the hand-written
`role="menuitem" class="gbt-menu__item"` elements — those keep working, this is the shorter,
complete way to write them.

**Selector**: `button[gbtMenuItem], a[gbtMenuItem]`

The element itself is the menu item: it gets `role="menuitem"` and the `.gbt-menu__item` look, so the
menu's keyboard handling (↑ ↓ Home End, Escape, focus return) reaches it unchanged. It is
router-agnostic: put `routerLink` (or a plain `href`) on the same anchor.

## Inputs

| Input      | Type                    | Default     | Role                                                                                                                                 |
| ---------- | ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `icon`     | `string \| null`        | `null`      | `gbt-icon` name shown before the label (decorative, `aria-hidden`).                                                                  |
| `variant`  | `'default' \| 'danger'` | `'default'` | `danger`: red text, red fill on hover and keyboard focus — for an irreversible action ("Delete"). The label still says what it does. |
| `disabled` | `boolean`               | `false`     | `aria-disabled="true"`, dimmed, and the click is swallowed (no handler, no navigation); the menu stays open.                         |

The label is the projected content.

## Example

```html
<gbt-menu label="Repository actions" triggerIcon="ellipsis-vertical" align="end">
  <a gbtMenuItem icon="external-link" [routerLink]="['/repos', repo.id]">Open</a>
  <button gbtMenuItem icon="pencil" (click)="rename(repo)">Rename</button>
  <button gbtMenuItem icon="archive" [disabled]="!canArchive" (click)="archive(repo)">
    Archive
  </button>
  <button gbtMenuItem variant="danger" icon="trash-2" (click)="askDelete(repo)">Delete</button>
</gbt-menu>
```

Import `MenuItem` (and `Menu`) in the consumer's `imports`.

## Behavior

- Every item has `tabindex="-1"`: items are reached with the arrow keys, and Tab leaves the menu
  (APG menu-button pattern). A `tabindex` you write on the element wins.
- A `<button>` without a `type` gets `type="button"`, so it never submits a surrounding form.
- A **disabled** item stays focusable (arrow keys stop on it and a screen reader reads "dimmed" /
  "unavailable"), which is what the APG recommends; a native `disabled` button would be skipped.
  The click (and a link's middle click) is stopped in the capture phase, before any `(click)`,
  `routerLink` or `href`.
- Activating an enabled item closes the menu and returns focus to the menu's trigger.
- Direct children of the item are flex items: wrap rich content in a `<span>`.
