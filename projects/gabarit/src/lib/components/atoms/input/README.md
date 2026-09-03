# Input

Text, email or password field, with a visibility toggle and an error message.
Integrated with reactive forms and `ngModel`.

**Selector**: `gbt-input`

**The exported class is called `GbtInput`, not `Input`** — `Input`
would collide with `@angular/core`'s `Input` decorator.

## Inputs

| Input               | Type                              | Default                   | Role                                                                    |
| ------------------- | --------------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| `id`                | `string`                          | generated (`gbt-input-N`) | DOM id, associates the `<label>`.                                       |
| `label`             | `string`                          | `''`                      | Visible label.                                                          |
| `type`              | `'text' \| 'password' \| 'email'` | `'text'`                  | In `password` mode, a button toggles visibility.                        |
| `required`          | `boolean`                         | `false`                   | Native `required` attribute.                                            |
| `disabled`          | `boolean`                         | `false`                   | Disables the field.                                                     |
| `placeholder`       | `string`                          | `''`                      | Placeholder text.                                                       |
| `errorMessage`      | `string \| null`                  | `null`                    | Error message shown under the field, associated via `aria-describedby`. |
| `autocomplete`      | `string`                          | `'off'`                   | Native `autocomplete` attribute.                                        |
| `showPasswordLabel` | `string`                          | `'Show password'`         | Accessible name of the button when the password is hidden.              |
| `hidePasswordLabel` | `string`                          | `'Hide password'`         | Accessible name of the button when the password is visible.             |

## Outputs

| Output      | Payload  | Role                                               |
| ----------- | -------- | -------------------------------------------------- |
| `committed` | `string` | Fires on blur, with the value the user settled on. |

`committed` is for anything that persists. A field bound straight to a
request sends `2` and then `24` while the user types `24`, and walking away
mid-edit saves the half-typed value; listening to `committed` instead sends
one request, with what the user actually settled on. Local state — a signal
backing another control — is better served by the form binding, which
updates on every keystroke.

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
