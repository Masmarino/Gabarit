# RGAA Audit — Textarea

Verified against RGAA 4.1.2 by exercising `Atoms/Textarea` in
Storybook (stories `Empty`, `Filled`, `Error`, `Disabled`, `Dark`) and
by code review (`textarea.ts`, `textarea.html`, `textarea.scss`).
Reuses the exact tokens and structure of `Input`'s audited fields, so
most criteria carry over identically.

| Criterion   | Short title                    | Verification                                                                                                                                                                                                                                                                            | Result                            |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 3.2         | Text contrast                  | Covered by `contrast.spec.ts` (`--text-primary`, `--text-secondary` on `--bg-principal`), same tokens as `Input`.                                                                                                                                                                        | Compliant for the tested tokens    |
| 3.3         | Component contrast             | `--border-color` on the field's outline, same value/ratio already audited for `Input`; `:focus-visible` adds a dedicated `2px solid var(--primary)` outline, offset by `1px`.                                                                                                          | Compliant                          |
| 7.3         | Keyboard- and pointer-operable | Tested via the native `input` event (`textarea.spec.ts`) — no handler intercepts keystrokes. Resizing (`resize: vertical`) is the browser's native drag handle, not reimplemented.                                                                                                     | Compliant                          |
| 10.7        | Visible focus indicator        | Same pattern as `Input`: `:focus { outline: none }` replaced by `:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px }` — verified visually in Storybook (`Dark` story, focus ring visible while typing).                                                          | Compliant — verified               |
| 11.1        | Label presence                 | `label()` optional but associated via `[for]="id()"` / `[id]="id()"` with an auto-generated id (`gbt-textarea-N`) — no orphan label possible on the component's side.                                                                                                                    | Compliant when `label` is provided |
| 11.2        | Label relevance                | Entirely delegated to the consumer (`input<string>`) — nothing hardcoded to check.                                                                                                                                                                                                       | Compliant (delegated)              |
| 11.4        | Label position                 | `<label>` before `<textarea>` in the flow, above the field — same convention as `Input`.                                                                                                                                                                                                 | Compliant                          |
| 11.11       | Label/format with a hint       | `errorMessage` linked via `[attr.aria-describedby]="id() + '-error'"` and `role="alert"` — tested ("renders the error message and wires aria-invalid/aria-describedby").                                                                                                                | Compliant                          |
| 10.11       | 320px reflow                   | **Regression found and fixed** (see below) — `document.body.scrollWidth` measured 382px against a 372px viewport before the fix (10px, i.e. `2×padding + 2×border`, overflowing past the field's container). Re-verified at both the default Storybook canvas width and 320×600: `scrollWidth === clientWidth` in both. | Compliant — verified                |
| WCAG 2.5.8  | 24×24px target size            | No small interactive control on this component (unlike `Input`'s password toggle) — the field itself is a large target by nature. Not applicable.                                                                                                                                       | Not applicable to this component   |
| WCAG 2.4.11 | Focus not obscured             | No scrolling container specific to the component.                                                                                                                                                                                                                                        | Not applicable to this component   |

## Box-sizing regression (found post-ship, fixed)

`textarea` computed to `box-sizing: content-box` by default — unlike
`<input>`, which stayed flush with its container under the same
`width: 100%` + padding + border despite also reporting `content-box`
(a form-control sizing quirk, not something either component's own
CSS controlled). For `<textarea>` this meant the rendered box was
`2×padding + 2×border` (~26px) wider than its wrapper, producing a
real horizontal scrollbar — caught by a user visually inspecting the
component, not by the test suite (jsdom doesn't compute real layout
boxes, so this class of bug is invisible to `textarea.spec.ts`).
Fixed with an explicit `box-sizing: border-box` on `textarea` in
`textarea.scss`. Worth checking for on any future component that pairs
`width: 100%` with padding/border on a native form element.

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
