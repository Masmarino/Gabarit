# RGAA Audit — gbt-line-chart

Verified against RGAA 4.1.2 by reading the code of `line-chart.ts`,
`line-series.ts`, and their templates, by running `line-chart.spec.ts`
(which exercises the wrapper component and its projected trace
together, the latter having no suite of its own), and by opening
Storybook directly in a browser at 320px wide — see criterion 10.11.
`gbt-line-chart` assembles `gbt-chart-frame`, `gbt-chart-axis`,
`gbt-chart-tooltip`, `gbt-chart-legend`, `gbt-chart-empty`, and
`gbt-chart-table` with no modification: criteria already covered by
`chart-frame/AUDIT.md` at the base level aren't re-tested here when
`gbt-line-chart` doesn't touch the path concerned — every row
explicitly says whether the check is specific to this component or
inherited unmodified.

## Checklist

| Criterion | Verdict                               | Verification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1       | ✅ inherited + own                    | `line-chart.spec.ts` reads `gbt-chart-table table`, checking the headers and the number of rendered rows. `gbt-chart-table` itself carries the visual hiding (see `chart-frame/AUDIT.md`); `gbt-line-chart` is checked here for the part that's its own: building columns and rows that match the received series.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 3.1       | ✅ partial                            | `line-chart.spec.ts` measures the rendered `stroke-dasharray` on two lines and checks `['none', '6 3']` for `solid` and `dashed`. The third pattern, `dotted` (`1 3` in `DASH_ARRAYS`, `line-series.ts`), is asserted only on the legend (`chart-legend.spec.ts`), not on the line itself — visible in the `ThreeSeries` story (solid, dashed, dotted side by side) but not asserted automatically.                                                                                                                                                                                                                                                                                                                                                                                              |
| 3.3       | ✅ inherited                          | `contrast.spec.ts` measures the three `chart-series-*-base` tokens at ≥ 3:1 on light and dark backgrounds, plus their pairwise distinction in each theme — the colors `line-series.ts` cycles through (`color: (index % 3) + 1`). Not re-tested at the `gbt-line-chart` level: the component consumes the same tokens without redefining them.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 7.1       | ✅ inherited                          | `gbt-line-chart` redefines no keyboard handler: navigation (`←` `→` `Home` `End` `Escape`, focus loss) is `.gbt-chart-frame__surface`'s (see `chart-frame/AUDIT.md`). Compliance rests on `gbt-line-chart` neither intercepting nor altering this path.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 10.11     | ✅ measured in the browser            | Storybook opened directly in a browser, viewport 320 × 700px, on `SingleSeries` and `ThreeSeries` (`Organisms/Dataviz/LineChart`). `scrollWidth === innerWidth` on both — no horizontal overflow; the highest y-axis tick sits fully within the SVG (`niceYDomain()` rounds the scale's domain to its own ticks' bounds, and the chart passes the same `tickCount` to the scale and to `gbt-chart-axis`, so the two stay in sync); no overlapping axis label; the line spans the usable width without distortion; the container fills to the height the story sets (288 × 288px SVG). `chart-data.spec.ts`, describe "niceYDomain", checks the computed domain against the ticks' bounds for the cases exercised here. No Vitest test measures the rendering itself: jsdom has no layout engine. |
| 10.13     | ✅ inherited                          | Closing (`Escape`, focus loss) is `gbt-chart-frame`'s (see `chart-frame/AUDIT.md`); not re-tested in `line-chart.spec.ts`. Measured in the browser: after `Escape`, no marker, no dots, and no tooltip panel remain in the DOM — including when the tooltip had been opened by pointer. The hoverable and persistent branches aren't verified here either: `gbt-line-chart` inherits the base without modifying them, and `chart-frame/AUDIT.md` covers them, including what isn't compliant there.                                                                                                                                                                                                                                                                                              |
| 12.11     | ✅ inherited, measured in the browser | `gbt-line-chart` wires `tooltipPoints()` to `gbt-chart-tooltip` with no hover handler of its own: pointer and keyboard both write into `ChartContext.activeIndex()`, at the base level (see `chart-frame/AUDIT.md` for the mechanism). Measured in the browser on `Nominal` (320px and 1200px, both themes), `Dense` and `UnroundedXValues` (320px, light theme): the tooltip, the vertical marker, the series dots, and the legend values all appear on `pointermove` and produce a state identical field for field to what `End`/`Home` produce at the keyboard.                                                                                                                                                                                                                               |

## What this audit doesn't cover

- **`gbt-bar-chart` and `gbt-timeline-chart`** have no checklist of
  their own. Their suites (`bar-chart.spec.ts`, `timeline-chart.spec.ts`)
  each pass a "has no violation detected by axe" test, and their
  nominal stories were opened at 320px in the same pass as above: no
  horizontal overflow in either case. For the timeline chart, a band's
  label only renders once the band is wide enough to hold it —
  narrower bands stay unlabeled visually but remain present in the
  `sr-only` table; the display condition compares the label's
  estimated width to its band's, sharing the same estimate
  `gbt-chart-axis` uses to thin out a category axis
  (`estimateLabelWidth()`, `primitives/label.ts`). `gbt-timeline-chart`
  also places a dot on the active point (`TimelineSeries.activePoint`),
  the counterpart to `gbt-line-chart`'s per-series dots, alongside a
  band accent (an outline, not a fill change) when the point falls
  inside an interval.
- **`UnroundedXValues`** exercises an x-axis whose outermost tick
  falls outside the raw data domain (`niceTicks()` extends it to round
  values) — at 320px, the tick renders fully within the frame, with
  margin to spare.
- **No contrast measurement is specific to the three cycled stroke
  colors** beyond the third series: `line-series.ts` loops
  (`index % 3`), so a fourth series reuses the first's color. This
  case is covered by no test, neither here nor in
  `chart-frame/AUDIT.md`.
- **The `dotted` pattern on the line itself** (not the legend) is
  asserted by no Vitest test — see criterion 3.1 above.
