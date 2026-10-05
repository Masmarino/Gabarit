# CheckboxGroup

A set of checkboxes that answer one question ("Which events?") — a
`<fieldset>` with a `<legend>`, whose value is the **array of the checked
options' values**. Use [`Checkbox`](../checkbox/README.md) for a single
yes/no, [`RadioGroup`](../radio-group/README.md) for a single choice.

**Selector**: `gbt-checkbox-group`

Implements `ControlValueAccessor` (`formControlName`, `[(ngModel)]`) **and** exposes a
`value` model, so it also works without Angular forms (`[(value)]`).

## Inputs

| Input          | Type                        | Default                            | Role                                                                                                                                                                                                                                       |
| -------------- | --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `legend`       | `string`                    | required                           | The group's question, rendered as the `<legend>` (its accessible name).                                                                                                                                                                    |
| `options`      | `CheckboxGroupOption<T>[]`  | `[]`                               | Flat list of options.                                                                                                                                                                                                                      |
| `groups`       | `CheckboxGroupSection<T>[]` | `[]`                               | Options split into named sections, rendered after `options`. Each section is a `role="group"` named by its heading.                                                                                                                        |
| `value`        | `T[]` (model)               | `[]`                               | The checked options' values, in option order. Also the form value.                                                                                                                                                                         |
| `columns`      | `number \| 'auto'`          | `1`                                | Equal columns, or `'auto'` to fit as many (min 11rem) as the width allows. On the flat list, or on the sections when there are `groups`. Only `'auto'` collapses on a narrow screen; a fixed count keeps its columns (short options only). |
| `hint`         | `string`                    | `''`                               | Help text under the legend, linked with `aria-describedby`; replaced by the error while one shows.                                                                                                                                         |
| `errorMessage` | `string \| null`            | `null`                             | Error text (`role="alert"`), `aria-describedby` and `aria-invalid` on the fieldset.                                                                                                                                                        |
| `required`     | `boolean`                   | `false`                            | Adds ` *` to the legend (same convention as `RadioGroup`).                                                                                                                                                                                 |
| `hideLegend`   | `boolean`                   | `false`                            | Keeps the legend for assistive technology, removes it from the layout.                                                                                                                                                                     |
| `disabled`     | `boolean`                   | `false`                            | Disables every checkbox (cumulative with the form's disabled state).                                                                                                                                                                       |
| `id`           | `string`                    | generated (`gbt-checkbox-group-N`) | Prefix of the ids of the checkboxes, hint and error.                                                                                                                                                                                       |

```ts
interface CheckboxGroupOption<T = string> {
  value: T
  label: string
  hint?: string // help text under this option
  disabled?: boolean // disables this option only
}

interface CheckboxGroupSection<T = string> {
  label: string // visible heading, names the role="group"
  options: CheckboxGroupOption<T>[]
}
```

`T` is compared by identity (`includes`), so primitives and shared object
references both work.

## Examples

```html
<!-- With Angular forms -->
<gbt-checkbox-group legend="Notify me about" [options]="options" formControlName="events" />

<!-- Without: two-way model -->
<gbt-checkbox-group legend="Notify me about" [options]="options" [(value)]="events" />

<!-- Named sections, as many columns as fit -->
<gbt-checkbox-group
  legend="Events"
  [groups]="eventGroups"
  columns="auto"
  formControlName="events"
/>
```

## Behavior

- Toggling a box emits the new array (`valueChange` / form `onChange`) **in
  option order**, not click order, so the value is stable; values that match no
  option are kept at the end. The control is marked touched on the first toggle.
- Unchecking the last box emits `[]`, never `null`. `writeValue(null)` reads as `[]`.

## Accessibility

Native checkboxes (each is the existing `gbt-checkbox`) inside a
`<fieldset>`/`<legend>`: the group name is announced with each box, every box
is a tab stop and Space toggles it — no scripted keyboard handling, no roving
tabindex (it is a set of independent controls, not a composite widget). Named
sections add `role="group"` + `aria-labelledby` on the visible heading. See
[`AUDIT.md`](AUDIT.md).
