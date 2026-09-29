# AuthResetPassword

The password-reset page of the auth kit: where the link of a password-reset mail lands, outside the app
shell, in the sign-in panel ([`gbt-auth-panel`](../auth-panel/auth-panel.ts)). An administrator has
reset the password of an existing account; the user follows the link and chooses a new password. No
session comes out of it: they sign in afterwards, through their second factor as on any sign-in (a
password reset leaves the account's factors untouched). It never talks HTTP, never reads the URL and
never navigates: the backend is the application's `AUTH_PORT`, the token is an input, and the page tells
the application where to go through its outputs.

**Selector**: `gbt-auth-reset-password`

It is the sibling of [`gbt-auth-activate`](../activate/README.md): same one-time link mechanics, same
form, same failure handling; only the call (`resetPassword` instead of `activate`), the output and the
wording differ.

## Views

| View    | What shows                                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| form    | A token was given: "Choose a new password", why (an administrator reset it), New password (with its hint), Confirm the new password, one primary "Set new password", then the projected sign-in link. |
| success | The server accepted: "Your password has been changed", sign in with the new one, one "Sign in" button.                                                                                          |
| invalid | No token (`null` or `''`), or the server refused it (unknown, expired or used): an error-toned state, "This link does not work", ask an administrator for a new link, one "Sign in".            |

## Inputs

| Input               | Type                           | Default                   | Role                                                                                                                                                                                                        |
| ------------------- | ------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token`             | `string \| null`               | `null`                    | The reset link's token, as the application read it from its URL with `activationToken(fragment, null)`. `null` (or `''`) is the dead link, without any request. A new value starts the page over. |
| `labels`            | `Partial<ResetPasswordLabels>` | `{}`                      | Strings to change, over `provideAuthLabels({ resetPassword })` and the English defaults (`DEFAULT_RESET_PASSWORD_LABELS`).                                                                                  |
| `minPasswordLength` | `number`                       | `MIN_PASSWORD_LENGTH` (8) | The server's minimum password length, checked before the round trip; also worded in the hint and the errors.                                                                                                |

## Outputs

| Output          | Payload | Role                                                                                 |
| --------------- | ------- | ------------------------------------------------------------------------------------ |
| `passwordReset` | `void`  | The server accepted the new password: the success view shows. No session was opened. |
| `signIn`        | `void`  | "Sign in" was pressed in the success or dead-link view: go to the sign-in page.      |

The success output is `passwordReset`, not `reset`: an output named after a native DOM event would
also catch the `reset` events bubbling from the page's own `<form>`.

## Slots

| Selector              | Role                                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[auth-logo]`         | The application's logo (an `img`, `picture` or `svg`), on top of the panel. Optional.                                                                                                        |
| `[gbtAuthFooterLink]` | The link to the sign-in page, under the form after "Already set your new password?". An `a gbtButton variant="link"` carrying `routerLink` or `href`. No footer when absent. |

## Behaviour

- **The token.** The page sends it with the new password (`resetPassword(token, password)`) and never
  renders it (not in the markup, not in a field). Once spent (success) or refused (a 400 other than a weak
  password), it is dropped: the page does not send it again until a new `token` arrives.
- **The application's part** (it owns the URL): put the token in the link's **fragment**
  (`/reset-password#token=…`) so that no server, proxy or access log ever sees it; read it once with
  `activationToken(route.snapshot.fragment, null)` (the helper is shared with the activation: a token not
  shaped like the server's, 64 hexadecimal characters by default, is `null`; pass your own `shape` as its
  third argument if your backend's differs); then remove it (and any other parameter) from the address bar
  and the history entry, e.g. `router.navigateByUrl('/reset-password', { replaceUrl: true })` after the
  first render, so it does not linger in a screenshot or a shared tab. Unlike the activation, there is no
  older `?token=` link to support: read the fragment only.
- **The `token` input must be a one-time snapshot of the URL, never a value that reactively follows the
  URL (e.g. a signal derived from `route.fragment`): the component resets when it changes.** Scrubbing the
  URL as above would otherwise turn the token into `null` and flip the page to the dead-link view, even over
  its success view. Read it into a plain field, as in the example below.
- **`minPasswordLength` must mirror the server's own rule.** It only spares a round trip: the server stays
  the authority, and a looser value only moves the refusal to the server's answer.
- **Checks before the request.** Nothing is said while typing; after a first attempt the password rule and
  the confirmation ("Confirm your new password", "The passwords do not match") show under their fields, the
  focus moves to the first wrong one, and the checks stay live.
- **Failures** are worded from the labels, in an alert, the focus back in the password field: a weak-password
  400 keeps the form (the link is still good), a 429 says to wait, anything else (5xx, network) says the new
  password could not be set and the same token can be retried. Any other 400 is the dead link: the server
  is expected to answer one generic 400 for an unknown, expired, used or malformed token, so that nobody
  probing links can tell them apart; the page words them all the same way. The failures are read by
  `classifyActivateFailure`, shared with the activation.
- **Focus**: the form starts in the new-password field; the success and dead-link views move the focus to
  their `h1` (focusable by script, not a tab stop). The passwords are emptied when the server accepted or
  refused the link.

## Example

```ts
// app.config.ts
providers: [
  { provide: AUTH_PORT, useClass: HttpAuthPort }, // your adapter over HttpClient
  provideAuthLabels({ resetPassword: { signInPrompt: 'Password already changed?' } }),
]
```

```ts
@Component({
  imports: [AuthResetPassword, Button, AuthFooterLink, RouterLink],
  template: `
    <gbt-auth-reset-password [token]="token" (signIn)="router.navigateByUrl('/login')">
      <img auth-logo src="/logo.svg" alt="Acme" width="160" height="40" />
      <a gbtButton variant="link" gbtAuthFooterLink routerLink="/login">Sign in</a>
    </gbt-auth-reset-password>
  `,
})
export class ResetPasswordRoute {
  protected readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)
  // Read once, then scrubbed from the address bar and the history entry.
  protected readonly token = activationToken(this.route.snapshot.fragment, null)

  constructor() {
    const { fragment, queryParamMap } = this.route.snapshot
    if (fragment !== null || queryParamMap.keys.length > 0) {
      afterNextRender(() => void this.router.navigateByUrl('/reset-password', { replaceUrl: true }))
    }
  }
}
```

## Accessibility

See [AUDIT.md](./AUDIT.md). The panel owns the page's `<main>` landmark and its `h1`.
