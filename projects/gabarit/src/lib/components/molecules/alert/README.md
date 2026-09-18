# Alert

Persistent inline message — a banner within a page or section, not a
transient notification. Distinct from `Toaster` (auto-dismissing,
stacked at a screen corner): `Alert` stays visible for as long as the
app renders it.

**Selector**: `gbt-alert`

## Inputs

| Input          | Type            | Default   | Role                                                              |
| -------------- | --------------- | --------- | -------------------------------------------------------------------- |
| `variant`      | `AlertVariant`  | `'info'`  | `'info' \| 'success' \| 'warning' \| 'error'`.                       |
| `dismissible`  | `boolean`       | `false`   | Shows a close button.                                                |
| `closeLabel`   | `string`        | `'Dismiss'` | Accessible name of the close button.                               |

## Outputs

| Output      | Type   | Role                                                                                     |
| ----------- | ------ | ------------------------------------------------------------------------------------------ |
| `dismissed` | `void` | Emitted when the close button is clicked — `Alert` does not remove itself, like `Toaster`'s own close button; the app decides whether to stop rendering it. |

## Content

The message comes from projected content (`<ng-content />`), so it can
include an action link, not just plain text.

## Example

```html
<gbt-alert variant="warning">Le quota du dépôt est presque atteint.</gbt-alert>

<gbt-alert variant="error" [dismissible]="true" closeLabel="Fermer" (dismissed)="showError = false">
  Le paiement a échoué. <a href="/facturation">Mettre à jour le moyen de paiement</a>
</gbt-alert>
```

## Role

`warning` and `error` use `role="alert"` (announced immediately);
`info` and `success` use `role="status"` (announced politely) — the
same split `Toaster` already uses for its variants.
