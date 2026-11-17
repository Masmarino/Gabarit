# Passer de Gabarit 4.0 à 4.1

La 4.1 met **les contrôles en verre liquide** et **uniformise les rayons**. La lumière suit la règle de la 4.0.1 : en
haut et en bas, jamais en diagonale. Le verre liquide reste réservé à ce qui commande et flotte : jamais une cellule de
liste, une bulle ou une carte.

Rien n'est retiré : ce qui casse est l'aspect par défaut, et chaque plateforme garde un chemin vers celui de la 4.0.

## 4.1.1 : le verre posé dans une surface claire

En clair, le verre blanc posé dans une surface déjà claire (une feuille, une carte, un verre épais) perdait ses bords :
chips non choisies presque invisibles, champ réduit à un trait, rangées de formulaire en plaques à peine visibles. La
4.1.1 garde le fond de la 4.1.0 et dessine **un bord de verre**, pas un trait : le relief a la lumière en haut et
l'ombre en bas, le creux l'inverse ; sur un sol clair, c'est la moitié sombre qui travaille.

- **Ce qui flotte** (chips non choisies, boutons de verre, face des menus de choix) : le reflet blanc du haut reste ;
  l'encre à 0,20 au bord du bas, un passage doux d'encre à 0,08 le long des côtés, une ombre de contact serrée (y 1,
  flou 3 en CSS) à l'ombre proche du sol. Les verres teintés (bouton principal, chip choisie) ne changent pas.
- **Le creux d'un champ** : pas de trait au repos ; l'encre à 0,14 sous le bord du haut (y 1, flou 2), une trace à 0,06
  tout autour, la lumière blanche au bord du bas. Le focus et l'erreur ne changent pas.
- **La carte d'une section de formulaire** : pas de cadre ; une ombre proche plus nette ; l'encre à 0,12 au bord du bas
  seulement.
- En clair, les ombres du verre sont un peu plus marquées partout : large 0,22 → 0,27, proche 0,06 → 0,10, verre
  liquide 0,20 → 0,26.
- Le fond, le regroupement et les espacements ne changent pas ; le sombre et les ambiances ne bougent pas. Un essai
  vérifie, sur chaque plateforme, que le bas d'une chip et l'ombre d'un creux se distinguent (1,3:1 au moins) de la
  surface, au pire point des sols clairs.
- Les valeurs sont des constantes de chaque plateforme (`GNestedEdgeValues` sur Apple, `GNestedValues` sur Android,
  `glass::nested` en GPUI, `_glass.scss` sur le web), pas encore des jetons.

Comment chaque plateforme sait qu'un contrôle est posé dans une surface :

- **GPUI** : `glass::in_glass(…)` (type `GInGlass`), posé par `GSheet`, `GGlass` et la carte d'une `GFormSection`. Une
  carte faite par l'app avec `relief::card` ou `glass_on` s'enveloppe elle-même : `in_glass(relief::card(…).child(…))`.
  Nouveaux : `is_in_glass`, `holds_controls`. En GPUI, la règle vaut pour tout verre liquide clair posé dans un verre
  clair (boutons fantômes, piste du contrôle segmenté et étiquettes compris).
- **Apple** : l'environnement public `gOnSurface`, posé par `gGlass`, `gCardDepth`/`gSurface` et `gSheetGround` (donc
  `gSheet`, `GSheetStack`) ; l'app n'a rien à faire. Le contour « plus de contraste » d'un champ prend l'encre au lieu
  de `GColor.border` (qui tombait sous 3:1).
- **Android** : `LocalGOnGlass` (feuilles, cartes de formulaire, `GGlass`), comme en 4.1.0. Avec `GFormCardSlice`,
  chaque tranche trace sa part du bord de la carte entière.
- **Web** : `glass()` et `floating-glass` posent des propriétés héritées `--gbt-nested-*` (par `light-dark()` : clair
  seulement), lues par les contrôles. Demande Chrome 123, Safari 17.5 ou Firefox 120.

Rien ne casse. Reste ouvert : sur les ambiances, l'anneau de focus à l'accent ne tient pas 3:1 autour d'un champ
(Apple le déclare comme défaut connu dans son essai).

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

## 4.1.2 : la main sur ce qui se clique

Correctif, rien à changer dans une app.

- **GPUI :** les rangées de menu et de sous-menu (`GMenu`, `GMenuItem` seul, les choix d'un `GPicker`) et le
  déclencheur de `GMenuButton` passent de la flèche à la main. Une rangée désactivée garde la flèche, un champ le
  curseur de texte. Les boutons de la fenêtre (`GWindowHeader`, sous Windows et Linux) gardent la flèche, comme ceux du
  système. Le reste avait déjà la main : rangées de la barre latérale, onglets, entrées du rail, chips, cases,
  interrupteurs, curseurs, sélecteurs, boutons, croix de fermeture, liens de formulaire.
- Essai `tests/curseur.rs` : chaque gestionnaire de clic de `src/` est à côté de la main (ou du curseur de texte), et la
  flèche n'est demandée que pour les boutons de la fenêtre. GPUI ne laisse pas un essai hors de sa crate lire le curseur
  qu'il demande au système : l'essai lit les sources.
- **Web :** la règle était déjà tenue (`cursor: pointer`, `not-allowed` quand c'est désactivé) ; le rond d'un bouton
  radio prend maintenant le curseur de son option (`cursor: inherit`).
- **Apple, Android :** rien (pas de curseur, ou le système le gère).
