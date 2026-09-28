# RGAA Audit — CopyField

Verified against RGAA 4.1.2 by exercising `Molecules/CopyField` in Storybook (stories `Default`,
`WithLabel`, `InlineFeedback`, `LongToken`, `NarrowAside`, `NoWrapHints`, `Dark`) and by code review
(`copy-field.ts`, `copy-field.html`, `copy-field.scss`). The copy button, its live region and its
fallback are audited in [`gbt-copy-button`](../../atoms/copy-button/AUDIT.md).

## Checklist

| Criterion | Short title                                  | Verification                                                                                                                                                                                       | Result    |
| --------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 3.2       | Text contrast                                | The value is `--text-primary` on `--bg-principal` and the label `--text-secondary` on the page: both pairs measured at 7:1 (AAA) in both themes by `tokens/contrast.spec.ts`.                      | Compliant |
| 10.4      | Text size                                    | rem-based (12 px value, 13 px label). Nothing has a fixed width or height: the value wraps (`overflow-wrap: anywhere`) and grows.                                                                  | Compliant |
| 10.12     | Text spacing                                 | The value has a `min-height`, no fixed height; increased letter and line spacing cannot clip it.                                                                                                   | Compliant |
| 10.11     | Reflow at 320 px                             | The value wraps between path segments in a 240 px column and breaks inside an unbroken token (`LongToken`, `NarrowAside`); no horizontal scroll.                                                   | Compliant |
| 9.3       | Text content, grouping                       | The `<wbr>` elements only add break opportunities: the value's text (`textContent`) is exactly the copied string (asserted in the spec), so assistive technology reads the URL, not a chopped one. | Compliant |
| 11.1      | Label of a form field / group                | With a `label` the field is a `role="group"` named by it; the copy button is always named (`copyLabel`).                                                                                           | Compliant |
| 7.1       | Scripts compatible with assistive technology | Confirmation through the button's always-present `role="status"` region; a failed copy selects the value so the keyboard user can press Ctrl+C.                                                    | Compliant |

## Accessibility test

`copy-field.spec.ts` ends with axe runs (plain, labelled, after a copy): 0 violations.

## Externalized strings

`label`, `copyLabel`, `copiedText`, `failedText` are inputs with English defaults.
