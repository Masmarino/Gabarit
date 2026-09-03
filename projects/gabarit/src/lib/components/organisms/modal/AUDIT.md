# RGAA Audit — Modal

Verified against RGAA 4.1.2 by exercising `Organisms/Modal` in
Storybook (stories `Closed`, `Open`, `LongTitle`, `Dark`) and by code
review (`modal.ts`, `modal.html`, `modal.scss`).

`gbt-modal` sets no ARIA attribute on its own host — `role="dialog"`,
`aria-modal`, and `aria-label` live on the internal
`<div class="gbt-modal__dialog">`. The dialog's attributes are checked
by direct DOM inspection in `modal.spec.ts`, not only by the axe pass.

## Checklist

| Criterion   | Short title                                  | Verification                                                                                                                                                                                                                                                                                                                                              | Result               |
| ----------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 7.1         | Scripts compatible with assistive technology | `role="dialog"`, `aria-modal="true"`, `[attr.aria-label]="heading() \|\| null"` — 0 axe violations in the open state ("presents no accessibility violation, open"). The input is called `heading`, not `title`: a `title` input would also land as the native `title` attribute on the host and produce an unwanted tooltip on hover.                     | Compliant            |
| 7.3         | Keyboard- and pointer-operable               | `Escape` closes the modal (`@HostListener('document:keydown.escape')`), the exact keyboard equivalent of clicking the backdrop (`onBackdropClick`) and of the close button — all three paths lead to `closed.emit()`. Tested ("emits closed when the Escape key is pressed", "... when the close button is clicked", "... when the backdrop is clicked"). | Compliant            |
| 7.4         | No uncontrolled context change               | The modal only opens on a consumer-driven `isOpen()` (never auto-opens); closing is always an explicit user action (Escape, backdrop click, button).                                                                                                                                                                                                      | Compliant            |
| 9.1         | Heading hierarchy                            | `headingLevel` (default `2`, range 1–6) drives the rendered level via a `@switch`, the same pattern as `gbt-card`.                                                                                                                                                                                                                                        | Compliant            |
| 10.7        | Visible focus indicator                      | `.gbt-modal__dialog:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px }` — a dedicated outline, `:focus` alone (mouse) stays outline-free. `.gbt-modal__close` redefines no `outline`/`:focus` rule: the browser's default outline stays active, not suppressed.                                                                     | Compliant            |
| 12.8        | Consistent tab order                         | Focus moves into the dialog on open (`queueMicrotask(() => dialog().focus())`) then is trapped between the first and last focusable element by `onDialogKeydown` (Tab/Shift+Tab) — tested ("wraps focus from the last focusable element back to the first", and the reverse). Focus restored to the trigger on close (`ngOnDestroy`, tested).             | Compliant            |
| 12.9        | No keyboard trap                             | The focus trap isn't a trap in the RGAA sense: `Escape` remains available at all times to exit, regardless of which element inside the dialog holds focus — tested independently of the focus trap ("emits closed when the Escape key is pressed while open").                                                                                            | Compliant            |
| WCAG 2.4.11 | Focus not obscured                           | Dialog centered over a full-screen backdrop (`position: fixed; inset: 0`, `align-items/justify-content: center`) — verified visually in Storybook across all four stories, including at 320px wide (`LongTitle`, screenshot: long title wraps, close button always visible and reachable, nothing covers it).                                             | Compliant — verified |
| WCAG 2.5.8  | 24×24px target size                          | `.gbt-modal__close` carries an absolutely-positioned `::before` sized to `max(100%, 24px)`, extending its target area to at least 24×24px with no change to the visible button box. Measured in Storybook (`Open` story, `getComputedStyle(button, '::before')`): **28.6641 × 24px**.                                                                     | Compliant            |

`[attr.aria-label]="heading() || null"` keeps the attribute absent
from the DOM (not merely an empty string) when `heading` isn't
provided — an explicit `aria-label=""` can, depending on the assistive
technology, mask an accessible name that would otherwise be computed
from the dialog's content.

## Externalized strings

`closeLabel` defaults to `'Close'`. Tested by "uses the provided close
label" and "uses an English default close label".

## Template lint — one documented exception

`modal.html` sets `(click)` with no keyboard counterpart on the
backdrop (`.gbt-modal__backdrop`) — @angular-eslint flags this
(`click-events-have-key-events`/`interactive-supports-focus`) because it
can't see that `Escape` (wired up elsewhere, in `modal.ts`) already
provides the exact keyboard equivalent of the same action (closing).
Documented with an explanatory HTML comment followed by an
`eslint-disable-next-line` targeted at these two specific rules, at
this specific spot — no global disable.

Dark mode is visually confirmed in Storybook (`Dark` story) — dialog
and backdrop both dark, text legible.
