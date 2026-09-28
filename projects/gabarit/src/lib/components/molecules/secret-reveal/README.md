# SecretReveal

A secret shown once or on demand: an API token, a runner registration token, a recovery code. Masked
until the user shows it; copies whether it is shown or not.

**Selector**: `gbt-secret-reveal`. Built on [`gbt-button`](../../atoms/button/README.md) (show / hide) and
[`gbt-copy-button`](../../atoms/copy-button/README.md).

## Inputs

| Input         | Type                               | Default                                    | Role                                                                                        |
| ------------- | ---------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `value`       | `string`                           | —                                          | Required. The secret.                                                                       |
| `revealed`    | `boolean` (model)                  | `false`                                    | Whether the secret is shown; two-way `[(revealed)]`. Start it `true` for a one-time secret. |
| `label`       | `string \| null`                   | `null`                                     | Visible label above the field; it also names the group.                                     |
| `showLabel`   | `string`                           | `'Show the secret'`                        | Accessible name of the toggle while masked.                                                 |
| `hideLabel`   | `string`                           | `'Hide the secret'`                        | Accessible name of the toggle while shown.                                                  |
| `hiddenLabel` | `string`                           | `'Secret hidden'`                          | Read by screen readers in place of the bullets.                                             |
| `copyLabel`   | `string`                           | `'Copy the secret'`                        | Accessible name of the copy button.                                                         |
| `copiedText`  | `string`                           | `'Copied'`                                 | Confirmation after a copy.                                                                  |
| `failedText`  | `string`                           | `'Copy failed, secret shown and selected'` | Message when the copy is refused.                                                           |
| `feedbackMs`  | `number`                           | `2000`                                     | How long the confirmation stays.                                                            |
| `feedback`    | `'bubble' \| 'inline' \| 'hidden'` | `'bubble'`                                 | Where the confirmation is drawn.                                                            |
| `maskLength`  | `number`                           | `24`                                       | Bullets drawn while masked (fixed: the real length is not disclosed).                       |

## Outputs

| Output           | Payload   | Role                                                                |
| ---------------- | --------- | ------------------------------------------------------------------- |
| `copied`         | `string`  | The copied secret.                                                  |
| `copyFailed`     | `void`    | Neither copy API worked: the secret has been revealed and selected. |
| `revealedChange` | `boolean` | The user showed or hid the secret (the model's change event).       |

## Behaviour

- **Masked, the secret is not in the DOM** (only bullets, `aria-hidden`, and a visually hidden `hiddenLabel`):
  it cannot be read by assistive technology, found by in-page search or taken from a DOM snapshot.
- The copy button copies the real secret without showing it.
- A refused copy (plain-HTTP page, permissions) reveals the secret and selects it for a manual Ctrl+C.
- The toggle carries `aria-controls` (the value element) and swaps its accessible name; it is not also
  `aria-pressed` (one signal, not two).

## Example

```html
<gbt-secret-reveal
  label="Runner token"
  showLabel="Show the token"
  hideLabel="Hide the token"
  hiddenLabel="Token hidden"
  copyLabel="Copy the token"
  [value]="runner.token"
  [revealed]="true"
  (copied)="tokenCopied.set(true)"
/>
```

## Accessibility

See [AUDIT.md](./AUDIT.md). Localise every string input.
