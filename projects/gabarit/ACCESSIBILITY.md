# Accessibility

Target standard: **RGAA 4.1.2** (the current version of the French
accessibility standard, 106 criteria, aligned with WCAG 2.1 AA and EN 301
549), plus the WCAG 2.2 AA additions that RGAA 5 will fold in by the end
of 2026 — 2.4.11 focus not obscured and 2.5.8 target size.

Text contrast targets level **AAA (7:1)**, beyond RGAA's own requirement
of AA (4.5:1). UI component contrast stays at 3:1: criterion 3.3 has no
AAA level.

## What Gabarit guarantees, and what it can't guarantee

**RGAA is assessed on a page or a service, never on a library.** Gabarit
is therefore not "RGAA-compliant" and cannot be: it's your application
that is, or isn't. What Gabarit guarantees is that **the 30 criteria that
depend on its components are met**, verified by `axe-core` in the unit
tests, by a contrast test on the tokens, and by thirteen manual audit
checklists (`AUDIT.md`) — one alone covers seven chart-base components,
another covers both tab components, and five components have none. The
first two means run locally via `npm test`, not in continuous
integration: this repository has no CI. The checklists are handwritten
and reviewed by a human.

## How it's actually verified, and where that stops

**This describes what actually runs, not what would be desirable.**
This repository has no continuous integration, and no `axe-core` pass
runs on Storybook stories. What does exist:

- **`axe-core`, run in the unit tests (`npm test`, local).** Each
  component has its own `expectNoA11yViolations` test. It covers only
  around 30% of RGAA criteria: necessary, and very insufficient on its
  own.
- **`@storybook/addon-a11y`** is registered in Storybook and gives a
  visual inspection panel per story — useful in manual review, but
  **nothing runs it as a test**: it isn't wired to a test runner, so no
  story can "fail" on an accessibility violation. Reading it is part of
  the manual audit checklist below, not of automated verification.
- **A dedicated contrast test** (`tokens/contrast.spec.ts`), which
  recomputes the ratio of a **hand-maintained** list of token pairs in
  that file against the thresholds above, in both themes — not "every
  token pair" in an exhaustive sense: a token added without being added
  to that list is checked by nothing, and the test measures token
  values in isolation without asking which token a component actually
  uses — a component can paint text with a graphic-only token at 3:1
  and this test still comes back green. It also covers **hover
  states**, checking that every hovered fill stays perceptibly distinct
  from its resting state.
- **A token-usage test** (`tokens/token-usage.spec.ts`), which closes the
  blind spot described above in three parts, under an explicit exemption
  you need to know before them. **A `*-base` token (validated at 3:1,
  never a text threshold) may paint a purely graphic HTML fill if its
  declaration carries the `// token-graphique-sans-texte` marker at the
  end of the line**, and this exemption is refused outright as soon as
  the selector of the rule carrying it itself denotes text (BEM word
  `label`, `text`, `caption`, or `title`). It is used in three places
  today: the fill of `gbt-gauge-bar`, which carries no text, and the
  fills of `gbt-dimension-card` and `gbt-funnel-chart`, themselves
  translucent, on which opaque text is laid — never in the exempted
  declaration itself. That said, the three parts: the test re-reads the
  components' stylesheets — and the `styles:` blocks declared inline in
  decorators — and fails the suite as soon as a direct reference to the
  raw palette appears (the families are **derived from
  `_palette.scss`**, never hand-enumerated) or a `color` declaration
  tied to a `*-base` token. Its third part measures the **actual
  pairing**: for a rule's own `background` declaration, it resolves the
  **effective** text color — the rule's own if it sets one, otherwise
  its nearest ancestor's that does — up to the palette, composites
  translucent overlays over the real background, and checks the ratio as
  it will actually be painted. It's the only check in this repository
  that measures a pair under rendering conditions, rather than two
  tokens side by side.
- **Thirteen manual audit checklists** (`AUDIT.md` in the folder of the
  components that have one — not all of them). One (`chart-frame/AUDIT.md`)
  alone covers seven chart-base components (`chart-frame`, `chart-axis`,
  `chart-tooltip`, `chart-legend`, `chart-empty`, `chart-table`,
  `chart-context`), another (`tabs/AUDIT.md`) covers both the `Tabs` and
  `Tab` components. Each checklist records what automation doesn't see —
  actual keyboard use, screen reader, measurements in Storybook, reading
  the `@storybook/addon-a11y` panel. Conversely, five components
  (`bar-chart`, `funnel-chart`, `icon`, `sparkline`, `timeline-chart`)
  have none.

