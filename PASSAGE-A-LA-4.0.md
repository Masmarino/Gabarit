# Passer de Gabarit 3.x à 4.0

La 4.0 est le lot 1 du design immersif de SkollN (étude du 17/11/2026) : **un seul sol** sous toute la fenêtre,
**deux verres** posés dessus (le verre de contenu pour les panneaux, le verre liquide pour ce qui commande et flotte),
**moins de traits**. Le principe « A hairline stays the edge of things » devient **« Light is the edge of things »** :
un reflet en haut et une ombre douce à la place du trait ; le trait ne reste que sur les contrôles (le contour d'un
champ, 3:1 ; l'anneau du focus).

Cette note dit ce qui casse, plateforme par plateforme, et comment retrouver l'ancien comportement.

## Ce qui s'ajoute, partout (rien ne casse)

Depuis `tokens/gabarit.json`, par `tools/tokens.py` :

| Jeton | Valeur |
|---|---|
| `ground.ambiances` | les sols : `light`, `dark`, `black` (ceux de Gabarit) et des ambiances d'exemple (`aurore`, `lagune`, `braise`, `nuitPolaire`, `sousBois`, `laiton`, `givre`). Un dégradé de 2 à 4 arrêts à un angle, plus une lumière. |
| `glass.kinds` | trois sortes de verre (`light`, `dark`, `tinted`) : opacités du verre de contenu (`thin`, `regular`, `thick`), du verre liquide, des reflets et des ombres. |
| rôles des apps | `ink`, `ink2`, `ink3` (l'encre sur le sol, réglée sur le mode du sol), `groundVeil`, `glassThin`, `glassRegular`, `glassThick`, `glassLiquid`, `glassRim`, `glassRimEdge`, `liquidRim`, `liquidRimSoft`, `glassShadow`, `glassShadowNear`, `liquidShadow`. |
| rayons | `radius.glass` 22, `radius.row` 14 (les autres gardés). |
| espaces | `spacing.page` 20 et `spacing.gap` 16 ; 12 et 12 au téléphone (`spacingPhone`). |
| texte | `display` : Plex Sans Condensed, 30 au bureau, 34 au téléphone (en demi-gras : la graisse 700 n'est pas encore dans les polices de Gabarit). |
| mouvement | `page` (fondu et 8 points de montée, ressort 0,24 / 0,9), `ground` (fondu de 450 ms), `shared` (ressort 0,42 / 0,86). |
| le ton d'un sol | `GGroundSpec.tone()` (Swift, Kotlin), `tone::tone` (Rust) : pour un sol apporté par l'app, le voile, les opacités de l'encre et le blanc du verre liquide qui tiennent 4,5:1 (texte) et 3:1 (contours) au pire point. |

`tools/tokens.py --check` échoue désormais aussi si une ambiance ne tient pas ces contrastes.

## Web (`@masmarino/gabarit`)

Les projets Angular (Alume, Hangar, FerrisGit, FerrisTrace, le portfolio, le site de SkollN) sont encore sur
Gabarit 2.x : rien ne change pour eux tant qu'ils ne montent pas de version (ils passeront d'abord par les
changements de la 3).

Tout le web passe sur le sol et les deux verres, comme GPUI, Apple et Android. **L'ancien rendu est abandonné** : pas
d'option pour retrouver le cadre graphite, la carte opaque ou les traits entre les rangées. Seuls **`gbt-table` et
les formulaires** gardent leurs traits (contour d'un champ à 3:1, anneau du focus), comme le trait reste sur les
contrôles partout ailleurs.

### API retirées ou changées

- **`gbt-card`** : l'entrée **`variant` est retirée**, et le type **`CardVariant`** avec elle (plus d'`elevated`,
  d'`outlined`, de `bordered` ni de `glass` : la carte est du verre). Un gabarit qui passe `variant="…"` ne compile
  plus (gabarits stricts) : retirer l'attribut. L'attribut `data-variant` n'est plus posé.
- **`gbt-disclosure`** : `DisclosureAppearance` devient `'glass' | 'plain'` (`'bordered'` → `'glass'`, la valeur par
  défaut) : un verre fin sans bord.
- **`gbt-skeleton-list`** : l'entrée `divided` est retirée (plus de trait entre les rangées).
- **Mixin `frame-tokens`** et jeton **`--frame`** retirés ; jetons retirés : `--gbt-frame-sheen`, `--gbt-page-ground`,
  `--gbt-page-light`, `--gbt-bar-shade`, `--gbt-depth-bar`. Un projet qui posait ses propres parties sur le cadre
  graphite les pose sur le sol ou dans un verre.
- `index.scss` transmet `_grounds.scss` et `_glass.scss` : un projet qui a lui-même des mixins de ces noms (`ground`,
  `glass`, `liquid-glass`, `floating-glass`, `on-ground`, `on-liquid`, `ambiance-…`) sous l'espace `tokens` entre en
  conflit.

### Ce qui s'ajoute

- Les jetons du sol et des verres (`--gbt-ground`, `--gbt-glass-*`, `--gbt-liquid-blur`, `--gbt-depth-glass`,
  `--gbt-depth-liquid`, `--gbt-radius-glass`, `--gbt-radius-row`, `--gbt-ink*`…), et trois jetons du web pour le
  contraste sur le sol : `--gbt-ground-text-discret`, `--gbt-ground-border`, `--gbt-liquid-text`.
- Les recettes (`_glass.scss`) : `ground`, `glass($density, $shadow)`, `liquid-glass($fill)`, `floating-glass`,
  `on-ground`, `on-liquid`, `dense-when-asked`, `edged-when-asked` ; et les classes `.gbt-ground`, `.gbt-glass`
  (`--thin`, `--thick`), `.gbt-liquid-glass`. Le verre devient dense sous `prefers-reduced-transparency` et reprend un
  bord sous `prefers-contrast: more`.

### Rendus changés

- **`document-base`** : le `body` porte le sol (`--gbt-ground`, tenu à la fenêtre, `min-height: 100vh`) au lieu de
  `--bg-panel` éclairé en haut.
- **Sur le sol** (le `body` avec `document-base`, `gbt-app-shell`, `gbt-auth-panel`, `.gbt-ground`) et dans les
  verres, `--text-discret`, `--border-color` et `--color-success|warning|error-text` prennent des teintes plus
  marquées (`on-ground`), pour tenir 7:1 et 3:1 au pire point du sol : le texte discret prend la teinte du texte
  secondaire, les textes d'état celle qu'ils ont sur leur teinte, le contour d'un champ est un peu plus foncé en clair
  (`#78828f`) et plus clair en sombre (`#7a828e`). Sur le verre liquide, `--text-secondary` monte d'un cran.
- **`gbt-app-shell`** : sur le sol, rail et barre transparents, sans cadre graphite, sans ombre ; la page n'est plus
  une feuille à coin arrondi ; le lien courant est en verre liquide (rayon 14), son icône en rouille, sans trait ni
  lueur ; le bouton du tiroir est un rond de verre liquide ; le tiroir (étroit) est un verre épais. `--gbt-shell-header-bg`
  vaut le sol par défaut ; `--gbt-nav-active-mark` n'a plus de valeur par défaut.
- **`gbt-auth-panel`** et les pages du kit d'accès : le sol, le panneau en verre épais (rayon 22) sans bordure ;
  `gbt-git-field` lit les couleurs de la page. `--gbt-auth-panel-backdrop` vaut le sol par défaut.
- **`gbt-card`** : verre régulier (rayon 22, sans bordure), épaissi au survol, sans ombre quand on appuie.
  `--gbt-card-radius` vaut 22px.
- **`gbt-list-card`**, **`gbt-stat-tile`**, la réserve de **`gbt-stat-grid`**, **`gbt-accordion`** : verre régulier,
  rayon 22, sans bordure ; rangées arrondies, sans trait entre elles.
- **Plus de traits** : entre les rangées de `gbt-list-row` et de `gbt-skeleton-list`, entre deux `gbt-panel` (1,5rem
  d'espace), entre les éléments de `gbt-accordion`, sous `gbt-page-header` (titre à 30px), sous les rangées de
  `gbt-nav-tabs` et de `gbt-tabs`, au-dessus de l'aparté empilé de `gbt-page-layout`, au-dessus de `gbt-auth-footer`,
  entre les rangées de `gbt-mfa-settings` et de `gbt-passkey-settings`, sous les titres et autour du code de
  `gbt-markdown-view`, sous la navigation repliée de `gbt-docs-nav`.
- **`gbt-nav-tabs`** vertical : l'onglet ouvert est en verre liquide, sans barre rouille.
- **Ce qui flotte** — `gbt-menu`, `gbt-popover`, `gbt-tooltip` et `.gbt-tooltip`, la bulle du rail réduit, les listes
  de `gbt-select`, `gbt-autocomplete`, `gbt-date-picker`, `gbt-date-range-picker`, le débordement de
  `gbt-avatar-group`, les bulles des graphiques et de `gbt-sparkline`, le panneau de `gbt-search-bar` : verre liquide
  dense (`floating-glass`), sans bordure ; rayon 12 (8 pour les bulles, 22 pour le panneau de recherche). La bulle
  d'aide n'est plus inversée.
- **`gbt-toaster`** : capsule de verre liquide dense, texte de la page (avant : pavé d'encre `--bg-inverse`).
- **`gbt-command-palette`** : verre liquide dense, rayon 22, sans bordure ni traits ; son déclencheur est une capsule
  de verre liquide, comme **`gbt-search-bar`** (sans bordure ; ouverte, elle s'épaissit et prend l'anneau du focus).
- **`gbt-modal`**, **`gbt-drawer`** : verre épais (rayon 22), en-tête et pied sans trait ni fond à eux.
- **`gbt-alert`** : plus de bord ; `neutral` est un verre fin. **`gbt-disclosure`** : verre fin.
- **`gbt-tree`** : l'élément choisi est sur verre épais avec reflet. **`gbt-job-graph`** : nœuds en verre fin.
- **`gbt-empty-state`** (pastille de l'icône), les invites de `gbt-mfa-settings` et de `gbt-passkey-settings`, les
  codes de secours, le nom créé de `gbt-auth-register` : verre fin, sans bordure.
- **Storybook** : le fond de page est le sol.

### Ce qui ne change pas

- **`gbt-table`** et **les formulaires** (`gbt-input`, `gbt-textarea`, `gbt-select` fermé, `gbt-file-upload`, cases,
  boutons radio, interrupteurs, `gbt-segmented-control`, `<gbt-card form>` et ses traits), les boutons, les badges et
  les puces gardent leurs traits.

### Ce qu'un projet Angular doit faire

1. Inclure `tokens.document-base` (ou `@include tokens.ground` sur sa racine) et retirer ses fonds opaques de page.
2. Retirer `variant` de ses `gbt-card` ; `appearance="bordered"` de ses `gbt-disclosure` ; `divided` de ses
   `gbt-skeleton-list` ; `frame-tokens` et `--frame` de ses feuilles de style.
3. Ses propres panneaux : `@include tokens.glass` ; ce qui flotte : `@include tokens.floating-glass`.

### Limites

- `background-attachment: fixed` (le sol tenu à la fenêtre) n'est pas suivi par Safari sur iPhone : le sol y défile
  avec la page.
- Le texte sur verre tient 7:1 au-dessus du sol ; au-dessus d'un contenu quelconque (un menu au-dessus d'une image),
  seul le remplissage dense le protège.
- Un texte d'état n'a pas sa place sur le verre liquide clair (`on-liquid`) : il flotte dans le remplissage dense.

## Les apps natives : les nouveaux rôles

- **Swift** (`GColorValues`, `GColor`), **Kotlin** (`GColors`) et **Rust** (`GColorRoles`) gagnent les rôles du
  tableau plus haut. En Kotlin et en Rust, ce sont de nouveaux champs : **un `GColors(…)` ou un `GColorRoles { … }`
  construit à la main par une app ne compile plus** ; partir de `GLightColors.copy(…)` / `tokens::LIGHT` et changer les
  champs voulus. `GTypography` (Kotlin) gagne `display`, en dernier paramètre (avec sa valeur par défaut).
- `GSpacing.page` / `gap` valent 12 sur iOS et sur Android, 20 et 16 ailleurs.
- GTK et WinUI reçoivent les rôles (`@define-color g_glassRegular…`, `GGlassRegularBrush`…) et, pour WinUI, le sol
  (`GGroundBrush`, `GGroundLightBrush`), sans composant nouveau.

## Bureau, GPUI (`rust/gabarit-gpui`)

Aucune API publique n'est retirée ; des rendus par défaut changent (c'est la 4.0), et quelques signatures gagnent un
sens nouveau. Pour chaque point : comment retrouver l'ancien comportement.

### Thème (`theme.rs`)

- `GTheme` gagne des champs publics : `bars`, `ground`, `tone`, `own_ground`, `reduce_transparency`,
  `increase_contrast`. Un code qui construit `GTheme { … }` à la main ne compile plus : passer par `GTheme::new` ou
  `GTheme::with_ground`.
- `GTheme::frame` reste le cadre graphite 950 (ses valeurs n'ont pas changé ; `GFrameColors::new()` privé devient
  `GFrameColors::graphite()` public). Les barres ne le lisent plus par défaut : elles lisent `GTheme::bars` (encre du
  sol, sans fond). Ancien rendu : `.framed()` sur la barre, ou `theme.bar_colors(true)`.
- `GColorRoles` a 15 rôles de plus (générés : `ink`, `ink_2`, `ink_3`, `ground_veil`, `glass_*`, `liquid_*`…) : un
  code qui construit un `GColorRoles` à la main doit les donner.
- `set_appearance` garde le sol de l'app s'il y en a un (le sol porte son propre mode) : pour revenir au sol de
  Gabarit, `set_ground(None, appearance, cx)`.
- Sur un sol d'app (`set_ground(Some(…))`), `text_primary`, `text_secondary`, `text_discret` prennent l'encre du sol
  (`ink`, `ink_2`, `ink_3`).

### Relief (`relief.rs`)

- `card(radius, cx)` : même signature, mais c'est un **verre `regular`** (le sol flouté dessous, reflet d'un point en
  haut + contour d'un demi-point, ombre `shadow.glass` en deux couches), **sans bordure `hairline`** ni fond
  `surface`. Ancien rendu : `relief::surface_card(radius, cx)` (nouveau).
- `card_layers` (interne) est retiré ; `card_shadow` reste mais n'est plus utilisé par `card`.
- `page_ground(cx)` : même signature, mais peint **le sol** de la fenêtre (son image, à sa place) au lieu du fond gris
  éclairé en haut. Ancien rendu : `relief::lit_background(cx)` (nouveau). Attention : `page_ground` met le sol en
  premier enfant ; une page qui défile doit défiler dans un enfant (sinon le sol défile avec elle).
- Le principe écrit « A hairline stays the edge of things » devient « Light is the edge of things » : le trait ne
  reste que sur les contrôles.

### Formulaires (`form.rs`)

- `GFormSection` : **plus de séparateurs** entre les rangées par défaut (rangées espacées de 2) ; la carte est un
  verre. Ancien rendu : `.separated()` (nouveau) pour le trait ; la carte opaque n'a pas d'option (voir `surface_card`).
- `GForm` avec sol : le sol est peint hors du défilement (il ne défile plus avec la page).
- `GForm::without_ground()` ne change pas de sens ; **dans une feuille, utiliser `GForm::on_glass()`** (nouveau) :
  ses sections deviennent des verres `nested` (sans fond flouté ni ombre), sinon elles peignent le sol flouté sous
  elles, comme un trou dans la feuille.

### Barres (`bars.rs`)

- `GWindowHeader` : **transparent sur le sol** par défaut (ni fond graphite, ni trait du bas, ni ombre), titre à
  l'encre du sol. Ancien rendu : `.framed()`.
- `GPageBand` : transparent, l'icône sur un carré de **verre liquide** (rayon 14). Ancien rendu : `.framed()`.
- `GRailItem` : sur le sol, texte `ink_2` (`ink` pour la page ouverte), icône de la page ouverte en rouille, la page
  ouverte sur **verre liquide** (rayon `radius::ROW`), plus de trait rouille à gauche ; la pastille est en rouille.
  Ancien rendu : `.framed()` (et un conteneur `bg(theme.frame.ground)`).
- `GBarTitle` : encre du sol. Ancien rendu : `.framed()`.
- `GNavTabs` : plus de trait `hairline` sous toute la rangée (seul le trait rouille de l'onglet ouvert reste). Ancien
  rendu : `.separated()`.
- `GSidebarRow` : la section choisie est sur **verre épais** avec reflet (au lieu du fond rouille translucide qui
  luisait), son texte à l'encre (plus en rouille), son icône toujours en rouille ; son détail en `text_secondary`.
  Pas d'option pour l'ancien rendu.
- `frame_ground(cx)` reste (le dégradé graphite), utilisé seulement par `framed()`.

### Boutons (`button.rs`)

- `GCloseButton::on_frame()` : un rond de **verre liquide** à l'encre du sol (plus de contour graphite). Ancien
  rendu : `.framed()` (nouveau ; implique `on_frame`).

### Feuilles, menus, retours

- `GSheet` : **verre épais**, sans contour `hairline`, sans ombre flottante, rayon `radius::GLASS` (22, au lieu de
  20) ; plus de fond gris de page. Pas d'option pour l'ancien rendu.
- Menus (`GMenu`, `GContextMenu`, la pastille au-dessus) : `card_material` est en **verre liquide** (plus de fond
  `surface` opaque ni de contour) ; ombre courte du verre liquide. `menu_shadow` reste public mais n'est plus utilisé.
- Bulle d'aide (`GTooltip`) : **verre liquide**, rayon `MD`, texte `ink` (plus `surface` + `hairline` + ombre
  flottante, texte secondaire).

### Mouvement (`motion.rs`)

- Ajouts seulement : `PAGE`, `SHARED` (ressorts), `GROUND` (0,45 s), `GMotion::page()`, `GMotion::ground()`.

### Nouveau (rien à migrer)

- `GGround`, `GGroundPaint`, `GBackdrop` (`ground.rs`) ; `GGlass`, `GLiquidGlass`, `GGlassButton`, `GGlassTabs`,
  `GMaterial`, `GGlassDensity`, `glass_on`, `glass_layer`, `paint_glass` (`glass.rs`) ; `GInsetList` (`list.rs`) ;
  `theme::set_ground`, `set_reduce_transparency`, `set_increase_contrast`, `ground_colors`.
- `Cargo.toml` : version `4.0.0` ; nouvelle dépendance `image` 0.25 (celle de GPUI, sans fonction en plus).

### Ce qu'une app doit faire pour passer à la 4.0

1. Poser `GGround` sous toute la fenêtre (la racine), et retirer ses fonds opaques (`bg(colors.background)`,
   `page_ground` sous le sol).
2. Ses panneaux en `GGlass` (ou `relief::card`), ses formulaires de feuille en `GForm::on_glass()`.
3. Garder `framed()` là où le cadre graphite est voulu.

### Limites connues

- Le verre floute **le sol**, pas ce qui est entre lui et le sol (un menu sur une carte montre le sol flouté sous lui,
  pas la carte).
- Les images du sol sont gardées (au plus 48) et jamais retirées de l'atlas de GPUI : un redimensionnement de fenêtre
  qui passe par beaucoup de proportions en crée quelques-unes de plus (≈ 1 Mo chacune).
- La lumière du sol a pour rayon une fraction du **grand côté** de la fenêtre ; le web l'écrit en `vmax`, ce qui
  revient au même pour un sol qui couvre la fenêtre.

## Apple (`GabaritApple`)

### API renommées, retirées ou changées

- **`GGround` (struct de peinture du fond de page) → `GPagePaint`**, et la valeur d'environnement **`gGround` (de type
  `GGround`) → `gPagePaint`**. Les noms `GGround` et `gGround` désignent maintenant le sol : `GGround` est une vue,
  `\.gGround` un `GGroundSpec?`, `.gGround(_:)` un modificateur. Pour retrouver l'ancien : remplacer
  `.environment(\.gGround, GGround { … })` par `.environment(\.gPagePaint, GPagePaint { … })` ; `GGround.plain` →
  `GPagePaint.plain`.
- **`gCardDepth(_:fill:)`** : `fill` passe de `Color = GColor.surface` à `Color? = nil`. Sans `fill`, la carte est du
  verre de contenu (`gGlass(.regular)`). Les appels qui passaient une couleur ne changent pas. Ancien rendu :
  `gCardDepth(shape, fill: GColor.surface)`.
- **`GTab` et `GTabBar`** existent aussi sur Mac (avant : iOS seulement). Ajout, rien ne casse.
- **La valeur d’environnement `gGroundPainted`** : même nom, sens élargi : vrai sous `.gGround(_:)` et dans une feuille (verre
  épais). `GSheetStack` et `gSheet` ne le remettent plus à faux.

### Rendus par défaut changés (et comment retrouver l'ancien)

- **Le cadre** : plus de graphite 950 par défaut. Barre du haut transparente sur le sol (iPhone : `toolbarBackground`
  caché, bord de défilement doux), boutons de barre dans le Liquid Glass du système (`sharedBackgroundVisibility`
  automatique), titres dans l'encre du sol ; `GPageBand`, `GWindowHeader`, `GAppShell`, `GRailItem`, `GRailButton`,
  `GRailSquareButton` posés sur le sol (rail courant et boutons en verre liquide, page sans plaque arrondie ni ombre
  de bandeau) ; `GTabBar` devient une capsule flottante de verre liquide ; `GCloseButton` un rond de verre liquide
  sans liseré ; `GNavTabs` sans trait sous les onglets. **Ancien : `.gFrameStyle(.graphite)`** (à la racine ou sur
  la vue).
- **`GAppShell`** et **`GWindow`** posent eux-mêmes le sol (`gGround`) s'il n'est pas déjà posé. Le paramètre
  `ground: GShellPageGround` ne sert plus qu'en graphite.
- **`gPageGround()`** : par défaut ne peint rien si un sol est déjà posé au-dessus, sinon peint le sol. Ancien (fond
  plat `GColor.background` éclairé en haut) : `.environment(\.gPagePaint, .plain)`.
- **Formulaires (`GForm`)** : cartes en verre de contenu (rayon 22), **sans séparateurs**, rangées espacées de 2, sans
  bordure ; survol arrondi. Titres, phrases et libellés dans l'encre du sol (`.gInk`, `.gInk2`). Ancien :
  **`.gSeparated()`** sur le `GForm` (toutes les sections) ou sur une `Section` (rayon 12, surface opaque, liseré,
  traits entre rangées). Le `Form` du système (`gFormLayout` faux) prend la couleur du verre régulier pour ses rangées.
- **`gSurface`** : plus de bordure (ni grise, ni teintée) ; carte en verre. Ancien : `gCardDepth(shape, fill:
  GColor.surface)` + `.overlay { shape.strokeBorder(GColor.hairline) }`.
- **`GSidebarRow`** : la rangée choisie est en verre épais, son nom dans l'encre (avant : fond rouille doux, texte
  rouille, lueur). Pas d'option ; `GSidebarRow.selectedFill` reste public pour qui veut le dessiner à la main.
- **Feuilles (`GSheetStack`, `gSheet`)** : fond = le sol sous un verre épais (`gSheetGround()`, `presentationBackground`
  sur iPhone), plus de fond de page gris. Pas d'option directe ; `.presentationBackground(GColor.background)` sur la
  feuille redonne un fond plat.
- **Menus (`GMenu`)** : verre liquide, lignes sans trait, espacées de 2 (avant : surface opaque, traits). **Menu de
  `GPicker`** : plus de trait entre les lignes.
- **Messages passagers (`gToastOverlay`)** : capsule de verre liquide dans l'encre du sol (`GToastLabel`), au lieu du
  pavé d'encre primaire.
- **Tiroir (`gSideDrawer`)** : verre épais aux coins droits arrondis, sans trait au bord.
- **Recherche rapide (`GCommandPalette`)** : verre épais (rayon 22), sans liseré ni trait sous le champ.
- **Contrôles** (champ, menu de `GPicker`, puces, `GStepper`, bouton secondaire, `gFieldBox`) : leur fond devient
  `.gControlGround` (voile blanc : 70 % sur sol clair, 7 % sur sombre, 12 % sur ambiance) au lieu de
  `GColor.background` / `GColor.surface`. Leur liseré (3:1) reste.
- **`GSkeleton`** : voile de l'encre (9 %) au lieu du gris de piste.
- **Principe écrit** : « A hairline stays the edge of things » → « Light is the edge of things » (`GRelief.swift`,
  `GGround.swift`).

### La galerie (`galerie/apple`)

- `swift run GabaritGallery <dossier> [sections…]` ouvre maintenant une vraie fenêtre par section et apparence (clair,
  sombre, aurore) et la capture par `screencapture -l` (fichiers `apple-<section>-<apparence>.png`). L'ancien rendu
  par `ImageRenderer` (fichiers `<section>-light|dark.png`) est retiré : il ne dessinait pas le verre.

## Android (Compose)

### API

- **`GGrounds` (la classe des fonds 3.x) devient `GThemeGrounds`**. Le nom `GGrounds` est pris par l'objet généré des ambiances (`GGrounds.light`, `GGrounds.aurore`…). Les paramètres restent les mêmes : `GTheme(grounds = GThemeGrounds(...))`, `G.grounds`. Pour s'adapter : renommer le type.
- **`GColors` (généré)** prend 15 rôles de plus, en fin de constructeur : `ink`, `ink2`, `ink3`, `groundVeil`, `glassThin`, `glassRegular`, `glassThick`, `glassLiquid`, `glassRim`, `glassRimEdge`, `liquidRim`, `liquidRimSoft`, `glassShadow`, `glassShadowNear`, `liquidShadow`. Un `GColors(...)` construit à la main ne compile plus ; `GLightColors.copy(...)` continue de marcher.
- **`GTypography` (généré)** : `display` est ajouté en dernier paramètre. Les appels par position ne cassent pas.
- **`GTheme` / `GScheme`** : nouveaux paramètres `ground`, `reduceTransparency` et `highContrast`, tous avec une valeur par défaut. Si l'app passe un `ground`, c'est le mode de ce sol qui décide du clair ou du sombre (et donc de l'encre), plus le paramètre `dark`.
- **`GBottomSheet(ground = …)`** : la valeur par défaut passe de `G.backgroundOpaque` à `Color.Unspecified`, ce qui veut dire « verre épais ». Pour retrouver 3.x : `ground = G.backgroundOpaque`.
- **`GSearchField`** : nouveau paramètre `glass`, qui vaut `!LocalGFormCard.current` par défaut. Pour retrouver le champ 3.x : `glass = false`.
- **`GTabBar`, `GTopBar`, `GRail`, `GPageBand`** : nouveau paramètre `style: GFrameStyle`, `Ground` par défaut. Pour retrouver le cadre 3.x : `style = GFrameStyle.Graphite`, ou `CompositionLocalProvider(LocalGFrameStyle provides GFrameStyle.Graphite)` pour tout un écran. Autres paramètres ajoutés : `GTopBar(floating = …)` et `GTabBar(backdrop = …)`.
- **`GFormSection` (les deux formes) et `gFormSection`** : nouveau paramètre `separated`, `false` par défaut.
- **Ajouts** (rien ne casse) : `GGround`, `Modifier.gGround()`, `GGroundScene`, `GGroundBlur`, `Modifier.gGlass(density, shape, shadow)`, `GGlass`, `GGlassDensity`, `GGlassShadow`, `Modifier.gLiquidGlass(shape, backdrop, shadow)`, `GLiquidGlass`, `GBackdrop`, `rememberGBackdrop()`, `Modifier.gBackdropSource()`, `LocalGOnLiquid`, `GInsetList`, `GInsetRow`, `LocalGRowDividers`, `Modifier.gSurfaceCard()` (la carte 3.x), `G.ground`, `G.groundTone`, `G.reduceTransparency`, `G.highContrast`, `gSystemReduceTransparency()`, `gSystemHighContrast()`, `GFrameStyle`, `LocalGFrameStyle`.

### Rendu par défaut

- **Page** : `gPageGround()` peint le sol (dégradé, lumière, voile), placé comme il s'étend sous toute la fenêtre. Avant, c'était le gris de `background` avec la lumière du haut. Avec des `GThemeGrounds`, le rendu 3.x est inchangé.
- **Cartes** : `gCard()` devient un verre `regular`, rayon 22, sans contour, avec une ombre large. Avant : surface opaque, contour `hairline`, rayon 12. Pour retrouver 3.x : `gSurfaceCard()`. `GFormCardSlice` suit la même règle (rayon 22).
- **Séparateurs** : `GFormSection` n'a plus de traits entre les rangées (elles sont espacées de 2) et `gRowDivider` / `divider = true` ne dessinent plus rien. Pour retrouver 3.x : `GFormSection(separated = true)` ou `LocalGRowDividers provides true`. Les traits de `GMenu`, de la liste de `GMenuField`, de la recherche rapide et du tiroir disparaissent aussi.
- **Cadre** : la barre du haut, le rail et le bandeau sont transparents sur le sol, à l'encre (`ink`). `GFrameButton` devient un rond de verre liquide. La barre d'onglets devient une pilule de verre liquide qui flotte au-dessus de la barre de navigation : l'onglet choisi est sur une pilule plus claire, la pastille de nombre est en rouille. Pour retrouver 3.x : `GFrameStyle.Graphite` (barre d'onglets plate 3.x, bandes graphite 950).
- **Feuilles** : verre épais, rayon 22 (avant : `backgroundOpaque`, rayon 14). Le tiroir latéral devient aussi du verre épais, sans trait.
- **Menus et boîtes de dialogue** (`GDropdownMenu`, `GMenuField`, `GAlert`, `GErrorAlert`, recherche rapide) : fond `G.surfaceOpaque`, c'est-à-dire le verre épais posé sur le milieu du sol, opaque puisque ce sont d'autres fenêtres. Bord de lumière en dégradé, rayon 16 pour les menus et 22 pour les boîtes. Avant : surface et `hairline`.
- **`G.surfaceOpaque` et `G.backgroundOpaque`** sont calculés à partir du sol (sauf avec des `GThemeGrounds`).
- **Messages de passage** (`GToastHost`) : pilule de verre liquide à l'encre. Avant : encre d'un bouton principal.
- **Champs** : contour au repos en `ink3` (3:1), y compris dans une carte. En 3.x, le contour était `hairline`, et il n'y en avait pas dans une carte. Le fond est un blanc léger (0,7 en clair, 0,07 en sombre, 0,12 sur une ambiance) au lieu de `background`. Même fond pour la face de `GMenuField`, les puces et le compteur.
- **Bouton secondaire** : fond clair des champs avec un contour `ink3`. Avant : `surface`, `border` à 60 %.
- **`G.colors.track`** devient un voile de l'encre (14 %), donc translucide. Ça touche les interrupteurs, les curseurs, les squelettes et les barres de progression.
- **Ombres** : sur le sol, l'ombre de `gRaised` / `gResting` est peinte autour de la forme, jamais dessous. Avant : l'ombre du système dès que la surface était opaque.
- **État vide** : la vignette de l'icône devient un verre `thin` de rayon 22. Avant : surface et contour.
- **Mouvement** : tous les `tween` / `spring` codés en dur sont remplacés par `GMotion`. Appui : `linear` puis `quick` (avant 70 et 160 ms). Interrupteur : `quick` pour la couleur, `bouncy` pour le bouton (avant 180 ms). Tiroir : `pane` (avant 260 ms). Message de passage : `smooth`, `pane`, `quick`. Seules restent les boucles du squelette (1 400 ms) et des points d'écriture (1 050 ms), qu'aucun jeton ne décrit.
- **Couleurs du texte** sur un sol de l'app (`GTheme(ground = …)`) : `textPrimary`, `textSecondary` et `textDiscret` prennent les valeurs de l'encre du sol (`ink`, `ink2`, `ink3`).

## Ce qui reste ouvert

- La graisse 700 de Plex Sans Condensed (pour `display`) n'est pas dans les polices de Gabarit : `display` est en
  demi-gras tant que le fichier n'est pas ajouté.
- L'accent n'est pas encore décalé quand il est trop proche d'une couleur du sol (l'orange sur Braise) : c'est pour
  le lot des ambiances SkollN+.
- GTK et WinUI reçoivent les jetons, pas encore les composants du sol et du verre.
- Le paquet GabaritGtk ne se construit que sous Linux (la CI le fait dans un conteneur) : il n'a pas été construit
  sur le Mac pour cette version ; seuls ses fichiers de couleurs générés ont changé.
