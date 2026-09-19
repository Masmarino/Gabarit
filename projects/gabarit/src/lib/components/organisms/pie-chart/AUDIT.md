# RGAA Audit — PieChart

Verified against RGAA 4.1.2 by exercising `Organisms/Dataviz/PieChart`
in Storybook (stories `Pie`, `Donut`, `ManySlices`, `Empty`, `Dark`)
and by code review (`pie-chart.ts`, `pie-chart.html`, `pie-chart.scss`,
and the `ChartLegend`/`ChartTable`/`ChartEmpty` building blocks it
reuses).

## Checklist

| Criterion | Short title                                     | Verification                                                                                                                                                                                                                                        | Result   |
| --------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1.1       | Alternative for non-text content                    | Each slice's own `role="img"`/`aria-label` (`"{label} — {value}"`) is its accessible name — a slice has no text content of its own, unlike `FunnelChart`'s `<li>`, so this is the only source of one. Plus the full data in the `sr-only` table.        | Compliant |
| 7.1       | Scripts compatible with assistive technology          | 0 axe violations, both with data and on the empty state (`pie-chart.spec.ts`, "has no a11y violations" ×2).                                                                                                                                          | Compliant |
| 7.3       | Keyboard-operable                                    | Every slice is independently `tabindex="0"`, reachable via `Tab`/`Shift+Tab` in natural DOM order — see "Why no arrow-key navigation" below.                                                                                                          | Compliant |
| 3.1       | Information not conveyed by color alone              | Each slice is named (`aria-label`) and listed with its own text label + formatted value in the legend and the table — color differentiates visually but is never the only channel. See "Why not a hatch pattern" below.                                | Compliant |
| 3.3       | Component/graphic contrast                           | `--chart-series-1-base` through `--chart-series-6-base` each reach ≥3:1 against both theme backgrounds (`contrast.spec.ts`, `token contrast` describe block) and are pairwise distinct (`series palette` describe block).                              | Compliant |
| 11.1      | Label presence                                        | `label` names the chart; `categoryColumn`/`valueColumn`/`shareColumn` name the table's columns; `sliceAnnouncement` and `emptyMessage` are consumer-supplied, translatable strings/functions, not hardcoded.                                             | Compliant |

## Why no arrow-key navigation between slices

The WAI-ARIA Authoring Practices don't define a canonical pattern for
a pie/donut chart (charts sit outside the APG entirely). Rather than
invent a bespoke arrow-key scheme, `PieChart` follows the one existing
precedent in this library for a non-cartesian chart, `FunnelChart`:
plain `Tab` order across independently-focusable elements, no custom
key handling. `ChartFrame`'s arrow/Home/End model doesn't apply here
either way — it's built entirely on x-axis pixel positions, which a
pie chart doesn't have.

## Why the live region duplicates the aria-label on focus

Each slice's `aria-label` already names it (label + value) on focus,
and the `aria-live="polite"` region then additionally announces the
same label plus its *share* of the total. This mirrors `FunnelChart`
exactly: there too, the `<li>`'s own accessible name (from its visible
label/value content) is read on focus, and the live region separately
announces the *conversion from the previous step* — information that
only exists once a step is active. The overlap on the base fact
(label) is the same accepted trade-off `FunnelChart` already ships;
duplicating it here keeps the two categorical charts in this library
consistent rather than inventing a different, arguably "cleaner" but
inconsistent scheme.

## Why `role="group"`, not `role="img"`, on the `<svg>`

`role="img"` on an element flattens its entire subtree into a single
leaf as far as assistive technology is concerned — exactly the
opposite of what's needed here, since each slice inside must stay
independently focusable and independently named. The `<svg>` itself
therefore carries `role="group"` with `label()` as its `aria-label`,
naming the collection without hiding its children; each `<path>`
individually carries its own `role="img"` as the leaf-level graphic
with a name, the same layering `FunnelChart` gets from a plain
`<ol aria-label>` containing individually-accessible `<li>`s.

## Why direct on-slice labels sit just outside the slice

A slice's fill cycles through six different hues across two themes.
Painting readable text *on top of* an arbitrary fill would need the
same kind of dynamic per-background contrast computation `Tag` uses
for its removable chips (`getReadableTextColor`) — solvable, but a
real chunk of added complexity for a presentational nicety. Instead,
the percentage for a large-enough slice (≥15% of the total; smaller
slices skip the direct label, per the original ticket's note that a
label on a tiny slice mostly just overlaps its neighbors) is placed
just outside the arc's outer radius, over the chart's ordinary
background — so it can use the already-audited `--text-secondary`
token exactly like any other text in the library, with zero new
contrast risk. The percentage remains available for *every* slice
regardless of size, in the legend and in the `sr-only` table.

## Why the six-color palette extension lives in the shared tokens, not here

`--chart-series-4/5/6-base` were added to `_semantic.scss` (alongside
the pre-existing `-1/2/3`) rather than declared as one-off colors
local to `PieChart`, because a six-category palette is a general
dataviz need, not a pie-chart-specific one — any future categorical
chart can reuse it. Beyond 6 slices the palette cycles and, in dev
mode, logs a console warning identical in spirit to `LineChart`'s own
`MAX_SERIES` warning.

## Externalized strings

`label`, `emptyMessage`, `categoryColumn`, `valueColumn`,
`shareColumn` are all consumer-supplied strings; `sliceAnnouncement`
is a consumer-supplied formatter function — none of the library's own
text is hardcoded into the component, consistent with `FunnelChart`'s
`stepAnnouncement`.

Dark mode is visually confirmed in Storybook (`Dark` story) — slice
fills, the on-slice percentage labels, the legend, and the focus
outline all remain legible, no contrast regression.
