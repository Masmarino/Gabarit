# PasskeySettings

The account settings card of the signed-in user's **passkeys** (WebAuthn): the keys already
registered (name, when each was added, when it was last used), adding a new one, and deleting one.
It is the second factor next to the authenticator app of [`gbt-mfa-settings`](../mfa-settings/mfa-settings.ts):
the two cards sit side by side on an account security page and coordinate through the root-provided
`MfaSettingsState`.

**Selector**: `gbt-passkey-settings`

## States

| State   | What shows                                                                                                                                                                                                                                                            |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| loading | Two skeleton rows and a polite status (`labels.loading`), outside any `aria-busy` region.                                                                                                                                                                             |
| failed  | An error alert (`role="alert"`) with a Retry button, which reads the status again.                                                                                                                                                                                    |
| ready   | The list (`ul`, named by `labels.listLabel`, the count beside the card heading) or the empty state (`labels.emptyHeading`), a polite result line, then "Add a passkey" — or, in its place, the add form. Each row opens its own delete prompt.                        |
| revoked | After a successful delete (the server revoked every session, this one included): an inert card, only "You have been signed out" (`labels.signedOut`), no list and no action left. `sessionRevoked` fires too: the card cannot clear the application's session itself. |

## Inputs

| Input    | Type                             | Default | Role                                                                                                                                                       |
| -------- | -------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `labels` | `Partial<PasskeySettingsLabels>` | `{}`    | Strings to change, string by string, over `provideAuthLabels({ passkeySettings })` and the English defaults (`DEFAULT_PASSKEY_SETTINGS_LABELS`).           |
| `locale` | `string \| null`                 | `null`  | The locale of the dates (relative times such as "2 hr. ago", dates such as `03/12/2025`, the exact date and time on hover). `null`: Angular's `LOCALE_ID`. |

## Outputs

| Output           | Payload | Role                                                                                                                                                                                                                                                                                  |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionRevoked` | `void`  | A passkey was deleted: the server revoked every session of the account, this one included. Sign out locally and go to the sign-in page (when the key was the last factor, the user goes through a new enrolment at the next sign-in). Bind it: the card only turns inert (`revoked`). |

## Slots

None.

## Dependencies (injection)

| Token              | Required | Role                                                                                                                                                                                                    |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MFA_PORT`         | yes      | `status`, `startPasskeyRegistration`, `finishPasskeyRegistration`, `deletePasskey` (see `MfaPort`).                                                                                                     |
| `AUTH_PORT`        | no       | Only `authConfig()`, read alongside the status: `passkeysAvailable: false` blocks adding. Without an `AUTH_PORT`, or when the config cannot be read, the availability is unknown and adding is allowed. |
| `MfaSettingsState` | root     | Shared with `gbt-mfa-settings`. Nothing to provide; provide it on the page (`providers: [MfaSettingsState]`) to scope it.                                                                               |
| `AUTH_LABELS`      | no       | The application-wide strings (`provideAuthLabels`).                                                                                                                                                     |

## Behaviour

- **Adding** opens an inline form in place of the button: an optional name (the placeholder and the
  default name are `labels.defaultPasskeyName`, trimmed, at most 40 characters counted as code
  points, no control characters) and the **current password**. The server checks the password on
  `startPasskeyRegistration` before any ceremony (a stolen session alone must not plant a key); the
  browser's prompt then opens (`labels.promptOpen` is said politely meanwhile) and
  `finishPasskeyRegistration` receives the credential and the name. The new key joins the list, the
  result line announces it, and the focus moves to its row.
- **Failures** of adding: a wrong password is an error under the password field (refocused); 429, 503
  (passkeys unavailable), too many passkeys, a duplicate (409 or the browser's `InvalidStateError`)
  and any other failure are an alert above the form, the focus back on the submit button. A dismissed
  browser prompt is a quiet `info` note (`role="status"`), and the password is kept for a one-click
  retry.
- **Leaving the form** while a request or the browser's prompt is under way is allowed: a late answer
  is dropped (no prompt opens, nothing is listed). A key whose finish still succeeded is counted in
  `MfaSettingsState`.
- **Deleting** opens a password prompt under that row (a warning alert first when it is the account's
  last factor: one key and no authenticator app, as read or as changed by the sibling card), then a
  confirmation dialog that says every device is signed out. Confirming calls `deletePasskey` once;
  success emits `sessionRevoked`. A wrong password, a 429 or a server failure bring the user back to
  the prompt with the message; a 404 (already gone) takes the key off the list and announces it,
  nobody is signed out.
- **Where adding is impossible** (a browser without WebAuthn, or `passkeysAvailable: false`), an
  information note says why and the button is disabled; the keys stay listed and deletable.
- **One prompt at a time**: opening the add form closes a delete prompt and the reverse; when the app
  card takes the form (`MfaSettingsState.formOwner`), this card's open prompts close quietly; while the
  app card is mid-enrolment (`appFlowActive`), "Add a passkey" is disabled with a hint. At most one
  primary button is on screen.
- **Secrets**: passwords live in signals until their request answers or the form closes, and are
  cleared when the component is destroyed; the credential the browser returns is never stored.
- **Dates**: an addition or a last use older than 30 days is shown as a date (`labels.added(true)`,
  "Added on"), a recent one as a relative time (`labels.added(false)`, "Added"); the `<time>` element
  carries the ISO date and the exact date and time as its `title`.

## Example

```ts
// app.config.ts
import { AUTH_PORT, MFA_PORT, provideAuthLabels } from '@masmarino/gabarit'

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: MFA_PORT, useClass: HttpMfaPort }, // your adapter over HttpClient
    { provide: AUTH_PORT, useClass: HttpAuthPort }, // optional here: only authConfig() is read
    provideAuthLabels({ passkeySettings: { heading: "Clés d'accès" /* … */ } }),
  ],
}
```

```ts
// account-security.page.ts
@Component({
  imports: [MfaSettings, PasskeySettings],
  template: `
    <gbt-mfa-settings (sessionRevoked)="signOut()" />
    <gbt-passkey-settings locale="fr" (sessionRevoked)="signOut()" />
  `,
})
export class AccountSecurityPage {
  private readonly session = inject(SessionService)
  private readonly router = inject(Router)

  signOut(): void {
    this.session.clear()
    this.router.navigateByUrl('/login')
  }
}
```

The card never navigates and never touches storage: signing out after a deletion is the page's job.

## Accessibility

See [AUDIT.md](AUDIT.md).
