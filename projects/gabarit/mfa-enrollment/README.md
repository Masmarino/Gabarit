# MfaEnrollment

The mandatory first enrolment of a second factor, shown inside the sign-in panel when the password
step (or a free registration) answered "setup required". The user picks a factor, sets it up, then
acknowledges the backup codes; only then does the component hand the new session to its host.

It is embedded by [`gbt-auth-login`](../auth-login/login.ts) and [`gbt-auth-register`](../auth-register/register.ts)
inside their [`gbt-auth-panel`](../auth/auth-panel/auth-panel.ts). Use it directly only to build your own
sign-in page. The panel (logo, page heading) belongs to the host page.

**Selector**: `gbt-mfa-enrollment`

## Steps

The step counter reads "Step n of 3".

| Step      | #   | What shows                                                                                                                                                                                                                                                         |
| --------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `choice`  | 1   | Where a passkey can be made (`passkeysAvailable` and a browser with WebAuthn): two option cards, "Passkey" (Recommended, the single primary button) and "Authenticator app". Otherwise: the introduction of the authenticator path, three steps and "Get started". |
| `scan`    | 2   | The QR code of the `otpauth://` URL and the secret as text ([`gbt-totp-qr`](totp-qr/totp-qr.ts)), the one-time-code field and "Activate".                                                                                                                       |
| `passkey` | 2   | An optional key name (its default, "Passkey", is the placeholder), then "Create the passkey" opens the browser's prompt.                                                                                                                                           |
| `codes`   | 3   | The backup codes ([`gbt-backup-codes`](backup-codes/backup-codes.ts)), shown once, and "Continue", disabled until "I have saved my backup codes" is ticked. No way back from here.                                                                              |

A note ("Two-factor authentication is required…") sits on the first step, as a plain information
note, not a live region.

## Inputs

| Input               | Type                           | Default    | Role                                                                                                                                                 |
| ------------------- | ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mfaToken`          | `string`                       | (required) | The short-lived token of the password step (`LoginResponse.mfaToken`): the credential of every enrolment call.                                       |
| `passkeysAvailable` | `boolean`                      | `false`    | The server can run passkey ceremonies (`AuthConfig.passkeysAvailable`). A passkey is offered only when the browser can too (read once, on creation). |
| `labels`            | `Partial<MfaEnrollmentLabels>` | `{}`       | Strings to change, over `provideAuthLabels({ mfaEnrollment })` and the English defaults (`DEFAULT_MFA_ENROLLMENT_LABELS`).                           |

## Outputs

| Output      | Payload  | Role                                                                                                                                                                                                                 |
| ----------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `completed` | `string` | The codes are acknowledged and "Continue" was pressed: the SESSION token. Hand it to `AuthPort.setToken` (the login and register pages do) and move on. The component never stores it.                               |
| `cancelled` | `void`   | "Back" on the first step, or on the second when there is no choice to go back to: return to the credentials.                                                                                                         |
| `expired`   | `void`   | The `mfaToken` is no longer usable (a 401 `invalid or expired token`, or a 400 `MFA is already set up`): return to the credentials. The component also shows why, in its alert, in case the host keeps it on screen. |

## Slots

None. The nested QR and backup codes take their strings from `provideAuthLabels({ totpQr, backupCodes })`
(or `DEFAULT_TOTP_QR_LABELS` / `DEFAULT_BACKUP_CODES_LABELS`); the component's `labels` input only covers
its own strings.

## Dependencies

| Token              | Required | Used for                                                                                                                                                                                               |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_PORT`        | yes      | `enrollTotp(mfaToken)`, `confirmTotp(mfaToken, code)`, `startPasskeySetup(mfaToken)`, `finishPasskeySetup(mfaToken, challengeId, credential, name)`. The two confirmations must NOT store the session. |
| `TOTP_QR_RENDERER` | no       | Draws the QR (Gabarit ships no encoder). Without one, `gbt-totp-qr` shows its fallback and the secret to type by hand.                                                                                 |
| `AUTH_LABELS`      | no       | Application-wide strings (`provideAuthLabels`).                                                                                                                                                        |

## Behaviour

- **Nothing is asked before a choice.** The first call is made by "Get started" / "Use an app"
  (`enrollTotp`) or "Create the passkey" (`startPasskeySetup`); choosing "Use a passkey" only opens the
  name step.
