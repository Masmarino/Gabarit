# RGAA Audit — CopyButton

Verified against RGAA 4.1.2 by exercising `Atoms/CopyButton` in Storybook (stories `Default`,
`WithText`, `FeedbackPlacement`, `VariantsAndSizes`, `CopyRefused`, `Dark`) and by code review
(`copy-button.ts`, `copy-button.html`, `copy-button.scss`, `clipboard.ts`).

## Checklist

| Criterion   | Short title                                    | Verification                                                                                                                                                                                                                                                                                                        | Result    |
| ----------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 7.1         | Scripts compatible with assistive technology   | A native `<button>` (through `gbt-button`): Tab, Enter and Space work natively. The result is announced by a `role="status"` polite region that is present from the first render (a spec asserts it exists and is empty before any copy), so screen readers announce "Copied" / "Copy failed" without moving focus. | Compliant |
| 7.3         | Keyboard operable                              | Every action is the button's own click; nothing depends on hover or a pointer. A failed copy selects the target text so the keyboard user can press Ctrl+C.                                                                                                                                                         | Compliant |
| 3.1         | Information not conveyed by colour alone       | Success and failure differ by the icon (`check` / `alert-circle`) and by the message text, not only by the green / red pill.                                                                                                                                                                                        | Compliant |
| 3.2         | Text contrast                                  | The message uses `--color-success-bg-text` on `--color-success-bg` and `--color-error-bg-text` on `--color-error-bg` (asserted at 7:1 in both themes in `tokens/contrast.spec.ts`).                                                                                                                                 | Compliant |
| 11.1 / 11.9 | Label of a button                              | An icon-only button is always named: `ariaLabel`, defaulting to `Copy`. With a visible `text` the name is that text. The name is stable (the outcome is not written into it).                                                                                                                                       | Compliant |
| 13.8        | Moving content can be controlled               | The bubble fades in for 150 ms; the animation is removed under `prefers-reduced-motion: reduce`. The message disappears by itself after `feedbackMs` (default 2 s, failure twice as long), which is long enough to be read; it is duplicated in the live region.                                                    | Compliant |
| 12.11       | Hidden content ignored by assistive technology | The glyph is an `aria-hidden` `gbt-icon`.                                                                                                                                                                                                                                                                           | Compliant |
| WCAG 2.5.8  | Target size minimum                            | The `small` icon-only square is about 32 px (`size="medium"` 36 px, `large` 44 px), above the 24 px minimum.                                                                                                                                                                                                        | Compliant |

## Accessibility test

`copy-button.spec.ts` ends with axe runs in the idle, copied, failed and labelled states: 0 violations.
`clipboard.spec.ts` covers the Clipboard API, the `execCommand` fallback, the refusals, focus and
selection restoration, and the destroy-while-pending case with fake globals restored in `afterEach`.

## Externalized strings

`ariaLabel`, `copiedText`, `failedText` (and `text`) are inputs with English defaults: a consumer
localises them by passing its own.
