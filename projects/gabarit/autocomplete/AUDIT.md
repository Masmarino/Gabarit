# RGAA Audit — Autocomplete

Verified against RGAA 4.1.2 by exercising `Molecules/Autocomplete` in
Storybook (stories `Default`, `CustomItemTemplate`, `ObservableSearch`,
`NoResults`, `SearchError`, `Disabled`, `WithError`, `Dark`) and by code
review (`autocomplete.ts`, `autocomplete.html`, `autocomplete.scss`).

`gbt-autocomplete` sets no ARIA attribute on its own host — all the
semantics (`role="combobox"`, `role="listbox"`, `role="option"`) live
on internal elements (`<input>`, `<ul>`, `<button>`). Every ARIA
attribute below was checked by direct DOM inspection in the tests
(`autocomplete.spec.ts`), not only by an axe pass.

## Checklist

| Criterion   | Short title                                    | Verification                                                                                                                                                                                                                                                                                                    | Result                 |
| ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 3.2         | Text contrast                                  | `.gbt-autocomplete__error` and `.gbt-autocomplete__state--error` both paint with `--color-error-text` (7.04:1 light / 7.01:1 dark — same token already measured for `Select`/`GbtInput`).                                                                                                                        | Compliant               |
| 3.3         | Component contrast                             | `.gbt-autocomplete__input` uses `--border-color` (3.03:1 light / 3.01:1 dark) for its outline, same token `Select`'s trigger uses.                                                                                                                                                                                | Compliant               |
| 7.1         | Scripts compatible with assistive technology   | "Combobox with list autocomplete" ARIA pattern: `role="combobox"` on the `<input>` with `aria-autocomplete="list"`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, and a bounded `aria-activedescendant`. The panel is a `role="listbox"`; each option is a `<button role="option">` inside an `<li role="presentation">`. A `role="status" aria-live="polite"` region announces the loading/error/result-count state as it changes. 0 axe violations, panel closed and open with results (`autocomplete.spec.ts`). | Compliant               |
| 7.3         | Keyboard- and pointer-operable                 | `ArrowDown`/`ArrowUp` move the active option, `Enter` selects it, `Escape` closes the panel without clearing the typed text — all on the `<input>`'s own `(keydown)`, no extra tab stop needed (`autocomplete.spec.ts`, "navigates results with the keyboard…", "closes the panel on Escape…"). Each `<button role="option">` carries `tabindex="-1"`, consistent with `Select`'s combobox pattern. Target sizes measured in Storybook (`getBoundingClientRect`, `Default` story, panel open): input **992 × 34px**, option row **962 × 31px** — both above the WCAG 2.5.8 threshold.                                     | Compliant               |
| 7.4         | No uncontrolled context change                 | The panel only opens once a search actually starts (typing past `minLength`), never merely on focus unless a previous result set is still relevant to the current text (`onFocus`); it only closes on `Escape`, a selection, or focus leaving the component (`onBlur`, delayed like `SearchBar`'s to let a click-selection land first) — never on a mere hover.                                                                        | Compliant               |
| 9.3         | Appropriate list structure                     | See 7.1: `role="presentation"` on the `<li>` elements gives the `listbox`/`option` relationship the structure ARIA requires.                                                                                                                                                                                       | Compliant               |
| 10.13       | Additional content controllable by the user    | Same as 7.4 — the suggestions panel never appears or disappears from a hover or an incidental event; only explicit typing, selection, `Escape`, or leaving the field.                                                                                                                                             | Compliant               |
| 11.1        | Label presence                                 | A native `<label [for]="id()">`, associated with the `<input>` by id — unlike `Select`'s button trigger, the combobox here is a real text input, so the plain HTML label mechanism applies directly. Tested implicitly by the axe pass, which flags an unlabelled control.                                        | Compliant               |
| 11.2        | Label relevance                                | Text entirely delegated to the consumer — nothing to check on the component's side.                                                                                                                                                                                                                                | Compliant (delegated)   |
| 12.6        | Content that moves/updates automatically       | The suggestions panel updates only in response to the user's own typing (debounced) or an explicit action — never on a timer or unrelated event the user didn't trigger.                                                                                                                                          | Compliant               |
| WCAG 2.4.11 | Focus not obscured                             | The panel uses `position: fixed` computed from the input's `getBoundingClientRect()`, the same technique as `Select`'s panel — it escapes an ancestor container's `overflow: hidden`.                                                                                                                             | Compliant               |

## Search lifecycle, not just UI

Three behaviors here are load-bearing for accessibility but live in
`autocomplete.ts` rather than markup, so they're called out explicitly:

- **Debounce** (`debounceMs`, default 300ms) avoids firing a request —
  and therefore an ARIA-live announcement — on every keystroke, which
  would otherwise spam a screen reader mid-word.
- **Stale-response guard**: a request token (`requestSeq`) ensures a
  response for an earlier query can never overwrite a newer query's
  results or announcement, tested in `autocomplete.spec.ts` ("ignores a
  stale response…").
- **Promise/Observable interop**: an `Observable`'s subscription is
  unsubscribed before starting a newer search, so a slow, long-lived
  stream (e.g. a websocket-backed search) can't keep emitting into a
  panel the user has since navigated away from with new input.

## Box-sizing note

`.gbt-autocomplete__panel` carries an explicit `box-sizing: border-box`
— its width is set inline from the input's own `getBoundingClientRect()`
width, and the panel also has `padding: 6px`; without `border-box` the
padding would add on top of that width, rendering the panel visibly
wider than the input it's anchored to.

## Externalized strings

`loadingMessage`, `noResultsMessage`, `searchErrorMessage`, and
`resultsAnnouncement` (a function input, like `Select`'s
`selectedCountLabel` and `SearchBar`'s `resultsAnnouncement`) all
default to English and are meant to be localized by the consuming app.

Dark mode is visually confirmed in Storybook (`Dark` story).
