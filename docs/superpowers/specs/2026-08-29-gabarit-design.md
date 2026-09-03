# Gabarit — Design

## Contexte et objectif

Design system Angular open source, extrait des frontends de
[Hangar](../../../../Hangar) et [FerrisGit](../../../../FerrisGit), et
consommé par ces deux applications ainsi que par
[FerrisTrace](../../../../FerrisTrace).

Le design system existant, `@skolln/ui` (`~/Projects/design-system`), est
publié sur un Nexus privé sous licence UNLICENSED : **il est inutilisable
dans un dépôt public**. C'est la raison d'être de Gabarit. Conséquence
observable aujourd'hui : Hangar et FerrisGit ont chacun un dossier
`frontend/src/app/ui/` local — 11 composants d'un côté, 5 de l'autre, dont 5
identiques — et `Hangar/frontend/src/styles/tokens.scss` porte le commentaire
« Copiée ligne à ligne depuis `_palette.scss` ».

Le nom : un gabarit est la pièce de référence dont on se sert en menuiserie
et en aéronautique pour que toutes les pièces sortent identiques. Vérifié
libre sur npm le 29 août 2026.

**Gabarit se construit avant FerrisTrace.** C'est FerrisTrace qui dicte
l'essentiel du besoin en dataviz, mais c'est Gabarit qui doit exister
d'abord.

## Périmètre

**Dans le scope :**

- Couche de tokens (palette brute, couche sémantique, utilitaires)
- 11 composants d'interface extraits de Hangar
- Une couche de primitives de graphique en TypeScript pur
- Les composants de graphique, existants et nouveaux
- `IconRegistry` injectable
- Storybook comme atelier et documentation
- **La conformité RGAA 4.1.2** des 35 critères qui dépendent de la librairie,
  la matrice de responsabilité des 71 autres, et l'outillage de vérification
- **La migration de Hangar**, qui fait partie du projet

**Hors périmètre :**

- Formulaires réactifs enveloppés
- Data-grid (tri, pagination, virtualisation)
- Sélecteur de date-heure complet
- Système de notifications / toasts
- Layout applicatif — `app-shell` reste dans chaque application, il est trop
  spécifique
- Internationalisation — voir « Contrat de librairie »

## Décisions

- **Audience : les trois projets d'abord.** Publié sur npm sous licence
  libre parce que les applications qui le consomment le sont, mais l'API
  sert ces trois besoins. Versionné en `0.x`, **aucune promesse de semver
  avant la 1.0**, annoncé dans le README. Ce sont FerrisGit, Hangar et
  FerrisTrace qui dictent l'API, pas des usages hypothétiques.
- **Dataviz faite maison, zéro dépendance.** Ni d3, ni ECharts, ni
  ngx-charts. Cohérent avec le style hand-rolled assumé des trois projets.
  Contrepartie explicitement acceptée : les graduations lisibles et le
  formatage temporel multi-échelle deviennent des livrables à part entière,
  testés unitairement, et non des utilitaires écrits au fil de l'eau.
- **Palette existante reprise, six tokens corrigés pour l'accessibilité.**
  L'indigo `#0d1ed3` et l'emerald `#55b48b` ne bougent pas. Mais l'audit de
  contraste a relevé sept échecs aux critères RGAA 3.2 et 3.3 : la palette
  telle quelle ne peut pas être livrée. Voir « Accessibilité ». La structure
  à deux niveaux (palette brute → couche sémantique en custom properties)
  est conservée, donc la surcharge par une application reste possible de
  fait, même si ce n'est pas une fonctionnalité annoncée.
- **Accessibilité : RGAA 4.1.2, niveau AAA sur le contraste du texte.**
  Exigence structurante, pas une finition. Voir la section dédiée.
- **Icônes par registre injectable.** Le `Record` figé de SVG lucide copiés
  en dur dans `icon.ts` est remplacé par un `IconRegistry` où l'application
  enregistre ses propres icônes. Gabarit ne fournit que celles dont ses
  propres composants ont besoin.
- **Préfixe de sélecteur `gbt-`**, ce qui rend le renommage depuis `hg-`
  mécanique.
- **Licence MIT.** Gabarit est une librairie destinée à être intégrée : une
  licence permissive est la seule qui n'impose rien à ses consommateurs. Les
  applications (FerrisGit, Hangar, FerrisTrace) partent en AGPL-3.0 —
  répartition retenue par Grafana et par Sentry avant sa bascule.

