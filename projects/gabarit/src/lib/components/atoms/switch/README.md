# Switch

Bascule on/off — alternative visuelle à `Checkbox` pour un réglage
binaire immédiat (ex. activer une option), plutôt qu'une sélection
dans un formulaire à valider.

**Selector**: `gbt-switch`

## Inputs

| Input      | Type      | Default | Role                                  |
| ---------- | --------- | ------- | -------------------------------------- |
| `id`       | `string`  | généré  | `id` du champ natif.                   |
| `label`    | `string`  | `''`    | Texte affiché à côté de la bascule.    |
| `disabled` | `boolean` | `false` | Désactive le contrôle.                 |

S'intègre aux formulaires Angular via `ControlValueAccessor`, comme
`Checkbox` — utilisable indifféremment avec `formControlName` ou
`[formControl]`.

## Exemple

```html
<gbt-switch label="Recevoir les notifications" formControlName="notifications" />
```

## Accessibilité

Basé sur `<input type="checkbox" role="switch">` — tout le
comportement natif (Space pour basculer, participation aux
formulaires, focus) est conservé ; `role="switch"` fait annoncer
"interrupteur" par les lecteurs d'écran plutôt que "case à cocher".
L'entrée native est visuellement masquée (`opacity: 0`) mais reste
dans l'arbre d'accessibilité et la zone cliquable — le rendu piste +
curseur est purement du CSS piloté par `:checked`, sans JavaScript.
