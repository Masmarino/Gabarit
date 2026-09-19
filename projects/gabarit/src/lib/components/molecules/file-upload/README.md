# FileUpload

Select one or more files by drag-and-drop or by clicking, with a
visual selected-files list (each removable) and optional size
validation. Integrates with Angular forms via `ControlValueAccessor`
(`File[]`), like `Select`.

**Selector**: `gbt-file-upload`

## Inputs

| Input             | Type                                          | Default                                              | Role                                                       |
| ------------------ | ------------------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------- |
| `label`           | `string`                                         | `''`                                                     | Field label.                                                     |
| `multiple`        | `boolean`                                        | `false`                                                   | Accept more than one file. Selecting again replaces the current file when `false`. |
| `accept`          | `string`                                         | `''`                                                       | Native `accept` attribute (e.g. `'image/*'`) — a hint to the OS picker and drag source, not enforced by this component. |
| `maxSizeMb`       | `number \| null`                                  | `null`                                                     | Rejects (and reports) a file larger than this, in megabytes.    |
| `disabled`        | `boolean`                                        | `false`                                                     | —                                                                 |
| `errorMessage`    | `string \| null`                                  | `null`                                                       | Rendered as `role="alert"` below the file list.                  |
| `dropLabel`       | `string`                                         | `'Drag and drop a file here, or click to browse'`             | The dropzone's own instructional text.                            |
| `removeLabel`     | `(name: string) => string`                       | `` (name) => `Remove ${name}` ``                              | Accessible name of each file's remove button.                    |
| `oversizeMessage` | `(name: string, maxSizeMb: number) => string`    | `` (name, max) => `${name} exceeds ${max} MB and was not added.` `` | Message shown per rejected file.                                  |

## Example

```html
<gbt-file-upload label="Justificatif de domicile" [maxSizeMb]="5" [formControl]="proof" />
```

## Behavior

- The whole dropzone is one `<button>` — clicking anywhere in it (not
  just a nested "browse" link) opens the native file picker via a
  hidden `<input type="file">`. A `<button>` can't contain another
  interactive element, so there's no separate clickable "browse" word
  inside it; the entire zone is the control.
- The hidden native input is `tabindex="-1"` and `aria-hidden="true"`
  — it's a pure trigger mechanism, triggered programmatically via
  `.click()` from the visible button, never meant to be independently
  focused or perceived.
- Drag-and-drop has no direct keyboard equivalent, but every capability
  it offers is also reachable via the same button (click → native
  picker), so keyboard users lose nothing.
- A rejected (oversized) file is never silently dropped — its name and
  reason appear in a `role="alert"` list, replaced (not appended to)
  on the next selection attempt.