Two measured limits of `axe-core` in this tooling, worth knowing before
reproducing this approach:

- **`color-contrast` can't be evaluated under jsdom.** The rule needs a
  real canvas; under jsdom it consistently returns "incomplete" rather
  than a verdict. It's therefore disabled in the test helper
  (`expectNoA11yViolations`) and replaced by the dedicated contrast test
  above — which is actually a **more rigorous** check, since it measures
  the tokens' real values rather than inspecting rendered output.
- **`axe` doesn't infer the implicit role of an unknown custom
  element.** Measured empirically: the `aria-prohibited-attr` rule fires
  on `<div role="generic" aria-label="x">` but **not** on
  `<gbt-icon aria-label="x">`. And the host of every Gabarit component is
  a custom element of that kind. Consequence: no ARIA assertion about the
  host of a `gbt-*` component relies on `axe` alone — it's also checked
  by direct DOM inspection in that component's tests.

A different kind of gap is worth distinguishing from the two axe
limits above: a duplicate-id defect between two instances of
`gbt-tabs` on the same page is only observable when a fixture actually
renders two instances at once — a single-instance fixture can't
surface it, however thorough the test. The `duplicate-id` and
`duplicate-id-aria` rules are part of the default rule set used here
(`wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`/`wcag22aa`) and do catch this
class of defect, given that scenario; `tabs.spec.ts` includes it, and
`gbt-tabs` namespaces every instance's generated ids accordingly (see
`tabs/AUDIT.md`). The distinction matters for anyone adopting this
verification method: a rule with no violation to show isn't the same
as a rule with nothing to check — check the scenario, not just the
rule.

## Criteria covered by Gabarit

| Topic           | Criteria                                                  |
| --------------- | --------------------------------------------------------- |
| 3 Colors        | 3.1, 3.2, 3.3                                             |
| 5 Tables        | 5.4, 5.5, 5.6, 5.7, 5.8                                   |
| 7 Scripting     | 7.1, 7.3, 7.4, 7.5                                        |
| 9 Structure     | 9.3                                                       |
| 10 Presentation | 10.5, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12, 10.13, 10.14 |
| 11 Forms        | 11.1, 11.4, 11.9, 11.11                                   |
| 12 Navigation   | 12.8, 12.9, 12.11                                         |
| 13 Consultation | 13.8                                                      |

That's 30 out of the 106 criteria in RGAA 4.1.2. Two topics that might
look like they belong here don't: **Topic 6 Links (6.1, 6.2)** isn't
listed because no `<a>` element exists anywhere in the library — a
library that never produces a link cannot guarantee a criterion about
links. And **11.2, 11.10, and 11.13** sit under "What remains your
responsibility" below rather than here, since the components only
provide the mechanism (`label`/field association, `role="alert"`,
`aria-describedby`, an `autocomplete` you can override) — never the
label text, the error text, or the field-specific `autocomplete`
value itself.

## What remains your responsibility

The other 76 criteria. The main ones:

| Topic                | What you need to do                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 Images             | Text alternatives for your images. `gbt-icon` is unconditionally decorative — see "Points to watch" below — a meaningful icon must be accompanied by text on your side.                                                                                                                                                                                                                          |
| 6 Links              | Explicit (6.1) and relevant (6.2) wording for every link in your application. No Gabarit component renders an `<a>`: nothing to delegate.                                                                                                                                                                                                                                                        |
| 8 Mandatory elements | Doctype, `lang`, page `<title>`, absence of validity errors.                                                                                                                                                                                                                                                                                                                                     |
| 9 Structure          | Heading hierarchy of the page. `gbt-card` lets you choose its level via `headingLevel` — it's up to you to set it correctly.                                                                                                                                                                                                                                                                     |
| 10 Presentation      | 200% zoom, page-wide reflow. The components hold up their end; the layout is yours.                                                                                                                                                                                                                                                                                                              |
| 11 Forms             | Field grouping (`fieldset` / `legend`), **relevance** of your labels (11.2 — the component associates `label`/field, the text is yours), **content** of your error messages (11.10 — the component announces them via `role="alert"`, you write the text in `errorMessage`), and a correct `autocomplete` value (11.13 — `gbt-input` sets it to `'off'` by default, to override field by field). |
| 12 Navigation        | Two navigation systems, sitemap, skip link, ARIA regions. The `.skip-link` utility is provided (`tokens/_utilities.scss`), using it is up to you.                                                                                                                                                                                                                                                |
| 13 Consultation      | Time limits, opening new windows, downloadable documents, screen orientation.                                                                                                                                                                                                                                                                                                                    |

