# AuthActivate

The activation page of the auth kit: where the link of an invitation mail lands, outside the app shell,
in the sign-in panel ([`gbt-auth-panel`](../auth-panel/auth-panel.ts)). The invited user chooses a
password; no session comes out of it: they sign in afterwards and are taken through the mandatory MFA
enrolment like everybody. It never talks HTTP, never reads the URL and never navigates: the backend is
the application's `AUTH_PORT`, the token is an input, and the page tells the application where to go
through its outputs.

**Selector**: `gbt-auth-activate`

## Views

| View    | What shows                                                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| form    | A token was given: "Activate your account", New password (with its hint), Confirm the password, one primary "Activate my account", then the projected sign-in link.       |
| success | The server accepted: "Your account is activated", what comes next, one "Sign in" button.                                                                                  |
| invalid | No token (`null` or `''`), or the server refused it (unknown, expired or used): an error-toned state, "This link does not work", ask for a new invitation, one "Sign in". |

## Inputs

| Input               | Type                      | Default                   | Role                                                                                                                                                                                               |
| ------------------- | ------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token`             | `string \| null`          | `null`                    | The invitation's token, as the application read it from its URL with `activationToken(fragment, query)`. `null` (or `''`) is the dead link, without any request. A new value starts the page over. |
| `labels`            | `Partial<ActivateLabels>` | `{}`                      | Strings to change, over `provideAuthLabels({ activate })` and the English defaults (`DEFAULT_ACTIVATE_LABELS`).                                                                                    |
| `minPasswordLength` | `number`                  | `MIN_PASSWORD_LENGTH` (8) | The server's minimum password length, checked before the round trip; also worded in the hint and the errors.                                                                                       |
| `chooseUsername`    | `boolean`                 | `false`                   | For servers where the administrator invites by e-mail only: a Username field comes first, and the invitee's choice is sent as `activate(token, password, username)`.                             |
| `usernamePattern`   | `RegExp`                  | `USERNAME_PATTERN`        | The server's username rule, checked before the round trip when `chooseUsername` is on.                                                                                                             |

## Outputs

| Output      | Payload | Role                                                                             |
| ----------- | ------- | -------------------------------------------------------------------------------- |
| `activated` | `void`  | The server accepted the password: the success view shows. No session was opened. |
| `signIn`    | `void`  | "Sign in" was pressed in the success or dead-link view: go to the sign-in page.  |

## Slots

| Selector              | Role                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[auth-logo]`         | The application's logo (an `img`, `picture` or `svg`), on top of the panel. Optional.                                                                                         |
| `[gbtAuthFooterLink]` | The link to the sign-in page, under the form after "Is your account already active?". An `a gbtButton variant="link"` carrying `routerLink` or `href`. No footer when absent. |

## Behaviour

- **The token.** The page sends it with the password (`activate(token, password)`) and never renders it
  (not in the markup, not in a field). Once spent (success) or refused (a 400 other than a weak password),
  it is dropped: the page does not send it again until a new `token` arrives.
- **The application's part** (it owns the URL): put the token in the link's **fragment**
  (`/activate#token=…`) so that no server, proxy or access log ever sees it; read it once with
  `activationToken(route.snapshot.fragment, route.snapshot.queryParamMap.get('token'))` (the query is only a
  fallback for older links; a token not shaped like the server's is `null`); then remove it (and any other
  parameter) from the address bar and the history entry, e.g.
  `router.navigateByUrl('/activate', { replaceUrl: true })` after the first render, so it does not linger in
  a screenshot or a shared tab.
- **The `token` input must be a one-time snapshot of the URL, never a value that reactively follows the
  URL (e.g. a signal derived from `route.fragment`): the component resets when it changes.** Scrubbing the
  URL as above would otherwise turn the token into `null` and flip the page to the dead-link view, even over
  its success view. Read it into a plain field, as in the example below.
- **`chooseUsername`.** The intro becomes `introWithUsername`, the Username field (with `usernameHint`) comes
  before the passwords and takes the first focus, and it is checked first (`usernameEmpty`,
  `usernameInvalid`). The value is sent trimmed; the server keeps the final say: a 400 `username is reserved`
  (`usernameReserved`), another 400 starting with `username ` (`usernameInvalid`) or a 409
  (`usernameTaken`) keeps the form, in an alert, the focus in the Username field.
- **`minPasswordLength` must mirror the server's own rule.** It only spares a round trip: the server stays
  the authority, and a looser value only moves the refusal to the server's answer.
- **Checks before the request.** Nothing is said while typing; after a first attempt the password rule and
  the confirmation ("Confirm your password", "The passwords do not match") show under their fields, the
  focus moves to the first wrong one, and the checks stay live.
- **Failures** are worded from the labels, in an alert, the focus back in the password field: a weak-password
  400 keeps the form (the link is still good), a 429 says to wait, anything else (5xx, network) says the
  activation failed and the same token can be retried. Any other 400 (but the username ones, with
  `chooseUsername`) is the dead link.
- **Focus**: the form starts in the new-password field; the success and dead-link views move the focus to
  their `h1` (focusable by script, not a tab stop). The passwords are emptied when the server accepted or
  refused the link.

## Example

```ts
// app.config.ts
providers: [
  { provide: AUTH_PORT, useClass: HttpAuthPort }, // your adapter over HttpClient
  provideAuthLabels({ activate: { signInPrompt: 'Already signed up?' } }),
]
```

```ts
@Component({
  imports: [AuthActivate, Button, AuthFooterLink, RouterLink],
  template: `
    <gbt-auth-activate [token]="token" (signIn)="router.navigateByUrl('/login')">
      <img auth-logo src="/logo.svg" alt="Acme" width="160" height="40" />
      <a gbtButton variant="link" gbtAuthFooterLink routerLink="/login">Sign in</a>
    </gbt-auth-activate>
  `,
})
export class ActivateRoute {
  protected readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)
  // Read once, then scrubbed from the address bar and the history entry.
  protected readonly token = activationToken(
    this.route.snapshot.fragment,
    this.route.snapshot.queryParamMap.get('token'),
  )

  constructor() {
    const { fragment, queryParamMap } = this.route.snapshot
    if (fragment !== null || queryParamMap.keys.length > 0) {
      afterNextRender(() => void this.router.navigateByUrl('/activate', { replaceUrl: true }))
    }
  }
}
```

## Accessibility

See [AUDIT.md](./AUDIT.md). The panel owns the page's `<main>` landmark and its `h1`.
