# Breadcrumb

Trail of ancestor links plus a current segment — purely presentational,
no router dependency.

**Selector**: `gbt-breadcrumb`

## Inputs

| Input       | Type     | Role                                                 |
| ----------- | -------- | ---------------------------------------------------- |
| `ariaLabel` | `string` | Required. Accessible name of the breadcrumb `<nav>`. |

## Projected content

| Selector                | Role                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `[breadcrumb-ancestor]` | Zero or more ancestor items, in order — each projected as `<li breadcrumb-ancestor>` wrapping a real link (the `<ol>` content model and the CSS separator rule both depend on the projected node being an `<li>`, not the link itself). `.gbt-breadcrumb__item` (in `_utilities.scss`) for styling, applied to the link. |
| Default                 | The current segment: plain text, or an interactive element like `gbt-menu` if the current item doubles as a switcher.                                                                                                                                                                                                    |

Separators (`/`) between items are rendered automatically via CSS — the
consuming app never adds them itself.

## Example

```html
<gbt-breadcrumb ariaLabel="Fil d'Ariane">
  <li breadcrumb-ancestor><a class="gbt-breadcrumb__item" routerLink="/groupe">Groupe</a></li>
  <li breadcrumb-ancestor>
    <a class="gbt-breadcrumb__item" routerLink="/groupe/sous-groupe">Sous-groupe</a>
  </li>
  <gbt-menu label="Dépôt" align="start">
    <a role="menuitem" class="gbt-menu__item" routerLink="/groupe/sous-groupe/autre-depot"
      >autre-depot</a
    >
  </gbt-menu>
</gbt-breadcrumb>
```
