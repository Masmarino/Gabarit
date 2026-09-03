# AppShell

Page shell — side navigation panel, header, content. Below the 768px
breakpoint, the navigation becomes a drawer: the button opens it, the
backdrop or Escape closes it, focus is trapped inside while it's open
and returns to the button on close.

**Selector**: `gbt-app-shell`

## Inputs

| Input            | Type     | Role                                                              |
| ---------------- | -------- | ----------------------------------------------------------------- |
| `navLabel`       | `string` | Required. Accessible name of the navigation (`<nav aria-label>`). |
| `skipLabel`      | `string` | Required. Text of the skip link to the content.                   |
| `openMenuLabel`  | `string` | Required. Accessible name of the button, drawer closed.           |
| `closeMenuLabel` | `string` | Required. Accessible name of the button, drawer open.             |

## Projected content

| Selector         | Role                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `[shell-brand]`  | The brand, at the top of the navigation.                                                                                                               |
| `[shell-nav]`    | The navigation links. `.gbt-app-shell__link` (in `_utilities.scss`) for styling; `aria-current="page"` denotes the current page — never a class alone. |
| `[shell-header]` | Header content: title, search, account menu… Several elements can project into this same slot.                                                         |
| Default          | The page content, in a focusable `<main>`.                                                                                                             |

`.gbt-app-shell` sets the background (`--bg-panel`) of the whole page,
content included — cards and other surfaces left on `--bg-principal`
stand out from it by contrast. `.gbt-container` (in `_utilities.scss`)
centers content at reading width, to place on the default-projected
content if needed.

## Example

```html
<gbt-app-shell
  navLabel="Navigation principale"
  skipLabel="Aller au contenu principal"
  openMenuLabel="Ouvrir la navigation"
  closeMenuLabel="Fermer la navigation"
>
  <a shell-brand href="/">Hangar</a>
  <a shell-nav href="/depots" class="gbt-app-shell__link" aria-current="page">Dépôts</a>
  <a shell-nav href="/utilisateurs" class="gbt-app-shell__link">Utilisateurs</a>
  <h1 shell-header>Dépôts</h1>
  <div shell-header style="margin-left:auto">
    <gbt-menu label="Mon compte" align="end">...</gbt-menu>
  </div>

  <p>Contenu de la page.</p>
</gbt-app-shell>
```
