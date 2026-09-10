# Tooltip

Info-bulle générique qui enveloppe n'importe quel élément projeté et
l'affiche au survol ou au focus clavier.

**Selector**: `gbt-tooltip` (`exportAs="gbtTooltip"`)

## Inputs

| Input      | Type                                        | Default   | Role                                  |
| ---------- | -------------------------------------------- | --------- | -------------------------------------- |
| `text`     | `string`                                     | required  | Texte affiché dans la bulle.           |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'`     | `'top'`   | Côté de l'élément où placer la bulle.  |

Pas de retournement automatique si la bulle déborde de l'écran —
l'application choisit la position adaptée à son layout (même logique
que `gbt-menu`).

## Comportement

- Apparition après ~400ms de survol (annulée si le pointeur repart
  avant), immédiate au focus clavier.
- Disparition sur `mouseleave`, `focusout`, ou `Escape`, avec un court
  fondu (120ms) avant que la bulle ne quitte le DOM — un nouveau
  survol/focus pendant ce délai annule la disparition et la bulle
  reste affichée.
- Contenu texte uniquement — pas d'élément interactif à l'intérieur de
  la bulle (voir WCAG 1.4.13, § Accessibilité ci-dessous).

## Accessibilité

`gbt-tooltip` ne peut pas poser `aria-describedby` automatiquement sur
l'élément projeté (il ne connaît pas sa structure interne). Câblez-le
vous-même via `tooltipId`, exposé par `exportAs="gbtTooltip"` :

```html
<gbt-tooltip text="Supprimer" #tip="gbtTooltip">
  <button [attr.aria-describedby]="tip.tooltipId" aria-label="Supprimer">
    <gbt-icon name="x" />
  </button>
</gbt-tooltip>
```

## Exemple

```html
<gbt-tooltip text="Cette action est définitive" position="right">
  <button type="button">Supprimer</button>
</gbt-tooltip>
```
