# RGAA Audit — Panel

Verified against RGAA 4.1.2 by exercising `Molecules/Panel` in
Storybook (stories `Default`, `WithActions`, `ThreeStacked`,
`EmptyContent`, `LongHeading`, `Dark`) and by code review (`panel.ts`,
`panel.html`, `panel.scss`).

## Checklist

| Criterion | Short title                         | Verification                                                                                                                                                                                                             | Result                |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| 9.1       | Information structured by headings  | The panel title is a real `h2`/`h3`/`h4` chosen by `headingLevel`, exactly one per panel and never a bare styled `<div>` (`panel.spec.ts`, "maps headingLevel…"). The app picks the level that fits its outline.         | Compliant             |
| 9.2       | Coherent document structure         | The panel is a `<section>` named by its heading (`aria-labelledby`, kept in sync when the level changes; ids distinct per panel), so it is announced as a region.                                                        | Compliant             |
| 3.2       | Text contrast                       | Heading `--text-secondary` and body `--text-primary`, on the page (`--bg-principal`) and on `--bg-panel`: both pairs measured ≥ 7:1 (AAA) in light and dark by `tokens/contrast.spec.ts`.                                | Compliant             |
| 3.3       | Component contrast                  | The hairline between panels is decorative (the panels are also separated by spacing and by their headings); `--gbt-hairline` is asserted visible against the page and the panel background in `tokens/contrast.spec.ts`. | Compliant             |
| 10.4      | Text size                           | rem-based: 13 px heading, 14 px body; long words break (`overflow-wrap: anywhere`) instead of overflowing, checked with the unbroken heading in `LongHeading`.                                                           | Compliant             |
| 10.12     | Text spacing                        | No fixed heights on text: the header has a `min-height`, the body grows with its content.                                                                                                                                | Compliant             |
| 12.9      | Keyboard trap / order               | Nothing focusable of its own. The `[panel-actions]` control comes right after the heading in the DOM, before the content, in the visual order too.                                                                       | Compliant (delegated) |
| 11.1      | Label presence (projected controls) | An icon-only action in `[panel-actions]` needs its own accessible name (`ariaLabel` on `gbt-button`): demonstrated by the `LongHeading` story; delegated to the application.                                             | Compliant (delegated) |

## Externalized strings

None: the heading is an input, the content is projected.

Dark mode is visually confirmed in Storybook (`Dark` story).
