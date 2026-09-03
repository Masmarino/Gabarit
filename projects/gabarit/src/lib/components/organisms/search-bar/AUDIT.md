# RGAA Audit — SearchBar

Verified against RGAA 4.1.2 by exercising `Organisms/SearchBar` in
Storybook (stories `Empty`, `WithResults`, `NoResults`, `Dark`, the
latter two driven by a `play` function that simulates typing) and by
code review (`search-bar.ts`, `search-bar.html`, `search-bar.scss`).

`gbt-search-bar` sets no ARIA attribute on its own host — the combobox
pattern (`role="combobox"` on the `<input>`, `role="listbox"`/
`role="option"` on the panel and its items) lives entirely on internal
elements.

The panel splits into two branches (`@if (hasNoResults())`/`@else`):
the "no results" state carries no `role="listbox"` at all (nor the
focus-retention `(mousedown)`/`(click)` handlers, pointless with no
options to click), while the "with results" state keeps a static
`role="listbox"` with `role="option"` children — 0 axe violations
across all three states (`empty`, `with results`, `no results`),
corroborated by Storybook's built-in Accessibility panel. Each option
carries `tabindex="-1"`: results are reachable via `ArrowUp`/
`ArrowDown` (`onNavigationKeydown`) rather than sitting in the natural
tab order.

Each `gbt-search-bar` instance namespaces its generated ids the same
way `Select` does (a module-level counter, an `id` input defaulting to
`gbt-search-bar-${n}`, `panelId()`/`itemDomId(index)` derived from it),
so two instances on the same page never collide on id or ARIA
reference resolution. `aria-controls` on the input is conditional —
`[attr.aria-controls]="showOverlay() ? panelId() : null"` — so it's
absent while closed and, while open, always names a panel that
actually exists in the DOM.

## Checklist

| Criterion | Short title                                    | Verification                                                                                                                                                                                                                                                                                                                                                                                                                       | Result                           |
| --------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 3.2       | Text contrast                                  | `.gbt-sb-trigger__input`, `.gbt-sb-trigger__clear:hover`, `.gbt-sb-item__label`, and `.gbt-sb-state span` paint their text with `--text-primary` (17.51:1 light / 16.59:1 dark), the only text token the semantic layer exposes.                                                                                                                                                                                                   | Compliant                        |
| 3.3       | Component contrast                             | `.gbt-sb-trigger` uses `--border-color` (3.03:1 light / 3.01:1 dark) for its outline.                                                                                                                                                                                                                                                                                                                                              | Compliant                        |
| 6.1       | Explicit link                                  | Not applicable — no `<a>` element in this component; results are `<button role="option">`, not hyperlinks.                                                                                                                                                                                                                                                                                                                         | Not applicable to this component |
| 6.2       | Relevant link wording                          | Not applicable, same reason as 6.1.                                                                                                                                                                                                                                                                                                                                                                                                | Not applicable to this component |
| 7.1       | Scripts compatible with assistive technology   | Full combobox pattern (`role="combobox"`, `aria-autocomplete="list"`, `aria-haspopup="listbox"`, conditional `aria-controls`, `aria-expanded`, a bounded `aria-activedescendant`) — 0 axe violations across the three tested states, corroborated by Storybook's Accessibility panel on `WithResults`/`NoResults`. Ids are namespaced per instance and `aria-controls` always points at a target that actually exists (see above). | Compliant                        |
| 7.3       | Keyboard- and pointer-operable                 | `ArrowUp`/`ArrowDown` navigation, `Enter` to select, `Escape` to close. Clear button measured in Storybook (`getBoundingClientRect`, `WithResults` story): **28 × 28px**, above the WCAG 2.5.8 threshold. The `(click)` on the pill (`.gbt-sb-trigger`) only extends the clickable area to the native field it contains (like a `<label>`): the field itself remains reachable via its own tab stop, independent of this handler.  | Compliant                        |
| 7.5       | Status message announced                       | A `role="status" aria-live="polite" aria-atomic="true"` region announces `{n} result(s)` on every keystroke, driven by the `resultsAnnouncement` input; the "no results" message (`.gbt-sb-state`) is likewise marked `role="status"`. Tested ("marks the empty-state message as a status region so it is announced"), verified in the DOM under real conditions via Storybook.                                                    | Compliant                        |
| 9.3       | Appropriate list structure                     | `role="listbox"` > `role="option"` (buttons, direct children, no intermediate `<li>` here) — verified by the absence of `aria-required-children`/`aria-required-parent` violations on `WithResults`.                                                                                                                                                                                                                               | Compliant                        |
| 10.13     | Additional content controllable by the user    | The panel, opened while typing, never closes on a mere hover — only on `Escape`, selection, an actual focus loss (`onBlur`, with a 200ms grace period to let an internal click land) or an outside click. `(mousedown.preventDefault)`/`(click.stopPropagation)` on the panel prevent an unwanted close while clicking inside it.                                                                                                  | Compliant                        |
| 11.1      | Label presence                                 | `[attr.aria-label]="ariaLabel() \|\| placeholder()"` — never empty, `placeholder` defaulting to `'Search…'`. The placeholder disappears once typing starts, hence the double guard rather than a `placeholder` alone.                                                                                                                                                                                                              | Compliant                        |
| 12.11     | Hidden content ignored by assistive technology | Decorative icons via `gbt-icon` (unconditional `aria-hidden`). The panel footer (`.gbt-sb-footer`, the keyboard-shortcut hint) is marked `aria-hidden="true"` as a whole — its text content (`navigateHint`/`selectHint`/`closeHint`) stays externalized (see below) since it remains visible to a sighted user, even while ignored by screen readers.                                                                             | Compliant                        |

