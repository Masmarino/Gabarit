# Alert

Persistent inline message — a banner within a page or section, not a
transient notification. Distinct from `Toaster` (auto-dismissing,
stacked at a screen corner): `Alert` stays visible for as long as the
app renders it.

**Selector**: `gbt-alert`

## Inputs

| Input         | Type              | Default     | Role                                                                                                                                                                                                               |
| ------------- | ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `variant`     | `AlertVariant`    | `'info'`    | `'info' \| 'success' \| 'warning' \| 'error' \| 'neutral'` (`neutral`: a quiet grey status line or review bar).                                                                                                    |
| `dismissible` | `boolean`         | `false`     | Shows a close button.                                                                                                                                                                                              |
| `closeLabel`  | `string`          | `'Dismiss'` | Accessible name of the close button.                                                                                                                                                                               |
| `live`        | `AlertLive`       | `'auto'`    | `'auto' \| 'assertive' \| 'polite' \| 'off'` — how the alert is announced (see _Role_).                                                                                                                            |
| `heading`     | `string`          | `''`        | A short bold title above the message.                                                                                                                                                                              |
| `size`        | `AlertSize`       | `'md'`      | `'md' \| 'sm'` — `sm` is the tighter alert for side panels, hints and dense cards.                                                                                                                                 |
| `appearance`  | `AlertAppearance` | `'default'` | `'default' \| 'subtle'` — subtle: lighter wash, hairline edge and icon ring.                                                                                                                                       |
| `iconAlign`   | `AlertIconAlign`  | `'auto'`    | `'auto' \| 'center' \| 'start'` — `auto` centres the icon on a single block and moves it to the first line once there is a `heading` or `[alert-actions]`; `start` forces the top, `center` opts out.             |

## Outputs

| Output      | Type   | Role                                                                                                                                                        |
| ----------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dismissed` | `void` | Emitted when the close button is clicked — `Alert` does not remove itself, like `Toaster`'s own close button; the app decides whether to stop rendering it. |

## Content

The message comes from projected content (`<ng-content />`), so it can
include an action link, not just plain text.

`[alert-actions]` projects buttons or links into a slot beside
the message — they share the row while there is room and drop under the
message when there is not:

```html
<gbt-alert variant="error">
  Les variables n'ont pas pu être chargées.
  <gbt-button alert-actions variant="secondary" size="small" text="Réessayer" (clicked)="retry()" />
</gbt-alert>

<gbt-alert variant="error" heading="Impossible de charger le tableau de bord">
  Le service de métriques ne répond pas.
  <gbt-button alert-actions variant="secondary" size="small" text="Réessayer" />
</gbt-alert>
```

## Example

```html
<gbt-alert variant="warning">Le quota du dépôt est presque atteint.</gbt-alert>

<gbt-alert variant="error" [dismissible]="true" closeLabel="Fermer" (dismissed)="showError = false">
  Le paiement a échoué. <a href="/facturation">Mettre à jour le moyen de paiement</a>
</gbt-alert>
```

## Role and `live`

With the default `live="auto"`, `warning` and `error` use `role="alert"`
(announced immediately), `info`, `success` and `neutral` use `role="status"`
(announced politely) — the same split `Toaster` already uses for its
variants.

`live` overrides that mapping:

| `live`        | Result                                                      |
| ------------- | ----------------------------------------------------------- |
| `'auto'`      | The mapping above (default).                                |
| `'assertive'` | `role="alert"` whatever the variant.                        |
| `'polite'`    | `role="status"` whatever the variant.                       |
| `'off'`       | No `role`, no `aria-live`, no `aria-atomic`: a static note. |

A live region only announces what appears **after** the page has loaded.
A note that is on the page from the start (a warning above a form, a
footnote) should be `live="off"`, otherwise a static `warning` interrupts
screen-reader users for nothing. A message that appears as the result of an
action (a failed save, a load error) keeps `auto`, or `polite` when it is
not urgent. Never nest an alert inside another live region.

## Touch

The close button is 44 × 44 px on coarse pointers
(`@media (pointer: coarse)`); the alert keeps its height, only the hit area
and the focus ring grow.
