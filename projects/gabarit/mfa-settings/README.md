# MfaSettings

The account settings card of the signed-in user's **authenticator app** (TOTP) and **backup codes**.
It sits next to [`gbt-passkey-settings`](../passkey-settings/passkey-settings.ts): a second factor is
an app OR a passkey, so this card reads both (the app is only "Optional" once a passkey exists). It
talks to the application's backend through the `MFA_PORT` it injects, and signals the one thing the
application must act on, a revoked session, through an output.

**Selector**: `gbt-mfa-settings`

## States

| State        | What shows                                                                                                                                                                                                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| loading      | Skeleton rows (`aria-busy`) and, beside them (never inside the busy block, which would keep it quiet), a visually hidden `role="status"` ("Loading two-factor authentication…"), while `status()` runs.                                                                                                                                            |
| failed       | An error alert (`role="alert"`) with a **Retry** button that reads the status again.                                                                                                                                                                                                                                                               |
| app on       | "App configured" with an **On** badge; the backup codes left (warning-toned, with an icon and a sentence, from `lowCodesThreshold` down) and **Regenerate backup codes**; **Reset** (the app is the only factor) or **Remove** (a passkey remains). Each action opens an inline current-password prompt.                                           |
| passkey only | "No app configured" with an **Optional** badge and **Add an app**; the backup codes row as above; no reset.                                                                                                                                                                                                                                        |
| no factor    | Defensive (a live session without a factor should not exist: removing the last one signs the user out): a static warning that MFA is required and a primary **Set up now**.                                                                                                                                                                        |
| enrolling    | After the password: the QR ([`gbt-totp-qr`](../mfa-enrollment/totp-qr/totp-qr.ts)), the secret as text, a 6-digit code field, **Activate** and **Cancel**.                                                                                                                                                                                                        |
| codes        | After an enrolment or a regeneration: the ten backup codes, shown **once** ([`gbt-backup-codes`](../mfa-enrollment/backup-codes/backup-codes.ts): copy, download, acknowledgement), a static "Do not leave this page" warning until acknowledged, and **Done** (disabled until acknowledged; it returns to the ready state with the new count, without a reload). |
| revoked      | After a successful reset/removal (the server revoked this session): an inert card, only "You have been signed out" (`signedOut`), no action left. `sessionRevoked` fires too: the card cannot clear the application's session itself.                                                                                                              |

## Inputs

| Input               | Type                         | Default | Role                                                                                                                                         |
| ------------------- | ---------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `labels`            | `Partial<MfaSettingsLabels>` | `{}`    | The strings to change, string by string, over `provideAuthLabels({ mfaSettings })` and the English defaults (`DEFAULT_MFA_SETTINGS_LABELS`). |
| `lowCodesThreshold` | `number`                     | `3`     | From this many backup codes left (inclusive), the count turns to a warning asking the user to regenerate them.                               |

## Outputs

| Output           | Payload | Role                                                                                                                                                                                                                                                              |
| ---------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionRevoked` | `void`  | The app was reset/removed (`MfaPort.disable` succeeded) and the server revoked this very session with it. Sign out locally and go to the sign-in page (a new enrolment is forced there unless a passkey remains). Bind it: the card only turns inert (`revoked`). |

## Slots

None.

## Dependencies (DI)

| Token              | Required | Role                                                                                                                                                                                                              |
| ------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MFA_PORT`         | yes      | The application's `MfaPort`: `status`, `enroll`, `confirm`, `regenerate`, `disable` are used here. A wrong current password must be a **400** `{ "error": "current password is incorrect" }` (see `mfa.port.ts`). |
| `TOTP_QR_RENDERER` | no       | Draws the QR. Without one, `gbt-totp-qr` shows its fallback text and the secret to type by hand.                                                                                                                  |
| `AUTH_LABELS`      | no       | The kit's strings for the whole application (`provideAuthLabels`). The nested backup codes and QR take theirs from here (`backupCodes`, `totpQr`), not from this card's `labels`.                                 |
| `MfaSettingsState` | (root)   | What this card and `gbt-passkey-settings` share: the factors as last read or changed, which card owns the open form, whether the app is mid-flow. Root-provided; provide it on the page to scope it.              |

## Behaviour

