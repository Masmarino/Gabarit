# AuthLogin

The sign-in page of the auth kit, outside the app shell: the application's logo,
a heading, the username and password fields and one "Sign in" button; then,
when the password is accepted, the second factor. It is router-, storage- and
backend-agnostic: every call goes through the application's
[`AuthPort`](../ports/auth.port.ts), and the page tells the application the
user is signed in with `loggedIn` (the application navigates).

**Selector**: `gbt-auth-login`

## States

| State       | When                                                                           | What shows                                                                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credentials | On open, after "Back", after an expired second step.                           | "Sign in", the two fields, the submit button; the registration footer when registration is open and the application projected a link.                                                                                                                         |
| Challenge   | `login` answered an `mfaToken` without `mfaSetupRequired`.                     | "Two-step verification", with what this user can do here: their passkey (when they have one and both the browser and the server can run it), the 6-digit code of their app (when they have one), and always a backup code.                                    |
| Enrolment   | `login` answered an `mfaToken` with `mfaSetupRequired` (no second factor yet). | "Two-factor authentication" and [`gbt-mfa-enrollment`](../mfa-enrollment/mfa-enrollment.ts) in a wider panel: the mandatory first set-up of an app or a passkey, then the backup codes. The session is only handed over once the user acknowledged the codes. |

## Inputs

| Input    | Type                   | Default | Role                                                                                                                        |
| -------- | ---------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| `labels` | `Partial<LoginLabels>` | `{}`    | Strings to change, string by string, over `provideAuthLabels({ login })` and the English defaults (`DEFAULT_LOGIN_LABELS`). |

The enrolment takes its strings from `provideAuthLabels({ mfaEnrollment, totpQr, backupCodes })`.

## Outputs

| Output     | Payload | Role                                                                                                                                                                                                                       |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loggedIn` | `void`  | The user is signed in: the port stored the session (`login`, `verifyMfa`, `finishPasskeyChallenge`), or the page handed the held-back session of a finished enrolment to `AuthPort.setToken`. Navigate to the application. |

## Slots

| Selector              | Role                                                                                                                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[auth-logo]`         | The application's logo (an `img`, a `picture`, an `svg`) at the top of the panel, on every state. Give it its `alt`.                                                                                                        |
| `[gbtAuthFooterLink]` | The link to the application's registration page (`<a gbtButton variant="link" gbtAuthFooterLink routerLink="/register">`). Shown under the form, after "No account yet?", only when `authConfig` says registration is open. |

## Providers

| Token                               | Required               | Role                                                                                                                                       |
| ----------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_PORT`                         | Yes                    | The backend: `authConfig`, `login`, `verifyMfa`, `startPasskeyChallenge`, `finishPasskeyChallenge`, `setToken`, and the enrolment's calls. |
| `TOTP_QR_RENDERER`                  | For the enrolment's QR | The QR encoder of the authenticator-app set-up. Without one the enrolment shows the secret to type by hand.                                |
| `AUTH_LABELS` (`provideAuthLabels`) | No                     | The application's wording, once for the whole kit.                                                                                         |

## Behaviour

- **Configuration.** `authConfig` is read once, when the page opens. A failed read only hides
  the registration link, and is not taken for "no passkeys on this server": signing in never
  depends on it.
- **Password step.** Only a 401 says "Incorrect username or password"; a 429 says to wait; any
  other failure (a 5xx, a network error, an answer with neither `token` nor `mfaToken`) says the
  sign-in failed. The password is dropped from memory as soon as the server accepted it.
- **Challenge.** One primary button per view: "Use a passkey" when it is offered, else "Verify".
  A user with both factors gets the passkey first and the code form under "or". Spaces are
  stripped from a code. A refused code empties the field; a 429 keeps it. A passkey-only user
  whose passkey cannot run here (no WebAuthn in the browser, or passkeys off on the server) is
  told why and given the backup-code form, never a dead end.
- **Passkey.** `startPasskeyChallenge`, the browser's prompt, then `finishPasskeyChallenge`. A
  dismissed prompt is a quiet "Operation cancelled" (not an error) and keeps the screen. While
  the prompt is open "Use a backup code" and "Back" stay usable; leaving drops the ceremony, so a
  late answer is never sent.
- **Expiry.** A dead `mfaToken` (401 `invalid or expired token`, at the challenge, the passkey
  or the enrolment) goes back to the credentials with "Your sign-in has expired, sign in again."
  and the username kept.
- **Enrolment.** The page embeds `gbt-mfa-enrollment`: `completed` hands the session to
  `AuthPort.setToken` then emits `loggedIn`; `cancelled` ("Back") returns to the credentials;
  `expired` returns with the expiry message. The passkey option is only offered when the
  server said `passkeysAvailable: true` and the browser has WebAuthn.
- **Focus.** On open the username field; after a failed sign-in the password field; on the
  challenge the passkey button or the code field; after a failure the field (or button) to retry;
  after "Back" the password field.

Failures are classified by status and by the body's `error` string (see
`AUTH_PORT_ERROR_BODIES`): the backend's own text is never shown.

## Example

```ts
// app.config.ts
providers: [
  { provide: AUTH_PORT, useClass: HttpAuthPort }, // your adapter over HttpClient
  {
    provide: TOTP_QR_RENDERER,
    useValue: (text, options) => import('qrcode').then((m) => m.toDataURL(text, options)),
  },
  provideAuthLabels({ login: { heading: 'Connexion', submit: 'Se connecter' /* … */ } }),
]
```

```ts
@Component({
  imports: [AuthLogin, Button, AuthFooterLink, RouterLink],
  template: `
    <gbt-auth-login (loggedIn)="router.navigateByUrl('/home')">
      <img auth-logo src="/logo.svg" alt="Acme" width="160" height="40" />
      <a gbtButton variant="link" gbtAuthFooterLink routerLink="/register">Create an account</a>
    </gbt-auth-login>
  `,
})
export class LoginPage {
  protected readonly router = inject(Router)
}
```

## Accessibility

See [AUDIT.md](./AUDIT.md). The page title (`<title>`) is the application's: set it on the route.
