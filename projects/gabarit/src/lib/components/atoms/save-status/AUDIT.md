# RGAA Audit — SaveStatus

Verified against RGAA 4.1.2 by exercising `Atoms/SaveStatus` in Storybook (stories `Default`,
`AllStates`, `WithMessage`, `NextToAField`, `Dark`) and by code review (`save-status.ts`,
`save-status.html`, `save-status.scss`).

## Checklist

| Criterion | Short title                                    | Verification                                                                                                                                                                                                                                      | Result    |
| --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 7.1       | Scripts compatible with assistive technology   | The text is in a `role="status"` region rendered in every state, including `idle`, so screen readers announce "Saving…", "Saved" and "Not saved" without any focus move. A spec asserts the region is the same element across every state change. | Compliant |
| 3.1       | Information not conveyed by colour alone       | Each state has its own glyph (spinning ring, check, alert) and its own text; colour only reinforces it.                                                                                                                                           | Compliant |
| 3.2       | Text contrast                                  | `--text-secondary`, `--color-success-text` and `--color-error-text` on the page and on `--bg-panel` (7:1, 13 px text) in both themes, all covered by `tokens/contrast.spec.ts`.                                                                   | Compliant |
| 13.8      | Moving content can be controlled               | The ring spins for as long as the state is `saving`; under `prefers-reduced-motion: reduce` it is a static ring and the text still says "Saving…".                                                                                                | Compliant |
| 12.11     | Hidden content ignored by assistive technology | The icons and the ring are decorative and `aria-hidden`.                                                                                                                                                                                          | Compliant |
| 10.4      | Text size                                      | 13 px in rem; the region has a `min-height` and no fixed width, so a long `message` wraps.                                                                                                                                                        | Compliant |

## Accessibility test

`save-status.spec.ts` runs axe on the four states: 0 violations.

## Externalized strings

`savingLabel`, `savedLabel`, `errorLabel` and `message` are inputs with English defaults.
