# RGAA Audit — Tooltip

Verified against RGAA 4.1.2 by exercising `Molecules/Tooltip` in
Storybook (stories `Basic`, `Positions`, `Dark`) and by code review
(`tooltip.ts`, `tooltip.html`, `tooltip.scss`).

## Checklist

| Criterion   | Short title                                  | Verification                                                                                                                                                                                                                                                                       | Result                    |
| ----------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 7.1         | Scripts compatible with assistive technology | `role="tooltip"` on the bubble. 0 axe violations with the bubble open (`toaster.spec.ts`-style test: "presents no accessibility violation, tooltip open").                                                                                                                        | Compliant                 |
| 7.3         | Keyboard-operable                            | The bubble opens on `focusin` — whatever the consumer projects (their own button/link) already carries its own native keyboard operability; the tooltip adds no extra tab stop of its own (`pointer-events: none`, never focusable), which is the correct pattern for tooltips. | Compliant                 |
| 7.4         | No uncontrolled context change               | The tooltip never moves or steals focus on show/hide — it only reacts to focus/hover events the application already produced.                                                                                                                                                    | Compliant                 |
| WCAG 1.4.13 | Content on hover or focus                    | Dismissible: `Escape` hides the bubble unconditionally, tested. Persistent-until-explicit-dismissal doesn't apply in the risky sense the SC targets, because the bubble carries no interactive content — it is announced once (on focus) or after a hover delay, and disappears with the same input that would naturally end the interaction (`focusout`/`mouseleave`). | Compliant                 |
| —           | Programmatic association with its trigger    | **Known limitation, documented in the README**: since the component wraps arbitrary projected content instead of rendering its own trigger, it cannot reach into that content to set `aria-describedby` itself. `tooltipId` is exposed via `exportAs="gbtTooltip"` for the consumer to wire manually onto their own trigger element. Left as an explicit contract rather than silently skipped. | Consumer responsibility   |

## Color usage

`.gbt-tooltip__bubble` reuses `Toaster`'s theme-invariant tokens
(`--bg-inverse`, `--text-on-color`) — same near-black background and
white text regardless of the host app's theme, for the same reason: a
tooltip must stay legible over whatever page is behind it. Verified by
the generic 7:1 pairing check in `token-usage.spec.ts` (already proven
compliant for `Toaster`, same token pair, no new tokens needed).

One difference from `Toaster`: a 1px `rgba(255, 255, 255, 0.15)`
border was added after visual review in Storybook (`Dark` story)
showed the bubble nearly disappearing against a dark-themed host page
— `--bg-inverse` and the dark theme's own `--bg-principal` both
resolve to `--grey-900`, so box-shadow alone wasn't enough separation.
The border isn't a semantic token (it's a translucent white overlay,
not a flat color), so it doesn't interact with `token-usage.spec.ts`'s
palette/contrast checks — it's a visual affordance on top of the
already-compliant text contrast, not a substitute for it.

## Positioning

No collision/flip handling if a bubble would render off-screen — the
same trade-off `gbt-menu` already makes. Documented in the README as
the application's responsibility (choose a `position` that fits the
layout).