## Structure du workspace

```
gabarit/
├── projects/gabarit/src/lib/
│   ├── tokens/          palette brute, couche sémantique, utilitaires
│   ├── primitives/      TypeScript pur — échelles, graduations, formats
│   ├── components/      les 11 composants d'interface
│   └── charts/          socle et composants de graphique
├── .storybook/
└── docs/superpowers/specs/
```

Build par `ng-packagr`, catalogue et documentation par Storybook. Storybook
n'est pas un confort : la moitié de Gabarit est de la dataviz, et un
graphique doit être vu dans ses états limites — aucune donnée, un point,
dix mille points, valeurs négatives, thème sombre. Sans catalogue
interactif, ces cas ne sont jamais regardés avant la production.

## Couche 1 — Tokens

`tokens.scss` de Hangar (273 lignes) repris et scindé en trois fichiers :

- **Palette brute** — `--brand-*`, `--emerald-400`, `--grey-*`, `--red-*`,
  `--amber-*`, `--green-*`. Jamais utilisée directement par un composant.
- **Couche sémantique** — `--primary`, `--surface`, `--border-color`,
  `--text-primary`, `--text-secondary`, `--text-discret`, `--text-on-color`.
  C'est le seul niveau que les composants consomment, et le seul point de
  surcharge pour une application.
- **Utilitaires** — `sr-only`, bandeau de retour de formulaire.

Thème clair/sombre piloté par `prefers-color-scheme` — comportement actuel
des deux fronts, conservé : **aucune bascule manuelle n'est exposée au
produit**.

Les 30 déclarations du thème sombre vivent dans un mixin appliqué à deux
sélecteurs : `@media (prefers-color-scheme: dark)` et
`:root[data-theme='dark']`. Le second n'existe que pour l'outillage — il
permet à Storybook, aux tests et à un futur audit de rendre le thème sombre
sans dépendre de la préférence du système d'exploitation. Rien dans les
applications ne pose cet attribut, donc le comportement produit est
inchangé. Sans ce hook, les stories « Sombre » n'affichent qu'un fond
sombre garni de tokens clairs, et la moitié de la palette n'est jamais
vérifiée à l'œil.

**Corrections d'accessibilité.** Six tokens sémantiques changent de valeur
et trois sont ajoutés (`--color-error-text`, `--color-success-text`,
`--color-warning-text`) — voir « Accessibilité ». Les échelles brutes de la
palette ne bougent pas.

**Ajout nécessaire : une échelle catégorielle de séries.** Elle n'existe pas
aujourd'hui — `line-chart` retombe sur `var(--primary)` pour toutes ses
séries.

> **Corrigé le 30/08/2026.** Cette section demandait « six à huit teintes,
> distinguables en deutéranopie, contrastées à 3:1 ». **Mesure faite : c'est
> impossible.** En partant d'Okabe-Ito, référence en la matière, l'écart
> minimal entre paires vues en deutéranopie tombe à ΔE 11,7 à six teintes et
> 2,9 à huit — indistinguables. Seules **trois** séries tiennent
> confortablement (ΔE 58,3). Et le critère 3.1 rendait de toute façon la
> couleur insuffisante à elle seule. La décision retenue est de limiter à
> trois séries : voir `2026-08-30-gabarit-0.2-dataviz-design.md`.

## Couche 2 — Composants d'interface

Extraction fidèle des 11 composants non graphiques de Hangar : `button`,
`card`, `icon`, `input`, `select`, `checkbox`, `modal`, `tabs`, `tab`,
`table`, `search-bar`.

Ils sont déjà `standalone`, en signaux (`input()` / `output()`) et
`OnPush` : le travail se limite à quatre choses — renommer le préfixe,
externaliser les chaînes en dur, brancher l'`IconRegistry`, et corriger les
deux défauts d'accessibilité relevés (`table` sans équivalent clavier ni
`caption`, `card` qui impose un `<h2>`). Aucune refonte d'API au-delà de ça
n'est nécessaire, et aucune n'est souhaitable.

## Couche 3 — Dataviz

### Étage 1 — primitives

TypeScript pur, aucun composant Angular, aucune dépendance au DOM. C'est ce
qui rend le choix « zéro dépendance » tenable : ces fonctions se testent
comme des fonctions mathématiques.

