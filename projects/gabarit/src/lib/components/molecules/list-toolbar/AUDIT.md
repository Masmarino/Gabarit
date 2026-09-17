# RGAA Audit — ListToolbar

Verified against RGAA 4.1.2 by exercising `Molecules/ListToolbar` in
Storybook (`Default`, `Dark`) and by code review
(`list-toolbar.ts`, `list-toolbar.html`, `list-toolbar.scss`). Storybook's
own Accessibility addon reports no violations on `Default`, and
`list-toolbar.spec.ts`'s `expectNoA11yViolations` check (axe-core) passes
with 0 violations.

`gbt-list-toolbar` introduces no new color pairing or ARIA pattern of
its own — it composes `gbt-input` (already audited), `gbt-select`
(already audited), and one new plain icon button.

## Checklist

| Criterion | Short title                                  | Verification                                                                                                                                                     | Result                              |
| --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 3.2/3.3   | Text / component contrast                     | Search field and sort selector: unchanged, see `input/AUDIT.md` and `select/AUDIT.md`. The direction button uses `--border-color` (already-audited 3:1+ token) for its outline and `--text-secondary` for its icon, same tokens `select`'s trigger already uses. | Compliant (inherited)                |
| 7.1       | Scripts compatible with assistive technology  | The direction button is a plain `<button type="button">`, no custom widget semantics needed. 0 axe violations (`list-toolbar.spec.ts`).                          | Compliant                            |
| 7.3       | Keyboard- and pointer-operable                | The direction button is a native `<button>` — full keyboard support (`Enter`/`Space`) for free. Target size 40×40px, above the WCAG 2.5.8 threshold.              | Compliant                            |
| 11.1      | Label presence                                | Search field labeled via `gbt-input`'s own `label` (required input here, never omitted); sort selector labeled via `gbt-select`'s own `label`; direction button labeled via `aria-label` (`directionLabel`), reflecting its current action's target state via `aria-pressed`. | Compliant                            |
| 12.11     | Hidden content ignored by assistive technology | The direction icon is `gbt-icon`, whose host unconditionally carries `aria-hidden="true"` — never duplicating the button's own `aria-label`.                      | Compliant (delegated to `gbt-icon`) |

## Externalized strings

`searchLabel` is required (no default) precisely so a consumer must
always supply a real accessible name for the search field rather than
falling back to a generic one that wouldn't describe *what* is being
searched. `sortLabel` and `directionLabel` default to English strings
(`'Sort by'` / `'Reverse sort direction'`) — Gabarit has no i18n
mechanism yet (see `Select`'s own README), consumers in another
language override both explicitly.

Dark mode is visually confirmed in Storybook (`Dark` story).

## Implementation note

The task brief's reference implementation wires the search/sort child
controls with plain `[ngModel]`/`(ngModelChange)` bindings. In practice
this makes the *initial* `sortValue` fail to reach `gbt-select`'s
displayed selection synchronously: Angular's `NgModel` directive defers
propagating a bound value into the control (and therefore into the
control-value-accessor's `writeValue()`) via a microtask
(`resolvedPromise.then(...)`, an Angular Forms internal), so a single
synchronous `fixture.detectChanges()` observes the select's placeholder
rather than the pre-selected option — this was confirmed empirically
against this exact Angular/Vitest setup while implementing task 3.
`ListToolbar` instead mirrors `searchValue`/`sortValue` onto internal
`FormControl`s via `effect()` and binds them with `[formControl]`;
`FormControl.setValue()` propagates to the CVA synchronously, so the
initial selection renders correctly on the very first change-detection
pass. This is purely an internal wiring detail — the component's
selector, inputs, and outputs are unchanged from the brief.
