# Select

Dropdown list, single or multiple selection. Integrated with reactive
forms and `ngModel`.

**Selector**: `gbt-select`

## Inputs

| Input                | Type                        | Default                    | Role                                                            |
| -------------------- | --------------------------- | -------------------------- | --------------------------------------------------------------- |
| `id`                 | `string`                    | generated (`gbt-select-N`) | DOM id, associates the `<label>`.                               |
| `label`              | `string`                    | `''`                       | Visible label.                                                  |
| `size`               | `'md' \| 'sm'`               | `'md'`                     | `'sm'` shrinks the trigger to 32px tall — for compact contexts like a table's rows-per-page selector (see `Pagination`). |
| `options`            | `SelectOption<T>[]`         | required                   | `{ value, label, icon?, color? }` — the offered options.         |
| `multiple`           | `boolean`                   | `false`                    | Multiple selection.                                             |
| `chips`              | `boolean`                   | `false`                    | When `true` together with `multiple`, renders selected options as removable colored chips below the trigger instead of a collapsed count label. Each option's `color` field sets its chip color (a 6-digit hex — see `Tag`); options without one default to a neutral grey. When the field is disabled the chips stay visible but lose their remove buttons. |
| `placeholder`        | `string`                    | `'Select…'`                | Text shown with no selection.                                   |
| `disabled`           | `boolean`                   | `false`                    | Disables the field.                                             |
| `required`           | `boolean`                   | `false`                    | Native `required` attribute.                                    |
| `errorMessage`       | `string \| null`            | `null`                     | Error message shown under the field.                            |
| `selectedCountLabel` | `(count: number) => string` | `` `${count} selected` ``  | Trigger label in multiple-selection mode, beyond a single item. In `chips` mode the trigger shows the placeholder instead, and this string is what the screen-reader status region announces as chips are added or removed. |
| `chipRemoveLabel`    | `(label: string) => string` | `` `Remove ${label}` ``    | Accessible label of each chip's remove button, in `chips` mode. |

## Example

```html
<gbt-select
  label="Rôle"
  [options]="[{ value: 'read', label: 'Lecture' }, { value: 'admin', label: 'Administration' }]"
  formControlName="role"
/>
```
