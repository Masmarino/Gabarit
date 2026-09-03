# Select

Dropdown list, single or multiple selection. Integrated with reactive
forms and `ngModel`.

**Selector**: `gbt-select`

## Inputs

| Input                | Type                        | Default                    | Role                                                            |
| -------------------- | --------------------------- | -------------------------- | --------------------------------------------------------------- |
| `id`                 | `string`                    | generated (`gbt-select-N`) | DOM id, associates the `<label>`.                               |
| `label`              | `string`                    | `''`                       | Visible label.                                                  |
| `options`            | `SelectOption<T>[]`         | required                   | `{ value, label, icon? }` — the offered options.                |
| `multiple`           | `boolean`                   | `false`                    | Multiple selection.                                             |
| `placeholder`        | `string`                    | `'Select…'`                | Text shown with no selection.                                   |
| `disabled`           | `boolean`                   | `false`                    | Disables the field.                                             |
| `required`           | `boolean`                   | `false`                    | Native `required` attribute.                                    |
| `errorMessage`       | `string \| null`            | `null`                     | Error message shown under the field.                            |
| `selectedCountLabel` | `(count: number) => string` | `` `${count} selected` ``  | Trigger label in multiple-selection mode, beyond a single item. |

## Example

```html
<gbt-select
  label="Rôle"
  [options]="[{ value: 'read', label: 'Lecture' }, { value: 'admin', label: 'Administration' }]"
  formControlName="role"
/>
```
