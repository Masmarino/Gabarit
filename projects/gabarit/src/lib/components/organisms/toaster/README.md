# Toaster

Pile de notifications temporaires (toasts) — l'application possède le
tableau de toasts et le composant gère l'empilement, l'auto-dismiss et
l'accessibilité.

**Selector**: `gbt-toaster`

## Inputs

| Input        | Type              | Default          | Role                                                                                                                 |
| ------------ | ----------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| `toasts`     | `ToastItem[]`     | — (le service)   | Toasts affichés, possédés par l'application. Omis, le toaster affiche le store de `GbtToastService` (voir plus bas). |
| `position`   | `ToasterPosition` | `'bottom-right'` | Coin ou bord de l'écran où empiler les toasts.                                                                       |
| `closeLabel` | `string`          | `'Close'`        | Nom accessible du bouton de fermeture de chaque toast.                                                               |

```ts
interface ToastItem {
  id: string
  variant: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number // ms, défaut 5000 ; 0 ou Infinity = pas d'auto-dismiss
}
```

## Outputs

| Output      | Type     | Role                                                                                                                            |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
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

## Service : `GbtToastService`

Un store de toasts pour toute l'application, à injecter n'importe où (`providedIn: 'root'`). Le toaster placé une
fois dans le shell l'affiche quand son entrée `toasts` est **omise** ; l'API explicite ci-dessus reste inchangée.

```ts
private readonly toasts = inject(GbtToastService)

this.toasts.show('Token révoqué')                                     // succès, disparaît après 5 s
this.toasts.show('La requête a échoué', 'error', { duration: 0 })   // reste jusqu'à fermeture
```

```html
<gbt-toaster />
```

| Membre                           | Rôle                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `show(message, kind?, options?)` | Ajoute un toast et retourne son `id`. `kind` : `'success'` (défaut) `\| 'error' \| 'info' \| 'warning'`. `options.duration` en ms. |
| `dismiss(id)`                    | Retire un toast (et son minuteur). Un `id` inconnu est ignoré.                                                                     |
| `clear()`                        | Retire tous les toasts.                                                                                                            |
| `toasts`                         | Signal en lecture seule des toasts affichés (`ToastItem[]`), du plus ancien au plus récent.                                        |
| `defaultDuration`                | Signal de la durée par défaut, en ms (`5000`). `0` ou `Infinity` : aucun toast ne disparaît seul.                                  |

Le service possède les minuteurs d'auto-dismiss (un toast affiché avant que le toaster n'existe disparaît quand même
à l'heure), les annule au `dismiss`/`clear` et à la destruction de l'injecteur, et fabrique ses `id` avec un compteur
(`crypto.randomUUID` n'existe pas hors contexte sécurisé). En mode service, le toaster ne programme aucun minuteur : le
bouton fermer appelle `dismiss()` (et émet aussi `dismissed`) ; l'expiration ne l'émet pas.

## Accessibilité

Chaque toast porte `role="status"` (succès, info) ou `role="alert"`
(warning, error), avec `aria-atomic="true"`, pour que les lecteurs
d'écran annoncent le message sans action de l'utilisateur. C'est la
même chose en mode service : les erreurs et avertissements sont
annoncés de façon assertive, les autres poliment.

**À savoir.** (1) Tous les toasts, erreurs comprises, disparaissent après 5 s par défaut et rien ne les suspend au
survol ou au focus : un utilisateur qui lit lentement (loupe, clavier) peut manquer un message d'erreur (WCAG 2.2.1).
Passez `{ duration: 0 }` pour une erreur qui doit rester jusqu'à fermeture. (2) Un avertissement est annoncé de façon
assertive (`role="alert"`) : un `warning` non bloquant interrompt donc la lecture. (3) En mode
service, placez **un seul** `<gbt-toaster />` dans l'application : deux toasters affichent le même store et
annoncent chaque message deux fois.
