# RGAA Audit — AuthResetPassword

Verified against RGAA 4.1.2 by `reset-password.spec.ts` (jsdom, axe-core through
`expectNoA11yViolations`, contrast rule off), by the play functions of the `Auth/AuthResetPassword`
stories (`Default`, `Mismatch`, `Success`, `InvalidLink`, `ExpiredLink`, `WeakPassword`, `RateLimited`,
`Submitting`, `Dark`, `DarkInvalidLink`, `Phone`, `Localised`), and by code review (`reset-password.ts`,
`reset-password.html`).

## Checklist

| Criterion | Short title                                  | Verification                                                                                                                                                                                                                                                                                                          | Result    |
| --------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 8.2       | Valid code (automated rules)                 | No axe violation (WCAG 2.0/2.1/2.2 A and AA tags) in the form, field-error, server-error (429), success and dead-link views (`reset-password.spec.ts`).                                                                                                                                                               | Compliant |
| 9.1       | Headings                                     | One `h1` per view: "Choose a new password", "Your password has been changed", "This link does not work" (`reset-password.spec.ts`; `Success`, `InvalidLink`, `ExpiredLink` stories).                                                                                                                                  | Compliant |
| 11.1      | Form fields have a label                     | New password and Confirm the new password are `label[for]`-labelled (`reset-password.spec.ts`); the stories find both by their label.                                                                                                                                                                                 | Compliant |
| 11.10     | Input control is relevant                    | The password hint ("At least 8 characters.") is its field's `aria-describedby`, the confirmation has none; nothing is said before the first attempt; the errors show under their fields and stay live (`reset-password.spec.ts`).                                                                                     | Compliant |
| 11.11     | Suggestions for correction                   | The errors state the rule ("At least 8 characters", following `minPasswordLength`; "The passwords do not match"; after a weak-password 400, "The password must be at least 8 characters long") (`reset-password.spec.ts`; `Mismatch`, `WeakPassword` stories).                                                         | Compliant |
| 11.13     | Input purpose (autocomplete)                 | Both fields are `type="password"` with `autocomplete="new-password"`, so password managers offer to generate and save the new password rather than fill the old one (`reset-password.spec.ts`).                                                                                                                      | Compliant |
| 7.1       | Scripts compatible with assistive technology | Server failures are an alert (`gbt-alert [role="alert"]`, `reset-password.spec.ts`; `WeakPassword`, `RateLimited` stories). The in-flight button is disabled and shows its loading label "Setting the password" (`reset-password.spec.ts`, `Submitting` story).                                                       | Compliant |
| 7.5       | Status messages                              | Failures are announced as alerts; the change to the success or dead-link view is announced by moving the focus to its `h1` (below).                                                                                                                                                                                   | Compliant |
| 12.8      | Focus order and focus management             | The form starts in the new-password field; a client-side check focuses the first wrong field; a server failure focuses the password; the success and dead-link views focus their `h1`, which is `tabindex="-1"` (no tab stop) (`reset-password.spec.ts`; `Default`, `Mismatch`, `Success`, `WeakPassword` stories). | Compliant |
| 7.3       | Keyboard operable                            | The form submits on Enter (`submit` event, `reset-password.spec.ts`); every action is a native `<button>` (`gbt-button`) or the projected link.                                                                                                                                                                       | Compliant |
| 1.2       | Decorative images ignored                    | The success and dead-link icons are `aria-hidden="true"` (`reset-password.spec.ts`). The logo is the application's: it must carry its own `alt`.                                                                                                                                                                      | Compliant |
| 3.1       | Information not conveyed by colour alone     | The dead link is error-toned (`data-tone="error"`) AND says so in its heading and message; the success is not toned and says so in text; order icon, heading, message, button (`reset-password.spec.ts`).                                                                                                             | Compliant |
| 10.11     | Reflow                                       | `expectPanelLayout` in every story: no horizontal overflow, a 16 px gutter, nothing spills out of the panel, tap targets at least 44 px, the button spans the form; also at 375 px (`Phone`) and in the dark theme (`Dark`, `DarkInvalidLink`). Runs in a real browser only (Storybook).                              | Compliant |
| 12.6      | Landmarks                                    | The panel (`gbt-auth-panel`) is the page's `<main>` (code review).                                                                                                                                                                                                                                                    | Compliant |

Not verified here: focus visibility and colour contrast (they come from `gbt-input`, `gbt-button`,
`gbt-alert` and `gbt-empty-state`, audited in their own folders); a real screen reader pass.

Security notes (not RGAA criteria): the token is never rendered, neither in the markup nor in a field
value (`reset-password.spec.ts`); once spent or refused it is never sent again (`reset-password.spec.ts`).
The page reads no URL: carrying the token in the link's fragment (`/reset-password#token=…`), so that no
server or access log sees it, and scrubbing it from the address bar and the history are the application's
part (see the README). Every refused token (the server's generic 400, whatever its body) gets the same
dead-link view, so the page reveals nothing about why a link does not work.

## Externalized strings

Every user-facing string of the page is a `ResetPasswordLabels` member with an English default
(`DEFAULT_RESET_PASSWORD_LABELS` in `auth-labels.ts`), separate from the activation's: the heading and
intro, the field labels and the password hint (`passwordHint`, `passwordTooShort` and `weakPassword` take
the minimum length), the password toggle's names, the button and its loading label, the footer's "Already
set your new password?", the success and dead-link views, the "Sign in" button, the field errors and the
server failures. An application overrides them once with `provideAuthLabels({ resetPassword })` and per
instance with the `labels` input, which wins string by string (both verified in `reset-password.spec.ts`,
as is the independence from the `activate` labels; the French strings of the `Localised` story). The
sign-in link's text is the application's own (projected).
