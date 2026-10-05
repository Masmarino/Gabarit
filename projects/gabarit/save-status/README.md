# SaveStatus

The save state of a field or form that saves on its own: "Saving…", "Saved", "Not saved".

**Selector**: `gbt-save-status`

## Inputs

| Input         | Type                                       | Default       | Role                                                                                                    |
| ------------- | ------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------- |
| `state`       | `'idle' \| 'saving' \| 'saved' \| 'error'` | `'idle'`      | The state to show. Set it from your save logic; nothing resets itself.                                  |
| `savingLabel` | `string`                                   | `'Saving…'`   | Text of `saving`.                                                                                       |
| `savedLabel`  | `string`                                   | `'Saved'`     | Text of `saved`.                                                                                        |
| `errorLabel`  | `string`                                   | `'Not saved'` | Text of `error`.                                                                                        |
| `message`     | `string \| null`                           | `null`        | Replaces the current state's text with a specific one; keeps its icon and colour. Ignored while `idle`. |

## The live region

The text lives in a `role="status"` element that is **always rendered**, also when `idle` (empty). A live
region only announces changes if it was already in the accessibility tree, so never put the component
behind an `@if` on the state: bind `[state]` instead. `idle` keeps the 20 px line, so nothing moves when a
state appears. The host carries no role; the inner `.gbt-save-status` has `data-state`.

Each state has an icon as well as text and colour: a spinning ring (a static ring under
`prefers-reduced-motion`), a check, an alert.

## Example

```html
<gbt-input label="Instance name" [(ngModel)]="name" (blur)="save()" />
<gbt-save-status
  [state]="nameState()"
  savingLabel="Enregistrement…"
  savedLabel="Enregistré"
  errorLabel="Non enregistré"
/>

<!-- A form-level result with its own wording -->
<gbt-save-status [state]="result().state" [message]="result().message" />
```

## Accessibility

See [AUDIT.md](AUDIT.md).
