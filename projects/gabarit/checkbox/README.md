# Checkbox

Checkbox, integrated with reactive forms and `ngModel`.

**Selector**: `gbt-checkbox`

Implements `ControlValueAccessor` — driven via `formControlName` or
`[(ngModel)]`. Without Angular forms, use the `checked` model
(`[checked]` + `(checkedChange)`, or `[(checked)]`).

## Inputs

| Input      | Type              | Default                      | Role                                                                                                |
| ---------- | ----------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `id`       | `string`          | generated (`gbt-checkbox-N`) | DOM id, associates the `<label>`.                                                                   |
| `label`    | `string`          | `''`                         | Visible label.                                                                                      |
| `disabled` | `boolean`         | `false`                      | Disables the checkbox (cumulative with the form's disabled state).                                  |
| `hint`     | `string`          | `''`                         | Help text under the label, linked to the input with `aria-describedby`.                             |
| `checked`  | `boolean` (model) | `false`                      | Checked state for use **without** Angular forms: `[checked]` sets it, `(checkedChange)` follows it. |

## Outputs

| Output          | Type      | Role                                             |
| --------------- | --------- | ------------------------------------------------ |
| `checkedChange` | `boolean` | Emitted when the user toggles the box (`model`). |

## Example

```html
<gbt-checkbox label="Se souvenir de moi" formControlName="remember" />
```

## Without Angular forms (`checked` model)

```html
<gbt-checkbox label="Push" [checked]="selected().has('push')" (checkedChange)="toggle('push')" />
```

The native box reflects the bound value, and the user's toggle is reported
through `checkedChange` — the pattern for a list of options whose state lives
in a signal or a `Set`. For a whole group use [`gbt-checkbox-group`](../checkbox-group/README.md).
`checked` and the form value are the same state: do not bind both.
Set it with a binding, `[checked]="true"`: a bare `checked` attribute is not a boolean
attribute here (the model is not transformed) and fails strict templates.

## Hint

Without `hint` nothing is added. With it, the host becomes a block and the text
shows under the label, aligned with the label text; it is a `<p>` outside the
`<label>`, so it describes the checkbox (`aria-describedby`) without joining its name.
