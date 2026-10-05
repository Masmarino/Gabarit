# RGAA Audit — PageLayout

Verified against RGAA 4.1.2 by exercising `Templates/PageLayout` in
Storybook (stories `MainOnly`, `MainAndAside`, `AsideStart`,
`NavMainAside`, `NavAndMain`, `StickyNav`, the width and aside-size
stories, `Resizable`, `PhoneWidth`, `BelowTwoColumns`, `TwoColumnsWithNav`,
`ThreeColumnsWide`, `ConditionalSlots`, `Dark`) and by code review
(`page-layout.ts`, `page-layout.html`, `page-layout.scss`). The play
function of each story measures the real grid (column count, no empty
track, main at the origin) and `StickyNav` measures the sticky offset.

## Checklist

| Criterion   | Short title                         | Verification                                                                                                                                                                                                                                                                                 | Result                 |
| ----------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 9.2         | Coherent document structure         | `<nav>` (named by `navLabel`) for `[page-nav]`, `<aside>` for `[page-aside]`, no second `<main>` (the shell owns it). Empty regions are `display: none`: no empty landmark reaches assistive technology (`page-layout.spec.ts`).                                                             | Compliant              |
| 12.6        | Landmark regions                    | The nav landmark carries an accessible name (English default, an input). The aside is a complementary region; `asideLabel` names it when a page has several.                                                                                                                                 | Compliant              |
| 10.11       | Reflow (320 px)                     | One column up to 768 px of layout width: no horizontal scroll at 343 px (`PhoneWidth`); columns use `minmax(0, 1fr)` so wide content shrinks or wraps instead of overflowing.                                                                                                                | Compliant              |
| 10.4        | Text zoom to 200 %                  | The breakpoints follow the layout's own width in px; browser zoom shrinks the available CSS pixels, so a zoomed page falls back to fewer columns exactly like a narrow window.                                                                                                               | Compliant              |
| WCAG 2.4.11 | Focus not obscured (sticky content) | Sticky nav / aside only apply from two/three columns up (wide layouts) and are `align-self: start`, as tall as their content; they never cover the main column (own grid track). Stacked, nothing is sticky.                                                                                 | Compliant              |
| 12.8        | Tab order coherent                  | DOM order is nav, main, aside; the visual order is the same in every layout except an `asidePosition="start"` aside, which is visually first but sits after main in the DOM — content after main is reachable, and the aside is supplementary. Documented; use `end` when the order matters. | Compliant (documented) |
| 3.2         | Text contrast                       | No text of its own; the stacked-aside separator is a decorative `--gbt-hairline`, asserted visible in `tokens/contrast.spec.ts`.                                                                                                                                                             | Not applicable         |

## Externalized strings

`navLabel` defaults to `'Page navigation'`; `asideLabel` defaults to none.

Dark mode is visually confirmed in Storybook (`Dark` story).