| Primitive                                                          | Rôle                                                                                               |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `linearScale`, `timeScale`, `bandScale`                            | projection domaine → pixel, **et son inverse** (nécessaire au survol : pixel → donnée)             |
| `niceTicks(min, max, count)`                                       | graduations lisibles — `0 / 5 / 10`, jamais `0 / 3,7 / 7,4`                                        |
| `timeTicks(start, end, largeur)`                                   | granularité (minute/heure/jour/semaine/mois) selon la largeur disponible, **et le format associé** |
| `formatNumber`, `formatCompact`, `formatDuration`, `formatPercent` | locale passée en paramètre, jamais déduite                                                         |
| `linePath`, `areaPath`                                             | génération de l'attribut `d`                                                                       |

`niceTicks` et `timeTicks` sont les deux points durs du projet. L'algorithme
de `niceTicks` tient en une vingtaine de lignes — pas brut arrondi à une
puissance de dix multipliée par 1, 2, 5 ou 10, puis extension du domaine aux
bornes rondes — mais c'est exactement le genre de code qu'on écrit mal à la
va-vite. Un axe temporel qui affiche « 03/09 03/09 03/09 » parce que la
granularité est trop fine est le bug visuel classique de tout graphique fait
maison. Les deux sont donc isolés et testés sur table de cas.

### Étage 2 — composants de graphique

**Le défaut à corriger.** `line-chart` utilise aujourd'hui un `viewBox` fixe
de 600×200 avec `preserveAspectRatio="none"`. Le SVG est étiré à la taille
du conteneur, ce qui déforme l'épaisseur des traits — dans un conteneur de
1200×100, un trait de 2 unités devient large horizontalement et fin
verticalement — et interdit tout texte d'axe, qui subirait la même
déformation. Raccourci parfaitement acceptable pour les trois graphiques
décoratifs de Hangar ; intenable pour ce que FerrisTrace demande.

**La correction : `chart-frame`.** Un socle qui mesure son conteneur par
`ResizeObserver`, expose la taille réelle en signal, réserve les marges
d'axes, et fournit le système de coordonnées à ses enfants. Les graphiques
deviennent des projections dans un espace pixel réel : épaisseurs
constantes, étiquettes non déformées, axes gradués possibles.

Briques partagées : `chart-frame`, `chart-axis`, `chart-tooltip`,
`chart-legend`, `chart-empty`.

| Graphique                 | Statut                                                         |
| ------------------------- | -------------------------------------------------------------- |
| `line-chart`, `bar-chart` | réécrits sur `chart-frame`                                     |
| `gauge-bar`               | repris tel quel — il n'a pas d'axe                             |
| `sparkline`               | nouveau — sans marge ni axe, conçu pour une cellule de tableau |
| `timeline-chart`          | nouveau — courbe et bandes d'événements sur un axe commun      |
| `funnel-chart`            | nouveau — étapes, largeur proportionnelle, décrochage          |
| `dimension-card`          | nouveau — top-N avec barres de proportion en fond de ligne     |

**Accessibilité.** Chaque graphique expose ses données en table visuellement
masquée via l'utilitaire `sr-only` déjà présent dans les tokens. Un SVG seul
est invisible pour un lecteur d'écran.

## Accessibilité — RGAA 4.1.2

### Version visée

**RGAA 4.1.2**, mise à jour du 18 avril 2023 : 13 thématiques, 106 critères,
alignée sur WCAG 2.1 niveau AA et sur la norme EN 301 549. C'est la version
en vigueur.

Le RGAA 5 est en rédaction par la Dinum, publication annoncée fin 2026. La
Dinum précise que ses critères « viendront préciser ou compléter ceux du
RGAA 4.1.2, sans les réfuter », et qu'il intégrera WCAG 2.2. **Gabarit
anticipe donc les ajouts AA de WCAG 2.2 qui concernent des composants**,
pour ne pas avoir à reprendre les onze composants fin 2026 :

- **2.4.11 Focus non masqué (minimum)** — un élément qui prend le focus reste
  au moins partiellement visible. Concerne la modale et le menu déroulant du
  `select`.
- **2.5.8 Taille de cible (minimum)** — 24 × 24 px CSS au minimum, ou
  espacement équivalent. Concerne `button` en taille `small`, `checkbox`, la
  croix de fermeture de la modale, le bouton d'effacement de la barre de
  recherche, et les déclencheurs d'onglets.

