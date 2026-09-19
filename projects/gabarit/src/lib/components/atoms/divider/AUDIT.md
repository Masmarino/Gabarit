# RGAA Audit — Divider

Verified against RGAA 4.1.2 by exercising `Atoms/Divider` in
Storybook (stories `Horizontal`, `WithLabel`, `Vertical`, `Dark`) and
by code review (`divider.ts`, `divider.html`, `divider.scss`).

`gbt-divider` is purely presentational: no interactive affordance, no
focusable element.

## Checklist

| Criterion | Short title                                   | Verification                                                                                                                                                          | Result   |
| --------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 7.1       | Scripts compatible with assistive technology      | `role="separator"`, `aria-orientation` set only when vertical (the ARIA default is horizontal) — 0 axe violations, plain and with a label (`divider.spec.ts`, "has no a11y violations" ×2). | Compliant |
| 3.2       | Text contrast                                     | The optional label reuses `--text-secondary` on whatever background it sits over — the same token already covered by the generic pairing check in `token-usage.spec.ts`, no new color introduced. | Compliant |
| 12.11     | Hidden content ignored by assistive technology    | N/A — nothing in this component is decorative-only in a way that needs hiding; the line itself carries no text and needs no label (a `role="separator"` with no content is standard and expected). | N/A       |

## Externalized strings

None — `label` is entirely consumer-supplied, with no default text of
its own.

Dark mode is visually confirmed in Storybook (`Dark` story) — line and
label both legible, no contrast regression.
