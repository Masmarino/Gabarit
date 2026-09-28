# Switch

Bascule on/off — alternative visuelle à `Checkbox` pour un réglage
binaire immédiat (ex. activer une option), plutôt qu'une sélection
dans un formulaire à valider.

**Selector**: `gbt-switch`

## Inputs

| Input      | Type      | Default | Role                                                                 |
| ---------- | --------- | ------- | -------------------------------------------------------------------- |
| `id`       | `string`  | généré  | `id` du champ natif.                                                 |
| `label`    | `string`  | `''`    | Texte affiché à côté de la bascule.                                  |
| `disabled` | `boolean` | `false` | Désactive le contrôle.                                               |
| `hint`     | `string`  | `''`    | Texte d'aide sous le libellé, relié au champ par `aria-describedby`. |

S'intègre aux formulaires Angular via `ControlValueAccessor`, comme
`Checkbox` — utilisable indifféremment avec `formControlName` ou
`[formControl]`.

## Exemple

```html
<gbt-switch label="Recevoir les notifications" formControlName="notifications" />

<gbt-switch
  label="Envoyer un résumé quotidien"
  hint="Un e-mail par jour, à 8 h."
  formControlName="digest"
/>
```

## Texte d'aide (`hint`)

Sans `hint`, le rendu ne comporte aucun élément supplémentaire (hôte inline).
Avec `hint`, l'hôte devient un bloc et le texte
s'affiche sous le libellé, aligné sur celui-ci (piste 2,25 rem + espace
0,5 rem) — plus besoin d'une indentation « magique » côté application.
Le texte est un `<p>` **hors** du `<label>` : il décrit le champ
(`aria-describedby`) sans s'ajouter à son nom accessible.

## Accessibilité

Basé sur `<input type="checkbox" role="switch">` — tout le
comportement natif (Space pour basculer, participation aux
formulaires, focus) est conservé ; `role="switch"` fait annoncer
"interrupteur" par les lecteurs d'écran plutôt que "case à cocher".
L'entrée native est visuellement masquée (`opacity: 0`) mais reste
dans l'arbre d'accessibilité et la zone cliquable — le rendu piste +
curseur est purement du CSS piloté par `:checked`, sans JavaScript.
