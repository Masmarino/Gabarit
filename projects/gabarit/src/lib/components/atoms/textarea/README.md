# Textarea

Champ de texte multiligne, cohérent avec `GbtInput` — même API, même
intégration `ControlValueAccessor`.

**Selector**: `gbt-textarea`

## Inputs

| Input          | Type                                             | Default      | Role                                                                                                      |
| -------------- | ------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------- |
| `id`           | `string`                                         | généré       | `id` du champ natif.                                                                                      |
| `label`        | `string`                                         | `''`         | Libellé affiché au-dessus du champ.                                                                       |
| `required`     | `boolean`                                        | `false`      | Affiche un `*` à côté du label.                                                                           |
| `disabled`     | `boolean`                                        | `false`      | Désactive le champ.                                                                                       |
| `placeholder`  | `string`                                         | `''`         | Texte indicatif.                                                                                          |
| `errorMessage` | `string \| null`                                 | `null`       | Message d'erreur, associé via `aria-describedby`.                                                         |
| `rows`         | `number`                                         | `3`          | Hauteur initiale, en lignes (hauteur minimale avec `autosize`).                                           |
| `hint`         | `string`                                         | `''`         | Aide sous le champ, associée via `aria-describedby`. Masquée (et déliée) tant qu'une erreur est affichée. |
| `hideLabel`    | `boolean`                                        | `false`      | Masque le libellé visuellement ; il reste dans le DOM et continue de nommer le champ.                     |
| `mono`         | `boolean`                                        | `false`      | Police à chasse fixe (`--gbt-font-mono` si définie, sinon la pile monospace du système).                  |
| `autosize`     | `boolean`                                        | `false`      | Le champ grandit avec son contenu au lieu de défiler. Désactive la poignée de redimensionnement.          |
| `maxRows`      | `number \| null`                                 | `null`       | Avec `autosize` : nombre de lignes au-delà duquel le champ cesse de grandir et défile.                    |
| `resize`       | `'vertical' \| 'none' \| 'both' \| 'horizontal'` | `'vertical'` | Poignée de redimensionnement (ignorée avec `autosize`).                                                   |

Tous ces inputs sont « éteints » par défaut : un champ qui ne les utilise pas
garde le même rendu.

## Outputs

| Output      | Type     | Role                                                                                                   |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `committed` | `string` | Émis au blur, avec la valeur sur laquelle l'utilisateur s'est arrêté (même convention que `GbtInput`). |

## Exemple

```html
<gbt-textarea label="Description" [rows]="5" formControlName="description" />
```

## Aide, libellé masqué, monospace

```html
<gbt-textarea label="Description" hint="Markdown accepté." formControlName="description" />

<gbt-textarea label="Ajouter un commentaire" [hideLabel]="true" [rows]="2" />

<gbt-textarea label="Variables d'environnement" [mono]="true" [rows]="4" />
```

L'aide (`<p id="<id>-hint">`) est le `aria-describedby` du champ ; tant que
`errorMessage` est renseigné, elle n'est plus rendue et l'erreur prend sa
place.

## Redimensionnement

Par défaut, `resize: vertical` natif — l'utilisateur agrandit en tirant le
coin. `resize` accepte aussi `none`, `both` et `horizontal`.

Avec `autosize`, le champ grandit à la saisie (et se recale quand la valeur
est écrite par le formulaire ou quand sa largeur change) ; `rows` reste la
hauteur minimale et `maxRows` plafonne la hauteur, au-delà de laquelle le
champ défile. Le plafond est un `max-height` CSS calculé avec l'unité `lh` : un
navigateur qui ne la connaît pas laisse simplement le champ grandir sans
limite. Pas de compteur de caractères intégré (à ajouter côté application si
un besoin réel apparaît).

```html
<gbt-textarea label="Message de commit" [autosize]="true" [rows]="2" [maxRows]="6" />
```

## Valeur

La valeur est liée à la propriété `value` du `<textarea>` : `writeValue('')`,
`reset()` ou un `ngModel` remis à `''` vident bien le champ, même après une
saisie.
