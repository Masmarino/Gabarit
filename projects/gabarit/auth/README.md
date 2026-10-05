# Auth kit

The public sign-in pages and the account's second-factor settings, as components an application uses
as they are: login (with the MFA challenge), free registration, invitation activation, the new
password after an administrator's reset, the mandatory
first MFA enrolment (authenticator app or passkey, then backup codes), and the account cards for the
authenticator app and the passkeys. Every application that uses them gets the same behaviour, the same
accessibility and the same look, by construction.

The kit is **router-agnostic** (it never imports `@angular/router`: it emits outputs and shows the
links the application projects), **backend-agnostic** (it never talks HTTP: every call goes through a
port the application implements), **storage-agnostic** (it never touches `localStorage`: sessions are
the port's business) and **locale-agnostic** (every string is a label with an English default).

| Component                                                 | Selector               | Port                                     |
| --------------------------------------------------------- | ---------------------- | ---------------------------------------- |
| [`AuthLogin`](../auth-login/README.md)                          | `gbt-auth-login`       | `AUTH_PORT`                              |
| [`AuthRegister`](../auth-register/README.md)                    | `gbt-auth-register`    | `AUTH_PORT`                              |
| [`AuthActivate`](../auth-activate/README.md)                    | `gbt-auth-activate`    | `AUTH_PORT`                              |
| [`AuthResetPassword`](../auth-reset-password/README.md)         | `gbt-auth-reset-password` | `AUTH_PORT`                           |
| [`MfaEnrollment`](../mfa-enrollment/README.md)             | `gbt-mfa-enrollment`   | `AUTH_PORT`                              |
| [`MfaSettings`](../mfa-settings/README.md)                 | `gbt-mfa-settings`     | `MFA_PORT`                               |
| [`PasskeySettings`](../passkey-settings/README.md)         | `gbt-passkey-settings` | `MFA_PORT` (and `AUTH_PORT` if provided) |
| [`AuthPanel`](auth-panel/README.md)                     | `gbt-auth-panel`       | —                                        |
| [`AuthFooter`, `AuthFooterLink`](auth-footer/README.md) | `gbt-auth-footer`      | —                                        |
| [`TotpQr`](../mfa-enrollment/totp-qr/README.md)                           | `gbt-totp-qr`          | — (`TOTP_QR_RENDERER`)                   |
| [`BackupCodes`](../mfa-enrollment/backup-codes/README.md)                 | `gbt-backup-codes`     | —                                        |

## Wiring

```ts
// app.config.ts
providers: [
  { provide: AUTH_PORT, useExisting: AuthService }, // your service implements AuthPort
  { provide: MFA_PORT, useExisting: MfaService }, // your service implements MfaPort
  {
    provide: TOTP_QR_RENDERER, // Gabarit ships no QR encoder: bring one, loaded lazily
    useValue: (text: string, options: TotpQrRenderOptions) =>
      import('qrcode').then((qr) => qr.toDataURL(text, options)),
  },
  provideAuthLabels(MY_AUTH_LABELS), // optional: localise the whole kit once
]
```

> **Security: `TOTP_QR_RENDERER` receives the user's TOTP secret.** It is called with the full
> `otpauth://…?secret=…` URL, raw secret included. The renderer **must encode locally**, in the
> browser (a bundled library such as `qrcode`, as above): **no network call, never a hosted or
> third-party QR service** (a `https://…?data=otpauth…` image would hand every user's second factor
> to that service and its access logs). It **must not log** the text, nor send it to analytics or
> error reports. See [TotpQr](../mfa-enrollment/totp-qr/README.md).

```html
<!-- login.page.html: a thin wrapper, routed at /login -->
<gbt-auth-login (loggedIn)="router.navigateByUrl('/home')">
  <img auth-logo src="logo.svg" alt="Acme" width="480" height="120" />
  <a gbtButton variant="link" gbtAuthFooterLink routerLink="/register">Create an account</a>
</gbt-auth-login>
```

Every page takes the application's logo in its `[auth-logo]` slot (an `img`, a `picture` or an
`svg`) and the link of its footer in `[gbtAuthFooterLink]` (an `a[gbtButton]` in its `link` variant,
carrying the application's `routerLink` or `href`). A page without a projected footer link shows no
footer.

**`gbt-auth-register`, `gbt-auth-activate` and `gbt-auth-reset-password` also emit `(signIn)`**, from
their own terminal states (registration closed, account created, activation succeeded, password
changed, dead link), where "Sign in" is a button
rather than the projected link. That output is in addition to the projected `[gbtAuthFooterLink]`,
not instead of it: **wire both** (`(signIn)="router.navigateByUrl('/login')"` and the footer link)
for every path to reach the sign-in page.

## The `AuthPort` contract

- **Sessions.** `login`, `register`, `verifyMfa` and `finishPasskeyChallenge` store the session they
  obtain, when there is one (`LoginResponse.token` not null), then the page emits its success output.
  `confirmTotp` and `finishPasskeySetup` must **not** store theirs: the enrolment holds the session
  back until the user has acknowledged the backup codes (shown once), then the page hands it to
  `setToken(token)` and emits.
- **MFA.** A `LoginResponse` with `token: null` and an `mfaToken` sends the user to the challenge
  (`mfaHasTotp`, `mfaHasPasskey` say what they can use) or, with `mfaSetupRequired`, to the mandatory
  enrolment.
- **Configuration.** `authConfig()` is read once by the login page (a failed read hides the
  registration link; passkeys stay "unknown", which does not block them) and by the registration page
  (a failed read shows the form: the server has the last word).

## The error contract

A failed port call errors with `{ status, error }`: the HTTP status and the response body, the shape
of Angular's `HttpErrorResponse` (an adapter on `HttpClient` passes its errors through untouched). A
browser's WebAuthn error (a `DOMException`, no `status`) is told apart from a server answer by that
shape. The kit words every failure itself; the server's text is never shown. What it recognises
(`AUTH_PORT_ERROR_BODIES` holds the strings):

| Call                                  | Answer                                                                                                             | Read as                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `login`                               | 401                                                                                                                | wrong username or password (any other failure: "sign-in failed")             |
| any                                   | 429                                                                                                                | too many attempts                                                            |
| MFA calls with an `mfaToken`          | 401 `invalid or expired token`                                                                                     | the sign-in expired: back to the credentials                                 |
| `verifyMfa`, `finishPasskeyChallenge` | 401 (any other body)                                                                                               | wrong code / passkey refused                                                 |
| `confirmTotp`, `confirm`              | 400 `invalid code`                                                                                                 | wrong code                                                                   |
| enrolment calls                       | 400 `MFA is already set up`                                                                                        | the account got a factor meanwhile: back to the credentials                  |
| passkey calls                         | 503                                                                                                                | passkeys not available on this server                                        |
| `finishPasskeySetup`, registration    | 409                                                                                                                | this key is already registered                                               |
| password-gated `MfaPort` calls        | 400 `current password is incorrect` (exactly)                                                                      | wrong password (never a 401, which an interceptor would take for a sign-out) |
| `startPasskeyRegistration`/`finish…`  | 400 `too many passkeys`                                                                                            | the account holds the most passkeys the server keeps                         |
| `deletePasskey`                       | 404                                                                                                                | already gone: removed from the list, nobody signed out                       |
| `register`                            | 400 `registration is disabled`                                                                                     | the closed state                                                             |
| `register`                            | 400 `username is reserved` / `username …` / `email is not a valid address` / `password must be at least …` / other | the field concerned, else "check the fields"                                 |
| `register`                            | 409 `email already in use` / other 409                                                                             | address taken / name taken                                                   |
| `activate`, `resetPassword`           | 400 `password must be at least …` / other 400                                                                      | weak password (the link still works) / dead link                             |

An adapter for a backend that words these differently maps its answers onto them with `catchError`.

## Session revocation

`MfaPort.disable` and `MfaPort.deletePasskey` revoke the caller's own session on the server (MFA
being mandatory, removing a factor signs every device out). The cards then emit `sessionRevoked`:
the application must discard its local session and go to its sign-in page. As a safety net, the card
that revoked the session also turns inert ("You have been signed out", its `signedOut` label, and no
action left), so an unbound output never leaves a live card acting on a dead session; it cannot clear
the application's stored session, though: binding `sessionRevoked` stays mandatory.

