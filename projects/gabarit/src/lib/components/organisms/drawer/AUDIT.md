# RGAA Audit — Drawer

Verified against RGAA 4.1.2 by exercising `Organisms/Drawer` in
Storybook (stories `Right`, `Left`, `Top`, `Bottom`, `AlwaysOpen`,
`Dark`) — real keyboard use and `getBoundingClientRect`/computed
styles run in the browser console — and by code review (`drawer.ts`,
`drawer.html`, `drawer.scss`).

`gbt-drawer` reuses `Modal`'s exact control pattern (`isOpen` input,
no internal open/close state, `closed` output, focus trap, `Escape`,
backdrop click) — see `Modal`'s own audit for the shared reasoning;
this audit focuses on what `Drawer` adds or does differently:
the edge-anchored, non-centered layout, and the animated close.

## Checklist

| Criterion   | Short title                                             | Verification                                                                                                                                                                                                                                                                                                                       | Result               |
| ----------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| 7.1         | Scripts compatible with assistive technology              | `role="dialog"`, `aria-modal="true"`, `[attr.aria-label]="heading() \|\| null"` on `.gbt-drawer__panel` — 0 axe violations open (`drawer.spec.ts`, "presents no accessibility violation, open").                                                                                                                                   | Compliant             |
| 7.3         | Keyboard- and pointer-operable                            | `Escape` closes the drawer (`@HostListener('document:keydown.escape')`), the same keyboard equivalent as clicking the backdrop or the close button. Tested (`drawer.spec.ts`, "emits closed when the Escape key is pressed", "... backdrop is clicked", "... close button is clicked"), reproduced with real keyboard input in Storybook (`Escape` on the `Right` story closes it, animating out). | Compliant             |
| 7.4         | No uncontrolled context change                            | Opens only on a consumer-driven `isOpen()`; closing is always an explicit action (Escape, backdrop click, close button).                                                                                                                                                                                                            | Compliant             |
| 9.1         | Heading hierarchy                                          | `headingLevel` (default `2`, range 1–6) drives the rendered level via `@switch`, identical to `Modal`.                                                                                                                                                                                                                              | Compliant             |
| 10.7        | Visible focus indicator                                   | `.gbt-drawer__panel:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px }` (inset, since an outward offset would render partly off-screen against the panel's own edge) — a mouse click leaves no outline, confirming `:focus-visible` is the trigger, not `:focus`.                                            | Compliant             |
| 12.8        | Consistent tab order                                       | Focus moves into the panel on open, trapped between its first/last focusable element (`onPanelKeydown`, Tab/Shift+Tab) — tested both directions. Focus restored to the trigger once the close animation finishes, not before (see 13.8) — tested ("unmounts the panel and restores focus once the close animation finishes"). | Compliant             |
| 12.9        | No keyboard trap                                            | `Escape` remains available at all times regardless of which element inside the panel holds focus, independent of the Tab-based focus trap — tested separately.                                                                                                                                                                    | Compliant             |
| 13.8        | Controllable moving content                                | The slide/fade animation (open and close, per-edge) is disabled under `@media (prefers-reduced-motion: reduce)` — the panel appears/disappears instantly instead. Verified by reading the compiled CSS rule; actually toggling the OS preference could not be emulated with the browser tooling available for this audit, consistent with `Skeleton`'s and `Accordion`'s own audit notes. | Compliant             |
| WCAG 2.4.11 | Focus not obscured                                          | The panel is anchored to a screen edge, never centered — verified visually in all four `edge` stories that the header (and its close button) always renders fully within the viewport, never clipped.                                                                                                                              | Compliant — verified  |
| WCAG 2.5.8  | 24×24px target size                                        | Same `::before` target-area technique as `Modal`'s close button (identical markup/CSS) — re-measured live in Storybook (`Dark` story): **28.66 × 24px**.                                                                                                                                                                            | Compliant             |

## Why the panel stays mounted ~200ms after `isOpen` becomes `false`

`Modal` removes its dialog from the DOM the instant `isOpen()` flips —
correct for an instant appear/disappear, but it would cut the slide
animation off mid-motion if reused as-is. `Drawer` keeps the panel
mounted (its own `rendered` signal, independent of `isOpen`) for
`CLOSE_ANIMATION_MS` (200ms, matching the CSS animation duration) so
the closing transition can finish, then unmounts and restores focus —
the same technique `Tooltip` already uses for its own fade-out. If
`isOpen` flips back to `true` while this timer is pending, the pending
`setTimeout` is cancelled and the drawer simply stays open — tested
("cancels a pending close and reopens cleanly if isOpen flips back to
true mid-animation").

This also means `Drawer`'s "closed and destroyed" test differs from
`Modal`'s: asserting the panel is gone requires advancing past
`CLOSE_ANIMATION_MS` first (`vi.useFakeTimers()` / `vi.advanceTimersByTime`),
whereas `Modal`'s equivalent test asserts this synchronously.

## Why `AppShell`'s mobile drawer wasn't refactored to use this component

Considered and rejected, per the issue's own framing: `AppShell`'s
internal drawer only ever renders a fixed nav-link list, never
arbitrary content, and is already shipped and stable. Routing it
through `gbt-drawer` would add indirection for no behavioral gain,
while risking a regression on a component real applications already
depend on.

## Externalized strings

`closeLabel` defaults to `'Close'`. Tested ("uses an English default
close label") — same convention as `Modal`.

Dark mode is visually confirmed in Storybook (`Dark` story) — panel,
backdrop, and header border all legible, no contrast regression.