- **One password prompt at a time**, in place of the button that opened it: opening another drops the
  first one's password. Opening one claims the form in `MfaSettingsState`; when the passkeys card
  claims it, this card closes its prompt (and its dialog) quietly. The enrolment and the codes step
  are never interrupted (the passkeys card holds back instead, through `appFlowActive`).
- **At most one primary button** per state. The reset/remove prompt submits with a quiet
  **Continue**; the one destructive action is in the confirmation dialog
  (`gbt-confirm-danger-modal`), which sends the request. A second confirm while it runs is ignored.
- **Failures**: an empty field or a wrong password/code is said under the field
  (`Enter your password`, `Incorrect password`, `Enter the 6-digit code from your app`,
  `Incorrect code`, the refused code being emptied); a 429 or any other failure is an alert above
  the form, which stays. The backend's own text is never shown.
- **Secrets**: the password lives only until its request answers (or the prompt closes); the secret,
  the otpauth URL, the code and the backup codes are dropped as soon as they did their job, and
  everything is emptied when the component is destroyed. Spaces in the typed code are removed.
- **Codes shown once**: while they are on screen and not acknowledged, closing or reloading the tab
  asks the browser to confirm (`beforeunload` on the host document's window); the listener is
  removed once they are acknowledged or the card is destroyed.
- **Focus** follows the state: the password or code field when it opens or after a refusal, the
  instruction line (`tabindex="-1"`) of the scan and codes steps and of the ready state after
  **Done**, the opener after **Cancel**.
- After a confirmed enrolment the card tells `MfaSettingsState` (`totpConfirmed`), so the passkeys card
  knows deleting a key no longer removes the last factor; a passkey added by the passkeys card makes
  the mandatory warning give way to "No app configured" at once.

## Example

```ts
// app.config.ts
import { HttpClient, provideHttpClient } from '@angular/common/http'
import { type ApplicationConfig, Injectable, inject } from '@angular/core'
import {
  type BackupCodesResult,
  MFA_PORT,
  type MfaPort,
  type MfaStatus,
  TOTP_QR_RENDERER,
  type TotpEnrollment,
  type TotpQrRenderOptions,
  provideAuthLabels,
} from '@masmarino/gabarit'

@Injectable({ providedIn: 'root' })
export class HttpMfaPort implements MfaPort {
  private http = inject(HttpClient)
  status = () => this.http.get<MfaStatus>('/api/me/mfa')
  enroll = (currentPassword: string) =>
    this.http.post<TotpEnrollment>('/api/me/mfa/totp/enroll', { currentPassword })
  confirm = (code: string) =>
    this.http.post<BackupCodesResult>('/api/me/mfa/totp/confirm', { code })
  regenerate = (currentPassword: string) =>
    this.http.post<BackupCodesResult>('/api/me/mfa/backup-codes/regenerate', { currentPassword })
  disable = (currentPassword: string) =>
    this.http.post<void>('/api/me/mfa/totp/disable', { currentPassword })
  // … and the passkey calls used by gbt-passkey-settings.
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    { provide: MFA_PORT, useExisting: HttpMfaPort },
    {
      provide: TOTP_QR_RENDERER,
      useValue: (text: string, options: TotpQrRenderOptions) =>
        import('qrcode').then((qr) => qr.toDataURL(text, options)),
    },
    // Optional: localise the whole kit once.
    provideAuthLabels({
      mfaSettings: { heading: "Application d'authentification", enabled: 'Activée' /* … */ },
      backupCodes: { copy: 'Copier les codes' /* … */ },
    }),
  ],
}
```

```ts
// security-page.ts
import { Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import { MfaSettings, PasskeySettings } from '@masmarino/gabarit'
import { AuthService } from './auth.service' // the application's own session holder

@Component({
  imports: [MfaSettings, PasskeySettings],
  template: `
    <gbt-mfa-settings [lowCodesThreshold]="3" (sessionRevoked)="signedOut()" />
    <gbt-passkey-settings (sessionRevoked)="signedOut()" />
  `,
})
export class SecurityPage {
  private auth = inject(AuthService)
  private router = inject(Router)

  /** The server revoked the session with the factor: forget it locally and sign in again. */
  signedOut() {
    this.auth.logout()
    this.router.navigateByUrl('/login')
  }
}
```

## Accessibility

See [AUDIT.md](AUDIT.md).
