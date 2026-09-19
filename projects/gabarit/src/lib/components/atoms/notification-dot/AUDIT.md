# RGAA Audit — NotificationDot

Verified against RGAA 4.1.2 by exercising `Atoms/NotificationDot` in
Storybook (stories `PlainDot`, `WithCount`, `TruncatedCount`,
`Variants`, `Dark`) and by code review (`notification-dot.ts`,
`notification-dot.html`, `notification-dot.scss`).

## Checklist

| Criterion | Short title                                        | Verification                                                                                                                                                                                                       | Result   |
| --------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1.2       | Decorative image ignored by AT                          | The visual badge is `aria-hidden="true"` unconditionally — tested (`notification-dot.spec.ts`, "marks the visual dot as aria-hidden"). Its count text is never announced on its own, avoiding a disconnected "3" out of context. | Compliant |
| 7.1       | Scripts compatible with assistive technology            | 0 axe violations, plain dot and with a count (`notification-dot.spec.ts`, "has no a11y violations" ×2).                                                                                                             | Compliant |
| 11.1      | Label presence (of the announced state)                 | **Known limitation, documented in the README**: since the component wraps arbitrary projected content, it cannot set the trigger's accessible name itself. `count` is exposed via `exportAs="gbtNotificationDot"` for the consumer to fold into their own trigger's `aria-label` — demonstrated in the `WithCount` story. Same posture `Tooltip` takes for `aria-describedby` and `Popover` for `aria-expanded`. | Consumer responsibility |
| 3.2       | Text contrast (count variant)                            | The `--count` state reuses `Badge`'s own already-audited 7:1 "soft banner" pair (`--color-{variant}-bg`/`-bg-text`) — not the 3:1 decorative `-base` fill used for the plain (textless) dot.                          | Compliant |

## Why the plain dot and the count badge use different token pairs

The plain dot carries no text, so a solid, more vivid `-base` fill
(only required to clear the 3:1 non-text threshold) reads better as a
status marker. The moment it carries text — the count — contrast
requirements jump to the 7:1 text pairing this library standardizes
on, so the count state switches to `Badge`'s own already-audited soft
pair instead of inventing a new vivid-fill + text combination that
would need its own audit.

## Externalized strings

None — the component introduces no text of its own beyond the
formatted count, which is numeric and locale-agnostic.

Dark mode is visually confirmed in Storybook (`Dark` story) — the
dot's border (matching `--bg-principal`) keeps it visually separated
from whatever it overlaps, in both themes.
