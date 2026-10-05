# TagInput

Freely-typed values, each shown as a removable `Tag` — for values the
consumer invents (custom labels, email recipients), not chosen from a
predefined list. Distinct from `Select`'s chips, which pick among
fixed options. Integrates with Angular forms via
`ControlValueAccessor` (`string[]`), like `Select`.

**Selector**: `gbt-tag-input`

## Inputs

| Input             | Type                          | Default                       | Role                                                       |
| ------------------ | ------------------------------- | -------------------------------- | --------------------------------------------------------------- |
| `label`           | `string`                        | `''`                               | Field label.                                                      |
| `placeholder`     | `string`                        | `''`                               | Shown only while the list of tags is empty.                       |
| `disabled`        | `boolean`                       | `false`                             | —                                                                  |
| `errorMessage`    | `string \| null`                  | `null`                               | Rendered as `role="alert"` below the field.                       |
| `separatorKeys`   | `string[]`                      | `['Enter', ',']`                     | Keys that commit the current text as a new tag.                   |
| `allowDuplicates` | `boolean`                       | `false`                              | Silently ignores a duplicate value when `false`.                  |
| `color`           | `string`                        | `'#6b7280'`                          | Background color passed to each `Tag` (a 6-digit hex, per `Tag`'s own contract). |
| `removeLabel`     | `(value: string) => string`     | `` (v) => `Remove ${v}` ``            | Accessible name of each tag's remove button.                      |

## Example

```html
<gbt-tag-input label="Labels" placeholder="Add a label…" [formControl]="labels" />
```

## Behavior

- Typing text and pressing a `separatorKeys` key (Enter or comma by
  default) commits it as a new tag and clears the field. A pending
  draft is also committed on blur, so nothing is silently lost if the
  user clicks away instead of pressing Enter.
- `Backspace` on an *empty* field removes the last tag — the same
  convenience most tag/recipient fields offer (Gmail's "To" field,
  GitHub's label picker), not triggered while there's still text to
  delete normally.
- Clicking anywhere in the field (not just precisely on the thin text
  input) focuses it — a documented lint exception, since the real
  keyboard equivalent (Tab to the input directly) already exists; see
  `AUDIT.md`.
- Reuses `gbt-tag` for display, inheriting its automatic
  readable-text-color computation — no separate contrast logic here.