## 320px reflow (WCAG 10.11)

`.gbt-sb-trigger` (a `<div>`, not a native form control) carries
`box-sizing: border-box`, so its responsive `width: 100%` combined
with padding and a border doesn't push it past the viewport — verified
at 320px on `Empty` and `WithResults`: `scrollWidth === clientWidth ===
320`.

## Known limitation — a live region rendered under `@if`

`search-bar.html` renders the results-announcement region
(`role="status" aria-live="polite" aria-atomic="true"`) under `@if
(showOverlay())`: it doesn't exist in the DOM at rest, and is
re-created along with its content each time the panel opens, rather
than pre-existing with only its content changing. The risk is real but
bounded: the panel's first announcement on open may not be rendered by
every screen reader, since the node carrying the live attribute is
born with its text rather than receiving it afterward; subsequent
keystrokes mutate the content of an already-registered node and
announce normally as long as the panel stays open. `gbt-sparkline` and
`gbt-funnel-chart` render their own equivalent regions unconditionally,
avoiding this limitation.

## Externalized strings

`placeholder` (`'Search…'`), `noResultsMessage` (`'No results'`),
`noResultsHint` (`'Try a different search.'`), `clearLabel` (`'Clear
search'`), `resultsAnnouncement` (a function input, criterion 7.5),
and the keyboard-hint words `navigateHint` (`'Navigate'`), `selectHint`
(`'Select'`), `closeHint` (`'Close'`) — visible on screen despite
`aria-hidden` (see 12.11 above).

## Outputs named to avoid native DOM events

The outputs are `queryChange` and `itemSelected` rather than `search`
and `select`, which would collide with the native `search` and
`select` DOM events (`@angular-eslint/no-output-native`); `clear` has
no such collision.

## Template lint — one documented exception

The results panel sets `(mousedown)`/`(click)` on its own container
with no keyboard counterpart — @angular-eslint flags this, but these
two handlers don't represent an activatable action on the container:
they only prevent the field from losing focus and the outside-click
close while clicking inside the panel (focus plumbing, not a feature
`role="listbox"`/its `role="option"` items wouldn't already provide at
the keyboard). Documented with an HTML comment followed by an
`eslint-disable-next-line` targeted at these two specific rules.

Dark mode is visually confirmed in Storybook (`Dark` story) — pill and
text legible.
