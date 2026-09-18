# RGAA Audit — Accordion / AccordionItem

Verified against RGAA 4.1.2 by exercising `Molecules/Accordion` in
Storybook (stories `Faq`, `Multiple`, `OpenByDefault`, `Dark`) — real
keyboard use and `getBoundingClientRect` run in the browser console,
not just under jsdom — and by code review (`accordion.ts`,
`accordion-item.ts`, `accordion-item.html`, `accordion-item.scss`).

Unlike `Tabs` (a single trigger list, then a single panel list),
`AccordionItem` renders its own header **and** its own panel, so each
pair stays adjacent in the DOM — the natural reading/tab order already
matches the WAI-ARIA accordion pattern without extra markup.

## Checklist

| Criterion  | Short title                                             | Verification                                                                                                                                                                                                                                                                                                                       | Result                                     |
| ---------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| 7.1        | Scripts compatible with assistive technology              | `aria-expanded` on the header, `aria-controls`/`aria-labelledby` linking header and panel — 0 axe violations, both collapsed and with a panel open (`accordion.spec.ts`, "has no a11y violations" ×2).                                                                                                                             | Compliant                                  |
| 7.3        | Keyboard- and pointer-operable                            | `ArrowDown`/`ArrowUp` move focus between headers, wrapping at the start/end; toggling itself is native `<button>` behavior (`Enter`/`Space`), not custom-coded. Tested (`accordion.spec.ts`, "moves focus to the next/previous header..."), reproduced with real keyboard input in Storybook (`Faq` story: focus header 1, `ArrowDown` → focus + visible outline on header 2, wrapping confirmed both directions). | Compliant — verified under real conditions |
| 10.7       | Visible focus indicator                                   | `.gbt-accordion-item__header:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px }` — confirmed with real keyboard input in Storybook (visible outline after `ArrowDown`); a mouse click on the same button shows no outline, confirming `:focus-visible` (not `:focus`) is the trigger.                       | Compliant — verified under real conditions |
| 10.8       | Hidden content properly ignored by assistive technology    | A collapsed panel carries `inert` (`[attr.inert]="active() ? null : ''"`) rather than the `hidden` attribute — chosen deliberately so the height transition (see 13.8) can still animate, since `hidden` forces `display: none` with no way to transition through it. `inert` still removes the subtree from the accessibility tree and the tab order. Tested directly (`accordion.spec.ts`, "marks a collapsed panel inert, and an open one not").      | Compliant — by an equivalent, documented means |
| 13.8       | Controllable moving content                                | The open/close transition (`grid-template-rows` 0fr ↔ 1fr, 0.2s) is disabled under `@media (prefers-reduced-motion: reduce)`, along with the chevron's rotation — both jump directly to their end state instead of animating. Verified by reading the compiled CSS rule; actually toggling the OS preference could not be emulated with the browser tooling available for this audit, consistent with `Button`'s and `Skeleton`'s own audit notes.  | Compliant                                  |
| 9.3        | Appropriate group structure                                | Each header/panel pair is adjacent in the DOM (see intro) — no `role="tablist"`-equivalent grouping role is needed for an accordion under the WAI-ARIA pattern; confirmed by the absence of `aria-required-children`/`aria-required-parent` violations in the axe pass.                                                              | Compliant                                  |
| WCAG 2.5.8 | 24×24px target size                                        | Measured in Storybook (`getBoundingClientRect`, `Faq` story): header button **478 × 45.5px** — comfortably above the threshold; the whole header width is clickable, not just the label text.                                                                                                                                       | Compliant                                  |

Each `gbt-accordion` instance namespaces its generated ids exactly like
`Tabs` does (`id = input<string>(\`gbt-accordion-\${++nextAccordionId}\`)`),
so two `gbt-accordion` groups on the same page never collide on id or
resolve an ARIA reference into the wrong group. Confirmed by the id
pattern assertions in `accordion.spec.ts` ("links each header to its
panel via gbt--prefixed identifiers").

## Why `inert` instead of `hidden` on a collapsed panel

The issue's own accessibility guidance suggested the `hidden`
attribute (the same mechanism `Tab` uses via `display: none`), but
`hidden` forces `display: none`, which cannot be transitioned through
— a collapsed panel would snap shut instantly, contradicting the
animated `grid-template-rows` collapse this component was explicitly
designed to have (see the design discussion for this issue). `inert`
achieves the same accessibility outcome — the subtree becomes
unreachable by keyboard and invisible to assistive technology — without
constraining `display`, so the CSS transition still renders for
sighted users while AT users never perceive collapsed content as
present.

## Why no forced heading wrapper

The WAI-ARIA APG accordion pattern shows headers optionally wrapped in
a heading element (e.g. `<h3>`) for landmark-style navigation. This was
deliberately left out: the issue's own accessibility guidance for this
component describes only a button + region pair (matching `Menu` and
`Select`'s existing patterns), and hardcoding a heading level would
assume a document structure this library can't know in advance. A
consumer that wants heading semantics can wrap the whole
`gbt-accordion` in their own `<h3>`-per-item structure if their page
calls for it.

## Externalized strings

None. `AccordionItem` introduces no default text: the only visible or
announced text (each header's label) comes from the `label` input
supplied by the consumer, never from a hardcoded value in the
component.

Dark mode is visually confirmed in Storybook (`Dark` story) — border,
hover background, and open-panel text all legible, no contrast
regression.
