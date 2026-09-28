# RGAA Audit — ListRow

Verified against RGAA 4.1.2 by exercising `Molecules/ListRow` in
Storybook (stories `Issues`, `MergeRequests`, `LongTitlesAndManyTags`,
`TitleOnly`, `WithUserChipAndBadges`, `Narrow`, `KeyboardFocus`, `Dark`)
and by code review (`list-row.ts`, `list-row.html`, `list-row.scss`).
The play function of each story measures alignment, truncation,
separators and overflow on the real layout.

## Checklist

| Criterion | Short title                              | Verification                                                                                                                                                                                                                                                      | Result                |
| --------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 9.3       | Lists                                    | The application supplies `ul > li`; the row adds no list role, no `role` at all, and no nested list (`list-row.spec.ts`, "keeps list semantics"). A screen reader announces "list, N items".                                                                      | Compliant             |
| 3.1       | Information not conveyed by colour alone | `tone` only tints the icon. The status is carried by the glyph itself (different per status) and by the text alternative the application places next to it (`Issues` story shows both); README documents this as a rule.                                          | Compliant (delegated) |
| 3.3       | Component contrast                       | Every tone colour (`--text-secondary`, `--color-{success,warning,error}-text`, `--color-info-bg-text`) is measured ≥ 4.5:1 on the row and on its hover fill, on the page and on `--bg-panel`, in both themes (`tokens/contrast.spec.ts`), above the 3:1 required. | Compliant             |
| 3.2       | Text contrast                            | Title `--text-primary`, meta and trailing `--text-secondary` on the row and on the `--bg-hover` overlay: ≥ 7:1 (AAA) in both themes (the ghost-button hover test covers the same overlay).                                                                        | Compliant             |
| 7.3       | Keyboard operable                        | The title link and every meta link are native `<a>`s in the normal tab order. `:focus-visible` draws a 2 px `--primary` outline (offset 2 px on the title, 1 px in the meta); the row also shows a `:focus-within` background so the current row is visible.      | Compliant             |
| 10.4      | Text size                                | rem-based (15 px title, 13 px meta); the title truncates with an ellipsis on one line and the full title stays in `title` and in the DOM; the meta wraps (`overflow-wrap: anywhere`).                                                                             | Compliant             |
| 10.11     | Reflow                                   | The trailing column drops under the main column (right aligned) when the title would get less than 10 rem; no horizontal overflow at 343 px (`Narrow` play function measures `scrollWidth`).                                                                      | Compliant             |
| 13.8      | Controllable moving content              | The only motion is a 150 ms background transition, removed under `prefers-reduced-motion: reduce`.                                                                                                                                                                | Compliant             |
| 11.1      | Label presence (projected controls)      | Icon-only trailing controls need their own accessible name; the comment counter in the stories has an `aria-label`. Delegated to the application.                                                                                                                 | Compliant (delegated) |

## Externalized strings

None: every slot is projected.

Dark mode is visually confirmed in Storybook (`Dark` story).
