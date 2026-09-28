# RGAA Audit — IconMarker

Verified against RGAA 4.1.2 by exercising `Atoms/IconMarker` in Storybook (stories `Default`, `Tones`,
`Sizes`, `Tiles`, `WithLabel`, `InContext`, `Dark`) and by code review (`icon-marker.ts`,
`icon-marker.html`, `icon-marker.scss`). A purely visual atom: a `<span>`, nothing focusable.

## Checklist

| Criterion | Short title                                    | Verification                                                                                                                                                                                                                                                                                    | Result                |
| --------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1.2 / 1.3 | Decorative images, and their alternative       | Decorative by default: the marker carries `aria-hidden="true"` (spec). When it is the only carrier of a meaning, `label` turns it into `role="img"` with an `aria-label` (spec).                                                                                                                | Compliant             |
| 3.1       | Information not conveyed by colour alone       | The tint is reinforcement only: each tone uses a different glyph in practice, and the meaning is told by the adjacent text (documented). `label` gives an alternative when there is no text.                                                                                                    | Compliant (delegated) |
| 3.2 / 3.3 | Text contrast, component contrast              | Status tones: `--color-<tone>-bg-text` on `--color-<tone>-bg` at 7:1. Neutral and primary glyphs at least 4.5:1 on their wash over the page, a panel and each under a hover fill; outline glyphs at least 4.5:1 on the page and a panel, in both themes (`tokens/contrast.spec.ts`, "widgets"). | Compliant             |
| 10.4      | Text size                                      | Sizes in rem; the glyph scales with the font size of the marker.                                                                                                                                                                                                                                | Compliant             |
| 12.11     | Hidden content ignored by assistive technology | The inner `gbt-icon` is `aria-hidden` on its own; the decorative marker is hidden as a whole.                                                                                                                                                                                                   | Compliant             |

## Accessibility test

`icon-marker.spec.ts` runs axe on the decorative and labelled markers and on every tone in the outline
look: 0 violations.

## Externalized strings

`label` is the only text and is an input (no default).
