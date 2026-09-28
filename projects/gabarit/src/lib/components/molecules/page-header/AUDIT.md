# RGAA Audit — PageHeader

Verified against RGAA 4.1.2 by exercising `Molecules/PageHeader` in
Storybook (stories `WithBadgesMetaAndActions`, `IssueWithNumber`,
`TitleOnly`, `LongTitleWraps`, `UnbrokenTitle`, `Narrow`, `SectionHeading`,
`Dark`) and by code review (`page-header.ts`, `page-header.html`,
`page-header.scss`).

## Checklist

| Criterion | Short title                        | Verification                                                                                                                                                                                                                                    | Result                |
| --------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 9.1       | Information structured by headings | The title is a real heading: `h1` by default, `h2`/`h3` through `headingLevel` for a repeated header, exactly one per header (`page-header.spec.ts`). Badges and `[header-title]` stay outside the heading so its accessible name is the title. | Compliant             |
| 9.2       | Coherent document structure        | The block is a `<header>` element (a banner landmark only at the top level of the page; nested in a section it is a plain grouping).                                                                                                            | Compliant             |
| 3.2       | Text contrast                      | Title `--text-primary`, meta `--text-secondary`, on the page (`--bg-principal`) and on `--bg-panel`: ≥ 7:1 (AAA), both themes (`tokens/contrast.spec.ts`).                                                                                      | Compliant             |
| 10.4      | Text size                          | rem-based (24 px title, 14 px meta), scales with the user's font size.                                                                                                                                                                          | Compliant             |
| 10.12     | Text spacing                       | No fixed heights: `min-height` only. A long title wraps, an unbroken one breaks (`overflow-wrap: anywhere`) — checked with `UnbrokenTitle` and at 375 px in `Narrow`.                                                                           | Compliant             |
| 10.11     | Reflow                             | At 343 px content width the actions wrap under the title; nothing scrolls horizontally (`Narrow`).                                                                                                                                              | Compliant             |
| 12.9      | Order of focusable content         | The actions come after the title and meta in the DOM and in the visual order.                                                                                                                                                                   | Compliant             |
| 11.1      | Labels of projected controls       | Projected buttons and links need their own accessible names: delegated to the application.                                                                                                                                                      | Compliant (delegated) |

## Externalized strings

None: the heading is an input and every slot is projected.

Dark mode is visually confirmed in Storybook (`Dark` story).
