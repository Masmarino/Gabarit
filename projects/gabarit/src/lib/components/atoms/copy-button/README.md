# CopyButton

A button that copies a value to the clipboard and says so. It replaces the five hand-written
"copy + Copied for 2 s + select the text on failure" implementations of an application (clone box,
recovery codes, file view, one-time token, row menu).

**Selector**: `gbt-copy-button`. Built on [`gbt-button`](../button/README.md); the clipboard logic
(`copyToClipboard`, `ClipboardFeedback`) lives in `clipboard.ts` and is shared with
[`gbt-copy-field`](../../molecules/copy-field/README.md), [`gbt-secret-reveal`](../../molecules/secret-reveal/README.md)
and [`gbt-badge`](../badge/README.md)'s `copyable` input.

## Inputs

| Input          | Type                               | Default         | Role                                                                                                |
| -------------- | ---------------------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| `value`        | `string \| (() => string)`         | `''`            | The text to copy. A function is called when the button is pressed (a big file body, a fresh token). |
| `text`         | `string`                           | `''`            | Visible label. Empty: an icon-only square.                                                          |
| `ariaLabel`    | `string \| null`                   | `null`          | Accessible name. Defaults to `Copy` when icon-only and to `text` otherwise.                         |
| `copiedText`   | `string`                           | `'Copied'`      | Message shown and announced after a successful copy.                                                |
| `failedText`   | `string`                           | `'Copy failed'` | Message shown and announced when the copy is refused.                                               |
| `feedbackMs`   | `number`                           | `2000`          | How long the "copied" message stays. A failure message stays twice as long.                         |
| `variant`      | `ButtonVariant`                    | `'secondary'`   | Same values as `gbt-button`.                                                                        |
| `size`         | `ButtonSize`                       | `'small'`       | `small \| medium \| large`.                                                                         |
| `icon`         | `string`                           | `'copy'`        | Glyph of the idle button (registered icon name; `copy` is built in).                                |
| `disabled`     | `boolean`                          | `false`         |                                                                                                     |
| `feedback`     | `'bubble' \| 'inline' \| 'hidden'` | `'bubble'`      | Where the message is drawn (see below).                                                             |
| `selectTarget` | `HTMLElement \| null`              | `null`          | Selected when the copy fails, so the user can copy by hand with Ctrl+C / Cmd+C.                     |

## Outputs

| Output       | Payload  | Role                                                                                                         |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| `copied`     | `string` | The text that was copied.                                                                                    |
| `copyFailed` | `void`   | Neither the Clipboard API nor the fallback could copy (the text is shown selected if `selectTarget` is set). |

## How it copies

1. `navigator.clipboard.writeText` (secure contexts only: HTTPS or `localhost`).
2. Otherwise, or when the write is refused, `document.execCommand('copy')` on a throw-away textarea
   (the focus and the selection of the page are restored). This is what makes a **plain-HTTP
   self-hosted instance** work.
3. Otherwise `copyFailed` is emitted, the failure message shows and `selectTarget` is selected.

No browser API is read until the button is pressed, so rendering (SSR, jsdom) never touches
`navigator.clipboard`. A write that settles after the component is destroyed schedules nothing and
emits nothing.

## Stale messages

A "Copied" message belongs to the text that was copied: when `value` changes to a different **string** the message is
dropped (a function value is left alone, since a template may hand out a new closure on every change detection).
`reset()` (a public method) drops it on demand; `gbt-secret-reveal` calls it when the secret is hidden.

The legacy fallback puts its temporary textarea inside the trigger's `dialog` / `[role="dialog"]` when there is
one: a native modal `<dialog>` makes the rest of the page inert, and a textarea outside it could not be focused.

## Feedback

The accessible name never changes. The outcome is told by:

- a polite `role="status"` region that is **always in the DOM** (a live region only announces changes if
  it was already rendered), holding `copiedText` or `failedText`;
- the icon: `copy`, then `check` (or `alert-circle` on failure), so it is never colour alone;
- visually, according to `feedback`: `bubble` is a small pill floating above the button, right-aligned
  (clipped by an ancestor with `overflow: hidden`: use `inline` there); `inline` is the same message in
  the flow after the button; `hidden` is for screen readers only.

The host carries `data-status="idle | copied | failed"` for styling.

## Example

```html
<code #url>{{ cloneUrl }}</code>
<gbt-copy-button
  [value]="cloneUrl"
  ariaLabel="Copy the clone URL"
  copiedText="Copied"
  failedText="Copy failed, press Ctrl+C"
  [selectTarget]="url"
  (copied)="analytics.track('clone-url-copied')"
/>

<!-- A label, and a value produced only when needed -->
<gbt-copy-button text="Copy the file" [value]="() => file().content" feedback="inline" />
```

## Accessibility

See [AUDIT.md](./AUDIT.md). The icon-only button needs (and gets) a name; localise `ariaLabel`,
`copiedText` and `failedText` (the defaults are English).
