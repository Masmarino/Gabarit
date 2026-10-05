# AuthRegister

The free registration page of the auth kit, outside the app shell, in the sign-in panel
([`gbt-auth-panel`](../auth/auth-panel/auth-panel.ts)). It asks the backend whether registration is open,
shows the form (or "Registration is closed"), creates the account, then takes the new account through
the mandatory first MFA enrolment ([`gbt-mfa-enrollment`](../mfa-enrollment/mfa-enrollment.ts)) right
in the panel. It never talks HTTP, never touches storage and never navigates: the backend is the
application's `AUTH_PORT`, and the page tells the application where to go through its outputs.

**Selector**: `gbt-auth-register`

## States

| State     | What shows                                                                                                                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| loading   | Until `AuthPort.authConfig()` answers: a skeleton of the form (`role="status"`, `aria-busy`, a visually hidden "Loading"), no heading, never a flash of the form.                                                                                                  |
| open      | The form: username, email address, password, one primary "Create my account", then the projected sign-in link. Also shown when `authConfig()` fails: the server enforces the switch anyway.                                                                        |
| closed    | `registrationEnabled` is false (or the server answered "registration is disabled" to a submit): a lock state with "Registration is closed", its explanation and one "Sign in" button.                                                                              |
| enrolment | The server answered an `mfaToken`: the panel widens (`wide`), its heading becomes "Two-factor authentication" and `gbt-mfa-enrollment` replaces the form. A passkey is offered when `authConfig().passkeysAvailable` is true and the browser supports WebAuthn.    |
| created   | The enrolment was left ("Back") or its token expired: the account exists, so the page says "Your account has been created", names it (lower-cased, as stored; "The setup has expired." first when it expired) and offers one "Sign in" button. No session is held. |

## Inputs

| Input               | Type                      | Default                                | Role                                                                                                                                           |
| ------------------- | ------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `labels`            | `Partial<RegisterLabels>` | `{}`                                   | Strings to change, over `provideAuthLabels({ register })` and the English defaults (`DEFAULT_REGISTER_LABELS`).                                |
| `minPasswordLength` | `number`                  | `MIN_PASSWORD_LENGTH` (8)              | The server's minimum password length, checked before the round trip; also worded in the hint and the error.                                    |
| `usernamePattern`   | `RegExp`                  | `USERNAME_PATTERN` (a letter, 3 to 32) | The server's username rule, checked on the trimmed name before the round trip. Adjust the `usernameHint` and `usernameInvalid` labels with it. |

The enrolment's own strings are `MfaEnrollmentLabels`: localise them with `provideAuthLabels({ mfaEnrollment })`.

**A custom `usernamePattern` must not use the `g` or `y` regex flags (they make `.test()` stateful across
calls, so the same name would pass and fail in turn) and must mirror the server's own rule.** The same goes
for `minPasswordLength`: both only spare a round trip, the server stays the authority.

## Outputs

| Output       | Payload | Role                                                                                                                                                                                                            |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `registered` | `void`  | The account exists and has a session: either the backend issued one at once (the port stored it), or the enrolment finished and the held-back session was handed to `AuthPort.setToken`. Navigate into the app. |
| `signIn`     | `void`  | "Sign in" was pressed in the closed or created state: go to the sign-in page.                                                                                                                                   |

## Slots

| Selector              | Role                                                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[auth-logo]`         | The application's logo (an `img`, `picture` or `svg`), on top of the panel. Optional.                                                                                  |
| `[auth-backdrop]` | What is drawn on the graphite page, behind the panel: `gbt-git-field`, the family's animated commit graph (`@masmarino/gabarit/git-field`). Optional. |
| `[gbtAuthFooterLink]` | The link to the sign-in page, under the form after "Already have an account?". An `a gbtButton variant="link"` carrying `routerLink` or `href`. No footer when absent. |

## Behaviour

- **Checks before the request.** Nothing is said while the user types; after a first "Create my account"
  every wrong field shows its rule (in place of its hint, as its only `aria-describedby`) and the focus moves
  to the first wrong one. The checks then stay live. Nothing is sent while a field is wrong.
- **Sent**: `register(username.trim(), email.trim(), password)`. A second submit while in flight is ignored;
  the button shows its spinner and is disabled. The password is emptied as soon as the server answered.
- **Failures** are worded from the labels, never from the backend's text, in an alert (`role="alert"`), and the
  focus goes where the user retypes: a 400 naming a field focuses that field ("Check the fields"); a 400 naming
  none focuses the alert; a reserved name, a taken name or address (409) focus the field concerned; a 429 says
  to wait; anything else (5xx, network, a browser error) says the creation failed and keeps what was typed. A
  400 "registration is disabled" switches to the closed state. The recognised bodies are in
  `AUTH_PORT_ERROR_BODIES`.
- **Focus**: the form starts in the username field; the closed and created states move the focus to their
  `h1` (focusable by script, not a tab stop) so the change is announced.
- **Sessions**: the page never stores one. A backend without MFA enforcement answers a `token` (the port stores
  it): `registered` fires at once. Otherwise the enrolment keeps the session until the backup codes are
  acknowledged, then the page hands it to `AuthPort.setToken` and emits `registered`.

## Example

```ts
// app.config.ts
providers: [
  { provide: AUTH_PORT, useClass: HttpAuthPort }, // your adapter over HttpClient
  {
    provide: TOTP_QR_RENDERER,
    useValue: (text, options) => import('qrcode').then((m) => m.toDataURL(text, options)),
  },
  provideAuthLabels({ register: { intro: 'Join Acme to host your repositories.' } }),
]
```

```ts
@Component({
  imports: [AuthRegister, Button, AuthFooterLink, RouterLink],
  template: `
    <gbt-auth-register
      (registered)="router.navigateByUrl('/home')"
      (signIn)="router.navigateByUrl('/login')"
    >
      <img auth-logo src="/logo.svg" alt="Acme" width="160" height="40" />
      <a gbtButton variant="link" gbtAuthFooterLink routerLink="/login">Sign in</a>
    </gbt-auth-register>
  `,
})
export class RegisterRoute {
  protected readonly router = inject(Router)
}
```

## Accessibility

See [AUDIT.md](AUDIT.md). The panel owns the page's `<main>` landmark and its `h1`.
