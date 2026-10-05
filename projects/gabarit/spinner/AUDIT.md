# RGAA Audit — Spinner

Verified against RGAA 4.1.2 by exercising `Atoms/Spinner` in
Storybook (stories `Sizes`, `InACard`, `Dark`) and by code review
(`spinner.ts`, `spinner.html`, `spinner.scss`).

## Checklist

| Criterion | Short title                                          | Verification                                                                                                                                                                                    | Result   |
| --------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 7.1       | Scripts compatible with assistive technology             | `role="status"` — content is announced automatically when it appears, without needing focus to move there. 0 axe violations (`spinner.spec.ts`, "has no a11y violations").                          | Compliant |
| 11.1      | Label presence                                           | The visually-hidden `.sr-only` text carries `label()`, defaulting to `'Loading…'` — the ring itself is `aria-hidden="true"`, so the announcement comes from the text, never the animation. Tested ("announces the default English label...", "announces a custom label"). | Compliant |
| 13.8      | Controllable moving content                              | The spin animation is disabled under `@media (prefers-reduced-motion: reduce)`, leaving the static arc-over-track shape in place — consistent with `Button`'s own spinner, which does the same (stops the animation, no extra dimming). | Compliant |

## Externalized strings

`label` defaults to `'Loading…'` — tested ("announces the default
English label once, visually hidden") and overridable.

Dark mode is visually confirmed in Storybook (`Dark` story) — the ring
reuses `--primary`, already audited for both themes.
