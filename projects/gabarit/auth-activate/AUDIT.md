# RGAA Audit — AuthActivate

Verified against RGAA 4.1.2 by `activate.spec.ts` (jsdom, axe-core through `expectNoA11yViolations`,
contrast rule off), by the play functions of the `Auth/AuthActivate` stories (`Default`, `Mismatch`,
`Success`, `InvalidLink`, `ExpiredLink`, `RateLimited`, `Submitting`, `Dark`, `DarkInvalidLink`, `Phone`,
`Localised`), and by code review (`activate.ts`, `activate.html`).

## Checklist

| Criterion | Short title                                  | Verification                                                                                                                                                                                                                                                                                  | Result    |
| --------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 8.2       | Valid code (automated rules)                 | No axe violation (WCAG 2.0/2.1/2.2 A and AA tags) in the form, field-error, server-error (429), success and dead-link views (`activate.spec.ts`).                                                                                                                                             | Compliant |
| 9.1       | Headings                                     | One `h1` per view: "Activate your account", "Your account is activated", "This link does not work" (`activate.spec.ts`; `Success`, `InvalidLink`, `ExpiredLink` stories).                                                                                                                     | Compliant |
| 11.1      | Form fields have a label                     | New password and Confirm the password are `label[for]`-labelled (`activate.spec.ts`); the stories find both by their label.                                                                                                                                                                   | Compliant |
| 11.10     | Input control is relevant                    | The password hint ("At least 8 characters.") is its field's `aria-describedby`, the confirmation has none; nothing is said before the first attempt; the errors show under their fields and stay live (`activate.spec.ts`).                                                                   | Compliant |
| 11.11     | Suggestions for correction                   | The errors state the rule ("At least 8 characters", following `minPasswordLength`; "The passwords do not match"; after a weak-password 400, "The password must be at least 8 characters long") (`activate.spec.ts`, `Mismatch` story).                                                        | Compliant |
| 11.13     | Input purpose (autocomplete)                 | Both fields are `type="password"` with `autocomplete="new-password"` (`activate.spec.ts`).                                                                                                                                                                                                    | Compliant |
| 7.1       | Scripts compatible with assistive technology | Server failures are an alert (`gbt-alert [role="alert"]`, `activate.spec.ts`; `RateLimited` story). The in-flight button is disabled and shows its loading label "Activating" (`activate.spec.ts`, `Submitting` story).                                                                       | Compliant |
| 7.5       | Status messages                              | Failures are announced as alerts; the change to the success or dead-link view is announced by moving the focus to its `h1` (below).                                                                                                                                                           | Compliant |
| 12.8      | Focus order and focus management             | The form starts in the new-password field; a client-side check focuses the first wrong field; a server failure focuses the password; the success and dead-link views focus their `h1`, which is `tabindex="-1"` (no tab stop) (`activate.spec.ts`; `Default`, `Mismatch`, `Success` stories). | Compliant |
| 7.3       | Keyboard operable                            | The form submits on Enter (`submit` event, `activate.spec.ts`); every action is a native `<button>` (`gbt-button`) or the projected link.                                                                                                                                                     | Compliant |
| 1.2       | Decorative images ignored                    | The success and dead-link icons are `aria-hidden="true"` (`activate.spec.ts`). The logo is the application's: it must carry its own `alt`.                                                                                                                                                    | Compliant |
| 3.1       | Information not conveyed by colour alone     | The dead link is error-toned (`data-tone="error"`) AND says so in its heading and message; the success is not toned and says so in text; order icon, heading, message, button (`activate.spec.ts`).                                                                                           | Compliant |
| 10.11     | Reflow                                       | `expectPanelLayout` in every story: no horizontal overflow, a 16 px gutter, nothing spills out of the panel, tap targets at least 44 px, the button spans the form; also at 375 px (`Phone`) and in the dark theme (`Dark`, `DarkInvalidLink`). Runs in a real browser only (Storybook).      | Compliant |
| 12.6      | Landmarks                                    | The panel (`gbt-auth-panel`) is the page's `<main>` (code review).                                                                                                                                                                                                                            | Compliant |

Not verified here: focus visibility and colour contrast (they come from `gbt-input`, `gbt-button`,
`gbt-alert` and `gbt-empty-state`, audited in their own folders); a real screen reader pass.

Security note (not an RGAA criterion): the token is never rendered, neither in the markup nor in a
field value (`activate.spec.ts`); keeping it out of the URL and the history is the application's part
(see the README).

## Externalized strings

Every user-facing string of the page is an `ActivateLabels` member with an English default
(`DEFAULT_ACTIVATE_LABELS` in `auth-labels.ts`): the heading and intro, the field labels and the
password hint (`passwordHint`, `passwordTooShort` and `weakPassword` take the minimum length), the
password toggle's names, the button and its loading label, the footer's "Is your account already
active?", the success and dead-link views, the "Sign in" button, the field errors and the server
failures. An application overrides them once with `provideAuthLabels({ activate })` and per instance
with the `labels` input, which wins string by string (both verified in `activate.spec.ts`; the French
strings of the `Localised` story). The sign-in link's text is the application's own (projected).
