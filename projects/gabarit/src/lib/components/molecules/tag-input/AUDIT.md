# RGAA Audit — TagInput

Verified against RGAA 4.1.2 by exercising `Molecules/TagInput` in
Storybook (stories `Empty`, `WithValues`, `CustomColor`, `WithError`,
`Disabled`, `Dark`) and by code review (`tag-input.ts`,
`tag-input.html`, `tag-input.scss`).

## Checklist

| Criterion | Short title                                       | Verification                                                                                                                                                                                                     | Result   |
| --------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 7.1       | Scripts compatible with assistive technology           | 0 axe violations, empty and with tags present (`tag-input.spec.ts`, "has no a11y violations" ×2). Each tag's remove button carries an `aria-label` naming that specific tag's value, not a generic "Remove".        | Compliant |
| 7.3       | Keyboard-operable                                       | Every capability is reachable from the keyboard alone: type + `Enter`/`,` to add, `Backspace` on an empty field to remove the last tag, `Tab` to each tag's own remove button. Tested individually (`tag-input.spec.ts`, "commits the current text...", "removes the last tag on Backspace...", "removes a tag when its own remove button is clicked..."). | Compliant |
| 7.4       | No uncontrolled context change                          | A tag is only ever added on an explicit separator key or blur (committing a *typed* value, never on an arbitrary keystroke) and only ever removed on an explicit Backspace-on-empty or a remove-button click.       | Compliant |
| 11.1      | Label presence                                          | `removeLabel` names each tag's remove button with that tag's own value — reused from `Tag`'s own already-audited `removeLabel` input, not reimplemented.                                                          | Compliant |

## Why clicking the field container is a documented lint exception

`.gbt-tag-input__field`'s `(click)="focusInput()"` lets a click
anywhere in the field's padding (not just precisely on the thin text
caret) focus the input — a convenience, not a required capability: the
text input is already independently focusable via `Tab`, and every
tag's remove button is independently focusable too. `@angular-eslint`
flags the div's click handler because a plain `<div>` isn't natively
focusable, but nothing here actually needs it to be — there is no
capability that depends on this specific click. Documented and
suppressed for this one line, the same pattern `Modal`'s backdrop
click and `Popover`'s trigger already established, rather than adding
a meaningless `tabindex`/`keydown` pair purely to silence the linter.

## Known axe flag on the `Disabled` story (not a defect)

Storybook's axe addon reports a "Color contrast" violation on the
`Disabled` story: each tag's label span, seen through the field's
`opacity: 0.5` disabled treatment, computes to a lower ratio than
4.5:1. This is expected and not a compliance issue — WCAG 1.4.3
explicitly exempts "text that is part of an inactive user interface
component" from the contrast requirement, and `Tag`'s own contrast
computation (already audited) is correct at full opacity, which is
its actual state whenever it's interactive. `Select` uses the exact
same `opacity: 0.5`-on-disabled-wrapper treatment around its own
chips, so this is an established, consistent pattern across the
library rather than something specific to `TagInput`.

## Externalized strings

`removeLabel` defaults to `` (v) => `Remove ${v}` `` — overridable,
consistent with `Tag`'s own English-default convention.

Dark mode is visually confirmed in Storybook (`Dark` story) — field
border, tags (via `Tag`'s own automatic contrast), and input text all
legible, no contrast regression.
