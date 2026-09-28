# RGAA Audit — SkeletonList

Verified against RGAA 4.1.2 by exercising `Molecules/SkeletonList` in Storybook (stories `Default`,
`Avatars`, `Squares`, `SingleLine`, `ThreeLines`, `Bare`, `Dark`) and by code review (`skeleton-list.ts`,
`skeleton-list.html`, `skeleton-list.scss`).

## Checklist

| Criterion | Short title                                    | Verification                                                                                                                                                                                                                                            | Result    |
| --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 7.1       | Scripts compatible with assistive technology   | A `role="status"` region (`loadingLabel`) is present from the first render, also with `rows` at 0. It is not inside an `aria-busy` element nor inside the `aria-hidden` shapes (spec: no `[aria-busy]` in the list, the status has no hidden ancestor). | Compliant |
| 12.11     | Hidden content ignored by assistive technology | The placeholder shapes carry `aria-hidden="true"` (the wrapper and each `gbt-skeleton`): nothing meaningless is read.                                                                                                                                   | Compliant |
| 13.8      | Moving content can be controlled               | The shimmer is `gbt-skeleton`'s: it stops under `prefers-reduced-motion: reduce`.                                                                                                                                                                       | Compliant |
| 3.3       | Component contrast                             | The shapes are purely decorative placeholders of content that is not there yet (graphics without text, `token-graphique-sans-texte` in `gbt-skeleton`); the hairlines are decorative.                                                                   | Compliant |
| 10.4      | Text size                                      | No text but the visually hidden status.                                                                                                                                                                                                                 | Compliant |

## Accessibility test

`skeleton-list.spec.ts` runs axe on the default, avatar, single-line and empty lists: 0 violations.

## Externalized strings

`loadingLabel` is an input with an English default.