## Points to watch when integrating

- **`gbt-table`** — `caption` is a **required** input (criteria 5.4 and
  5.5): the component won't compile without it. As soon as you listen to
  `rowClick`, pass `clickableRows`, otherwise the feature is inaccessible
  from the keyboard (criterion 7.3).
- **`gbt-search-bar`** — the outputs are `queryChange` and
  `itemSelected` (not `search` / `select`: `@angular-eslint/no-output-native`
  forbids those, they're native DOM events).
- **`gbt-card`** — `headingLevel` defaults to 2. Adjust it to the card's
  actual place in the page (criterion 9.1).
- **`gbt-button`** — a button with no `text` must have an `ariaLabel`
  (criterion 11.9).
- **`gbt-modal` restores focus on both closing paths, regardless of how
  you mount it.** Whether you unmount the component on close
  (`@if (open()) { <gbt-modal ... /> }`) or keep it mounted and toggle it
  (`[isOpen]="open()"`), focus returns to the element that held it before
  opening — respectively on the component's destruction and on the
  `isOpen()` transition from `true` to `false`. Both usages are therefore
  safe; neither lets focus fall onto `<body>`.
- **`gbt-icon` is unconditionally decorative.** It receives no input to
  carry an accessible name: its host carries a bound `aria-hidden="true"`,
  set after any attribute written by the consumer — an `aria-label` you
  set on `<gbt-icon>` is ignored by assistive technology regardless. The
  accessible name of an action belongs to the control that contains it
  (button, field, link), never to the icon itself.
- **The four standalone charts** (`gbt-sparkline`, `gbt-gauge-bar`,
  `gbt-dimension-card`, `gbt-funnel-chart`) have neither an axis nor a
  frame: each carries its own text alternative rather than assembling the
  `gbt-chart-frame` base. Three inputs there distinguish similar-sounding
  roles, not to be confused: `tableCaption` is the caption of a chart's
  non-visual table (`gbt-sparkline`, `gbt-funnel-chart`); `caption` is the
  caption of a **visible** table, taking the name of the HTML element
  (`gbt-dimension-card`); `label` is the visible, accessible name of the
  component itself — the heading of `gbt-gauge-bar`, and the `aria-label`
  of `gbt-funnel-chart`'s `<ol>`, distinct from its `tableCaption`.
- **`gbt-gauge-bar` expresses its ARIA as a percentage, never in the
  consumer's own scale.** `aria-valuenow`, `aria-valuemin`, and
  `aria-valuemax` are always bounded to [0, 100]: with `[max]="500"` and
  `[value]="62"`, a screen reader reads `aria-valuenow="12.4"` — neither
  "62" nor "62 out of 500". Only `aria-valuetext` (your `formattedValue`)
  carries the human-readable quantity; it's the only one of the five ARIA
  values worth reading if you inspect the attribute rather than letting
  assistive technology announce it.
- **Default strings in English, to override in a non-English
  application** — these components carry visible or announced labels
  with no localized default:
  - `gbt-button`: `loadingLabel` (`'Loading'`).
  - `gbt-input`: `showPasswordLabel` (`'Show password'`),
    `hidePasswordLabel` (`'Hide password'`).
  - `gbt-select`: `placeholder` (`'Select…'`), `selectedCountLabel`
    (function, `` `${count} selected` ``).
  - `gbt-modal`: `closeLabel` (`'Close'`).
  - `gbt-table`: `emptyMessage` (`'No data'`).
  - `gbt-search-bar`: `placeholder` (`'Search…'`), `noResultsMessage`
    (`'No results'`), `noResultsHint` (`'Try a different search.'`),
    `clearLabel` (`'Clear search'`), `resultsAnnouncement` (function,
    announces the result count — criterion 7.5), `navigateHint`
    (`'Navigate'`), `selectHint` (`'Select'`), `closeHint` (`'Close'`).
- **Token overrides** — if you redefine the semantic colors, you take on
  criteria 3.2 and 3.3 yourself. Gabarit's contrast test only checks its
  own values.
