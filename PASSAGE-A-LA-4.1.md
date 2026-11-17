# Passer de Gabarit 4.0 à 4.1

La 4.1 met **les contrôles en verre liquide** et **uniformise les rayons**. La lumière suit la règle de la 4.0.1 : en
haut et en bas, jamais en diagonale. Le verre liquide reste réservé à ce qui commande et flotte : jamais une cellule de
liste, une bulle ou une carte.

Rien n'est retiré : ce qui casse est l'aspect par défaut, et chaque plateforme garde un chemin vers celui de la 4.0.

## Partout

- **Boutons** : capsules de verre liquide. Le secondaire et le tertiaire en verre clair, à l'encre du sol ; le principal
  en verre teinté (de l'encre, à `controlProminent`, 0,86) ; un style « en avant » teinté de l'accent. À l'appui, le
  verre s'éclaire (`controlPressLight`, 0,14) et grossit (`controlPressScale`, 1,04) sur le ressort `bouncy` ; avec le
  mouvement réduit, il s'éclaire sans grossir. Les boutons ronds d'icône sont en verre liquide.
- **Chips et filtres** : capsules de verre fin ; la chip choisie teintée de l'accent. **Étiquettes** : capsules de verre
  fin voilées de la couleur de l'état. Les compteurs, avatars et pastilles de présence restent pleins.
- **Contrôle segmenté et onglets d'une page** : une piste de verre fin et une lentille de verre liquide qui glisse
  d'un segment à l'autre.
- **Interrupteur et curseur** : la piste ne change pas ; leur bouton devient du verre liquide pendant qu'on le tient.
- **Champs** : un creux de verre fin sans bordure (l'ombre `glassHollow` tombe du bord haut). Au focus, le contour
  (3:1 au moins) ; avec plus de contraste, il reste au repos.
- **Feuilles** : elles portent un formulaire, elles restent en verre de contenu épais (web : modale et tiroir en verre
  liquide dense, comme les menus).

### Le contraste avant la teinte

Les essais de chaque plateforme vérifient le texte au pire point de chaque sol (4,5:1 ; 7:1 sur le web). Ils ont
imposé quelques écarts, les mêmes en esprit partout :

- le texte d'un verre teinté de l'accent n'est pas toujours blanc : il prend la couleur qui tient (souvent sombre), ou
  l'accent prend son cran plus sombre (Apple, GPUI), ou se mêle à l'encre (web) ;
- sur un sol sombre ou teinté, aucun rouge ne tient sur le verre : le texte d'un bouton destructif (et d'un élément
  destructif de menu) y prend l'encre, sur un verre voilé de rouge ;
- la lumière de l'appui est bornée là où elle ferait tomber le texte (sur Aurore, le verre grossit sans s'éclairer).

### Les quatre rayons

| Rayon | Pour |
|---|---|
| capsule (`pill`) | ce qui commande : boutons, chips, étiquettes, segments, onglets d'une page, champs d'une ligne, interrupteur, bouton du curseur, toast et info-bulle d'une ligne |
| `glass` (22) | ce qui contient : panneaux, cartes, feuilles, pop-overs, menus, boîtes de dialogue, sélecteur de dates, palette |
| `row` (14) | ce qui est posé dans un verre : lignes et leur sélection, éléments de menu (22 − 8), champ de plusieurs lignes, vignettes |
| `md` (8) | les petites choses : case à cocher (presque ronde sur 16 points : voulu), code en ligne, squelette, petite pastille |

Avatars et pastilles de présence sont des cercles. Une forme dans une autre prend le rayon extérieur moins l'écart. Les
autres crans (xs, sm, lg, xl, xxl, xxxl) restent pour les apps. Le cadre graphite 3.x garde ses anciens rayons.

### Jetons ajoutés

`glass.control` : `pressScale` 1,04, `pressLight` 0,14, `prominent` 0,86 ; par sorte de verre, `hollow` (clair 0,10,
sombre 0,40, teinté 0,32), rôle `glassHollow`. La règle des rayons est dans le `_` de `radius`.

## Web (`@masmarino/gabarit`)

- `ButtonVariant` gagne `glass`, `glass-prominent`, `outline` (l'ancien `secondary`) et `plain` (l'ancien `ghost`).
  `secondary` et `ghost` sont désormais du verre liquide. **Ancien :** `variant="outline"` ou `variant="plain"`.
  `primary`, `danger`, `ghost-danger` et `link` gardent leur aspect, en capsule. Un bouton d'icône seule est rond.
- Classe globale `.gbt-chip` (sur un `<button>`), choisie par `aria-pressed`, `aria-selected`, `aria-checked` ou
  `.gbt-chip--selected`. `gbt-badge` neutre en verre fin, `gbt-badge--count` pour un compteur. `gbt-tag` garde sa
  couleur, en capsule.
