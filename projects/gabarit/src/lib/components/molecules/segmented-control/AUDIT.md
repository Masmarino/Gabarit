# RGAA Audit — SegmentedControl

Verified against RGAA 4.1.2 by exercising `Molecules/SegmentedControl`
in Storybook (stories `Nominal`, `WithDisabledOption`, `Disabled`,
`Dark`) — real keyboard use and `getBoundingClientRect` run in the
browser console — and by code review (`segmented-control.ts`,
`segmented-control.html`, `segmented-control.scss`).

## Checklist

| Criterion  | Short title                                  | Verification                                                                                                                                                                                                                                                                                                       | Result                                     |
| ---------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 7.1        | Scripts compatible with assistive technology  | `role="radiogroup"` on the container, `role="radio"` + `aria-checked` on each `<button>` — 0 axe violations (`segmented-control.spec.ts`, "has no a11y violations"). Tested directly that exactly one option is `aria-checked="true"` at a time ("marks the option matching value as checked").                     | Compliant                                  |
| 7.3        | Keyboard- and pointer-operable                | Arrow keys move selection *and* focus together, immediately — matching native `<input type="radio">` group behavior, not requiring a separate activation step. Tested (`segmented-control.spec.ts`, "moves selection and focus with ArrowRight/ArrowLeft, wrapping...", "jumps to the first/last option with Home/End", "skips a disabled option..."), reproduced with real keyboard input in Storybook (`Nominal` story: focus "Mois", `ArrowLeft` → focus and selection both move to "Semaine"). | Compliant — verified under real conditions |
| 10.7       | Visible focus indicator                       | `.gbt-segmented-control__option:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px }` — a mouse click leaves no outline, confirming `:focus-visible`, not `:focus`, is the trigger.                                                                                                            | Compliant                                  |
| 11.1       | Label presence                                | `ariaLabel` names the `radiogroup` — there's no visible legend, so an explicit accessible name is required and documented as such in the README, rather than silently omitted. Tested ("names the group via ariaLabel").                                                                                          | Compliant                                  |
| 12.8       | Consistent tab order                          | Roving tabindex: only the checked option has `[tabIndex]="0"`, the others `-1` — tested ("gives only the checked option a tabIndex of 0, others -1").                                                                                                                                                              | Compliant                                  |
| WCAG 2.5.8 | 24×24px target size                           | Measured in Storybook (`getBoundingClientRect`, `Nominal` story), smallest option ("Jour", the shortest label): **52.17 × 27.5px** — clears the threshold without needing `Modal`/`Drawer`'s `::before` target-area trick.                                                                                         | Compliant                                  |

## Why `radiogroup`/`radio`, not a `tablist`

The issue explicitly poses this fork. The primary use this component
targets — switching a displayed view (a chart's period, a sort order)
— is a **value selection**, conceptually the same choice a set of
`<input type="radio">` would make, just styled as a compact button
row instead of circles. `Tabs`' `role="tablist"`/`tab`/`tabpanel`
pattern carries page-navigation semantics (moving between different
regions of content) that don't apply here — nothing about this
component owns or labels a corresponding panel.

## Why arrow keys move and select together, unlike `Tabs`

This mirrors the native `<input type="radio">` group behavior exactly
(arrowing to a radio checks it immediately, no separate "activate"
step) because `role="radio"` tells assistive technology to expect that
exact behavior — deviating from it (arrows move focus only, requiring
Enter/Space to select, as `Tabs` does for `tab`) would contradict the
ARIA role's own implied semantics.

## Externalized strings

None — `SegmentedControl` introduces no default text; every option's
label and the group's `ariaLabel` come from the consumer.

Dark mode is visually confirmed in Storybook (`Dark` story) — the
selected pill and unselected labels both legible, no contrast
regression.
