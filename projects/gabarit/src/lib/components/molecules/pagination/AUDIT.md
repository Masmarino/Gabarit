# RGAA Audit — Pagination

Verified against RGAA 4.1.2 by exercising `Molecules/Pagination` in
Storybook (stories `FewPages`, `ManyPagesWithEllipsis`, `FirstPage`,
`LastPage`, `SinglePage`, `WithControls`, `Disabled`, `Dark`) and by
code review (`pagination.ts`, `pagination.html`, `pagination.scss`).

`gbt-pagination` is a `<nav>` containing a plain `<ul>` of buttons — no
custom widget role, no roving tabindex: every button (previous, next,
each page number) is a normal native tab stop, reachable and operable
exactly like any other button on the page.

## Checklist

| Criterion   | Short title                                    | Verification                                                                                                                                                                                                                                                                       | Result                  |
| ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 3.2         | Text contrast                                  | The current page's `--primary`/`--text-on-primary` pair, already measured at 7:1 (AAA) elsewhere in `contrast.spec.ts`; confirmed again live in Storybook: 8.92:1 (light), 8.46:1 (dark).                                                                                          | Compliant                |
| 3.3         | Component contrast                             | Non-current page buttons use `--text-primary` on a transparent background — same text token already measured against the page background at 7:1+ (AAA) in `contrast.spec.ts`.                                                                                                     | Compliant                |
| 7.1         | Scripts compatible with assistive technology   | `<nav aria-label>` names the whole control; the current page is marked `aria-current="page"`; each page button has its own `aria-label` (`pageLabel()`) so "12" reads as "Page 12", not just the visible digits. 0 axe violations, few pages and many pages with ellipsis (`pagination.spec.ts`). | Compliant                |
| 7.3         | Keyboard- and pointer-operable                 | Plain native `<button>` elements in normal tab order — `Tab`/`Shift+Tab` moves between them, `Enter`/`Space` activates, no custom key handling needed. Target size measured in Storybook (`getBoundingClientRect`, `Dark` story): **32 × 32px**, above the WCAG 2.5.8 threshold.      | Compliant                |
| 7.4         | No uncontrolled context change                 | Navigation only happens on an explicit click/activation of a button — never from focus or hover. Clicking the already-current page is a deliberate no-op (`pagination.spec.ts`, "does not emit when clicking the already-current page") rather than a silent re-navigation.        | Compliant                |
| 9.3         | Appropriate list structure                     | Previous/next and every page number are `<li>` children of a single `<ul>` inside the `<nav>` — a real list, read as such by assistive technology.                                                                                                                                  | Compliant                |
| 12.11       | Hidden content ignored by assistive technology | The ellipsis (`…`) is a plain `<li aria-hidden="true">`, not a button — it carries no accessible name and isn't announced as an interactive element (`pagination.spec.ts`, "renders ellipsis as non-interactive…"). The chevron icons on previous/next also carry `aria-hidden="true"` (inherited from `gbt-icon`'s own host binding); the buttons' own `aria-label` supplies the accessible name instead. | Compliant                |
| WCAG 2.5.8  | Target size minimum                            | See 7.3 — 32 × 32px per button, comfortably above 24 × 24px.                                                                                                                                                                                                                        | Compliant                |
| 11.1        | Label presence                                 | The page-size selector is `Select`'s own `<label>`, associated the same way `Select` already is elsewhere — `pageSizeSelectLabel` is a real visible label, not a placeholder standing in for one.                                                                                  | Compliant                |
| 12.6        | Content that moves/updates automatically       | The items summary and page count only change in response to the user's own action (a page click, or picking a page size) — never on a timer or an unrelated event.                                                                                                                | Compliant                |
| 7.4         | No uncontrolled context change (disabled state) | `disabled` sets the native `disabled` attribute on every button and on the page-size `Select` — a disabled control is already excluded from the tab order and inert for both pointer and keyboard by the platform, not just visually dimmed. Verified in `pagination.spec.ts` ("disables every button…", "ignores clicks on a disabled page button") and the `Disabled` story.  | Compliant                |

## Why the windowing never wastes an ellipsis on a single page

`paginationRange()` only switches to the "…" form when the gap being
collapsed is at least two pages — skipping exactly one page (e.g. "…
19 20" instead of "18 19 20") would spend the same width as just
showing that page, for no benefit. Tested directly as a pure function
in `pagination.spec.ts` ("never spends an ellipsis to skip just one
page"), independently of the DOM.

## The page numbers stay centered no matter what sits on either side

`.gbt-pagination__side--start`/`--end` are equal-growing flex zones
(`flex: 1`) around the `<nav>` — the items summary and the page-size
selector move within their own half but never push the page numbers
off-center, even though the two zones' content is rarely the same
width. Verified in Storybook: the `<nav>`'s horizontal center matches
the row's horizontal center exactly (0px difference, `WithControls`
story, measured via `getBoundingClientRect`).

## Changing the page size always resets to page 1

Picking a new page size emits `pageChange(1)` right after
`pageSizeChange`, so the app can never end up bound to a `page` number
that no longer exists once the page count shrinks (e.g. going from 50
to 10 items per page while on page 20 of a 24-page list). Tested in
`pagination.spec.ts` ("emits pageSizeChange and resets to page 1…").

## Self-healing when `page` falls out of range

If the app shrinks `totalItems` (e.g. a filter) or `pageSize` while
`page` stays on a now out-of-range value, `Pagination` doesn't get
stuck silently: an effect clamps `page` into `[1, pageCount]` and emits
the corrected value via `pageChange`. Without this, no button would
carry `aria-current`, and the "previous" button would stay enabled
while pointing at a page whose data the app can no longer produce.
Tested directly in `pagination.spec.ts` ("clamps a stale page down…",
"clamps a page below 1 up to 1", "does not emit a correction when the
page is already within range").

## Externalized strings

`ariaLabel`, `previousLabel`, `nextLabel`, `pageLabel`, `pageSizeLabel`,
`pageSizeSelectLabel`, and `itemsSummaryLabel` (function inputs, like
`Select`'s `selectedCountLabel`) all default to English and are meant
to be localized by the consuming app.

Dark mode is visually confirmed in Storybook (`Dark` story).
