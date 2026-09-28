# RGAA Audit — Badge

Verified against RGAA 4.1.2 by exercising `Atoms/Badge` in Storybook
(stories `Neutral`, `Variants`, `WithIcon`, `InContext`, `Dark`, plus the
`mono`/copy and `value`-mode stories — see below) and by code
review (`badge.ts`, `badge.html`, `badge.scss`).

`gbt-badge` is a purely informational atom in its default and `mono` modes:
no interactive affordance, no focusable element, no ARIA role of its own — a
`<span>` carrying a `data-variant` attribute for styling, exactly like
`Toaster`'s `data-variant` items. `copyable` adds the one interactive
affordance: a small native `<button>`, same engine as `gbt-copy-button`.

## Checklist

| Criterion   | Short title                                    | Verification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Result                |
| ----------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 3.2         | Text contrast                                  | Each colored variant pairs `--color-{variant}-bg-text` on `--color-{variant}-bg`. Measured in Storybook (`Variants` story, computed styles): success 9.43:1, warning 8.26:1, error 8.33:1, info 7.15:1 — all above 7:1 (AAA). `neutral` uses `--text-secondary` on the page background, already measured at 7:1+ (AAA) in `contrast.spec.ts`. `color-info-bg-text`/`color-info-bg` (light) also asserted directly in `contrast.spec.ts` ("text on colored banner backgrounds stays readable"). | Compliant             |
| 7.1         | Scripts compatible with assistive technology   | No script-driven behavior outside `copyable`: the plain/`mono`/`value` badge is static markup, nothing to break for assistive technology. 0 axe violations, with and without an icon (`badge.spec.ts`).                                                                                                                                                                                                                                                                                        | Compliant             |
| 11.1 / 11.2 | Label presence / relevance                     | The label is the projected content itself (`<ng-content />`) — read by assistive technology exactly as any other inline text. Text entirely delegated to the consumer, except in `value` mode (see below).                                                                                                                                                                                                                                                                                     | Compliant (delegated) |
| 12.11       | Hidden content ignored by assistive technology | The optional icon (`gbt-icon`) always carries `aria-hidden="true"` (its own host binding) — it never duplicates or contradicts the text label already present.                                                                                                                                                                                                                                                                                                                                 | Compliant             |
| WCAG 2.5.8  | Target size minimum                            | Not applicable to the plain/`mono`/`value` pill: no pointer/keyboard interaction, no `tabindex`, no interactive role. `copyable`'s button is 18 px with a 24 px hit area, see below.                                                                                                                                                                                                                                                                                                           | N/A — non-interactive |

## Why `data-variant`, not `[class.gbt-badge--x]`

Matches `Toaster`'s existing convention for a single "one-of-N" variant
(`&[data-variant='success']` in SCSS) instead of five separate boolean
class bindings — one attribute, one source of truth, consistent with
the rest of the library.

## Externalized content

Unlike most other components in this library, `Badge` has no default
text of its own to externalize — its entire content comes from
`<ng-content />` (or, in `value` mode, a computed number), so there's
nothing here for a consuming app to override; it's already 100% in the
consumer's hands by construction, aside from `copyLabel`/`copiedText`/
`failedText`, which are inputs with English defaults (see below).

Dark mode is visually confirmed in Storybook (`Dark` story).

## `appearance="outline"`, `size="sm"`, `truncate`, `tabularNums`

Verified in Storybook (`Outline`, `Small`, `Counters`, `Truncate`, `DarkOutline`) and by
`badge.spec.ts`. These are opt-in: a spec asserts the default pill's attribute list and class are
unaffected when they are left unset.

| Criterion | Short title        | Verification                                                                                                                                                                                                                                                                 | Result               |
| --------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 3.2       | Text contrast      | The outline label uses `--text-secondary` (neutral), `--color-{success,warning,error}-text` and `--color-info-bg-text` on the page (7:1, `contrast.spec.ts`) and on `--bg-panel` (7:1 too, asserted in both themes). The border is decorative: the text carries the meaning. | Compliant            |
| 3.1       | Not by color alone | The variant is conveyed by the text (and an optional icon), never by the border colour alone; `outline` changes only the fill/border.                                                                                                                                        | Compliant            |
| 10.11     | 320px reflow       | `truncate` lets a long label shrink with an ellipsis in a narrow row instead of overflowing (`Truncate` story, 12rem list and 375 px: `scrollWidth === clientWidth`).                                                                                                        | Compliant — verified |
| 10.4      | Text resizing      | Sizes are in `rem`; the truncated text is still in the DOM in full, so nothing is lost for assistive technology or when the text is resized (`title`/`fullText` gives sighted mouse users the full text).                                                                    | Compliant            |
| 7.1       | Scripts            | Still static markup; 0 axe violations with outline + sm + icon + truncate + tabular numbers.                                                                                                                                                                                 | Compliant            |

