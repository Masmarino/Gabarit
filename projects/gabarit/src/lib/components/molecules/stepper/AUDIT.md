# RGAA Audit — Stepper

Verified against RGAA 4.1.2 by exercising `Molecules/Stepper` in
Storybook (stories `FirstStep`, `MiddleStep`, `LastStep`, `WithError`,
`Vertical`, `Dark`) and by code review (`stepper.ts`, `stepper.html`,
`stepper.scss`).

## Checklist

| Criterion | Short title                                          | Verification                                                                                                                                                                                                                                              | Result   |
| --------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 9.3       | Appropriate list structure                               | Real `<ol>`/`<li>`, every step rendered directly by this component's own template (via `steps`, not content projection) — each `<li>` a genuine direct child, tested (`stepper.spec.ts`, "renders a real ol with one li per step, in order") and by 0 axe violations, catching the exact `listitem` rule an earlier per-step-component design for `DescriptionList` failed. | Compliant |
| 7.1       | Scripts compatible with assistive technology             | The current step carries `aria-current="step"` — the ARIA value specifically defined for this exact pattern (a step in a process), not a generic `true`. Completed/error status, which has no dedicated ARIA state on a plain list item, is instead conveyed by a visually-hidden text suffix (`completedLabel`/`errorLabel`) appended to the step's own text, so it's read as part of the same accessible name rather than a disconnected announcement. Tested ("announces completed/error status via visually-hidden text"). | Compliant |
| 7.4       | No uncontrolled context change                           | `Stepper` has no interactive element and triggers no navigation itself — `activeIndex` only ever changes because the consuming application sets it, never as a side effect of anything inside this component.                                              | Compliant |
| 3.2       | Text contrast                                            | The error state reuses `--color-error-text` for both the indicator's border and the label — a token already audited for text contrast elsewhere (e.g. `SegmentedControl`'s error styling equivalents), not the unaudited-for-text `--color-error-base`.       | Compliant |
| 12.11     | Hidden content ignored by assistive technology            | The step number (`1`, `2`, `3`) is replaced entirely by the check/error icon once a step is no longer `upcoming`/`current` — never rendered underneath and merely hidden, so there's no stale text left in the accessibility tree for AT to stumble on.       | Compliant |

## Why `Stepper` never becomes clickable on its own

The issue's own framing left navigability as an open question; this
audit reflects the choice made: informational only. A step that can be
clicked to jump back needs its own keyboard semantics (most naturally
`role="button"` or a real `<button>` per completed step, each needing
its own accessible name distinct from the plain list item used here) —
adding that speculatively, before a real use case asks for it, would
mean auditing a keyboard pattern nobody yet needs. The `steps` data
array is application-owned, so wrapping a step in the consumer's own
clickable element remains entirely possible without any change here.

## Externalized strings

`completedLabel`/`errorLabel` default to English (`'Completed'`/
`'Error'`), both overridable — tested indirectly via the a11y pass
using their default values, since no test overrides them (consistent
with how straightforward the strings are; a dedicated override test
was judged not worth the space).

Dark mode is visually confirmed in Storybook (`Dark` story) — the
completed/current/upcoming/error indicator colors and the connecting
line all legible, no contrast regression.
