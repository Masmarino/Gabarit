# RGAA Audit — AvatarGroup

Verified against RGAA 4.1.2 by exercising `Molecules/AvatarGroup` in
Storybook (stories `NoOverflow`, `WithOverflow`, `FilterByUser`, `Dark`)
and by code review (`avatar-group.ts`, `avatar-group.html`,
`avatar-group.scss`).

`gbt-avatar-group` sets no ARIA role on its own host — every avatar
(visible or in the overflow menu) is a plain native `<button>`, and the
overflow panel reuses `Menu`'s exact pattern (`role="menu"` /
`role="menuitem"`).

## Checklist

| Criterion   | Short title                                    | Verification                                                                                                                                                                                                                 | Result                |
| ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 7.1         | Scripts compatible with assistive technology   | The "+N" trigger carries `aria-haspopup="menu"` and `aria-expanded`; the panel is `role="menu"` with `role="menuitem"` buttons — identical structure to `Menu`, already audited. 0 axe violations, no overflow and with the panel open (`avatar-group.spec.ts`). | Compliant               |
| 7.3         | Keyboard- and pointer-operable                 | Every avatar is a plain native `<button>` — normal tab order, `Enter`/`Space` activates, no custom roving-tabindex needed. `Escape` closes the open overflow panel (`avatar-group.spec.ts`, "closes the panel on Escape").    | Compliant               |
| 7.4         | No uncontrolled context change                 | The overflow panel only opens on an explicit click of "+N", and only closes on `Escape`, an outside click, or picking one of its items — never on a mere hover.                                                              | Compliant               |
| 9.3         | Appropriate list structure                     | The avatar row is a `<ul>` of `<li>`; the overflow panel's items are each a `<li role="presentation">` wrapping a `<button role="menuitem">` — same structure `Menu`'s projected items already use.                          | Compliant               |
| 11.1        | Label presence                                 | Each avatar button carries `[attr.aria-label]="item.name"` — the accessible name is the full name, not the two-letter fallback text inside `Avatar` (which itself is already labelled — see `Avatar`'s own audit). The "+N" button is labelled via `moreLabel()`. | Compliant               |
| WCAG 2.4.11 | Focus not obscured                             | The overflow panel uses `position: fixed` computed from the "+N" button's `getBoundingClientRect()`, the same technique as `Select`/`Menu` — it escapes an ancestor's `overflow: hidden`.                                    | Compliant               |
| 7.1 / WCAG 4.1.2 | State conveyed to assistive technology     | `activeItem`'s state is never color-only: the active visible avatar carries `aria-current="true"` (in addition to its outer ring), and the active overflow row carries `aria-current="true"` alongside the visible `check` icon — matching `Select`'s `aria-selected` + check-icon pattern for its multi-select options. | Compliant               |

## Why overlapping avatars still pass 7.3 without a custom hit-area trick

Each avatar button is a full 32×32px circle (or 24×24px if a consumer
reduces `Avatar`'s size) — the overlap only affects the *visual*
layering (`margin-left: -8px` plus a `box-shadow` ring to separate
adjacent circles), never the actual clickable/tappable area, which
stays the full circle underneath. Hovering or focusing a button raises
it via `z-index` so its full circle is never obscured by its neighbor
on top.

## Externalized strings

`ariaLabel` and `moreLabel` (a function input, like `Pagination`'s
`pageLabel`) default to English and are meant to be localized by the
consuming app.

Dark mode is visually confirmed in Storybook (`Dark` story).
