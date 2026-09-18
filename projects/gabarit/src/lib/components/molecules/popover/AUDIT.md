# RGAA Audit — Popover

Verified against RGAA 4.1.2 by exercising `Molecules/Popover` in
Storybook (stories `Basic`, `ActionsList`, `MiniForm`, `AlignEnd`,
`Dark`) and by code review (`popover.ts`, `popover.html`,
`popover.scss`).

Like `Tooltip`, `gbt-popover` wraps arbitrary projected content instead
of rendering its own trigger — several checks below are therefore
framed as a documented consumer responsibility rather than something
the component enforces, the same posture `Tooltip`'s own audit takes
for `aria-describedby`.

## Checklist

| Criterion   | Short title                                             | Verification                                                                                                                                                                                                                                                                                                       | Result                    |
| ----------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 7.1         | Scripts compatible with assistive technology              | The panel imposes no role on its content (per the issue's own explicit requirement) — 0 axe violations, both closed and open, across all content shapes exercised (plain text, a list of action buttons, a form) (`popover.spec.ts`, "has no a11y violations" ×2).                                                | Compliant                  |
| 7.3         | Keyboard- and pointer-operable                            | The trigger is whatever native interactive element the consumer projects (a real `<button>` in every story) — it keeps its own native keyboard operability; `Popover` adds no custom tab stop of its own. `Escape` closes the panel from anywhere inside it and returns focus to the trigger, tested (`popover.spec.ts`, "closes the panel on Escape and returns focus to the trigger"), reproduced with real keyboard input in Storybook. | Compliant                  |
| 7.4         | No uncontrolled context change                            | The panel opens only on an explicit click of the trigger, and closes only on `Escape`, an outside click, or the consumer's own code calling `pop.close()` — never on a mere hover, and never merely because focus moved inside the panel's own content (verified: focusing the `MiniForm` story's text input keeps the panel open, `popover.spec.ts` "does not close the panel when clicking inside its projected content"). | Compliant                  |
| 9.3         | Appropriate group structure                               | N/A by design — the panel is free-form content with no imposed role, unlike `Menu`'s `role="menu"`/`menuitem` structure. Confirmed no `aria-required-children`/`aria-required-parent` violations are produced regardless of what's projected.                                                                     | N/A — content is the consumer's |
| —           | Programmatic association with the trigger (`aria-expanded`/`aria-controls`) | **Known limitation, documented in the README**: since the component wraps arbitrary projected content instead of rendering its own trigger, it cannot reach into that content to set these attributes itself. `open` (a signal) and `panelId` are exposed via `exportAs="gbtPopover"` for the consumer to wire manually onto their own trigger element — demonstrated in every story. Left as an explicit contract rather than silently skipped, the same posture `Tooltip` takes for `aria-describedby`. | Consumer responsibility    |
| WCAG 2.5.8  | 24×24px target size                                       | N/A to `Popover` itself — the trigger's size is entirely the consumer's own element, not something this component renders or constrains.                                                                                                                                                                          | Consumer responsibility    |

## Why clicking inside the panel never closes it

`Menu` closes on any item click, because every click there is
inherently a completed selection. `Popover`'s content is unopinionated
— it can be a form, a list of buttons, or plain text — so a generic
"click inside closes" rule would silently interrupt typing in an input
or submitting a form. Closing is left to `Escape`, an outside click, or
the consumer explicitly calling `pop.close()` (e.g. from their own
"Cancel"/"Save" button, as the `ActionsList` and `MiniForm` stories
do).

## Positioning

No collision/flip handling if the panel would render off-screen — the
same trade-off `gbt-menu` and `gbt-tooltip` already make; the
application chooses an `align` that fits its layout.

## Externalized strings

None — `Popover` introduces no default text of its own; every word
shown or announced comes from the consumer's own projected trigger and
content.

Dark mode is visually confirmed in Storybook (`Dark` story) — panel
border, background, and text all legible, no contrast regression.
