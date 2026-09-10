# RGAA Audit — Switch

Verified against RGAA 4.1.2 by exercising `Atoms/Switch` in Storybook
(stories `Unchecked`, `Checked`, `Disabled`, `Dark`) and by code review
(`switch.ts`, `switch.html`, `switch.scss`).

| Criterion   | Short title                             | Verification                                                                                                                                                                                                                                                                                                     | Result                                                   |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| 3.1         | Information not conveyed by color alone | The state is carried by the thumb's position (left/right) and the track's fill, not by hue alone — verified visually in Storybook (`Unchecked` vs `Checked`).                                                                                                                                                   | Compliant                                                 |
| 3.2         | Text contrast                           | Covered by `contrast.spec.ts` (`--text-primary` on `--bg-principal`).                                                                                                                                                                                                                                            | Compliant (delegated)                                     |
| 7.1         | Scripts compatible with assistive tech  | `<input type="checkbox" role="switch">` — a native checkbox with the ARIA `switch` role layered on, a well-supported pattern (no custom `aria-checked` bookkeeping needed, the browser derives it from `:checked`). 0 axe violations, unchecked and checked (`switch.spec.ts`).                                 | Compliant                                                 |
| 7.3         | Keyboard- and pointer-operable          | Native `<input type="checkbox">` — Space toggles by browser default, no `keydown` handler intercepts it. `onToggle` reacts to `change`, fired by both keyboard and mouse. Tested ("propagates a click back to the form control").                                                                              | Compliant                                                 |
| 10.7        | Visible focus indicator                 | The native input is visually hidden (`opacity: 0`) but stays focusable — `.gbt-switch__input:focus-visible + .gbt-switch__track` draws an explicit `outline: 2px solid var(--primary)` on the visible track, since the invisible input's own outline wouldn't be seen otherwise (same reasoning as `Toaster`'s close button, inverted: here the focus ring must be *added*, not left alone). | Compliant                                                 |
| 11.1        | Label presence                          | `label()` rendered inside a `<span>` within the enclosing `<label>` (implicit association), same pattern as `Checkbox`.                                                                                                                                                                                          | Compliant when `label` is provided                        |
| 11.4        | Label position                          | Label text follows the visual switch in the DOM, the conventional position for a checkbox/switch (unlike `Input`, where the label precedes the field).                                                                                                                                                          | Compliant                                                 |
| WCAG 2.5.8  | 24×24px target size                     | `.gbt-switch` (the label) carries the same absolutely-positioned `::before` technique as `Checkbox`, extending the target area with no change to the visible track/thumb rendering (the track alone is only 20px tall). Measured in Storybook (`Dark` story, `getComputedStyle(label, '::before')`): **198.852 × 24px**. | Compliant — verified                                      |

## Native input, hidden but not removed

The checkbox input is hidden with `opacity: 0`, not `display: none` or
`visibility: hidden` — it stays in the accessibility tree, focusable,
and is the actual element receiving `role="switch"`. The visible
track/thumb are two sibling `<span>`s driven purely by the CSS
`:checked` and `:focus-visible` pseudo-classes on that input — no
JavaScript computes or mirrors the visual state.

Dark mode confirmed visually in Storybook (`Dark` story): label text
and both switch states (checked shown) legible against the dark
background. Clicking the track (verified in `Unchecked`) moves the
thumb and fills the track, confirming the sibling-selector wiring
works via real pointer interaction, not only via `writeValue` in
tests.
