# ConfirmDangerModal

A confirmation dialog for a destructive, hard-to-reverse action — the
confirm button stays disabled until the user types an exact match of a
given string (e.g. the name of the thing being deleted), the same
"type-to-confirm" pattern GitLab uses for project/group deletion.

**Selector**: `gbt-confirm-danger-modal`

Built on `Modal`: Escape, a backdrop click, or its own close button all
already work exactly as `Modal` documents them; this component only adds
the typed-confirmation gate and the Cancel/Confirm footer.

## Inputs

| Input               | Type      | Default             | Role                                                                                                                  |
| ------------------- | --------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `isOpen`            | `boolean` | required            | Open/closed state, driven by the application.                                                                         |
| `heading`           | `string`  | required            | Dialog title.                                                                                                         |
| `message`           | `string`  | required            | Warning text shown above the confirmation input.                                                                      |
| `confirmText`       | `string`  | required            | The exact string the user must type before the confirm button enables — typically the name of the item being deleted. Must be non-empty; an empty string disables the confirm button permanently (fail-closed behavior for destructive actions). |
| `confirmInputLabel` | `string`  | `'Type to confirm'` | Label of the confirmation text field.                                                                                 |
| `confirmLabel`      | `string`  | `'Confirm'`         | Text of the (danger-styled) confirm button.                                                                           |
| `cancelLabel`       | `string`  | `'Cancel'`          | Text of the cancel button.                                                                                            |
| `closeLabel`        | `string`  | `'Close'`           | Accessible name of the modal's own close (X) button.                                                                  |

## Outputs

| Output      | Type   | Role                                                                                                                                                                    |
| ----------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `confirmed` | `void` | Emitted only when the confirm button is clicked — only reachable once the typed text exactly matches `confirmText`.                                                     |
| `closed`    | `void` | Emitted on Cancel, Escape, the close button, or a backdrop click. The application must respond by setting `isOpen` to `false`. Never emitted together with `confirmed`. |

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
