# RGAA Audit — Textarea

Verified against RGAA 4.1.2 by exercising `Atoms/Textarea` in
Storybook (stories `Empty`, `Filled`, `Error`, `Disabled`, `Dark`) and
by code review (`textarea.ts`, `textarea.html`, `textarea.scss`).
Reuses the exact tokens and structure of `Input`'s audited fields, so
most criteria carry over identically.

| Criterion   | Short title                    | Verification                                                                                                                                                                                                                                                                                                            | Result                             |
| ----------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 3.2         | Text contrast                  | Covered by `contrast.spec.ts` (`--text-primary`, `--text-secondary` on `--bg-principal`), same tokens as `Input`.                                                                                                                                                                                                       | Compliant for the tested tokens    |
| 3.3         | Component contrast             | `--border-color` on the field's outline, same value/ratio already audited for `Input`; `:focus-visible` adds a dedicated 2px `--focus-ring` outline (the rust, 5.2:1), offset by `1px`.                                                                                                                                           | Compliant                          |
| 7.3         | Keyboard- and pointer-operable | Tested via the native `input` event (`textarea.spec.ts`) — no handler intercepts keystrokes. Resizing (`resize: vertical`) is the browser's native drag handle, not reimplemented.                                                                                                                                      | Compliant                          |
| 10.7        | Visible focus indicator        | Same pattern as `Input`: `:focus { outline: none }` replaced by `:focus-visible { outline: 2px solid var(--gbt-focus-ring, var(--focus-ring)); outline-offset: 1px }` — verified visually in Storybook (`Dark` story, focus ring visible while typing).                                                                                           | Compliant — verified               |
| 11.1        | Label presence                 | `label()` optional but associated via `[for]="id()"` / `[id]="id()"` with an auto-generated id (`gbt-textarea-N`) — no orphan label possible on the component's side.                                                                                                                                                   | Compliant when `label` is provided |
| 11.2        | Label relevance                | Entirely delegated to the consumer (`input<string>`) — nothing hardcoded to check.                                                                                                                                                                                                                                      | Compliant (delegated)              |
| 11.4        | Label position                 | `<label>` before `<textarea>` in the flow, above the field — same convention as `Input`.                                                                                                                                                                                                                                | Compliant                          |
| 11.11       | Label/format with a hint       | `errorMessage` linked via `[attr.aria-describedby]="id() + '-error'"` and `role="alert"` — tested ("renders the error message and wires aria-invalid/aria-describedby").                                                                                                                                                | Compliant                          |
| 10.11       | 320px reflow                   | `textarea.scss` sets `box-sizing: border-box` explicitly (native `<textarea>` defaults to `content-box`, unlike `<input>`), keeping the field flush with its container under `width: 100%` plus padding and border. Verified at both the default Storybook canvas width and 320×600: `scrollWidth === clientWidth` in both. | Compliant — verified               |
| WCAG 2.5.8  | 24×24px target size            | No small interactive control on this component (unlike `Input`'s password toggle) — the field itself is a large target by nature. Not applicable.                                                                                                                                                                       | Not applicable to this component   |
| WCAG 2.4.11 | Focus not obscured             | No scrolling container specific to the component.                                                                                                                                                                                                                                                                       | Not applicable to this component   |

## Resize

`resize: vertical` — native browser drag handle, disabled
(`resize: none`) when the field is `disabled`, since a disabled
control offering a live resize handle would be a confusing affordance
for a field the user can't otherwise interact with.

Dark mode confirmed visually in Storybook (`Dark` story): label
`rgb(158, 189, 207)`, field border `rgb(67, 106, 128)` — the exact
same resolved values already audited for `Input` (both components pull
from `--text-secondary`/`--border-color`). Typing was exercised with a
real keyboard interaction (`Test de saisie`), confirming the `(input)`
binding and focus ring both work outside of the test suite.

## `hint`, `hideLabel`, `mono` and `autosize`

Verified by `textarea.spec.ts` (including a default-rendering check), by code
review and in Storybook (stories `WithHint`, `HintReplacedByError`,
`HiddenLabel`, `Mono`, `Autosize`, `Resize`, `DarkFields`).

| Criterion | Short title              | Verification                                                                                                                                                                                    | Result    |
| --------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 3.2       | Text contrast            | Hint in `--text-secondary`, same pairs as `Input` (`contrast.spec.ts`); `mono` changes the font only.                                                                                           | Compliant |
| 10.4      | Text resizing            | `autosize` sizes the field in pixels from the rendered content and `maxRows` caps it with a `max-height` in `lh` units, so browser zoom / text-only zoom keep the same number of visible lines. | Compliant |
| 11.1      | Label presence           | `hideLabel` keeps the `<label for>` in the DOM, visually hidden with the clip-path pattern: the field keeps its accessible name (axe `label` rule, `textarea.spec.ts`).                         | Compliant |
| 11.11     | Label/format with a hint | `hint` renders `<p id="<id>-hint">` referenced by `aria-describedby`; hidden and unlinked while `errorMessage` shows, so the description is one message at a time.                              | Compliant |

`autosize` removes the drag handle (`resize: none`) because the two would
fight over the height; when a consumer wants a handle it leaves `autosize` off.