## Activation and password-reset links

The mail should carry the token in the URL fragment (`/activate#token=…`,
`/reset-password#token=…`), which no server ever sees. The application's wrapper reads it once with
`activationToken(fragment, query)`, removes it from the address bar and history
(`navigateByUrl('/activate', { replaceUrl: true })`), and hands it to the `token` input of
`gbt-auth-activate` or `gbt-auth-reset-password`.

**The `token` input must be a one-time snapshot of the URL, never a value that reactively follows the
URL (e.g. a signal derived from `route.fragment`): the component resets when it changes.** Scrubbing
the URL would otherwise turn the token into `null` and flip the page to the dead-link view, even over
its success view.

## Labels

Each component has a `labels` input (a partial object) over `provideAuthLabels({ … })` over its
English defaults (`DEFAULT_LOGIN_LABELS`, …); nested pieces (`gbt-mfa-enrollment` inside the login
page, `gbt-totp-qr` and `gbt-backup-codes` inside the enrolment and the settings) read the provided
labels, so an application localises the whole kit in one place. Interpolated strings are functions
(`step(current, total)`, `codesLeft(count)`, `passkeyAdded(name)`…).

## The account cards together

`gbt-mfa-settings` and `gbt-passkey-settings` are meant to sit side by side. They share
`MfaSettingsState` (root-provided; provide it on a page to scope it): the factors as last read or
changed by either card, so the app becomes optional as soon as a passkey is added and deleting the
only key is flagged as removing the last factor; and which card owns the open form, so a view never
shows two password prompts (two primary buttons) at once.

## Theming

`--gbt-auth-panel-logo-width` (15rem) sizes the logo; `--gbt-auth-panel-logo-offset` (0) pulls it
up when the artwork has a transparent margin above its drawing.
