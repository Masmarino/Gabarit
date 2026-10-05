# RGAA Audit — MenuItem

Verified against RGAA 4.1.2 by exercising `Molecules/MenuItem` and `Molecules/Menu` in Storybook
(stories `RowMenu`, `TextOnly`, `States`, `Dark`, `StatesDark`) with real keyboard use, and by code
review (`menu-item.ts`, `menu-item.html`, `menu-item.scss`).

## Checklist

| Criterion  | Short title                                  | Verification                                                                                                                                                                                                                                                            | Result                |
| ---------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 7.1        | Scripts compatible with assistive technology | The host element itself is the `menuitem` (`role="menuitem"` on a native `<button>`/`<a>`), directly inside the menu's `role="menu"`: no wrapper between them. 0 axe violations in an open menu with icons, a link, a danger and a disabled item (`menu-item.spec.ts`). | Compliant             |
| 7.3        | Keyboard- and pointer-operable               | Native button/link activation (Enter/Space on a button, Enter on a link). Reached with ↑ ↓ Home End through the menu; disabled items stay reachable. Tab leaves the menu (no trap).                                                                                     | Compliant             |
| 3.1        | Information not conveyed by color alone      | `danger` recolours the item but the label states the action; disabled is `aria-disabled` + reduced opacity + `not-allowed` cursor; hover/focus fills come with the focus ring of the shared `.gbt-menu__item`.                                                          | Compliant             |
| 3.2        | Text contrast                                | Default: `--text-primary` on the menu surface. Danger: `--color-error-text` on `--bg-principal` (`contrast.spec.ts`, 7:1 both themes) and `--color-error-bg-text` on `--color-error-bg` for hover/focus (asserted at 7:1 both themes).                                  | Compliant (delegated) |
| 10.7       | Visible focus indicator                      | The 2px `--focus-ring` ring of `.gbt-menu__item` (`outline-offset: -2px`) is kept; for `danger` the focus additionally fills the item red.                                                                                                                           | Compliant             |
| 11.9       | Button/link titles                           | The accessible name is the projected label (the icon is `aria-hidden`).                                                                                                                                                                                                 | Compliant (delegated) |
| 12.11      | Hidden content ignored by assistive tech     | The item icon is decorative and always `aria-hidden="true"`.                                                                                                                                                                                                            | Compliant             |
| WCAG 4.1.2 | Name, role, value                            | Disabled state is exposed with `aria-disabled="true"` (not the native `disabled`, which would remove the item from the arrow-key path); asserted, and the click is verified to be swallowed for a button, a link, a link's middle click and the icon.                   | Compliant             |
| WCAG 2.5.8 | 24×24px target size                          | Each item is at least 14px text + 8px vertical padding on both sides and the full menu width (measured in Storybook `RowMenu`: 32.5px tall).                                                                                                                            | Compliant — verified  |

## Notes

- Menu items are not tab stops (`tabindex="-1"`), following the APG menu-button pattern: focus is
  moved into the menu by the trigger and travels with the arrow keys.
- Externalized strings: none — labels come from the consumer.
