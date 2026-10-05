# RGAA Audit — StatGrid

Verified against RGAA 4.1.2 by exercising `Molecules/StatGrid` in Storybook (stories `Default`,
`ThreeColumns`, `Loading`, `Dashboard`, `NarrowFrame`, `MediumFrame`, `Dark`; container widths 260, 340, 606
and 862 px measured through `getComputedStyle(...).gridTemplateColumns`) and by code review
(`stat-grid.ts`, `stat-grid.html`, `stat-grid.scss`). The tiles are audited in
[`gbt-stat-tile`](../stat-tile/AUDIT.md).

## Checklist

| Criterion | Short title                                    | Verification                                                                                                                                                                                                         | Result    |
| --------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 9.3       | List structure                                 | `role="list"` named by `ariaLabel`, whose direct children are the tiles (`role="listitem"`). Tested, and 0 axe violations.                                                                                           | Compliant |
| 10.11     | Reflow                                         | Two columns below 600 px of grid width, at most `columns` above; `minmax(0, 1fr)` tracks never overflow (checked at 260 px). The contract is asserted on the stylesheet (container name, 600 px, no width `@media`). | Compliant |
| 7.1       | Scripts compatible with assistive technology   | While loading a `role="status"` region (always present, outside the hidden list) says `loadingLabel`. `aria-busy` is deliberately not used (a busy ancestor can suppress the live region).                           | Compliant |
| 12.11     | Hidden content ignored by assistive technology | The placeholder list is `aria-hidden` while loading; the skeletons are `aria-hidden` themselves.                                                                                                                     | Compliant |
| 13.8      | Moving content can be controlled               | The skeleton shimmer is `gbt-skeleton`'s, removed under `prefers-reduced-motion`.                                                                                                                                    | Compliant |

## Accessibility test

`stat-grid.spec.ts` runs axe on the loaded and loading grid: 0 violations.

## Externalized strings

`ariaLabel` and `loadingLabel` are inputs with English defaults.