### Ce que Gabarit peut promettre, et ce qu'il ne peut pas

**Le RGAA s'évalue sur une page ou un service, jamais sur une librairie.**
Gabarit ne peut pas être « conforme RGAA » — ce sont Hangar, FerrisGit et
FerrisTrace qui le seront ou non. Formuler l'inverse serait faux, et
exposerait les applications à une déclaration d'accessibilité inexacte.

Gabarit s'engage donc sur trois choses précises :

1. **Satisfaire 100 % des critères qui dépendent de lui** — 35 critères sur
   les 106, listés ci-dessous.
2. **Documenter les 71 autres** dans une matrice de responsabilité livrée
   avec la librairie, indiquant pour chacun ce que l'application doit faire.
3. **Vérifier les deux.** `axe-core` ne couvre qu'environ 30 % des critères
   RGAA : l'automatisation est nécessaire mais très insuffisante. Chaque
   composant a donc aussi une **grille d'audit manuelle** consignée dans son
   dossier.

### Les 35 critères sous la responsabilité de Gabarit

| Thématique      | Critères                                                  | Portée dans Gabarit                                                                |
| --------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 3 Couleurs      | 3.1, 3.2, 3.3                                             | Tokens, états de composants, palette de séries                                     |
| 5 Tableaux      | 5.4, 5.5, 5.6, 5.7, 5.8                                   | `table` — titre, en-têtes, association cellule/en-tête                             |
| 6 Liens         | 6.1, 6.2                                                  | Résultats de `search-bar` rendus en liens                                          |
| 7 Scripts       | 7.1, 7.3, 7.4, 7.5                                        | `select`, `tabs`, `modal`, `search-bar` — motifs ARIA, clavier, messages de statut |
| 9 Structuration | 9.3                                                       | Listes d'options, d'onglets, de résultats                                          |
| 10 Présentation | 10.5, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12, 10.13, 10.14 | Focus visible, contenus cachés, reflow, espacement du texte, contenus additionnels |
| 11 Formulaires  | 11.1, 11.2, 11.4, 11.9, 11.10, 11.11, 11.13               | `input`, `checkbox`, `select`, `search-bar`, `button`                              |
| 12 Navigation   | 12.8, 12.9, 12.11                                         | Ordre de tabulation, absence de piège clavier, atteignabilité au clavier           |
| 13 Consultation | 13.8                                                      | État de chargement du `button`, `prefers-reduced-motion`                           |

Les 71 autres — thématiques 1, 2, 4, 8, l'essentiel de 9 et 12, et 13 hors
13.8 — relèvent de l'application : structure de titres, langue du document,
liens d'évitement, systèmes de navigation, contenus multimédias.

### Contraste : audit et corrections

Audit de la palette actuelle : **sept échecs**, dont deux structurels sur
`--border-color`, qui est la couleur de contour des champs, des cases à
cocher et des cartes.

| Critère | Paire                        | Mesuré | Requis |
| ------- | ---------------------------- | ------ | ------ |
| 3.3     | bordure / fond, clair        | 1,34:1 | 3:1    |
| 3.3     | bordure / fond, sombre       | 1,66:1 | 3:1    |
| 3.2     | avertissement / fond, clair  | 2,55:1 | 4,5:1  |
| 3.2     | texte discret / fond, sombre | 2,60:1 | 4,5:1  |
| 3.2     | succès / fond, clair         | 3,28:1 | 4,5:1  |
| 3.2     | erreur / fond, clair         | 3,78:1 | 4,5:1  |
| 3.2     | texte discret / fond, clair  | 4,01:1 | 4,5:1  |

**Niveau visé : AAA sur le texte (7:1).** Le RGAA n'exige que AA (4,5:1) —
c'est un choix délibéré, au-delà de l'obligation. Précision : le niveau AAA
n'existe que pour le texte ; le contraste des composants d'interface et des
éléments graphiques (critère 3.3) reste à 3:1, il n'a pas de niveau
supérieur.

**Correction retenue — dédoubler les tokens d'état.** Une couleur d'état
sert tantôt de pastille ou d'icône (seuil 3:1), tantôt de texte (seuil 7:1).
Les fondre en un seul token forçait à darkener l'ambre jusqu'à un brun
(`#755217`), ce qui détruisait l'identité visuelle. Chaque état a donc deux
tokens :

