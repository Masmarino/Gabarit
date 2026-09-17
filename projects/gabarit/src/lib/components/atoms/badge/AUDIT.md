# RGAA Audit — Badge

Verified against RGAA 4.1.2 by exercising `Atoms/Badge` in Storybook
(stories `Neutral`, `Variants`, `WithIcon`, `InContext`, `Dark`) and by
code review (`badge.ts`, `badge.html`, `badge.scss`).

`gbt-badge` is a purely informational atom: no interactive affordance,
no focusable element, no ARIA role of its own — a `<span>` carrying a
`data-variant` attribute for styling, exactly like `Toaster`'s
`data-variant` items.

## Checklist

| Criterion   | Short title                                    | Verification                                                                                                                                                                                                                     | Result                    |
| ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| 3.2         | Text contrast                                  | Each colored variant pairs `--color-{variant}-bg-text` on `--color-{variant}-bg`. Measured in Storybook (`Variants` story, computed styles): success 9.43:1, warning 8.26:1, error 8.33:1, info 7.15:1 — all above 7:1 (AAA). `neutral` uses `--text-secondary` on the page background, already measured at 7:1+ (AAA) in `contrast.spec.ts`. `color-info-bg-text`/`color-info-bg` (light) also asserted directly in `contrast.spec.ts` ("text on colored banner backgrounds stays readable"). | Compliant                  |
| 7.1         | Scripts compatible with assistive technology   | No script-driven behavior: the badge is static markup, nothing to break for assistive technology. 0 axe violations, with and without an icon (`badge.spec.ts`).                                                                  | Compliant                  |
| 11.1 / 11.2 | Label presence / relevance                     | The label is the projected content itself (`<ng-content />`) — read by assistive technology exactly as any other inline text. Text entirely delegated to the consumer.                                                          | Compliant (delegated)      |
| 12.11       | Hidden content ignored by assistive technology | The optional icon (`gbt-icon`) always carries `aria-hidden="true"` (its own host binding) — it never duplicates or contradicts the text label already present.                                                                    | Compliant                  |
| WCAG 2.5.8  | Target size minimum                            | Not applicable: `gbt-badge` has no pointer/keyboard interaction (no click handler, no `tabindex`, no interactive role) — it is inline text content, not a target.                                                                | N/A — non-interactive      |

## Why `data-variant`, not `[class.gbt-badge--x]`

Matches `Toaster`'s existing convention for a single "one-of-N" variant
(`&[data-variant='success']` in SCSS) instead of five separate boolean
class bindings — one attribute, one source of truth, consistent with
the rest of the library.

## Externalized content

Unlike most other components in this library, `Badge` has no default
text of its own to externalize — its entire content comes from
`<ng-content />`, so there's nothing here for a consuming app to
override; it's already 100% in the consumer's hands by construction.

Dark mode is visually confirmed in Storybook (`Dark` story).
