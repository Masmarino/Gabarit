# Button

Action button — visual variants, sizes, loading state.

**Selector**: `gbt-button`

## Inputs

| Input          | Type                                   | Default     | Role                                                  |
| -------------- | -------------------------------------- | ----------- | ----------------------------------------------------- |
| `variant`      | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Visual treatment.                                     |
| `size`         | `'small' \| 'medium' \| 'large'`       | `'medium'`  | Button size.                                          |
| `type`         | `'button' \| 'submit'`                 | `'button'`  | Native `type` attribute.                              |
| `text`         | `string`                               | `''`        | Visible label.                                        |
| `iconName`     | `string \| null`                       | `null`      | Icon shown before the text, if provided.              |
| `ariaLabel`    | `string \| null`                       | `null`      | Accessible name, when the visible label isn't enough. |
| `loading`      | `boolean`                              | `false`     | Shows a loading indicator, disables the button.       |
| `loadingLabel` | `string`                               | `'Loading'` | Text announced while loading (`.sr-only`).            |
| `disabled`     | `boolean`                              | `false`     | Disables the button.                                  |

## Outputs

| Output    | Type   | Role                                          |
| --------- | ------ | --------------------------------------------- |
| `clicked` | `void` | Emitted on click (not disabled, not loading). |

## Example

```html
<gbt-button text="Enregistrer" variant="primary" (clicked)="save()" />
```
