# RGAA Audit — AuthFooter

Verified against RGAA 4.1.2 by the unit tests (`auth-footer.spec.ts`, including axe-core runs on
the drawn and the projected link), by the Storybook stories (`Auth/AuthFooter`: `Default`,
`LongText`, `ProjectedLink`, `Dark`, `Phone`, `Localised`, whose play functions find the link by role
and name and run `expectPanelLayout`) and by code review (`auth-footer.ts`, `auth-footer.html`,
`auth-footer.scss`).

## Checklist

| Criterion | Short title                  | Verification                                                                                                                                                                                                                  | Result           |
| --------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 6.1       | Explicit links               | The link's text names its destination ("Create an account", "Sign in"), after the sentence that gives it context, in the same paragraph (spec: order and text; stories: found by role `link` and name).                       | Compliant        |
| 6.2       | Every link has a name        | Drawn: `linkText`; projected: the application's text. Both checked by the spec and the stories.                                                                                                                               | Compliant        |
| 7.1       | Scripts compatible with AT   | The link is a real `<a href>` in both forms (spec). A projected link that is disabled gets `aria-disabled="true"`, `tabindex="-1"` and does not navigate (spec, with a stand-in `routerLink`).                                | Compliant        |
| 7.3       | Keyboard operable            | A native link, in the tab order unless disabled (spec).                                                                                                                                                                       | Compliant        |
| 10.11     | Reflow                       | A long sentence wraps under the link's row inside the panel (`LongText`, `Phone` at a 375 px column: `expectPanelLayout` checks no overflow and nothing out of the panel).                                                    | Compliant        |
| —         | Target size (WCAG 2.2 2.5.8) | The link is 44 px high, drawn or projected: the rule targets `.gbt-auth-footer__link` (set by `AuthFooterLink`, spec) and `a.gbt-button--link` (spec reads the rule); `expectPanelLayout` measures the height in every story. | Compliant        |
| 3.2       | Text contrast                | Theme tokens only (`--text-secondary`, the link variant's colour); the `Dark` story renders the dark theme. Not measured by the specs (axe's `color-contrast` rule is off in jsdom).                                          | Visually checked |
| 3.3       | Component contrast           | The hairline above is decorative (`--gbt-hairline`); nothing depends on it.                                                                                                                                                   | Compliant        |

axe-core (WCAG 2.0/2.1/2.2 A and AA rules, contrast excepted) reports no violation on the drawn and
the projected forms.

## Externalized strings

None of its own: `text` and `linkText` are inputs, a projected link's text is the application's.
The kit's pages take their footer sentence from their labels (`registerPrompt`, …). The `Localised`
story renders the footer in French.