| Token                              | Clair              | Ratio  | Sombre             | Ratio  |
| ---------------------------------- | ------------------ | ------ | ------------------ | ------ |
| `--border-color`                   | `#7798b3`          | 3,03:1 | `#436a80`          | 3,01:1 |
| `--text-discret`                   | `#425c6b`          | 7,06:1 | `#86a9bb`          | 7,01:1 |
| `--color-error-base` (graphique)   | `#d95a5a` inchangé | 3,78:1 | `#e88181` inchangé | 6,58:1 |
| `--color-error-text` (texte)       | `#a82727`          | 7,04:1 | `#e98989`          | 7,01:1 |
| `--color-success-base` (graphique) | `#29a079` inchangé | 3,28:1 | `#53b491` inchangé | 6,92:1 |
| `--color-success-text` (texte)     | `#1a644c`          | 7,07:1 | `#54b592`          | 7,01:1 |
| `--color-warning-base` (graphique) | `#c38927`          | 3,03:1 | `#dfb340` inchangé | 8,89:1 |
| `--color-warning-text` (texte)     | `#755217`          | 7,06:1 | `#dfb340` inchangé | 8,89:1 |

Inchangés parce que déjà conformes AAA : `--text-primary` (17,51:1 clair /
16,59:1 sombre), `--text-secondary` (10,53:1 / 7,52:1), `--primary`
(8,92:1 / 8,46:1).

**Texte posé sur un aplat coloré.** Les tokens `--text-on-primary` et
`--text-on-error` héritent de l'application source et désignent le texte
écrit _par-dessus_ une couleur de remplissage — un bouton `danger`, un
bandeau. Leur seuil est celui du texte, donc 7:1 visé.

| Paire                                      | Clair                   | Ratio  | Sombre                  | Ratio  |
| ------------------------------------------ | ----------------------- | ------ | ----------------------- | ------ |
| `--text-on-primary` sur `--primary`        | `#ffffff` sur `#44476a` | 8,92:1 | `#0d1b24` sur `#a7aeff` | 8,46:1 |
| `--text-on-error` sur `--color-error-fill` | `#ffffff` sur `#a82727` | 7,04:1 | `#0d1b24` sur `#e98989` | 7,01:1 |

`--color-error-fill` est un token distinct de `--color-error-base` : la base
(`#d95a5a`) est une couleur **graphique**, conforme à 3:1 face au fond de
page, sur laquelle **aucune couleur de texte ne peut atteindre 7:1** — le
noir y plafonne à 5,56:1 et le blanc n'y est qu'à 3,78:1. Écrire sur un
aplat d'erreur impose donc un aplat plus sombre, et `--color-error-fill`
porte cette valeur.

Les quatre paires ci-dessus sont couvertes par le test de contraste au même
titre que les autres : un token de texte sur aplat qui échappe au test est
exactement le trou que ce dispositif doit interdire.

Les valeurs proposées conservent teinte et saturation : seule la luminosité
bouge, du minimum nécessaire. La régression visuelle sur Hangar et FerrisGit
se limite à des contours plus marqués et à un ambre légèrement plus profond.

**Un test de la librairie recalcule tous ces ratios.** Une palette qui
régresse fait échouer la CI — c'est le seul moyen que la conformité tienne
dans le temps.

### Défauts d'accessibilité relevés dans les composants existants

Deux défauts trouvés à l'audit du code de Hangar, à corriger pendant
l'extraction :

- **`table` — critère 7.3.** Les lignes portent `(click)` sans équivalent
  clavier : un utilisateur au clavier ne peut pas activer une ligne. Il
  manque aussi un `<caption>` (critères 5.4 et 5.5). Correction : `rowClick`
  n'est câblé que si un `caption` et une intention d'interaction sont
  fournis, et chaque ligne interactive devient focalisable et activable au
  clavier.
- **`card` — critère 9.1.** La carte impose un `<h2>`. Une librairie qui fige
  un niveau de titre casse la hiérarchie de la page qui la consomme.
  Correction : le niveau de titre devient une entrée.

Le `modal` est conforme en l'état — piège de focus, restauration du focus à
la fermeture, `Échap`, clic hors zone. Rien à corriger.

### Vérification

