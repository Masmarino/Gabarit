# RGAA Audit — Tabs / Tab

Verified against RGAA 4.1.2 by exercising `Molecules/Tabs` in
Storybook (stories `Nominal`, `Empty`, `Dense`, `Dark`) — real keyboard
use and `getBoundingClientRect` / `getComputedStyle` run in the browser
console, not just under jsdom — and by code review (`tabs.ts`,
`tabs.html`, `tabs.scss`, `tab.ts`).

Unlike `gbt-modal`, the `gbt-tab` host carries its own ARIA attributes
(`role="tabpanel"`, `[id]`, `[attr.aria-labelledby]` are set on the
component's `host`, not on an internal element) — axe can't infer the
implicit role of an unknown custom element, so these three attributes
are checked by direct DOM inspection (`tabs.spec.ts`, describe "Tabs —
ARIA consistency"), not only by the axe pass. That check also confirms
`aria-labelledby` points to an element that actually exists in the DOM
and belongs to the same `gbt-tabs` instance, since no default axe rule
detects a dangling or cross-instance reference. Reproduced manually in
the browser (`Nominal` story) for `aria-controls` too.

Each `gbt-tabs` instance namespaces its generated ids: `Tabs` exposes
`id = input<string>(\`gbt-tabs-\${++nextTabsId}\`)`(a module-level
counter), and the trigger/panel ids,`aria-controls`, and
`aria-labelledby`all derive from it (via a`groupId` `Tab`receives
from its parent) — so two`gbt-tabs` groups on the same page never
collide on id or resolve an ARIA reference into the wrong group.
Tested (`namespaces ids per instance, so two gbt-tabs groups on the
same page never collide`, `tabs.spec.ts`), including that each
`aria-labelledby` resolves to a trigger within its own group.

## Checklist

| Criterion  | Short title                                             | Verification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Result                                     |
| ---------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 7.1        | Scripts compatible with assistive technology            | `role="tablist"` / `role="tab"` / `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby` — 0 axe violations ("has no accessibility violation", `tabs.spec.ts`). Ids are namespaced per instance (see above).                                                                                                                                                                                                                                                                                                                                | Compliant                                  |
| 7.3        | Keyboard- and pointer-operable                          | `ArrowRight`/`ArrowLeft` move selection and focus, wrapping at the start/end (`onKeydown`). Tested ("moves selection and focus with the right arrow key, wrapping...", "moves selection with the left arrow key, wrapping...", "allows navigating between tabs with arrow keys — criterion 7.3") and replayed with real keyboard input in Storybook (`Nominal` story: click on "Vue d'ensemble", `ArrowRight` → focus and panel switch to "Détails").                                                                                                       | Compliant                                  |
| 9.3        | Appropriate list/group structure                        | `role="tablist"` (`.gbt-tabs__list`) directly contains `role="tab"` elements (`<button>`), with no intermediate wrapper — a valid relationship under the WAI-ARIA tabs pattern, confirmed by the absence of `aria-required-children`/`aria-required-parent` violations in the axe pass.                                                                                                                                                                                                                                                                     | Compliant                                  |
| 10.7       | Visible focus indicator                                 | `.gbt-tabs__trigger:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px }` — verified with real keyboard input in Storybook (visible outline after `ArrowRight`); a mouse click on the same button shows no outline at all, confirming the rule correctly targets `:focus-visible`, not `:focus`.                                                                                                                                                                                                                                       | Compliant — verified under real conditions |
| 10.8       | Hidden content properly ignored by assistive technology | Inactive panels hidden via `[style.display]="active() ? null : 'none'"` on the `gbt-tab` host, not via `*ngIf` (mounting stays permanent so `ngOnInit` only fires once). Verified in the browser, not just by reading the CSS: `getComputedStyle(panel).display` → `"none"` and `panel.offsetParent` → `null` for the inactive panel — `display: none` removes the element from rendering, the standard mechanism by which browsers exclude it entirely from the accessibility tree. The active panel has `display: "block"` and a non-null `offsetParent`. | Compliant — verified under real conditions |
| 12.8       | Consistent tab order                                    | Roving tabindex: only the active trigger has `[tabIndex]="0"`, the others `-1` (`[tabIndex]="activeIndex() === i ? 0 : -1"`) — a single tab stop in the tab list, navigation between tabs happens via arrow keys (the standard WAI-ARIA pattern), not `Tab`. Verified by direct DOM inspection in the browser (`tabIndex: 0` on the active trigger, `-1` on the other, `Nominal` story).                                                                                                                                                                    | Compliant                                  |
| WCAG 2.5.8 | 24×24px target size                                     | Measured in Storybook (`getBoundingClientRect`): `Nominal` story, "Vue d'ensemble" **138.55 × 43px**, "Détails" **77.85 × 43px**; `Dense` story (worst case, short labels), smallest trigger "Un" **51.18 × 43px** — all well above the threshold.                                                                                                                                                                                                                                                                                                          | Compliant                                  |

## Externalized strings

None. `Tab` and `Tabs` introduce no default text: the only visible or
announced text (each tab's label) comes from the `label` input supplied
by the consumer, never from a hardcoded value in the component.

Dark mode is visually confirmed in Storybook (`Dark` story) — tab
bar and text legible, no contrast regression.
