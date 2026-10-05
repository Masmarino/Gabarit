# RGAA Audit — TotpQr

Verified against RGAA 4.1.2 by the unit tests (`totp-qr.spec.ts`, including axe-core runs on the
drawn, drawing and fallback states), by the Storybook stories (`Auth/TotpQr`: `Default`,
`QrUnavailable`, `NoRenderer`, `Drawing`, `SecretCopied`, `SecretCopyFailed`, `Dark`, `Phone`,
`Localised`) and by code review (`totp-qr.ts`, `totp-qr.html`, `totp-qr.scss`). The copy widget
itself is `gbt-copy-field` (see its own audit).

## Checklist

| Criterion | Short title                              | Verification                                                                                                                                                                                                                                                                           | Result                  |
| --------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1.1 / 1.3 | Image has a relevant text alternative    | The QR is an `<img>` named "QR code to scan with your authenticator app" (`imageAlt`, spec; `Localised` finds it by role and French name). The information it carries is also on the page as text: the secret (spec).                                                                  | Compliant               |
| 1.9 / 1.8 | Information not only in an image         | The secret is always shown as text under the QR, and alone in the fallback (spec), so a user who cannot scan can type it.                                                                                                                                                              | Compliant               |
| 7.1       | Scripts compatible with AT               | While the QR is drawn, the frame is `aria-busy="true"` (spec, `Drawing`). The fallback is a `role="status"` paragraph (spec). The copy status is a polite live region, empty before any copy, then "Copied" or "Copy failed, key selected" (spec, `SecretCopied`, `SecretCopyFailed`). | Compliant               |
| 7.3       | Keyboard operable                        | The copy button is a native `<button>` named by `copyLabel` (spec).                                                                                                                                                                                                                    | Compliant               |
| 7.1       | Copy failure has a way out               | With no clipboard, the secret is selected for a manual copy and the status says so (spec checks the selection).                                                                                                                                                                        | Compliant               |
| 3.1       | Information not conveyed by colour alone | The fallback's warning tint comes with its text.                                                                                                                                                                                                                                       | Compliant               |
| 3.2       | Text contrast                            | Theme tokens (`--text-secondary`, the warning pair `--color-warning-text` on `--color-warning-bg`); the QR frame is a literal white on both themes on purpose (scannability). `Dark` renders the dark theme; contrast is not measured by the specs (axe's `color-contrast` is off).    | Visually checked        |
| —         | Target size (WCAG 2.2 2.5.8)             | The 32 px icon-only copy button gets a 44 px hit area through an invisible `::after` (code review; not measured by a story).                                                                                                                                                           | Compliant (code review) |
| 10.11     | Reflow                                   | The frame is at most 14rem and shrinks with its column; the secret wraps (`gbt-copy-field`). `Phone` (375 px column) checks there is no horizontal overflow.                                                                                                                           | Compliant               |

axe-core (WCAG 2.0/2.1/2.2 A and AA rules, contrast excepted) reports no violation with the QR,
while it is drawn, and in the fallback.

## Externalized strings

Every string is in `TotpQrLabels` (English defaults in `DEFAULT_TOTP_QR_LABELS`): `fallback`,
`imageAlt`, `secretLabel`, `fallbackSecretLabel`, `copyLabel`, `copied`, `copyFailed`. They are
changed for the whole application with `provideAuthLabels({ totpQr })` and per instance with the
`labels` input, which wins (both verified by the spec). The `Localised` story renders them in French.