- `gbt-segmented-control` et `gbt-tabs` : piste et lentille qui glisse (mesurée après le rendu ; au rendu serveur,
  l'option choisie est son propre verre). `gbt-tabs` n'est plus souligné.
- Champs (`gbt-input`, `gbt-textarea`, `gbt-tag-input`, `gbt-autocomplete`, `gbt-copy-field`, `gbt-secret-reveal`,
  déclencheur des dates) en creux. Les crochets `--gbt-field-ground`, `--gbt-field-border`, `--gbt-field-hollow`
  restent ; `--gbt-field-border-hover` n'est plus lu. **Ancien :** `--gbt-field-border: var(--border-color)` et
  `--gbt-field-ground: var(--bg-principal)`. Le déclencheur de `gbt-select` est un bouton de verre.
- `gbt-checkbox` dessine sa case (rayon 8, bord 3:1, coche en `--text-on-primary`) au lieu de celle du navigateur ; le
  balisage gagne `.gbt-checkbox__box` autour de l'entrée.
- `gbt-modal` et `gbt-drawer` en verre liquide dense ; dans la modale, le corps défile entre l'en-tête et le pied (le
  pied n'est plus `sticky`). Le calendrier des dates en verre de contenu épais.
- `gbt-search-bar` reste une capsule de verre liquide en relief (elle commande).
- Les valeurs de l'appui, de la teinte et du ressort sont en Sass dans `_glass.scss` (`$press-scale`, `$press-light`,
  `$prominent`, `$bouncy`) ; les crochets `--gbt-radius-chip`, `-badge`, `-menu`, `-tile`, `-search` restent.

## Bureau, GPUI (`rust/gabarit-gpui`)

- `GButton` : secondaire (le défaut) en verre clair, `ghost()` en verre fin, `primary()` teinté de l'encre ; nouveaux
  `.glass()` et `.glass_prominent()` (accent). `danger()` reste rouge plein. **Ancien :** `.solid()` (en capsule).
- `GCloseButton` en verre liquide partout ; `on_frame()` ne fait plus rien (gardé pour compiler), `framed()` garde le
  cadre graphite.
- GPUI ne sait pas agrandir une boîte : c'est le verre qui grandit autour du contenu, le texte ne bouge pas.
- Nouvelles matières : `GMaterial::LiquidThin`, `GMaterial::Tinted`, `GMaterial::Hollow` ; aides `control_glass`,
  `paint_lit_glass`, `press_light`, `hover_light`, `tinted_glass`, `accent_glass`, `ink_glass`, `legible_on_glass`… ;
  `motion::use_press` et `on_press` (l'appui dure jusqu'au relâchement).
- `GPicker::chips`, `GBadge`, menu déroulant, `GStepper`, `GGlassTabs` (lentille qui glisse), interrupteur, curseur,
  `GFieldFrame` en creux, toast et bulle d'aide en verre liquide.
- **Ce qui casse :** un `match` exhaustif sur `GButtonVariant` (2 de plus) ou `GMaterial` (3 de plus) ne compile plus.

## Apple (`GabaritApple`)

- `GButtonStyle` dessine le verre du système (`glassEffect`) : secondaire et fantôme en verre clair, principal teinté
  de l'encre, danger teinté de rouge. Nouveaux : paramètre `material: GButtonMaterial` (`.glass` par défaut, `.solid`),
  `.buttonStyle(.gGlass)` et `.buttonStyle(.gGlassProminent)`. **Ancien :** `GButtonStyle(variant:, material: .solid)`.
- Puces (`GPicker` en `.chips`) en verre, la choisie à l'accent ; `GBadge` en verre fin sur le verre épais du sol.
- Nouveau `GSegmentedControl(label, selection:, options:)` ; `GNavTabs` dessiné ainsi sur le sol (le cadre graphite
  garde le soulignement).
- Interrupteur et curseur : bouton en lentille de verre pendant l'appui.
- `GFieldFrame`, `GTextField`, `gFieldBox` en creux par `gGlassHollow(in:)` ; capsule, ou `row` sur plusieurs lignes
  (`GFieldFrame(multiline: true)`, `gEditorFrame`).
- `GMenu` au rayon 22, marge 8 ; sur un sol sombre, l'élément destructif prend l'encre.
- Briques publiques : `gLiquidControl(in:prominent:hovering:pressed:)`, `GLiquidControl`, `GProminentTint`,
  `gLiquidGlass(…, thin:)`, `GColor.prominentAccent(on:)`, `prominentDanger(on:)`, `prominentInk(on:)`,
  `onProminent(on:)`.
- **Ce qui casse :** l'aspect seulement ; `GFieldFrame` et `gFieldBox` perdent bordure et fond `gControlGround`.

## Android (Compose)

- `GButtonVariant` gagne `Glass` et `GlassProminent` ; `LocalGButtonLook` (`GButtonLook.Glass` par défaut) dessine
  `Primary` en verre teinté, `Secondary` et `Ghost` en verre clair. `Danger` reste rouge plein. **Ancien :**
  `CompositionLocalProvider(LocalGButtonLook provides GButtonLook.Solid)`.
- `GIconButton(glass = true)` et `GCloseButton` en cercles de verre ; `GMenuFace`, `GStepper`, le retour de
  `GSheetTitle` en verre.
- `GChip` en verre fin, la choisie à l'accent ; `GBadge` en verre fin voilé de l'état ; les compteurs restent opaques.
- Nouveau `GSegmentedControl(options, selection, title, onSelect, modifier)` ; `GNavTabs(style = …)` :
  `GNavTabsStyle.Glass` par défaut, `GNavTabsStyle.Underline` pour l'ancien.
- `GFieldFrame`, `GTextField` en creux par `Modifier.gGlassHollow(shape)`.
- `LocalGOnGlass` (posé par `GGlass`, les cartes de formulaire, les feuilles) : dans un verre, le verre d'un contrôle
  est une lentille qui ne redessine pas le sol. Avec `Modifier.gGlass`, l'app le pose elle-même.
- Sous les fonds 3.x (`GTheme(grounds = …)`), tout garde l'aspect 4.0.
- **Ce qui casse :** un `when` exhaustif sur `GButtonVariant` ne compile plus ; pas de réglage pour garder les
  anciennes chips ni les anciens champs.
