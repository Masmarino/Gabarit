# RGAA Audit — DescriptionList

Verified against RGAA 4.1.2 by exercising `Molecules/DescriptionList`
in Storybook (stories `Stacked`, `Inline`, `Dark`) — including
opening the `Inline` story at full width via `iframe.html?viewMode=story`,
since the docs canvas panel itself is narrower than the responsive
breakpoint (724px measured, below the 768px threshold) — and by code
review (`description-list.ts`, `description-list.html`,
`description-list.scss`).

`gbt-description-list` is purely informational: every `<dt>`/`<dd>`
pair is rendered directly by this component's own template (via
`items`, not content projection), so they are genuine direct children
of `<dl>` — required both by the HTML5 content model and by axe's
`definition-list`/`dlitem` rules (see "Why `items`..." in the README
for how an earlier, content-projection-based design failed this).

## Checklist

| Criterion | Short title                                   | Verification                                                                                                                                                                                                                                  | Result   |
| --------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 9.3       | Appropriate list/group structure                | Real `<dl>`/`<dt>`/`<dd>` elements, each pair a genuine direct child of `<dl>` in DOM order — tested directly (`description-list.spec.ts`, "renders a real dl with one dt/dd pair per item, in order") and by 0 axe violations in both layouts ("has no a11y violations, stacked"/"...inline"), which specifically catches the `definition-list`/`dlitem` rules this component's first design failed. | Compliant |
| 3.2       | Text contrast                                   | The term reuses `--text-secondary`, the value `--text-primary`, both on `--bg-principal` — the same base text/background pairing already measured at ≥7:1 (AAA) elsewhere in this library (e.g. `gauge-bar`, `dimension-card`) and covered by the generic pairing check in `token-usage.spec.ts`. No new tokens introduced.                | Compliant |
| 7.1       | Scripts compatible with assistive technology    | A `TemplateRef` value's content is whatever the consumer provides — its own accessibility is the consumer's responsibility (e.g. `Badge`, already audited). `DescriptionList` itself adds no ARIA attribute, needing none for a plain `<dl>`.  | Compliant — content is the consumer's |
| 11.1      | Label presence                                  | Every value is labelled by its own `<dt>` per the native `<dl>` association — no `aria-label`/`aria-labelledby` needed, unlike components that wrap arbitrary projected content (`Tooltip`, `Popover`).                                        | Compliant |
| 12.11     | Hidden content ignored by assistive technology  | N/A — nothing in this component is decorative-only; every rendered `<dt>`/`<dd>` carries meaningful content.                                                                                                                                    | N/A       |

## Why the responsive fallback matters for this audit

`layout="inline"` only renders as two columns above 768px; below that,
it's identical to `stacked` markup-wise (same `<dl>`/`<dt>`/`<dd>`
structure — only the CSS `display` value changes), so there is no
separate accessibility concern for the narrow case: the DOM and its
semantics are unaffected by which layout renders.

## Externalized strings

None — `DescriptionList` introduces no default text of its own; every
term and string value comes from the consumer's own `items` input.

Dark mode is visually confirmed in Storybook (`Dark` story) — term,
value, and the rich `Badge` value all legible, no contrast regression.