## `mono`, `copyable`, `maxWidth`, `fullText`

Verified in Storybook (`Mono: default`, `Mono: kinds`, `Mono: copyable`,
`Mono: truncated in a narrow row`, `Mono: in a sentence`, `Mono: dark`) and by
`badge.spec.ts`. The copy engine — `ClipboardFeedback` — is shared with
`gbt-copy-button`, not reimplemented:

| Criterion    | Short title                                    | Verification                                                                                                                                                                                                                                                                                   | Result    |
| ------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 3.2          | Text contrast                                  | `--text-primary` on the `--bg-hover` `mono` fill, over the page, a panel and each of them under a hovered row: at least 7:1 in both themes. The icon and the copy glyph (`--text-secondary`, `--color-success-text`, `--color-error-text`) reach 4.5:1 (`tokens/contrast.spec.ts`, "widgets"). | Compliant |
| 3.3          | Component contrast                             | The `mono` badge is delimited by its text and fill; the hairline border is decorative.                                                                                                                                                                                                         | Compliant |
| 10.4 / 10.11 | Text size, reflow                              | 12 px in rem. A long text is cut with an ellipsis (`fullText` gives the whole text as a tooltip on the label) when `truncate` is set; the chip never causes a horizontal scroll (`Mono: truncated in a narrow row`).                                                                           | Compliant |
| 11.1 / 11.9  | Label of a button                              | The copy button is a native `<button type="button">` named by `copyLabel` (the icon is `aria-hidden`).                                                                                                                                                                                         | Compliant |
| 7.1          | Scripts compatible with assistive technology   | A `role="status"` region, present while the badge is `copyable`, announces "Copied" / "Copy failed"; the glyph changes (`copy`, `check`, `alert-circle`) so the state is not colour alone.                                                                                                     | Compliant |
| 12.11        | Hidden content ignored by assistive technology | Icons are `aria-hidden`. The chip text stays in the DOM in full even when visually cut.                                                                                                                                                                                                        | Compliant |
| WCAG 2.5.8   | Target size minimum                            | The copy button is 18 px with a 24 px hit area (`::after` extends 3 px on every side); it is not adjacent to another target closer than 24 px in the usual layouts.                                                                                                                            | Compliant |
| 10.7         | Focus visible                                  | `:focus-visible` draws a 2 px `--primary` outline around the button.                                                                                                                                                                                                                           | Compliant |

`truncate` defaults to `false` in `mono` mode too (see the migration note in
README.md); this affects layout only, not any accessibility guarantee above
— the full text is always in the DOM either way.

### Externalized strings (mono/copy)

`copyLabel`, `copiedText`, `failedText` are inputs with English defaults.

## `value`, `max`, `hideZero`, `label`

Verified in Storybook (`Value: default`, `Value: composes with variant/appearance/size`,
`Value: max and zero`, `Value: in context`, `Value: dark`) and by `badge.spec.ts`. A purely
informational mode: a `<span>`, no role, nothing focusable (unless combined with `copyable`, a
supported combination with no dedicated test).

| Criterion  | Short title                                    | Verification                                                                                                                                                                                                                                                                             | Result                |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 3.2        | Text contrast                                  | `value` mode inherits Badge's own variant/appearance colours (see the table above); the default (`variant="neutral"`, `appearance="filled"`) uses `--text-secondary` on `--bg-hover`, ≥ 7:1 in both themes (`contrast.spec.ts`).                                                         | Compliant             |
| 10.4       | Text size                                      | 12 px (11 px for `sm`) in rem; the pill grows with its text (`min-width` from the base `.gbt-badge` rule, no fixed width): `1284` and `99+` fit.                                                                                                                                         | Compliant             |
| 9.3 / 11.1 | Meaning of a bare number                       | **A bare number is ambiguous for assistive technology.** `label` adds a visually hidden suffix ("12 open issues"), tested. Without it the number relies on the text around it (a heading, a tab) — `gbt-badge`'s `value` mode never announces itself on its own. | Compliant (delegated) |
| 3.1        | Information not conveyed by colour alone       | The variant/appearance only differ in emphasis; the count itself is text.                                                                                                                                                                                                                | Compliant             |
| 12.11      | Hidden content ignored by assistive technology | `hideZero` sets `hidden` on the host, so a hidden zero is removed from the accessibility tree too.                                                                                                                                                                                       | Compliant             |
| WCAG 2.5.8 | Target size minimum                            | Not applicable: not interactive (unless `copyable` is also set, covered above).                                                                                                                                                                                                          | N/A — non-interactive |

There is no dedicated `'primary'`-style appearance for counters (see the migration note in
README.md): Badge's own `variant`/`appearance` inputs cover that axis instead, and every
combination passes the contrast checks above via Badge's already-audited variant/appearance rules.

### Externalized strings (value mode)

`label` is the only text and is an input, with no default.
