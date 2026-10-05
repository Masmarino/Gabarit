# CopyField

A read-only value in monospace with a copy button beside it: a clone URL, a webhook URL, an activation
link, a token that is shown in full.

**Selector**: `gbt-copy-field`. Built on [`gbt-copy-button`](../copy-button/README.md) (Clipboard API,
`execCommand` fallback, live-region confirmation). For a secret that must stay masked until asked for,
use [`gbt-secret-reveal`](../secret-reveal/README.md).

## Inputs

| Input        | Type                               | Default                         | Role                                                                                        |
| ------------ | ---------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| `value`      | `string`                           | —                               | Required. The value shown and copied.                                                       |
| `label`      | `string \| null`                   | `null`                          | Visible label above the field. It also names the group (`role="group"`, `aria-labelledby`). |
| `copyLabel`  | `string`                           | `'Copy'`                        | Accessible name of the copy button. Say what is copied ("Copy the clone URL").              |
| `copiedText` | `string`                           | `'Copied'`                      | Message shown and announced after a successful copy.                                        |
| `failedText` | `string`                           | `'Copy failed, value selected'` | Message when the copy is refused; the value is then selected for a manual Ctrl+C.           |
| `feedbackMs` | `number`                           | `2000`                          | How long the confirmation stays (a failure stays twice as long).                            |
| `feedback`   | `'bubble' \| 'inline' \| 'hidden'` | `'bubble'`                      | Where the confirmation is drawn (see `gbt-copy-button`).                                    |
| `wrapAt`     | `RegExp \| null`                   | after each `/` (not in `//`)    | Where the value may wrap: it is cut after each match, with a `<wbr>`. `null`: no hint.      |

## Outputs

| Output       | Payload  | Role                                            |
| ------------ | -------- | ----------------------------------------------- |
| `copied`     | `string` | The copied value.                               |
| `copyFailed` | `void`   | Neither copy API worked; the value is selected. |

## Behaviour

- The value **wraps** instead of scrolling: it stays readable in a 240 px aside or on a phone with no scroll
  region to reach by keyboard. Break opportunities follow `wrapAt`; a segment too long for a line breaks
  anywhere.
- One click selects the whole value (`user-select: all`).
- The value is cut **after** each match of `wrapAt` (a `<wbr>` is inserted); the text itself is never altered, so a
  capturing group or a separator such as `/\//` cannot drop or duplicate characters.
- `COPY_FIELD_WRAP_AT` (the default pattern) is exported by the component file if you want to extend it.

## Example

```html
<gbt-copy-field
  label="Clone with HTTPS"
  copyLabel="Copy the clone URL"
  failedText="Copy failed, press Ctrl+C"
  [value]="repo.cloneUrl"
  (copied)="toast.show('URL copied', 'success')"
/>
```

## Accessibility

See [AUDIT.md](AUDIT.md). Localise `label`, `copyLabel`, `copiedText` and `failedText`.
