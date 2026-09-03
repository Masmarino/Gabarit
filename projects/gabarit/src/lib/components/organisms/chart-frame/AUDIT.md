# RGAA Audit — gbt-chart-frame and its building blocks

Verified against RGAA 4.1.2 by reading the code of the seven sources
(`chart-frame`, `chart-axis`, `chart-tooltip`, `chart-legend`,
`chart-empty`, `chart-table`, `chart-context`) and by running their
respective Vitest suites, as well as `contrast.spec.ts`
(`projects/gabarit/src/lib/tokens/`). Each of the seven components
passes a "has no violation detected by axe" test. Criteria **10.11**,
**10.13**, and **12.11** are additionally verified by opening
Storybook directly in a browser — see their rows below and "What the
browser measurement found".

Under RGAA 4.1.2, criterion 10.13 addresses additional content's
**controllability** — is it dismissible, hoverable, persistent? — while
12.11 addresses its **keyboard reachability**. Both are covered below
under those criteria specifically.

## Checklist

| Criterion | Verdict                                                        | Verification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1       | ✅                                                             | `chart-table.spec.ts`: renders a real `<table>` with a `<caption>`, visually hidden via `.gbt-sr-only` (`clip-path`, neither `display:none` nor `hidden`) but present in the DOM with no `aria-hidden`. `gbt-chart-table` is independent of `ChartContext`: it's the non-visual path for any chart, including ones that won't go through `gbt-chart-frame`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 3.1       | ✅ made possible                                               | `chart-legend.spec.ts` directly measures the rendered dash pattern (`stroke-dasharray`): `none`, `6 3`, `1 3`, the three distinct values. `ChartLegend` carries a `pattern` field, but nothing forces a chart built on the base to use it on its own marks — the base makes compliance possible, individual charts still have to use it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 3.3       | ✅                                                             | `contrast.spec.ts` measures `chart-series-1-base`, `chart-series-2-base`, and `chart-series-3-base` at ≥ 3:1 on light and dark backgrounds, plus a dedicated test that the three series stay pairwise distinct in each theme and that the dark-mode declaration literally exists, so as not to silently fall back to the light palette.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 7.1       | ✅                                                             | `chart-frame.spec.ts`, describe "keyboard navigation": `←` `→` `Home` `End` `Escape` and focus loss, each tested by dispatching a real `KeyboardEvent`/`FocusEvent` on `.gbt-chart-frame__surface` and reading `ChartContext.activeIndex()`. Clamping at the ends is explicitly tested — no wraparound.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 10.7      | ✅ code review                                                 | `chart-frame.scss` declares `.gbt-chart-frame__surface:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px }`. Not measured by a test — jsdom doesn't apply the compiled stylesheet in component specs — verified by direct reading of the SCSS.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 10.11     | ✅ measured in the browser                                     | `gbt-chart-frame` measures its own `.gbt-chart-frame__surface`, not its host: the surface excludes the header, so `ResizeObserver`'s measurement and the `<svg>`'s `viewBox` always match the space actually available below the header. `niceYDomain()`/`niceXDomain()` (`chart-data.ts`) round the scale's domain to its own ticks' bounds, and consuming charts pass the same `tickCount` to the scale and to `gbt-chart-axis`, so the axis's rendered ticks and the scale's projection always agree — no tick falls outside the frame. Verified in the browser, capture then DOM read, on the nominal stories of `LineChart`, `BarChart`, and `TimelineChart` at 320 × 700px: `document.documentElement.scrollWidth` equal to `window.innerWidth` on all three — no horizontal overflow; every tick fully within the SVG's bounds; no overlapping axis label; the plotted shape spans the usable width without distortion; the container fills to the height its story sets. No Vitest test measures the rendering itself: jsdom has no layout engine. `chart-data.spec.ts`, describe "niceYDomain", covers the domain-rounding logic itself. Per-component detail in `line-chart/AUDIT.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 10.13     | ⚠️ dismissible compliant; hoverable and persistent only partly | RGAA 10.13 reads as three branches, each covered separately. **Dismissible — ✅.** `chart-frame.spec.ts`: "Escape closes the selection" and "losing focus closes the selection" both dispatch the event then read `activeIndex() === null`; `chart-tooltip.spec.ts` confirms on the rendering side. Closes regardless of how it was opened: `Escape` writes `null` into the same `activeIndex()`, so a tooltip opened by pointer also closes on `Escape` — measured in the browser. **Hoverable — ⚠️, not guaranteed in general.** The tooltip panel carries `pointer-events: none`: it never itself captures the pointer, so it's the underlying surface that keeps driving the display as the cursor approaches it — which works as long as the panel stays painted within the surface's bounds (it does: the panel is positioned relative to `.gbt-chart-frame__surface`, which carries `position: relative`, so it never extends over the header — see "What the browser measurement found"). Unfixed caveat: `nearestIndex()` only reads `clientX`; a panel anchored `start` or `end` (`ChartTooltip.anchor()`) is offset from the active point rather than centered on it, so approaching it can push the cursor closer to a neighboring point and change the displayed content before it could be read. **Persistent — ⚠️, not guaranteed outside the keyboard.** A tooltip opened by keyboard persists — `onPointerLeave()` refrains from clearing the active index while the surface has focus (tested: "doesn't undo at the pointer what the keyboard established"). A tooltip opened by pointer alone closes as soon as the cursor leaves the surface, with no grace period comparable to `search-bar`'s 200ms. |
| 12.11     | ✅ satisfied by construction                                   | `gbt-chart-frame` carries `(pointermove)` and `(pointerleave)` on `.gbt-chart-frame__surface`, and both write into the same signal as the keyboard, `ChartContext.activeIndex()` — `onPointerMove()` calls `setActiveIndex(nearestIndex(...))`, `onKeydown()` calls `setActiveIndex()` on `←` `→` `Home` `End`. There is one state, not two: no mouse-reachable state can escape the arrow keys. Tested by `chart-frame.spec.ts`, "doesn't undo at the pointer what the keyboard established": `Home` at the keyboard on a focused surface, then a dispatched `pointerleave`, and `activeIndex()` still equals `0` — the same guard that makes a keyboard-opened tooltip persistent (see 10.13). Measured in the browser: the state produced by the pointer at the last point and the one produced by `End` at the keyboard are identical field for field (marker position, dot count, tooltip text, anchor, tooltip rectangle, legend values); likewise between the first point and `Home`. Measured on `LineChart → Nominal` (320px and 1200px, both themes), `LineChart → Dense`/`UnroundedXValues`, `BarChart → Nominal`/`Dense` (320px, light theme), `TimelineChart → Dense` (320px and 1200px, both themes), `TimelineChart → Nominal` (320px, light theme).                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## What the browser measurement found

Storybook opened directly in a browser, each story's `iframe.html`,
viewport at **320 × 700** then **1200 × 800**, in light theme and dark
theme (`data-theme="dark"` set on the root, as `.storybook/preview.ts`'s
`darkTheme` decorator does).

The tooling's real mouse events don't reach the page in this
environment's hidden panel, so the pointer path was exercised via
`dispatchEvent(new MouseEvent('pointermove', { clientX }))` on the
surface, with a real `clientX` checked against a real
`getBoundingClientRect()` — not jsdom, the layout and the measurement
are the browser engine's own. What's measured is therefore the
handler and the rendering that follows from it, not the browser's own
delivery of the event.

### What's compliant, measured

- **Pointer/keyboard parity, field for field**, as described under
  criterion 12.11 above.
- **The last point's tooltip stays within the frame**:
  `LineChart → Nominal` at 320px, last point, panel 159.9 → **296**
  for a 16 → **304** frame; first point, panel **64** → 200.1; at
  1200px, last point 1039.9 → **1176** for a 16 → **1184** frame.
  Same result on `BarChart` and `TimelineChart`. `data-anchor` reads
  `start` at the first point and `end` at the last.
- **`Escape` closes it, including a tooltip opened by pointer** — see
  row 10.13.
- **The grid renders behind the strokes.** Document order within the
  `<svg>` places grid lines before series marks (an SVG paints
  strictly in document order, with no `z-index`); `document.elementFromPoint()`
  at the intersection of a grid line and a solid bar returns the bar,
  not the line; a stylesheet-forced visual check (grid repainted
  bright red and thickened) shows every line interrupted by every bar,
  then resuming to its right.
- **No horizontal page overflow** on any story measured, at both
  widths and in both themes.

### Sizing and positioning

`gbt-chart-frame` is a flex column: the surface takes the remaining
space below the header (`flex: 1; min-height: 0`), and it's the
surface — not the host — that `ResizeObserver` observes and that the
`<svg>`'s dimensions derive from. The surface renders unconditionally,
with only the `<svg>` gated on `ready()` (an observer can't observe an
element that doesn't exist yet). As a result, the chart's plotted area
never overflows below its host regardless of whether a header is
present, and `gbt-chart-empty`'s empty state renders within the same
bounds.

The tooltip panel is positioned relative to `.gbt-chart-frame__surface`
(which carries `position: relative`), not to the frame as a whole — so
its `top: 0` anchors to the top of the plotted area, never to the top
of the header. Verified in the browser on `LineChart → Nominal` at
320px: the panel paints between `y = 62` (the surface's top, below a
38px header plus 8px margin) and `y = 125`, never overlapping the
header's `16 → 54` range, at the first point as at the last. No Vitest
test can measure this: jsdom computes no layout, so `getBoundingClientRect()`
returns zeros for both elements there — the only proof is the browser
measurement above.

`gbt-timeline-chart`'s band labels only render once the estimated
label width fits the band's width — the same `estimateLabelWidth()`
estimate `gbt-chart-axis` uses to thin out a category axis
(`primitives/label.ts`), so the two can't diverge. Bands whose label
doesn't fit stay unlabeled visually but remain present in the `sr-only`
table. `gbt-timeline-chart` also accents the band containing the
active point via its outline (widened and brightened, not its fill —
measurement showed a darker fill would degrade the legibility of the
label painted on it) and places a dot on the active point of its own
line, independent of whether that point falls inside a band —
`TimelineSeries.activePoint`, the counterpart to `gbt-line-chart`'s
per-series dots. Tested: `timeline-chart.spec.ts`, "places a dot on
the active point, even outside any interval".

The band label's own contrast is measured against the band's
composited surface (see `dimension-card/AUDIT.md` for the general
pattern of measuring text over a translucent fill) — it currently
holds RGAA's 4.5:1 requirement but not Gabarit's own 7:1 target on
`gbt-timeline-chart` specifically; this is recorded as a known gap
rather than a violation, since 3.2's actual threshold is met.

### The empty states

The six `Empty` stories (`LineChart`, `BarChart`, `TimelineChart`,
`Sparkline`, `DimensionCard`, `FunnelChart`), measured at 320px: none
has a zero height, none overflows, and the empty-state message renders
and stays contained in every case.

On the three charts built on the base, the empty state displays both
the message and an empty axis grid ticked on a default domain — a
rendering choice, not a compliance issue, since the message itself is
present and readable.

## What this audit doesn't cover

- **No visual, hands-on manipulation in a browser, outside of
  criteria 10.11, 10.13, and 12.11.** The rest of the checklist rests
  on running the Vitest suites and reading the source and stylesheets.
- **The browser's actual delivery of mouse events couldn't be
  verified** — see "What the browser measurement found" above. What's
  proven is that the handler produces the right state and that the
  rendering follows; what isn't proven is that an actual mouse
  movement fires `pointermove` on `.gbt-chart-frame__surface` — no
  `pointer-events` rule in the repository stands against it, but that
  isn't itself a measurement.
- **No screen reader was engaged**, neither on the tooltip
  (`role="status"`, `aria-live="polite"` on `.gbt-chart-tooltip`) nor
  on the `sr-only` table.
- **`gbt-chart-axis` and `gbt-chart-empty`** carry no row of their own
  beyond the criteria already covered: their suites each have a
  passing "has no violation detected by axe" test, but no distinct
  RGAA criterion was assigned to them individually. `gbt-chart-axis`
  carries an attribute selector on a `g` (`g[gbtChartAxis]`, not an
  element selector), precisely so that a real browser renders it — an
  element selector inside an `<svg:g>` would create a host outside the
  SVG namespace, invisible in a real browser along with all its
  descendants, while still passing jsdom-based tests that never
  actually paint it.
- **The seven charts** (`gbt-line-chart`, `gbt-bar-chart`,
  `gbt-timeline-chart`, `gbt-sparkline`, `gbt-gauge-bar`,
  `gbt-funnel-chart`, `gbt-dimension-card`) inherit this checklist
  without automatically reproducing it: a chart that ignores
  `ChartLegend` or `ChartTable`, for instance, loses the compliance the
  base made possible without ever touching the latter's code. Only
  `gbt-line-chart` carries its own checklist (`line-chart/AUDIT.md`).
