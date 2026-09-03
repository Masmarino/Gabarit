# RGAA Audit — gbt-dimension-card

Verified against RGAA 4.1.2 by reading `dimension-card.ts`,
`dimension-card.html`, and `dimension-card.scss`, by running
`dimension-card.spec.ts`, `contrast.spec.ts`, and
`token-usage.spec.ts` (`projects/gabarit/src/lib/tokens/`), and by
opening Storybook directly in a browser at 320px — see criterion
10.11. Each row names the test that produced it, or says none does.

`gbt-dimension-card` assembles no base building block: nothing is
inherited from `chart-frame/AUDIT.md`, except the color tokens. The
component is rendered as a **real, visible table** — this choice
carries most of its compliance, and explains the absence of an
`sr-only` table.

## Checklist

| Criterion                                      | Verdict | Verification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 — text alternative to non-text information | ✅      | No image, no SVG: the ranking is a visible `<table>` whose every value is text, verified by `dimension-card.spec.ts` ("renders a real table, not a list", "shows one row per entry, formatted values"). The background bar is purely decorative — it doubles up on a value already written in the neighboring cell — and carries `aria-hidden="true"`, verified by "hides the bar from screen readers". **No `sr-only` table, deliberately**: the visible table _is_ the non-visual path; adding a hidden one would announce the ranking twice. "doesn't add any hidden table to the one that's already visible" locks in this choice by asserting there's only one `<table>` and no `.gbt-sr-only` in the component.                                                                                                                                                                     |
| 3.1 — information not by color alone           | ✅      | No information is carried by color: the bar is monochrome — a single token, `--chart-series-3-base`, for every row — so it encodes nothing. The bar's length is the only additional visual channel, and it doubles up on the numeric value in the neighboring cell, whose presence `dimension-card.spec.ts` checks row by row and whose proportionality it checks too ("sizes the background bar against the largest value": `100%`, `50%`, `25%`).                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 3.2 — text contrast                            | ✅      | The text uses `--text-primary` (caption, cells) and `--text-secondary` (column headers), measured at ≥ 7:1 on `bg-principal` in both themes by `contrast.spec.ts`. Each row's label sits over the translucent bar (`opacity: 0.16`): the surface actually under that text is `bg-principal` tinted by 16% of `--chart-series-3-base`, which `contrast.spec.ts` doesn't model (it only measures tokens in isolation). Measured directly in the browser (compositing performed by the rendering engine, colors read via `getComputedStyle` on the rendered component): **light theme — 13.92:1 on `bg-principal`, 12.81:1 on `bg-panel`; dark theme — 14.42:1 on `bg-principal`, 14.23:1 on `bg-panel`**. The 7:1 threshold holds with a wide margin — opacity could go up to 0.40 without crossing it — so `opacity: 0.16` is kept as-is (contrast `gbt-funnel-chart`, below).             |
| 3.3 — graphic color contrast                   | ✅      | The bar uses `--chart-series-3-base`, measured at ≥ 3:1 on both light **and** dark backgrounds by `contrast.spec.ts` (5.19:1 and 3.38:1). The token is measured at full opacity, while it's painted at 16% — the bar as displayed is therefore less contrastful than the measured value, which is not a compliance issue here since the bar carries no information (see 3.1), but matters for anyone reusing this pattern for a bar that does.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 3.3 — `*-base` exemption on a fill             | ✅      | `token-usage.spec.ts` forbids `background` with a `*-base` token. `dimension-card.scss` carries the `// token-graphique-sans-texte` marker on the bar's `background` declaration: the exemption is explicit and auditable with a plain `grep`. The 3:1 threshold is the right one for this fill — the label isn't painted _inside_ it, it's laid _over_ it on a `<span>` with `position: relative`, and the background it actually receives is the composited surface measured in 3.2.                                                                                                                                                                                                                                                                                                                                                                                                    |
| 5.4 — table caption associated                 | ✅      | The caption is a real `<caption>`, first child of the `<table>`: the association is structural, not reconstructed via `aria-*`. Verified by `dimension-card.spec.ts`, which reads the `<caption>`'s text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 5.6 — row and column headers declared          | ✅      | The two column headers are `<th>` elements inside a `<thead>`, and every row opens with a `<th>` carrying the label — never a styled `<td>`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 5.7 — cell/header association technique        | ✅      | `scope="col"` on both column headers, `scope="row"` on each row's header — asserted attribute by attribute, since axe doesn't flag a missing `scope`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 10.11 — 320px reflow                           | ✅      | Storybook opened directly in a browser (`npm run storybook`, port 6006), viewport 320 × 700, on `Molecules/Dataviz/DimensionCard → Nominal`. `document.documentElement.scrollWidth === window.innerWidth === 320` — no horizontal overflow; the table spans the usable width without being pushed wider by its content; across all five rows, no truncated label, no overlap between the label and value columns; the bar stays behind the text (`document.elementFromPoint()` at the center of each label returns the label's `<span>`, never the bar, in both themes, checked line-of-text by line-of-text where labels wrap on `Dense`). The last row's bar (2.6% of the maximum) renders as a thin, near-hairline shape — expected behavior for a proportional bar at a small value, with the value itself read out in full in the neighboring cell. Measured with the fallback font. |