- **The code** is sent stripped of spaces. An empty field is refused without a call ("Enter the 6-digit
  code from your app").
- **The passkey name** is trimmed; empty or blank, the key is named `defaultPasskeyName`. More than 40
  characters (code points) or control characters are refused before any call, with the focus on the field.
- **Busy states.** The primary button of the step shows its spinner while a call is in flight and a second
  submit is ignored; the busy state is rolled back on any failure. On the passkey step a polite note
  ("Confirm on your device to create the key.") shows while the browser's prompt is open, and "Back" stays
  enabled (the prompt can be lost behind a window).
- **Stale ceremonies are dropped.** Leaving the passkey step while the server or the browser has not answered
  yet opens no prompt and sends no attestation.
- **Recreate this component per `mfaToken`** (e.g. with an `@if` / `*ngIf` keyed on the token, as
  `gbt-auth-login` and `gbt-auth-register` already do): **it does not reset its internal state when the input
  changes.** Its step, the held-back session and the acknowledgement would survive a new token, and a later
  "Continue" could emit the previous flow's session.
- **Known race: "Back" while a passkey `finish` call is in flight.** Pressing "Back" once the browser has
  answered and `finishPasskeySetup` is still on its way cancels the flow (`cancelled` fires) and its answer is
  dropped: the passkey and its backup codes may then exist on the server without the user ever seeing the
  codes: at the next sign-in the account already has that passkey, and regenerating the codes from the
  account settings replaces the unseen ones.
- **No backup codes, no codes step.** A server that issues none with the chosen factor (an empty
  `backupCodes`) ends the enrolment there: `completed` carries the session token at once.
- **The session is held back** until the codes are acknowledged; the secret, the `otpauth://` URL and the code
  are dropped as soon as the factor is confirmed.
- **Focus.** Each step opens on its heading (`h2`, `tabindex="-1"`), so the change is announced and the QR stays
  in view (no phone keyboard over it). After a failure the focus goes back where the user acts: the field, or
  the button that was disabled while loading.

### Failures

The port's errors are read by status and by the `error` string of their body (see
[`AUTH_PORT_ERROR_BODIES`](../auth/shared/port-error.ts)). The backend's own wording is never shown.

| Answer                                   | Where                | Message (label)                                                          | `expired` |
| ---------------------------------------- | -------------------- | ------------------------------------------------------------------------ | --------- |
| 401 `invalid or expired token`           | any call             | `loginExpired`                                                           | yes       |
| 400 `MFA is already set up`              | any call             | `alreadySetUp`                                                           | yes       |
| 429                                      | any call             | `tooManyAttempts`                                                        | no        |
| 400 `invalid code` (or another 401)      | `confirmTotp`        | `wrongCode`, the field emptied                                           | no        |
| 409                                      | passkey calls        | `alreadyRegistered`                                                      | no        |
| 503                                      | passkey calls        | `passkeysUnavailable`                                                    | no        |
| anything else (network failure included) | the call             | `startFailed`, `activationFailed` or `passkeyFailed`                     | no        |
| `NotAllowedError` / `AbortError`         | the browser's prompt | `cancelled`, as a quiet information note (`role="status"`), not an error | no        |
| `InvalidStateError`                      | the browser's prompt | `alreadyRegistered`                                                      | no        |
| `NotSupportedError`                      | the browser's prompt | `browserUnsupported`                                                     | no        |
| any other browser error                  | the browser's prompt | `passkeyFailed`                                                          | no        |

## Example

The application provides its backend once:

```ts
// app.config.ts
import { type ApplicationConfig } from '@angular/core'
import { provideHttpClient } from '@angular/common/http'
import { AUTH_PORT, TOTP_QR_RENDERER, provideAuthLabels } from '@masmarino/gabarit'
import { HttpAuthPort } from './auth/http-auth-port' // your AuthPort over HttpClient

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    { provide: AUTH_PORT, useClass: HttpAuthPort },
    {
      provide: TOTP_QR_RENDERER,
      // Loaded only when the QR is drawn. It receives the raw TOTP secret: a LOCAL encoder only, never a
      // hosted QR service, never logged (see ../totp-qr/README.md).
      useValue: (text: string, options: object) =>
        import('qrcode').then((m) => m.toDataURL(text, options)),
    },
    // Optional: localise the kit once (each part partial).
    provideAuthLabels({
      mfaEnrollment: { choiceHeading: 'Protégez votre compte', begin: 'Commencer' },
      totpQr: { secretLabel: 'Ou saisissez cette clé dans votre application' },
      backupCodes: { acknowledge: "J'ai enregistré mes codes de secours" },
    }),
  ],
}
```

With `gbt-auth-login` (or `gbt-auth-register`) there is nothing more to wire: the page shows the enrolment,
hands the session to `AuthPort.setToken` and emits `loggedIn` (`registered`). Its footer link is projected
by the application, for example with the router:

```html
<gbt-auth-login (loggedIn)="router.navigateByUrl('/')">
  <img auth-logo src="/logo.svg" alt="Acme" />
  <a gbtButton variant="link" gbtAuthFooterLink routerLink="/register">Create an account</a>
</gbt-auth-login>
```

A page of your own embeds the component in the panel and handles its outputs:

```ts
@Component({
  selector: 'app-setup-mfa',
  imports: [AuthPanel, MfaEnrollment],
  template: `
    <gbt-auth-panel wide heading="Two-factor authentication">
      <img auth-logo src="/logo.svg" alt="Acme" />
      <gbt-mfa-enrollment
        [mfaToken]="mfaToken"
        [passkeysAvailable]="passkeysAvailable"
        (completed)="done($event)"
        (cancelled)="router.navigateByUrl('/login')"
        (expired)="router.navigateByUrl('/login')"
      />
    </gbt-auth-panel>
  `,
})
export class SetupMfaPage {
  protected readonly router = inject(Router)
  private readonly auth = inject(AUTH_PORT)
  // From the password step (LoginResponse.mfaToken) and AuthConfig.passkeysAvailable.
  mfaToken = '…'
  passkeysAvailable = false

  done(sessionToken: string): void {
    this.auth.setToken(sessionToken)
    this.router.navigateByUrl('/')
  }
}
```

The login and register pages do not forward a `labels` input to the enrolment: localise it there with
`provideAuthLabels({ mfaEnrollment })`.

## Accessibility

See [AUDIT.md](AUDIT.md).
