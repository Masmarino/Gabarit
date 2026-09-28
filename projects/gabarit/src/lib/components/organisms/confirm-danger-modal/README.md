# ConfirmDangerModal

A confirmation dialog for a destructive, hard-to-reverse action. Two forms:

- **Typed** (`confirmText` given): the confirm button stays disabled until the user types an exact
  match of a given string (e.g. the name of the thing being deleted), the same "type-to-confirm"
  pattern GitLab uses for project/group deletion.
- **Light** (`confirmText` left out): no field, a normal confirm button, and a tinted icon beside
  the message. For what is easy to redo (a webhook, a token, a collaborator).

**Selector**: `gbt-confirm-danger-modal`

Built on `Modal`: Escape, a backdrop click, or its own close button all
already work exactly as `Modal` documents them (including `busy`); this component only adds
the optional typed-confirmation gate and the Cancel/Confirm footer.

## Inputs

| Input               | Type                                 | Default             | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | ------------------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isOpen`            | `boolean`                            | required            | Open/closed state, driven by the application.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `heading`           | `string`                             | required            | Dialog title.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `message`           | `string`                             | required            | Warning text shown above the confirmation input (typed) or beside the icon (light).                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `confirmText`       | `string \| null \| undefined`        | `undefined`         | The exact string the user must type before the confirm button enables — typically the name of the item being deleted. **Absent (or `null`): no typing gate, a light confirmation.** An empty string is still typed and fail-closed: it disables the confirm button permanently. An unresolved binding (`[confirmText]="repo()?.name"` while `repo()` is still `null`/`undefined`) also counts as absent and yields a light, one-click confirmation: for a destructive action, guard the `@if` that renders the modal until the name is known. |
| `confirmInputLabel` | `string`                             | `'Type to confirm'` | Label of the confirmation text field (typed form).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `confirmLabel`      | `string`                             | `'Confirm'`         | Text of the confirm button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `cancelLabel`       | `string`                             | `'Cancel'`          | Text of the cancel button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `closeLabel`        | `string`                             | `'Close'`           | Accessible name of the modal's own close (X) button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `busy`              | `boolean`                            | `false`             | The request is running: the confirm button shows a spinner (and is disabled), Cancel is disabled, and Escape, the backdrop, the close button and a second click are ignored — nothing is emitted. The typing field is locked too.                                                                                                                                                                                                                                                                                                             |
| `busyLabel`         | `string`                             | `'Working'`         | Read out on the confirm button and by the dialog while `busy`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `confirmIcon`       | `string \| null`                     | `null`              | Icon (a registered `gbt-icon` name) before the confirm label. None by default.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `tone`              | `'danger' \| 'warning' \| 'neutral'` | `'danger'`          | `danger`: red confirm button and disc. `warning`: primary button, amber disc. `neutral`: primary button, blue disc (a plain confirmation). The disc only shows on the light form.                                                                                                                                                                                                                                                                                                                                                             |

## Outputs

| Output      | Type   | Role                                                                                                                                                                                         |
| ----------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `confirmed` | `void` | Emitted only when the confirm button is clicked — for a typed confirmation, only once the typed text exactly matches `confirmText`; never while `busy`.                                      |
| `closed`    | `void` | Emitted on Cancel, Escape, the close button, or a backdrop click (never while `busy`). The application must respond by setting `isOpen` to `false`. Never emitted together with `confirmed`. |

Whatever the user typed is cleared automatically whenever the modal closes,
so a later reopen never shows a stale value.

## Example

```html
<gbt-confirm-danger-modal
  [isOpen]="confirming()"
  heading="Supprimer le dépôt"
  message="Cette action supprimera définitivement le dépôt et tout son contenu."
  [confirmText]="repo().name"
  confirmInputLabel="Tapez le nom du dépôt pour confirmer"
  confirmLabel="Supprimer"
  cancelLabel="Annuler"
  closeLabel="Fermer"
  (confirmed)="deleteRepository()"
  (closed)="confirming.set(false)"
/>
```

A light confirmation whose request is running:

```html
@if (pending(); as webhook) {
<gbt-confirm-danger-modal
  [isOpen]="true"
  heading="Delete the webhook"
  [message]="'Deliveries to ' + webhook.url + ' will stop.'"
  confirmLabel="Delete"
  confirmIcon="trash-2"
  [busy]="deleting()"
  busyLabel="Deleting"
  (confirmed)="delete(webhook)"
  (closed)="pending.set(null)"
/>
}
```