## Hover: decorative here, revealing in `gbt-funnel-chart`

`gbt-dimension-card`'s rows are not focusable, and that's deliberate:
hovering a row only accents it (`tbody tr[data-active] { background:
var(--bg-hover) }`), a purely decorative effect — label and value are
already written in the **visible table**, which a screen reader's
table navigation traverses on its own. Adding `tabindex` to eight rows
would add eight tab stops with no information or function attached to
them, at a pure cost to keyboard navigation.

`gbt-funnel-chart` is built differently, because its hover **reveals**
information its `sr-only` table doesn't carry: the table gives the
conversion rate from the **first** step, while hovering or focusing a
step shows the rate from the **previous** step — two different
numbers, not two views of the same one. A mouse path there gives
access to data no other path gives, so keyboard parity is mandatory
(criterion 12.11): every `<li class="gbt-funnel-chart__step">` carries
`tabindex="0"`, `(focus)`/`(blur)` mirror `(mouseenter)`/`(mouseleave)`,
and an always-rendered `role="status" aria-live="polite"
aria-atomic="true"` region announces the rate, worded via the
`stepAnnouncement` input so it names what the percentage is rather
than speaking it bare.

The general rule the two cases illustrate: what triggers the
keyboard-parity requirement isn't that a hover effect exists, it's
that it **reveals** something to someone who wouldn't otherwise reach
it. A sighted keyboard user reads `gbt-dimension-card`'s visible table
with no hover at all — hover reveals nothing to them. That same user
has no access to `gbt-sparkline`'s `sr-only` table, so its hover
**is** their only path to the data, and its `tabindex` is justified
the same way `gbt-funnel-chart`'s is.

## `gbt-funnel-chart` and `gbt-sparkline`, measured in the same pass

Neither `gbt-funnel-chart` nor `gbt-sparkline` has its own `AUDIT.md`
(the library ships thirteen checklists, not one per component — see
`README.md`), so relevant findings from measuring them alongside
`gbt-dimension-card` are recorded here:

- **`Molecules/Dataviz/FunnelChart → Nominal`**, at 320px: no
  horizontal overflow; the four steps each fit on one line, no
  truncated label, no overlap between label and value; the band stays
  behind the text; the `sr-only` table is present, clipped via
  `inset(50%)`, with no `aria-hidden`, with its three columns (`Étape`,
  `Visiteurs`, `Conversion`) and its four rows.
