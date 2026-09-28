# AppShellNavGroup (`gbt-app-shell-nav-group`)

A collapsible group of links for the `[shell-nav]` slot of [`gbt-app-shell`](../app-shell/README.md): a toggle that
wears the shell's link look and the sub-links below it, indented, including in the collapsed 64 px rail.

**Selector**: `gbt-app-shell-nav-group` — class `AppShellNavGroup`, standalone.

```ts
import { AppShellNavGroup } from '@masmarino/gabarit'
```

## Inputs

| Input      | Type              | Default | Role                                                                                                       |
| ---------- | ----------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `label`    | `string`          | —       | Required. The name of the group, on the toggle (and in the rail's flyout).                                 |
| `icon`     | `string \| null`  | `null`  | Registered icon name before the label. Needed for the collapsed rail, which only shows icons.              |
| `expanded` | `boolean` (model) | `false` | Whether the sub-links are shown. Two-way: `[(expanded)]`. `expandedChange` fires when the user toggles it. |

The default content is the sub-links: your own anchors (or buttons) wearing `.gbt-app-shell__link`.

## Example

```html
<gbt-app-shell …>
  <a shell-nav href="/repositories" class="gbt-app-shell__link"
    ><gbt-icon name="folder" /><span>Repositories</span></a
  >

  <gbt-app-shell-nav-group
    shell-nav
    label="Administration"
    icon="shield-check"
    [(expanded)]="adminOpen"
  >
    <a
      routerLink="/admin/users"
      routerLinkActive
      ariaCurrentWhenActive="page"
      class="gbt-app-shell__link"
    >
      <gbt-icon name="users" /><span>Users</span>
    </a>
    <a
      routerLink="/admin/health"
      routerLinkActive
      ariaCurrentWhenActive="page"
      class="gbt-app-shell__link"
    >
      <gbt-icon name="activity" /><span>Health</span>
    </a>
  </gbt-app-shell-nav-group>
</gbt-app-shell>
```

It is router-agnostic (no `@angular/router` in the library): the sub-links are yours, and the current one carries
`aria-current="page"` like any shell link.

## Behaviour

- The toggle is a native `<button aria-expanded aria-controls>` named by `label`; its name does not change with the
  state (no "Expand" / "Collapse" pair to announce), `aria-expanded` tells it. The panel stays in the DOM and is
  `hidden` while collapsed, so its links leave the tab order. The chevron points down, and up when expanded.
- While one of the sub-links is `aria-current`, the toggle reads stronger (weight and text colour), so a collapsed
  group still tells where the user is. It does not expand by itself: bind `[expanded]` if the group should open on the
  current section.
- **In the collapsed 64 px rail** the group behaves like a top-level icon: only the icon shows (the label appears in
  the shell's hover/focus flyout), a small chevron sits beside the icon instead of being clipped by the 40 px link box,
  and the sub-links have no indent, so their icons line up under the top-level ones. An expanded group is outlined by a
  hairline so its icons read as a group. **Give every sub-link an icon** (`<gbt-icon /><span>Label</span>`): text alone
  would disappear in the rail.
- In the mobile drawer (below 768 px) it works as in the full-width navigation, and the drawer's focus trap ignores the
  links of a collapsed group.

The indent, the rail alignment and the "current group" weight live in the global stylesheet (`tokens/_utilities.scss`,
like `.gbt-app-shell__link`), because the sub-links are projected by the application.

## Accessibility

See [AUDIT.md](./AUDIT.md).
