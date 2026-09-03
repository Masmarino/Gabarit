# RGAA Audit — Card

Verified against RGAA 4.1.2 by exercising `Molecules/Card` in
Storybook (stories `NoTitle`, `WithTitleAndIcon`, `Hoverable`, `Dark`)
and by code review (`card.ts`, `card.html`, `card.scss`).

| Criterion   | Short title                             | Verification                                                                                                                                                                                                                                | Result                           |
| ----------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 3.1         | Information not conveyed by color alone | `hoverable` changes the drop shadow (`box-shadow`) on hover, not just a color — perceptible independently of color perception.                                                                                                              | Compliant                        |
| 3.2         | Text contrast                           | Covered by `contrast.spec.ts` (`--text-secondary` on `--bg-principal`, `--text-primary` for the title)                                                                                                                                      | Compliant (delegated)            |
| 3.3         | Component contrast                      | The card is set apart from its background by `box-shadow` (`--site-shadow-sm`), not by a colored border — the 3:1 threshold for component borders doesn't apply to a shadow-only boundary.                                                  | Not applicable                   |
| 9.1         | Heading hierarchy                       | `headingLevel` (default `2`, range 1–6) drives the rendered heading level via a `@switch` — verified by `card.spec.ts` ("renders an h2 by default", "respects the requested heading level") and manually in Storybook for `headingLevel=3`. | Compliant                        |
| 10.7        | Visible focus indicator                 | The card sets no `tabindex`: `hoverable` is only a `pointer` cursor and a hover shadow, the card itself never receives keyboard focus (it carries no action of its own — a button or link projected inside it manages its own focus).       | Not applicable to this component |
| 10.11       | 320px reflow                            | Viewport set to 320×600 on the `WithTitleAndIcon` story: `scrollWidth === clientWidth`, no horizontal scroll.                                                                                                                               | Compliant — verified             |
| 10.12       | Redefinable text spacing                | Injected stylesheet (`line-height:1.5`, `letter-spacing:0.12em`, `word-spacing:0.16em`) on `WithTitleAndIcon`: title and projected content stay readable, no truncation, screenshot on file.                                                | Compliant — verified             |
| WCAG 2.4.11 | Focus not obscured                      | Not applicable — the card never takes focus itself (see 10.7).                                                                                                                                                                              | Not applicable to this component |

Dark mode is visually confirmed in Storybook, since `.gbt-card` carries
its own background (`--bg-principal`).
