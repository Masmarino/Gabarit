# Checkbox

Checkbox, integrated with reactive forms and `ngModel`.

**Selector**: `gbt-checkbox`

Implements `ControlValueAccessor` — driven via `formControlName` or
`[(ngModel)]`, never by setting `checked` directly.

## Inputs

| Input      | Type      | Default                      | Role                                                               |
| ---------- | --------- | ---------------------------- | ------------------------------------------------------------------ |
| `id`       | `string`  | generated (`gbt-checkbox-N`) | DOM id, associates the `<label>`.                                  |
| `label`    | `string`  | `''`                         | Visible label.                                                     |
| `disabled` | `boolean` | `false`                      | Disables the checkbox (cumulative with the form's disabled state). |

## Example

```html
<gbt-checkbox label="Se souvenir de moi" formControlName="remember" />
```