- **Automatisée** — `axe-core` exécuté sur chaque composant dans les tests
  unitaires, et sur chaque story. Zéro violation tolérée. Couvre environ
  30 % des critères.

  Deux limites mesurées, à documenter plutôt qu'à découvrir : la règle
  `color-contrast` est inévaluable sous jsdom (elle réclame un canvas et
  retourne « incomplete »), d'où sa désactivation et le test de contraste
  dédié qui la remplace avantageusement ; et **axe n'infère pas le rôle
  implicite d'un élément personnalisé inconnu**, donc aucune assertion ARIA
  portant sur l'hôte d'un composant `gbt-*` ne doit reposer sur lui. Ces
  attributs se vérifient par assertion directe sur le DOM.

- **Contraste** — test dédié recalculant les ratios de tous les couples de
  tokens, dans les deux thèmes.
- **Manuelle** — une grille d'audit par composant, consignée dans son
  dossier, couvrant les critères que l'automatisation ne voit pas :
  navigation au clavier complète, ordre de tabulation, restitution par
  lecteur d'écran, zoom à 200 %, reflow à 320 px, redéfinition de
  l'espacement du texte.
- **Matrice de responsabilité** — livrée dans le README, listant les 72
  critères qui restent à la charge de l'application.

## Contrat de librairie

**Aucune chaîne en dur.** `emptyMessage = input('Aucune donnée.')` est
acceptable dans une application, jamais dans une librairie. Tous les textes
visibles sont des entrées, avec un défaut anglais ou aucun défaut. Gabarit
n'embarque pas `transloco` : traduire est la responsabilité de l'application
qui consomme.

**Frontière avec les applications : Gabarit contient ce qui ne connaît pas
le domaine.** Un composant qui sait ce qu'est une _issue_ ou un _arbre de
filtres_ appartient à l'application.

| Dans Gabarit                                                                     | Reste dans l'application                           |
| -------------------------------------------------------------------------------- | -------------------------------------------------- |
| `stat-tile`, `status-pill`, `empty-state`, `dimension-card`, `date-range-picker` | `filter-bar` — connaît le `FilterTree`             |
| tous les graphiques et leurs primitives                                          | `event-timeline` — connaît les types d'événements  |
|                                                                                  | `stack-trace` — connaît le format des piles        |
|                                                                                  | `app-shell` — trop spécifique à chaque application |

**Accessibilité** : voir la section « Accessibilité — RGAA 4.1.2 ». C'est une
exigence de premier rang, au même titre que le contrat d'API.

## Stratégie de tests

`vitest`, comme les deux fronts existants.

- **Primitives** : tests exhaustifs sur table de cas. C'est du calcul pur, et
  c'est là que se logent les régressions silencieuses.
- **Composants** : contrat d'entrée/sortie et états limites.
- **Stories** : chaque composant en a au minimum quatre — vide, nominal,
  dense, sombre. Les graphiques en ont trois de plus — point unique, valeurs
  négatives, séries multiples.
- **Accessibilité** : `axe-core` sur chaque composant, zéro violation
  tolérée ; test de contraste recalculant tous les couples de tokens ; grille
  d'audit manuelle par composant. Détail dans la section « Accessibilité ».

## Plan de migration

Quatre temps, dont les trois premiers font partie du projet Gabarit :

1. **Publier `0.1`** — tokens, les 11 composants d'interface, `IconRegistry`.
2. **Migrer Hangar** — renommage de préfixe, imports, enregistrement des
   icônes, suppression de `frontend/src/app/ui/`. C'est le seul test sérieux
   de l'API, et la raison pour laquelle la migration n'est pas différée : si
   Hangar reste sur ses composants locaux, la librairie et l'original
   divergent au premier correctif.
3. **Corriger ce que la migration révèle, publier `0.2`.** Attendre une
   régression visuelle légère et voulue : contours plus marqués, ambre plus
   profond — ce sont les corrections de contraste.
4. **Construire la couche dataviz**, guidée par les besoins réels de
   FerrisTrace.

FerrisGit migre ensuite, chantier court : cinq composants, tous déjà
présents dans le lot extrait.

## Préalable bloquant

Ni Hangar ni FerrisGit n'a de fichier de licence aujourd'hui — le README de
Hangar indique explicitement « considérez le code source comme tous droits
réservés ». Les trois projets sont open source en intention, pas en droit.

**À faire avant toute publication npm** : ajouter `LICENSE` (MIT) à Gabarit,
et `LICENSE` (AGPL-3.0) à Hangar, FerrisGit et FerrisTrace, en mettant à
jour la section Licence de leurs README.
