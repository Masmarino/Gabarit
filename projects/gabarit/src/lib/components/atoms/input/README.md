# Input

Text, email, password, number, search or URL field, with a visibility toggle, a
hint, an error message, a compact size, a monospace mode and a leading icon.
Integrated with reactive forms and `ngModel`.

**Selector**: `gbt-input`

**The exported class is called `GbtInput`, not `Input`** — `Input`
would collide with `@angular/core`'s `Input` decorator.

## Inputs

| Input               | Type                                                                                          | Default                   | Role                                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                | `string`                                                                                      | generated (`gbt-input-N`) | DOM id, associates the `<label>`.                                                                                                                                                    |
| `label`             | `string`                                                                                      | `''`                      | Visible label.                                                                                                                                                                       |
| `type`              | `'text' \| 'password' \| 'email' \| 'number' \| 'search' \| 'url'`                            | `'text'`                  | In `password` mode, a button toggles visibility.                                                                                                                                     |
| `required`          | `boolean`                                                                                     | `false`                   | Native `required` attribute.                                                                                                                                                         |
| `disabled`          | `boolean`                                                                                     | `false`                   | Disables the field.                                                                                                                                                                  |
| `placeholder`       | `string`                                                                                      | `''`                      | Placeholder text.                                                                                                                                                                    |
| `errorMessage`      | `string \| null`                                                                              | `null`                    | Error message shown under the field, associated via `aria-describedby`.                                                                                                              |
| `autocomplete`      | `string`                                                                                      | `'off'`                   | Native `autocomplete` attribute.                                                                                                                                                     |
| `showPasswordLabel` | `string`                                                                                      | `'Show password'`         | Accessible name of the button when the password is hidden.                                                                                                                           |
| `hidePasswordLabel` | `string`                                                                                      | `'Hide password'`         | Accessible name of the button when the password is visible.                                                                                                                          |
| `hint`              | `string`                                                                                      | `''`                      | Help text under the field, linked with `aria-describedby`. Hidden (and unlinked) while an error shows.                                                                               |
| `hideLabel`         | `boolean`                                                                                     | `false`                   | Hides the label visually; it stays in the DOM and keeps naming the field.                                                                                                            |
| `size`              | `'md' \| 'sm'`                                                                                | `'md'`                    | The field is 38px tall (`md`) or 32px (`sm`): the shared `--gbt-control-height-md` / `-sm` scale, the height of `gbt-select` and `gbt-button` (`medium` / `small`) of the same tier. |
| `mono`              | `boolean`                                                                                     | `false`                   | Monospace text (`--gbt-font-mono` when defined, else the system monospace stack).                                                                                                    |
| `leadingIcon`       | `string \| null`                                                                              | `null`                    | Icon name shown inside the field, at its start (decorative, `aria-hidden`).                                                                                                          |
| `inputmode`         | `'none' \| 'text' \| 'tel' \| 'url' \| 'email' \| 'numeric' \| 'decimal' \| 'search' \| null` | `null`                    | Native `inputmode` (virtual keyboard). Attribute left out when `null`.                                                                                                               |
| `spellcheck`        | `boolean \| null`                                                                             | `null`                    | Native `spellcheck`. Left to the browser when `null`.                                                                                                                                |
| `autocapitalize`    | `'off' \| 'none' \| 'on' \| 'sentences' \| 'words' \| 'characters' \| null`                   | `null`                    | Native `autocapitalize`. Left to the browser when `null`.                                                                                                                            |
| `enterkeyhint`      | `'enter' \| 'done' \| 'go' \| 'next' \| 'previous' \| 'search' \| 'send' \| null`             | `null`                    | Native `enterkeyhint` (label of the virtual keyboard's enter key).                                                                                                                   |
| `maxlength`         | `number \| null`                                                                              | `null`                    | Native `maxlength`.                                                                                                                                                                  |
| `min` / `max`       | `number \| string \| null`                                                                    | `null`                    | Native `min` / `max` (number, date types…).                                                                                                                                          |

Every optional input defaults to "off": a field that leaves them unset renders
the same markup and the same pixels.

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

## Hint, hidden label and compact search

```html
<gbt-input label="Repository name" hint="Letters, digits, - and _ only." formControlName="name" />

<gbt-input
  label="Search repositories"
  [hideLabel]="true"
  size="sm"
  type="search"
  leadingIcon="search"
  placeholder="Search…"
/>
```

The hint sits under the field (`<p id="<id>-hint">`) and is the field's
`aria-describedby`. While `errorMessage` is set the hint is not rendered at
all and the error takes its place, so a screen reader only reads one
description.

## One-time code

```html
<gbt-input
  label="6-digit code"
  [mono]="true"
  inputmode="numeric"
  autocomplete="one-time-code"
  [maxlength]="6"
  [spellcheck]="false"
  autocapitalize="off"
  enterkeyhint="go"
/>
```

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
