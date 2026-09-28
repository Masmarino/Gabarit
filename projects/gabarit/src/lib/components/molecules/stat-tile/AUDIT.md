# RGAA Audit — StatTile

Verified against RGAA 4.1.2 by exercising `Molecules/StatTile` and `Molecules/StatGrid` in Storybook
(stories `Default`, `WithHintAndTrend`, `TrendDown`, `Muted`, `NoIcon`, `AsALink`, `ProjectedLink`,
`LongLabelAndFigure`, `Dark`) and by code review (`stat-tile.ts`, `stat-tile.html`, `stat-tile.scss`,
`stat-tile-link.ts`).

## Checklist

| Criterion  | Short title                              | Verification                                                                                                                                                                                                                                                           | Result    |
| ---------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 9.3        | List structure                           | Inside a `gbt-stat-grid` the tile is a `role="listitem"` (its parent is a `role="list"`); outside a grid it has no role (spec).                                                                                                                                        | Compliant |
| 3.1        | Information not conveyed by colour alone | A trend is its arrow **and** its text (`trendLabel` carries the sign or a word); the colour only tells good from bad. A muted tile is muted by its quiet figure and marker, and its figure is still there.                                                             | Compliant |
| 3.2        | Text contrast                            | Figure `--text-primary`, label, hint and neutral trend `--text-secondary`, trend `--color-success-text` / `--color-error-text`, all on `--bg-principal`: 7:1 in both themes (`tokens/contrast.spec.ts`, "widgets"). The marker's pairs are those of `gbt-icon-marker`. | Compliant |
| 9.1 / 10.4 | Text size, order                         | rem-based; the label comes first in the DOM and is read before the figure ("Open issues, 12"); a long label wraps and a long figure is cut, both without overflow (`LongLabelAndFigure`).                                                                              | Compliant |
| 6.1 / 6.2  | Link with a relevant name                | The link's name is its text, the label; the figure is not part of it. It is a real `<a href>` (or a projected anchor with the router): no nested interactive element.                                                                                                  | Compliant |
| 10.7       | Focus visible                            | The focus ring (2 px `--primary`, offset 2 px) is drawn around the whole tile, whose hit area is the link (`AsALink`, checked with the keyboard).                                                                                                                      | Compliant |
| 13.8       | Moving content can be controlled         | Only a 150 ms border / shadow transition on a link tile, removed under `prefers-reduced-motion`.                                                                                                                                                                       | Compliant |
| WCAG 2.5.8 | Target size minimum                      | A link tile is at least 80 px tall and 140 px wide.                                                                                                                                                                                                                    | Compliant |

## Accessibility test

`stat-tile.spec.ts` runs axe on plain, iconed, trend, muted, link and in-grid tiles: 0 violations.

## Externalized strings

`label`, `hint`, `trendLabel` are inputs; the tile has no default text of its own.
