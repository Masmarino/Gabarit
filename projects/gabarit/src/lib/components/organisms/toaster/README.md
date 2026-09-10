# Toaster

Pile de notifications temporaires (toasts) — l'application possède le
tableau de toasts et le composant gère l'empilement, l'auto-dismiss et
l'accessibilité.

**Selector**: `gbt-toaster`

## Inputs

| Input        | Type               | Default         | Role                                                     |
| ------------ | ------------------ | --------------- | --------------------------------------------------------- |
| `toasts`     | `ToastItem[]`       | required        | Toasts actuellement affichés, possédés par l'application. |
| `position`   | `ToasterPosition`   | `'bottom-right'` | Coin ou bord de l'écran où empiler les toasts.            |
| `closeLabel` | `string`            | `'Close'`       | Nom accessible du bouton de fermeture de chaque toast.    |

```ts
interface ToastItem {
  id: string
  variant: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number // ms, défaut 5000 ; 0 ou Infinity = pas d'auto-dismiss
}
```

## Outputs

| Output      | Type     | Role                                                                                                                          |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `dismissed` | `string` | Émis avec l'`id` du toast à retirer — auto-dismiss écoulé ou clic sur le bouton fermer. L'application doit filtrer son tableau. |

## Exemple

```html
<gbt-toaster [toasts]="toasts()" (dismissed)="onDismissed($event)" />
```

```ts
toasts = signal<ToastItem[]>([])

onDismissed(id: string): void {
  this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id))
}
```

Pour afficher un nouveau toast, l'application pousse un élément dans
son propre tableau (avec un `id` unique, par ex. `crypto.randomUUID()`)
— le composant se charge de programmer son auto-dismiss.

## Accessibilité

Chaque toast porte `role="status"` (succès, info) ou `role="alert"`
(warning, error), avec `aria-atomic="true"`, pour que les lecteurs
d'écran annoncent le message sans action de l'utilisateur.
