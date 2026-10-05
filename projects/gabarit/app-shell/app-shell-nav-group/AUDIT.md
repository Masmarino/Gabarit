# RGAA Audit — AppShellNavGroup

Verified against RGAA 4.1.2 by exercising `Templates/AppShellNavGroup` in Storybook (stories `Default`,
`GroupCollapsed`, `InCollapsedRail`, `InCollapsedRailFolded`, `InMobileDrawer`, `Dark`, `InCollapsedRailDark`, with the
keyboard: Tab, Enter, Space) and by code review (`app-shell-nav-group.ts`, `.html`, `.scss`, `tokens/_utilities.scss`).

## Checklist

| Criterion  | Short title                                    | Verification                                                                                                                                                                                                                                                                                        | Result    |
| ---------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 7.1        | Scripts compatible with assistive technology   | A native `<button type="button">` with `aria-expanded` (kept in sync with the model) and `aria-controls` pointing at the panel's id (distinct per instance). Its accessible name is the label and does not change with the state. Tested.                                                           | Compliant |
| 7.3        | Keyboard operable                              | Everything is the button: Enter and Space toggle it natively. Collapsed, the panel is `hidden`, so its links are out of the tab order; expanded, they follow the toggle in DOM order. The mobile drawer's focus trap ignores hidden links (tested).                                                 | Compliant |
| 10.7       | Focus visible                                  | The toggle is a `.gbt-app-shell__link`: `:focus-visible` draws a 2px `--focus-ring` outline inside it; in the collapsed rail the flyout label also appears on focus, not only on hover.                                                                                                               | Compliant |
| 3.1        | Information not conveyed by colour alone       | Expanded or not is `aria-expanded` and the chevron's direction; the group that holds the current page is heavier (weight) as well as darker; the current sub-link is `aria-current="page"`.                                                                                                         | Compliant |
| 3.2 / 3.3  | Text and component contrast                    | Toggle and sub-links use `--text-secondary` (`--text-primary` for the current group) on the shell's `--bg-panel`, 7:1 also under `--bg-hover`; the current link is `--text-primary` on a 9% ink tint with a rust mark (7:1); the rail's outline is a decorative hairline (`tokens/contrast.spec.ts`, "navigation"). | Compliant |
| 12.11      | Hidden content ignored by assistive technology | The chevron and icons are `aria-hidden`; a collapsed panel is `hidden`.                                                                                                                                                                                                                             | Compliant |
| 13.8       | Moving content can be controlled               | The chevron's 150 ms rotation is removed under `prefers-reduced-motion: reduce`.                                                                                                                                                                                                                    | Compliant |
| WCAG 2.5.8 | Target size minimum                            | The toggle and sub-links are as tall as any shell link (about 34 px, 32 px for sub-links) and as wide as the nav.                                                                                                                                                                                   | Compliant |

## Accessibility test

`app-shell-nav-group.spec.ts` runs axe collapsed, expanded with an icon, and inside a collapsed `gbt-app-shell`: 0 violations.

## Externalized strings

`label` is the only text and is an input (no default); the sub-links are projected.
