# RGAA Audit — Tree

Verified against RGAA 4.1.2 by exercising `Molecules/Tree` in
Storybook (stories `Nominal`, `ExpandedByDefault`, `WithSelection`,
`Dark`) and by code review (`tree.ts`, `tree.html`, `tree.scss`,
`tree-flatten.ts`).

## Checklist

| Criterion | Short title                                  | Verification                                                                                                                                                                                                                                    | Result   |
| --------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 7.1       | Scripts compatible with assistive technology      | 0 axe violations, collapsed and expanded-with-selection (`tree.spec.ts`, "has no a11y violations" ×2). `role="tree"`/`role="treeitem"` explicitly declared since the flat `<ul>`/`<li>` markup isn't a native nested list.                       | Compliant |
| 7.3       | Keyboard-operable                                | Full WAI-ARIA Tree View keyboard pattern implemented and tested individually: `ArrowDown`/`ArrowUp`/`ArrowRight`/`ArrowLeft`/`Home`/`End`/`Enter` (`tree.spec.ts`, keyboard-navigation describe block).                                            | Compliant |
| 7.5       | Consistent, predictable focus management         | Roving `tabindex`: exactly one row (`activeId()`) is ever `tabindex="0"`, every other row is `-1` — verified via the `[attr.tabindex]` assertions in `tree.spec.ts` rather than real DOM focus (see note below).                                    | Compliant |
| 8.9       | No misused markup for presentation-only purpose  | Depth is conveyed to assistive tech via `aria-level`, not via nested list markup or purely-visual indentation.                                                                                                                                    | Compliant |
| 11.1      | Label presence                                    | `expandLabel`/`collapseLabel` name each toggle button; `ariaLabel` names the tree itself when there's no adjoining visible heading.                                                                                                                | Compliant |

## Why real DOM focus isn't asserted in tests

`focusIndex()` schedules the actual `.focus()` call via
`afterNextRender()`, matching `DatePicker`'s own grid-navigation
pattern for the same reason: focus must move only after Angular has
finished rendering the newly-active row. This scheduling doesn't
reliably flush within one synchronous `fixture.detectChanges()` call
in the test environment, so — following the precedent already
established by `DatePicker`'s own spec — `tree.spec.ts` asserts the
`tabindex` attribute (the reliable, observable proxy for "this is the
row that will receive focus") rather than `document.activeElement`.
Manual verification in Storybook confirms real focus does move
correctly when navigating with arrow keys in a browser.

## Why clicking a `<li>` is a documented lint exception

Keyboard handling for the whole tree is delegated to a single
`(keydown)` listener on the parent `<ul role="tree">`, per the
WAI-ARIA pattern (one composite widget, one set of key bindings) —
not duplicated onto every `<li>`. `@angular-eslint` flags the `<li>`'s
own `(click)` handler because, read in isolation, a plain list item
isn't natively focusable/operable — but the row's keyboard operability
is already fully covered by the ancestor `<ul>`'s listener, so nothing
is actually missing. Documented and suppressed for this one line, the
same pattern used for `TagInput`'s field container and `Modal`'s
backdrop click.

## Externalized strings

`expandLabel`/`collapseLabel`/`ariaLabel` all default to English and
are consumer-overridable, consistent with every other component in
this library.

Dark mode is visually confirmed in Storybook (`Dark` story) — row
hover/focus/selected states, chevron icon, and text all legible, no
contrast regression.
