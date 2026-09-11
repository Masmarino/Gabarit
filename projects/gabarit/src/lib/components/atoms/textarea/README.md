# Textarea

Champ de texte multiligne, cohérent avec `GbtInput` — même API, même
intégration `ControlValueAccessor`.

**Selector**: `gbt-textarea`

## Inputs

| Input          | Type              | Default  | Role                                              |
| -------------- | ----------------- | -------- | -------------------------------------------------- |
| `id`           | `string`          | généré   | `id` du champ natif.                               |
| `label`        | `string`          | `''`     | Libellé affiché au-dessus du champ.                |
| `required`     | `boolean`         | `false`  | Affiche un `*` à côté du label.                    |
| `disabled`     | `boolean`         | `false`  | Désactive le champ.                                |
| `placeholder`  | `string`          | `''`     | Texte indicatif.                                   |
| `errorMessage` | `string \| null`  | `null`   | Message d'erreur, associé via `aria-describedby`.  |
| `rows`         | `number`          | `3`      | Hauteur initiale, en lignes.                       |

## Outputs

| Output      | Type     | Role                                                              |
| ----------- | -------- | -------------------------------------------------------------------|
| `committed` | `string` | Émis au blur, avec la valeur sur laquelle l'utilisateur s'est arrêté (même convention que `GbtInput`). |

## Exemple

```html
<gbt-textarea label="Description" [rows]="5" formControlName="description" />
```

## Redimensionnement

`resize: vertical` natif — l'utilisateur agrandit en tirant le coin.
Pas d'auto-agrandissement à la saisie, pas de compteur de caractères
intégré (à ajouter côté application si un besoin réel apparaît).
