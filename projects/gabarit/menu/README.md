# Menu

Generic dropdown menu — trigger and action list, the WAI-ARIA "menu
button" pattern.

**Selector**: `gbt-menu`

Click or Enter/Space opens it while focusing the first item; the
up/down arrows on the closed trigger open it while focusing the first
or last item respectively; the up/down arrows inside the list cycle
through the items with wraparound (Home/End jump to the first/last);
Escape closes it and returns focus to the trigger; activating an item
closes the menu and **returns focus to the trigger** (the item that had
it is gone); a click outside the menu or a focus-out (tabbing) closes
it without stealing focus. Focus is never trapped: Tab leaves the menu.

## Inputs

| Input              | Type               | Default   | Role                                                                                                                                                                            |
| ------------------ | ------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`            | `string`           | required  | Trigger text, and accessible name of the list.                                                                                                                                  |
| `align`            | `'start' \| 'end'` | `'start'` | Horizontal alignment of the list relative to the trigger.                                                                                                                       |
| `triggerIcon`      | `string \| null`   | `null`    | When set, the trigger renders only this icon (no visible label, no chevron) and `label` becomes its `aria-label` instead — for an icon-only trigger such as a "⋮" kebab button. |
| `triggerAriaLabel` | `string \| null`   | `null`    | Accessible name of the trigger button when a custom trigger (below) has no text of its own, e.g. an avatar alone. Left out, the button is named by its content.                 |
| `chevron`          | `boolean`          | `true`    | The chevron after the label or the custom trigger. Never shown with `triggerIcon`.                                                                                              |

## Outputs

| Output   | Type   | Role                                                                                                                                |
| -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `opened` | `void` | Emitted once per closed→open transition — never on close. Useful for lazily loading the menu's contents the first time it's opened. |

If you lazily populate the menu's contents on `opened`, project a placeholder item (e.g. `<a role="menuitem" class="gbt-menu__item">Chargement…</a>`) so the menu is never empty while the real content loads — otherwise a keyboard user's first ArrowDown-triggered open has nothing to focus, and other users briefly see an empty dropdown.

## Projected content

The list of menu items — each carries `role="menuitem"`. Write them with
[`gbtMenuItem`](menu-item/README.md) (`<button gbtMenuItem>` / `<a gbtMenuItem>`, with
`icon`, `variant="danger"` and `disabled`), or by hand with the `.gbt-menu__item` class (in
`_utilities.scss`, for styling; projected content escapes the component's encapsulation) — both
work, side by side. A real link or button, never a decorative element: it's what receives focus.

One more slot, the custom trigger: an element marked `gbtMenuTrigger`.

## Custom trigger (avatar + name…)

By default the trigger shows `label` and a chevron. To show anything else — a user's avatar and
name, say — project an element marked `gbtMenuTrigger` (import the `MenuTrigger` directive). Its
content goes **inside** the trigger button, replacing the label; the menu's behaviour, the chevron
and the list's name (`label`) are unchanged.

```html
<gbt-menu label="Account" align="end">
  <span gbtMenuTrigger class="who">
    <span aria-hidden="true"><gbt-avatar name="Ada Lovelace" size="sm" /></span>
    <span>ada.lovelace</span>
  </span>
  <a gbtMenuItem icon="user" href="/account">My account</a>
  <button gbtMenuItem icon="log-out" (click)="logout()">Sign out</button>
</gbt-menu>
```

- The slot lives in a `<button>`: phrasing content only, nothing interactive.
- The button is named by that content. Put a visible name next to a decorative avatar
  (`aria-hidden` on the avatar avoids reading the name twice). For an avatar alone, set
  `triggerAriaLabel`.
- A long name can ellipsise: give the slot `min-width: 0` and the name `overflow: hidden;
text-overflow: ellipsis; white-space: nowrap`; the trigger itself may shrink (`max-width: 100%`).
- The marked element is always projected into the trigger; without the `MenuTrigger` import it
  only misses the layout refinements (shrinking, padding), so import it.

## Example

```html
<gbt-menu label="Mon compte" align="end">
  <a role="menuitem" class="gbt-menu__item" href="/compte">Mon compte</a>
  <button role="menuitem" class="gbt-menu__item" type="button" (click)="logout()">
    Déconnexion
  </button>
</gbt-menu>
```

## Icon-only trigger (e.g. a kebab menu)

```html
<gbt-menu label="Actions" triggerIcon="ellipsis-vertical" align="end">
  <a role="menuitem" class="gbt-menu__item" href="/x">Copier le chemin</a>
  <button role="menuitem" class="gbt-menu__item" type="button" (click)="delete()">Supprimer</button>
</gbt-menu>
```
