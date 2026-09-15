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
| `collapseLabel`  | `string` | Required if `collapsible` is `true`. Accessible name of the collapse-toggle button, nav expanded. |
| `expandLabel`    | `string` | Required if `collapsible` is `true`. Accessible name of the collapse-toggle button, nav collapsed. |
| `collapsed`      | `boolean`| Optional, defaults to `false`. Fully controlled — `AppShell` never persists it; bind `[(collapsed)]` to a signal you own if you want it remembered across sessions. Only has an effect at/above the 768px breakpoint. |
| `collapsible`    | `boolean`| Optional, defaults to `true`. Set to `false` to omit the built-in collapse-toggle button entirely — e.g. if your app drives `collapsed` from its own control elsewhere. When `false`, `collapseLabel`/`expandLabel` aren't needed. |

## Outputs

| Output           | Type      | Role                                                        |
| ---------------- | --------- | ------------------------------------------------------------ |
| `collapsedChange` | `boolean` | Emitted when the collapse-toggle button is clicked, with the new desired value — `AppShell` does not update `collapsed` itself. |

## Projected content

| Selector         | Role                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `[shell-brand]`  | The brand, at the top of the navigation. With `collapsed`, plain text is clipped with an ellipsis rather than overflowing the rail — but since you already own the `collapsed` signal you bind to `[collapsed]`/`(collapsedChange)`, prefer swapping in a compact icon yourself (see example below) over relying on the ellipsis. |
| `[shell-nav]`    | The navigation links. `.gbt-app-shell__link` (in `_utilities.scss`) for styling; `aria-current="page"` denotes the current page — never a class alone. When using `collapsed`, each link's structure must be `<gbt-icon .../><span>Label</span>` — the icon stays visible in the rail, and the `<span>` is what the hover/focus flyout reveals. |
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
  collapseLabel="Réduire la navigation"
  expandLabel="Agrandir la navigation"
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

With `collapsed` bound, each `[shell-nav]` link must use the `<gbt-icon
.../><span>Label</span>` structure described in the table above, so the
hover/focus flyout has a label to reveal. Since you already own the
`sidebarCollapsed` signal to drive `[collapsed]`/`(collapsedChange)`, reuse
it in `[shell-brand]` to swap in a compact logo yourself — no extra input
or output needed on `AppShell` for this:

```html
<gbt-app-shell
  navLabel="Navigation principale"
  skipLabel="Aller au contenu principal"
  openMenuLabel="Ouvrir la navigation"
  closeMenuLabel="Fermer la navigation"
  collapseLabel="Réduire la navigation"
  expandLabel="Agrandir la navigation"
  [collapsed]="sidebarCollapsed()"
  (collapsedChange)="sidebarCollapsed.set($event)"
>
  <a shell-brand href="/">
    @if (sidebarCollapsed()) {
      <gbt-icon name="logo-mark" />
    } @else {
      <gbt-icon name="logo-full" />
      <span>Hangar</span>
    }
  </a>
  <a shell-nav href="/depots" class="gbt-app-shell__link" aria-current="page">
    <gbt-icon name="folder" />
    <span>Dépôts</span>
  </a>
  <h1 shell-header>Dépôts</h1>
  <p>Le contenu de la page.</p>
</gbt-app-shell>
```

With `[collapsible]="false"`, the built-in button is omitted — `collapseLabel`/
`expandLabel` become unnecessary, and `collapsed`/`(collapsedChange)` stay
available if you drive the state from your own control elsewhere:

```html
<gbt-app-shell
  navLabel="Navigation principale"
  skipLabel="Aller au contenu principal"
  openMenuLabel="Ouvrir la navigation"
  closeMenuLabel="Fermer la navigation"
  [collapsible]="false"
>
  <a shell-brand href="/">Hangar</a>
  <a shell-nav href="/depots" class="gbt-app-shell__link" aria-current="page">Dépôts</a>
  <h1 shell-header>Dépôts</h1>
  <p>Le contenu de la page.</p>
</gbt-app-shell>
```
