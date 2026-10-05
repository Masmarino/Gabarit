# Select

Dropdown list, single or multiple selection. Integrated with reactive
forms and `ngModel`.

**Selector**: `gbt-select`

## Inputs

| Input                | Type                        | Default                    | Role                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | --------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                 | `string`                    | generated (`gbt-select-N`) | DOM id, associates the `<label>`.                                                                                                                                                                                                                                                                                                                            |
| `label`              | `string`                    | `''`                       | Visible label.                                                                                                                                                                                                                                                                                                                                               |
| `hint`               | `string`                    | `''`                       | Help text under the field, linked to the trigger with `aria-describedby`. Hidden (and unlinked) while an error shows.                                                                                                                                                                                                                                        |
| `hideLabel`          | `boolean`                   | `false`                    | Hides the label visually; it stays in the DOM and keeps naming the trigger.                                                                                                                                                                                                                                                                                  |
| `fullWidth`          | `boolean`                   | `false`                    | Stretches the field to the width of its container (the default sizes to the content, 180px minimum).                                                                                                                                                                                                                                                         |
| `size`               | `'md' \| 'sm'`              | `'md'`                     | The trigger is 38px tall (`md`) or 32px (`sm`, for compact contexts like a table's rows-per-page selector, see `Pagination`): the shared `--gbt-control-height-md` / `-sm` scale, level with `gbt-input` and `gbt-button` of the same tier.                                                                                                                  |
| `options`            | `SelectOption<T>[]`         | required                   | `{ value, label, icon?, color? }` — the offered options.                                                                                                                                                                                                                                                                                                     |
| `multiple`           | `boolean`                   | `false`                    | Multiple selection.                                                                                                                                                                                                                                                                                                                                          |
| `chips`              | `boolean`                   | `false`                    | When `true` together with `multiple`, renders selected options as removable colored chips below the trigger instead of a collapsed count label. Each option's `color` field sets its chip color (a 6-digit hex — see `Tag`); options without one default to a neutral grey. When the field is disabled the chips stay visible but lose their remove buttons. |
| `placeholder`        | `string`                    | `'Select…'`                | Text shown with no selection.                                                                                                                                                                                                                                                                                                                                |
| `disabled`           | `boolean`                   | `false`                    | Disables the field.                                                                                                                                                                                                                                                                                                                                          |
| `required`           | `boolean`                   | `false`                    | Native `required` attribute.                                                                                                                                                                                                                                                                                                                                 |
| `errorMessage`       | `string \| null`            | `null`                     | Error message shown under the field.                                                                                                                                                                                                                                                                                                                         |
| `selectedCountLabel` | `(count: number) => string` | `` `${count} selected` ``  | Trigger label in multiple-selection mode, beyond a single item. In `chips` mode the trigger shows the placeholder instead, and this string is what the screen-reader status region announces as chips are added or removed.                                                                                                                                  |
| `chipRemoveLabel`    | `(label: string) => string` | `` `Remove ${label}` ``    | Accessible label of each chip's remove button, in `chips` mode.                                                                                                                                                                                                                                                                                              |
| `noOptionsMessage`   | `string`                    | `'No options'`             | Shown in place of the listbox when `options` is empty and the panel is opened.                                                                                                                                                                                                                                                                              |

## Hint, hidden label, full width

```html
<gbt-select
  label="Visibility"
  hint="Who can see this repository."
  [fullWidth]="true"
  [options]="options"
  formControlName="visibility"
/>

<gbt-select
  label="Sort by"
  [hideLabel]="true"
  size="sm"
  [options]="sortOptions"
  formControlName="sort"
/>
```

With `errorMessage` set the hint is not rendered and the trigger's
`aria-describedby` points at the error only (chips mode's chip row is
unaffected and still renders in the list).

## Example

```html
<gbt-select
  label="Rôle"
  [options]="[{ value: 'read', label: 'Lecture' }, { value: 'admin', label: 'Administration' }]"
  formControlName="role"
/>
```
