# NavTabs (`gbt-nav-tabs` and `a[gbtNavTab]`)

A navigation between the sections of a page (repository settings, account settings…) as **real links**: the
application projects `a[gbtNavTab]` items into `gbt-nav-tabs`. It is the link counterpart of
[`gbt-tabs`](../tabs/README.md), which is for panels that switch in place.

It is **router-agnostic**: no `@angular/router` anywhere in the library. The application decides which item is
active (`[active]`) and puts `routerLink` or a plain `href` on each anchor, so sections stay deep-linkable, the
back button walks through them, and middle-click / "open in a new tab" keep working. Keyboard behaviour is that of
native links: Tab, Shift+Tab and Enter (no roving tabindex, no arrow-key handling — it is a list of links, not a
`tablist`).

**Selectors**: `gbt-nav-tabs` (class `NavTabs`) and `a[gbtNavTab]` (class `NavTab`), both standalone.

```ts
import { NavTab, NavTabs } from '@masmarino/gabarit'
```

## `gbt-nav-tabs` inputs

| Input         | Type                         | Default        | Role                                                                                                                                                      |
| ------------- | ---------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`   | `string`                     | `''`           | Accessible name of the `<nav>` landmark. Give one (it is what a screen-reader user hears in the landmark list); ignored when `landmark` is `false`.       |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | `horizontal`: underline tabs above a section. `vertical`: a list of pill links for a side column.                                                         |
| `landmark`    | `boolean`                    | `true`         | Render the links in a `<nav>` of their own. Pass `false` inside a navigation that already exists (a `gbt-page-layout` `[page-nav]`): no nested landmarks. |

## `a[gbtNavTab]` inputs

| Input    | Type                       | Default | Role                                                                                                                         |
| -------- | -------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `active` | `boolean`                  | `false` | This item is the current page or section: sets `aria-current="page"` and the active look. At most one item should be active. |
| `icon`   | `string \| null`           | `null`  | Registered icon name before the label. Decorative (`aria-hidden`): the label names the link.                                 |
| `badge`  | `number \| string \| null` | `null`  | A counter pill after the label — `0` and `'20+'` included, `null` and `''` show nothing. Read as part of the link's name.    |

The label is the projected content.

## Behaviour

- **Horizontal** is a row of underline tabs with a hairline under it. When the tabs overflow, the row scrolls to
  the active one (keeping a glimpse of the previous tab) — the list scrolls, never the page — and fades at the edge
  that hides tabs. A tab keeps the width of its bold state, so nothing shifts when the active tab changes.
- **Vertical** is a list of pills, the active one with an accent bar on its leading edge (not the tint alone). While
  a [`gbt-page-layout`](../page-layout/README.md) stacks its columns (its container is ≤ 768 px wide),
  a vertical nav folds into that same row of tabs above the section, instead of pushing it far down. Outside a page
  layout it stays a list.
- Both look at the active tab through `aria-current="page"`, which is what assistive technology reads.

## Examples

Router-less (plain hrefs; the application owns the active section):

```html
<gbt-nav-tabs ariaLabel="Repository settings">
  <a
    gbtNavTab
    href="#general"
    icon="settings"
    [active]="section() === 'general'"
    (click)="section.set('general')"
    >General</a
  >
  <a
    gbtNavTab
    href="#webhooks"
    icon="bell"
    [badge]="3"
    [active]="section() === 'webhooks'"
    (click)="section.set('webhooks')"
    >Webhooks</a
  >
</gbt-nav-tabs>
```

With the Angular router, in the application (the library never imports it):

```html
<gbt-nav-tabs ariaLabel="Account settings">
  @for (section of sections; track section.path) {
  <a
    gbtNavTab
    [routerLink]="section.path"
    routerLinkActive
    #rla="routerLinkActive"
    [active]="rla.isActive"
    [icon]="section.icon"
    >{{ section.label }}</a
  >
  }
</gbt-nav-tabs>
```

Do not also set `ariaCurrentWhenActive` on the same element: `active` already sets `aria-current`. A matcher of your
own just computes the boolean you feed to `[active]`.

Inside a page layout's nav column, without a second landmark:

```html
<gbt-page-layout navLabel="Repository settings">
  <gbt-nav-tabs page-nav orientation="vertical" [landmark]="false">…</gbt-nav-tabs>
  …the section…
</gbt-page-layout>
```

## Accessibility

See [AUDIT.md](AUDIT.md).
