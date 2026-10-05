# RGAA Audit — RadioGroup

Verified against RGAA 4.1.2 by exercising `Molecules/RadioGroup` in
Storybook (stories `Vertical`, `Horizontal`, `WithError`, `Disabled`,
`Dark`) and by code review (`radio-group.ts`, `radio-group.html`,
`radio-group.scss`).

| Criterion   | Short title                             | Verification                                                                                                                                                                                                                                                          | Result                                     |
| ----------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 3.1         | Information not conveyed by color alone | The checked state is carried by native browser rendering (filled dot vs. empty ring), not by `accent-color` alone.                                                                                                                                                    | Compliant                                   |
| 3.2         | Text contrast                           | `--text-primary` (option labels) and `--text-secondary` (legend) on `--bg-principal`, both covered by `contrast.spec.ts`.                                                                                                                                             | Compliant (delegated)                       |
| 7.1         | Scripts compatible with assistive tech  | Native `<fieldset>`/`<legend>` and grouped `<input type="radio" name="...">` — no custom ARIA role reimplemented. 0 axe violations, empty and with an option selected + error shown (`radio-group.spec.ts`, "presents no accessibility violation").                  | Compliant                                   |
| 7.3         | Keyboard- and pointer-operable          | Native radio inputs sharing one `name`: Tab enters the group once, arrow keys move and select between options, Space/click select — entirely browser-native, no `keydown` handler in `radio-group.ts` to get wrong.                                                  | Compliant (native behavior, code review)    |
| 10.7        | Visible focus indicator                 | No `outline` rule anywhere in `radio-group.scss` — the browser's default focus outline on the native input stays active, not suppressed.                                                                                                                              | Compliant (code review)                     |
| 11.1        | Label presence                          | Group legend via `<legend>` (required `label` input, can't be omitted — no empty-label failure mode like `Checkbox`). Each option's text sits in a `<span>` inside its `<label>` (implicit association, same pattern as `Checkbox`).                                  | Compliant                                   |
| 11.4        | Label position                          | Legend precedes the options (native `<fieldset>` order); each option's text follows its radio input, the conventional position for checkbox/radio controls.                                                                                                           | Compliant                                   |
| WCAG 2.5.8  | 24×24px target size                     | `.gbt-radio-group__option` (the `<label>`) carries the same absolutely-positioned `::before` technique as `Checkbox`, extending the clickable area to at least 24×24px. Measured in Storybook (`Dark` story, `getComputedStyle(label, '::before')`): **340 × 24px**. | Compliant — verified                        |
| —           | Per-option disable                      | `option.disabled` is OR'd with the group's own `disabled`/form-disabled state per input, tested ("disables only the option marked disabled") — a disabled option can't be reached by Tab/arrow keys (native browser behavior for `disabled` radio inputs).           | Compliant                                   |

## Value propagation

`ControlValueAccessor`-based, same shape as `Checkbox`/`Select`:
`writeValue` sets the checked option from the form value,
`selectOption` (wired to each input's `(change)`) calls `onChange` —
tested through a real `ReactiveFormsModule` host (`formControlName`),
not by calling the CVA methods directly, matching `checkbox.spec.ts`'s
convention.

Dark mode confirmed visually in Storybook (`Dark` story): legend,
option labels and the disabled option's reduced-opacity state all
legible against the dark background; clicking an option (verified:
"Publié") moves the checked state and un-checks the previous one,
native mutual exclusivity via the shared `name`.