- **The first step's value** is the only text in `gbt-funnel-chart`
  that sits on the full width of the band, using `--text-secondary`
  over the band's composited surface. Measured in the browser:
  **7.44:1 on `bg-principal` and 7.34:1 on `bg-panel` in dark theme,
  8.93:1 and 8.23:1 in light theme**, with the band's own fill opacity
  at `0.14` — chosen as the highest value that still holds ≥ 7:1
  against the theme's worst-case background (`bg-panel`), measured by
  a browser sweep rather than by eye. The band itself (independent of
  any text) never exceeds ~1.2:1 against the page background in either
  theme; no RGAA threshold applies to it, since the value is already
  spelled out in full and the band's length is redundant with it —
  but it stays visible as a shape in both themes.
- **`Atoms/Dataviz/Sparkline → Nominal`**, at 320px: the component
  renders a fixed 80 × 24px SVG (`viewBox="0 0 80 24"`); it doesn't
  adapt to its container's width, and that's intentional — it lives in
  a table cell, where a `ResizeObserver` per row would be expensive for
  a width the consumer already knows. It doesn't overflow at 320px, it
  simply stays its own size; the `InTable` story confirms the same for
  a full row.
- **`gbt-sparkline` is focusable**: its `<svg>` carries `tabindex="0"`,
  `role="group"`, and an accessible name (`aria-label`, fed by
  `tableCaption()`), and listens for `pointermove`, `pointerleave`,
  `keydown`, and `blur`. The `sr-only` table remains the primary path
  for criterion 1.1 — it carries the values and their caption, and is
  what actually restitutes the data; the SVG's accessible name only
  announces what kind of object was just reached by tabbing. An
  always-rendered `role="status" aria-live="polite"` region, empty at
  rest, carries the active point; `Escape` and losing focus both clear
  it, and hover and keyboard write the same content into it. The
  region and the painted tooltip both word their content via `xColumn`
  and `yColumn` (e.g. "Jour 30 — Requêtes 421") rather than two bare
  numbers.
- **The end dots on `gbt-sparkline`'s line are not clipped**: the
  scale's margin (`MARGE = 4` in `sparkline.ts`) applies to both axes,
  so the x-range runs from `MARGE` to `width - MARGE` and the first and
  last points' dots render as full circles rather than being cut by
  the SVG's edge. Measured on the `Dense` story at 320px: the last
  point's `cx` sits at `76` in a 96-wide SVG, `1px` of margin to the
  edge; pointer-proximity activation (`activates the point nearest the
cursor`) uses the same coordinates and remains discriminating across
  the resulting spacing.

## Caveat: `role="status"` on a message inserted with its content

`dimension-card.html` sets `role="status"` on the empty-state `<p>`,
in the `@else` branch of an `@if` — that is, on an element inserted
into the DOM at the same time as its text. A live region ordinarily
needs to pre-exist in the DOM to be reliably announced, since screen
readers observe mutations of an already-registered region and many
won't announce a node that's born with its content. The impact is
minor — the message stays visible and present in the accessibility
tree, so it's reachable by a normal traversal — but the **spontaneous**
announcement at the moment the ranking becomes empty isn't guaranteed.
No test covers this point. `gbt-funnel-chart` carries the same pattern
on its own empty state, with the same caveat.

## What this audit doesn't cover

- **The interaction criteria (7.1, 10.13, 12.11) don't apply to
  `gbt-dimension-card`** — see "Hover: decorative here, revealing in
  `gbt-funnel-chart`" above for why that's a different conclusion than
  for the funnel chart, not an oversight.
- **The composited surface under `gbt-dimension-card`'s text (3.2) is
  measured by no automated test** — it's measured in the browser, in
  both themes and against both backgrounds, but that measurement
  doesn't replay on every commit. The underlying gap: `token-usage.spec.ts`'s
  `resolveToken()` can composite an `rgba`, but nothing yet connects an
  element's `opacity` to a sibling's text color.
- **Actual rendering by a screen reader hasn't been verified** for
  either component: neither the table being read out, nor the
  empty-state announcement. The "has no violation detected by axe"
  tests pass, but axe renders nothing aloud.
