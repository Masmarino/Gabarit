# TotpQr

The QR code of an authenticator app's `otpauth://` URL and, under it, the same secret as text with a
copy button (to type by hand, and the only thing left when the QR cannot be drawn). Used by
`gbt-mfa-enrollment` and `gbt-mfa-settings`; usable alone.

Gabarit ships **no QR encoder** (no dependency for one screen): the application provides one under
`TOTP_QR_RENDERER`. Without it the component shows its fallback text and the secret.

> **Security: the renderer receives the user's TOTP secret.** It is called with the full
> `otpauth://…?secret=…` URL, raw secret included: whoever sees that text can generate the user's
> codes forever. The renderer **must encode locally**, in the browser (a bundled library such as
> `qrcode`): **no network call, never a hosted or third-party QR service** (a
> `https://…?data=otpauth…` image URL hands every user's second factor to that service and its
> access logs). It **must not log** the text, nor put it anywhere else (analytics, error reports,
> storage). Answer a `data:` or `blob:` URL.

**Selector**: `gbt-totp-qr`

## Inputs

| Input        | Type                    | Default    | Role                                                                              |
| ------------ | ----------------------- | ---------- | --------------------------------------------------------------------------------- |
| `otpauthUrl` | `string`                | (required) | The `otpauth://` URL the QR encodes. A new URL draws a new QR.                    |
| `secret`     | `string`                | (required) | The base32 secret, shown as text (a `gbt-copy-field`) with a copy button.         |
| `labels`     | `Partial<TotpQrLabels>` | `{}`       | Strings to change, over `provideAuthLabels({ totpQr })` and the English defaults. |

## Outputs

None.

## Injection token

| Token              | Type                                                              | Role                                                                                                                                                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TOTP_QR_RENDERER` | `(text: string, options: TotpQrRenderOptions) => Promise<string>` | Draws `text` as a QR and resolves an image URL (a `data:` URL). Called with the `otpauth://` URL (**the raw TOTP secret: encode locally, no network, no logging**, see above) and `{ width: 448, margin: 1, errorCorrectionLevel: 'M' }` (448 px: twice the drawn size). Optional. |

## Behaviour

- **Drawing**: while the renderer works, an empty frame of the final size (224 px) is `aria-busy`,
  so nothing jumps when the image arrives.
- **Drawn**: the image, named by `imageAlt`, on a white frame that stays white on the dark theme (a
  camera needs dark modules on a light ground; the padding is the quiet zone). Above the secret:
  `secretLabel`.
- **Fallback** (no renderer provided, or the renderer rejects or throws): no frame; a warning
  paragraph (`role="status"`, `fallback`) and the secret under `fallbackSecretLabel`.
- **A newer URL wins**: an older render that answers (or fails) after a newer URL was set is ignored.
- **Copy**: the copy button copies the raw secret and says `copied` in a polite status; when the
  clipboard is refused or missing (plain HTTP), the secret is selected for Ctrl+C and the status
  says `copyFailed`. The icon-only button has a 44 px hit area.

## Example

```ts
// app.config.ts — the `qrcode` package, loaded only when a QR is drawn
import {
  AUTH_PORT,
  MFA_PORT,
  TOTP_QR_RENDERER,
  type TotpQrRenderOptions,
  provideAuthLabels,
} from '@masmarino/gabarit'

providers: [
  { provide: AUTH_PORT, useClass: HttpAuthPort }, // for gbt-mfa-enrollment
  { provide: MFA_PORT, useClass: HttpMfaPort }, // for gbt-mfa-settings
  {
    provide: TOTP_QR_RENDERER,
    useValue: (text: string, options: TotpQrRenderOptions) =>
      import('qrcode').then((qr) => qr.toDataURL(text, options)),
  },
  provideAuthLabels({ totpQr: { copyLabel: 'Copier la clé de configuration' } }),
]
```

```html
<gbt-totp-qr [otpauthUrl]="enrollment.otpauthUrl" [secret]="enrollment.secret" />

<!-- One string changed for this screen only -->
<gbt-totp-qr [otpauthUrl]="url" [secret]="secret" [labels]="{ secretLabel: 'Or type this key' }" />
```

## Accessibility

See [AUDIT.md](./AUDIT.md).
