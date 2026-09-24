# RGAA Audit — Stepper

Verified against RGAA 4.1.2 by exercising `Molecules/Stepper` in
Storybook (stories `FirstStep`, `MiddleStep`, `LastStep`, `WithError`,
`Vertical`, `Dark`, `Interactive`, `InteractiveDark`) and by code review (`stepper.ts`, `stepper.html`,
`stepper.scss`).

## Checklist

| Criterion | Short title                                          | Verification                                                                                                                                                                                                                                              | Result   |
| --------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 9.3       | Appropriate list structure                               | Real `<ol>`/`<li>`, every step rendered directly by this component's own template (via `steps`, not content projection) — each `<li>` a genuine direct child, tested (`stepper.spec.ts`, "renders a real ol with one li per step, in order") and by 0 axe violations, catching the exact `listitem` rule an earlier per-step-component design for `DescriptionList` failed. | Compliant |
| 7.1       | Scripts compatible with assistive technology             | The current step carries `aria-current="step"` — the ARIA value specifically defined for this exact pattern (a step in a process), not a generic `true`. Completed/error status, which has no dedicated ARIA state on a plain list item, is instead conveyed by a visually-hidden text suffix (`completedLabel`/`errorLabel`) appended to the step's own text, so it's read as part of the same accessible name rather than a disconnected announcement. Tested ("announces completed/error status via visually-hidden text"). | Compliant |
| 7.4       | No uncontrolled context change                           | `Stepper` triggers no navigation itself — `activeIndex` only ever changes because the consuming application sets it. In interactive mode a click only sets `selectedIndex`; the consumer decides what happens.                                              | Compliant |
| 3.2       | Text contrast                                            | The error state reuses `--color-error-text` for both the indicator's border and the label — a token already audited for text contrast elsewhere (e.g. `SegmentedControl`'s error styling equivalents), not the unaudited-for-text `--color-error-base`.       | Compliant |
| 12.11     | Hidden content ignored by assistive technology            | The step number (`1`, `2`, `3`) is replaced entirely by the check/error icon once a step is no longer `upcoming`/`current` — never rendered underneath and merely hidden, so there's no stale text left in the accessibility tree for AT to stumble on.       | Compliant |

## Interactive mode

With `interactive`, each step is a native `<button type="button">`
inside its `<li>`, so Tab, Enter and Space work natively and the list
structure (criterion 9.3) is unchanged. Criterion 7.4 stays compliant:
a click only sets `selectedIndex`, and the consuming application
decides what happens next — nothing changes context on its own. The
selected state is conveyed by `data-selected` plus the `selectedLabel`
visually-hidden text (criterion 7.1), while `aria-current="step"`
remains on the active step only. The axe test in `stepper.spec.ts`
covers the interactive mode.

## Externalized strings

`completedLabel`/`errorLabel` default to English (`'Completed'`/
`'Error'`), both overridable — tested indirectly via the a11y pass
using their default values, since no test overrides them (consistent
with how straightforward the strings are; a dedicated override test
was judged not worth the space).

Dark mode is visually confirmed in Storybook (`Dark` story) — the
completed/current/upcoming/error indicator colors and the connecting
line all legible, no contrast regression.
