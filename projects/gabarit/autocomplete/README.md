# Autocomplete

Text field with asynchronous suggestions. The app owns the data source
— it supplies a `search` function, `Autocomplete` owns debouncing the
input, tracking loading/empty/error state, and discarding a response
that arrives after a more recent one. Integrated with reactive forms
and `ngModel`, like `GbtInput`/`Select`.

Distinct from `Select` (a fixed, known-upfront list of options) and
from `SearchBar` (an organism dedicated exclusively to the header's
search — not a reusable form field).

**Selector**: `gbt-autocomplete`

## Inputs

| Input                 | Type                                             | Default              | Role                                                                                          |
| --------------------- | ------------------------------------------------ | --------------------- | ---------------------------------------------------------------------------------------------- |
| `id`                  | `string`                                          | generated             | DOM id, associates the `<label>`.                                                              |
| `label`               | `string`                                          | `''`                  | Visible label.                                                                                 |
| `search`              | `(query: string) => Observable<T[]> \| Promise<T[]>` | required           | Runs the search — `Autocomplete` never makes the HTTP call itself.                             |
| `displayFn`           | `(item: T) => string`                             | `String(item)`        | Formats an item as text, both in the input once selected and as the default option rendering.  |
| `itemTemplate`        | `TemplateRef<{ $implicit: T }>`                   | none                  | Custom rendering per suggestion (e.g. avatar + name), in place of the plain `displayFn` text.   |
| `debounceMs`          | `number`                                          | `300`                 | Delay after the last keystroke before `search` runs.                                           |
| `minLength`           | `number`                                          | `1`                   | Minimum query length (after trimming) before searching.                                        |
| `placeholder`         | `string`                                          | `''`                  | Input placeholder.                                                                              |
| `disabled`            | `boolean`                                         | `false`               | Disables the field.                                                                            |
| `required`            | `boolean`                                         | `false`               | Native `required` attribute.                                                                   |
| `errorMessage`        | `string \| null`                                  | `null`                | Error message shown under the field (form validation — distinct from a failed search).         |
| `loadingMessage`      | `string`                                          | `'Searching…'`        | Shown in the panel and announced while `search` is pending.                                    |
| `noResultsMessage`    | `string`                                          | `'No results'`        | Shown when `search` resolves to an empty array.                                                |
| `searchErrorMessage`  | `string`                                          | `'Search failed'`     | Shown when `search` rejects or errors.                                                         |
| `resultsAnnouncement` | `(count: number) => string`                       | `` `${count} result(s)` `` | Text announced to screen readers once results land.                                       |

## Outputs

| Output         | Type | Role                                                                                   |
| -------------- | ---- | --------------------------------------------------------------------------------------- |
| `itemSelected` | `T`  | Emitted when a suggestion is picked — in addition to the `ControlValueAccessor` value.  |

## Behavior

- Debounced: `search` only runs `debounceMs` after the last keystroke, not once per keystroke.
- A response that resolves after a more recent one is discarded — typing "a" then "al" before the first search settles never lets the "a" results flash back over "al"'s.
- Editing the text away from the current selection clears the form value (`null`) immediately — a stale object never lingers behind edited text.
- Works with either a `Promise`-returning or an `Observable`-returning `search` (an active `Observable` subscription is replaced, not stacked, when a newer search starts).
- The panel is positioned with `getBoundingClientRect()`, the same technique as `Select` — it escapes an ancestor's `overflow: hidden`.

## Example

```html
<gbt-autocomplete
  label="Utilisateur"
  placeholder="Rechercher un utilisateur…"
  [search]="searchUsers"
  [displayFn]="displayUser"
  formControlName="assignee"
/>
```

```ts
searchUsers = (query: string) =>
  this.http.get<User[]>('/api/users', { params: { q: query } })

displayUser = (user: User) => user.name
```

Custom rendering per suggestion, via `itemTemplate`:

```html
<gbt-autocomplete [search]="searchUsers" [displayFn]="displayUser" [itemTemplate]="userRow" formControlName="assignee">
</gbt-autocomplete>
<ng-template #userRow let-user>
  <img [src]="user.avatarUrl" width="20" height="20" />
  <span>{{ user.name }}</span>
</ng-template>
```
