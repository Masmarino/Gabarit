# Input

Text or password field, with a visibility toggle and an error message.
Integrated with reactive forms and `ngModel`.

**Selector**: `gbt-input`

**The exported class is called `GbtInput`, not `Input`** — `Input`
would collide with `@angular/core`'s `Input` decorator.

## Inputs

| Input               | Type                   | Default                   | Role                                                                    |
| ------------------- | ---------------------- | ------------------------- | ----------------------------------------------------------------------- |
| `id`                | `string`               | generated (`gbt-input-N`) | DOM id, associates the `<label>`.                                       |
| `label`             | `string`               | `''`                      | Visible label.                                                          |
| `type`              | `'text' \| 'password'` | `'text'`                  | In `password` mode, a button toggles visibility.                        |
| `required`          | `boolean`              | `false`                   | Native `required` attribute.                                            |
| `disabled`          | `boolean`              | `false`                   | Disables the field.                                                     |
| `placeholder`       | `string`               | `''`                      | Placeholder text.                                                       |
| `errorMessage`      | `string \| null`       | `null`                    | Error message shown under the field, associated via `aria-describedby`. |
| `autocomplete`      | `string`               | `'off'`                   | Native `autocomplete` attribute.                                        |
| `showPasswordLabel` | `string`               | `'Show password'`         | Accessible name of the button when the password is hidden.              |
| `hidePasswordLabel` | `string`               | `'Hide password'`         | Accessible name of the button when the password is visible.             |

## Example

```html
<gbt-input
  label="Mot de passe"
  type="password"
  showPasswordLabel="Afficher le mot de passe"
  hidePasswordLabel="Masquer le mot de passe"
  formControlName="password"
/>
```
