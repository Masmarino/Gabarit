# Menu

Generic dropdown menu — trigger and action list, the WAI-ARIA "menu
button" pattern.

**Selector**: `gbt-menu`

Click or Enter/Space opens it while focusing the first item; the
up/down arrows on the closed trigger open it while focusing the first
or last item respectively; the up/down arrows inside the list cycle
through the items with wraparound; Escape closes it and returns focus
to the trigger; a click outside the menu or a focus-out (tabbing)
closes it without stealing focus.

## Inputs

| Input   | Type               | Default   | Role                                                      |
| ------- | ------------------ | --------- | --------------------------------------------------------- |
| `label` | `string`           | required  | Trigger text, and accessible name of the list.            |
| `align` | `'start' \| 'end'` | `'start'` | Horizontal alignment of the list relative to the trigger. |

## Projected content

The list of menu items — each carries `role="menuitem"` and the
`.gbt-menu__item` class (in `_utilities.scss`, for styling; projected
content escapes the component's encapsulation). A real link or button,
never a decorative element: it's what receives focus.

## Example

```html
<gbt-menu label="Mon compte" align="end">
  <a role="menuitem" class="gbt-menu__item" href="/compte">Mon compte</a>
  <button role="menuitem" class="gbt-menu__item" type="button" (click)="logout()">
    Déconnexion
  </button>
</gbt-menu>
```
