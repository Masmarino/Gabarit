# RGAA Audit — SecretReveal

Verified against RGAA 4.1.2 by exercising `Molecules/SecretReveal` in Storybook (stories `Masked`,
`Revealed`, `OneTimeTokenCard`, `InlineFeedback`, `Narrow`, `Dark`) and by code review
(`secret-reveal.ts`, `secret-reveal.html`, `secret-reveal.scss`).

## Checklist

| Criterion   | Short title                                    | Verification                                                                                                                                                                                                  | Result    |
| ----------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 7.1         | Scripts compatible with assistive technology   | Show / hide and copy are native buttons. The copy outcome goes through the copy button's always-present `role="status"` region. Tested, including a copy while masked.                                        | Compliant |
| 11.1 / 11.9 | Label of a button                              | Toggle: `showLabel` / `hideLabel` (the name changes with the state, no redundant `aria-pressed`); copy: `copyLabel`. All three strings are inputs.                                                            | Compliant |
| 12.11       | Hidden content ignored by assistive technology | The bullets are `aria-hidden`; a visually hidden `hiddenLabel` says the secret is hidden. Masked, the secret is not in the DOM at all (asserted on `innerHTML`), so nothing can leak to assistive technology. | Compliant |
| 3.1         | Information not conveyed by colour alone       | Masked / shown differ by the content (bullets vs text) and the eye / eye-off icon; a failed copy differs by the alert icon and the message.                                                                   | Compliant |
| 3.2         | Text contrast                                  | Shown: `--text-primary` on `--bg-principal`; masked: `--text-secondary` on `--bg-principal` (7:1 in both themes, `tokens/contrast.spec.ts`).                                                                  | Compliant |
| 10.11       | Reflow                                         | The secret wraps anywhere; the two buttons stay on the row down to a 240 px column (`Narrow`).                                                                                                                | Compliant |
| 13.8        | Moving content can be controlled               | No animation but the copy bubble's 150 ms fade, removed under `prefers-reduced-motion`.                                                                                                                       | Compliant |
| 12.9        | Focus not lost                                 | Showing or hiding never moves the focus (the toggle stays); after a refused copy the focus stays on the copy button while the secret is selected.                                                             | Compliant |

## Accessibility test

`secret-reveal.spec.ts` ends with axe runs (masked, shown, after a copy): 0 violations.

## Externalized strings

`label`, `showLabel`, `hideLabel`, `hiddenLabel`, `copyLabel`, `copiedText`, `failedText`: inputs with English defaults.
