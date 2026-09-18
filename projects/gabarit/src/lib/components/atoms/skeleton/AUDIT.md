# RGAA Audit — Skeleton

Verified against RGAA 4.1.2 by exercising `Atoms/Skeleton` in
Storybook (stories `Text`, `Circle`, `Rect`, the three composition
stories, `Dark`) and by code review (`skeleton.ts`, `skeleton.scss`).

`gbt-skeleton` is a purely decorative placeholder: no text, no image,
no interactive affordance — a single `<span>` (the host itself) whose
only job is to occupy the shape content will later take.

## Checklist

| Criterion | Short title                    | Verification                                                                                                                                                                                                                                                                                          | Result   |
| --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 1.2       | Decorative image ignored by AT  | The host carries `aria-hidden="true"` unconditionally (`skeleton.spec.ts`, "is hidden from assistive technology") — a screen reader never encounters an empty, unlabelled shape, individually or in a group of a dozen.                                                                              | Compliant |
| 13.8      | Controllable moving content     | The shimmer (a `::after` highlight band sweeping via `transform` keyframes, 1.6s loop) is disabled under `@media (prefers-reduced-motion: reduce)` — the band freezes at its resting off-canvas position, leaving a flat, static shape. Verified by reading the compiled CSS rule; actually toggling the OS preference could not be emulated with the browser tooling available for this audit, consistent with `Button`'s own audit note for its spinner. | Compliant |
| 11.1      | Label presence for the group    | N/A for `gbt-skeleton` itself (see 1.2) — the README documents wrapping a *group* of skeletons in a single `role="status"` container with an `aria-label` (e.g. "Loading"), so the loading state is announced once per layout rather than once per shape. Demonstrated in all three composition stories. | N/A — consumer responsibility, documented |

## Why no built-in "loading" announcement

A `SkeletonGroup` wrapper that owns `role="status"` and a label was
considered and rejected: every real usage already has its own natural
container (a table row, a card, a list item) that the consumer
controls the layout of — adding a second wrapping element specific to
loading states would fight that layout rather than help it. Leaving
`role="status"` + `aria-label` as a documented pattern the consumer
applies to their own existing container avoids that friction.

## Externalized strings

None — `gbt-skeleton` has no strings of its own. The `aria-label`
("Loading" / "Chargement en cours") shown in the README example
belongs to the consumer's own wrapping element, not to this component.

Dark mode is visually confirmed in Storybook (`Dark` story).
