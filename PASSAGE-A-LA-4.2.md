# Passer à Gabarit 4.2

La 4.2 ne casse rien : une app qui ne donne pas d'accent garde le rendu de la 4.1.2, à l'octet près.

## L'accent propre d'une ambiance

Une ambiance peut porter son propre accent (`ground.accent` dans `tokens/gabarit.json`). Les boutons principaux, le
verre proéminent, les chips choisies, l'onglet choisi, les liens, la sélection, l'anneau de focus et le verre teinté le
prennent à la place de la rouille de Gabarit. Exemple : l'ambiance `dore`, accent or pâle `#E9C979`.

Les rôles sont calculés de la même façon partout, à l'exécution, depuis l'accent et le sol :

- `accent` : la couleur donnée (remplissages, anneau de focus, verre proéminent). Elle doit tenir 3:1 contre le sol voilé
  à son pire point.
- `accentText` (liens, onglet choisi) : l'accent s'il tient 4,5:1 sur le sol voilé et sur chaque verre de contenu,
  sinon l'accent mêlé vers l'encre de l'ambiance par pas de 0,05 jusqu'à ce qu'il tienne.
- `onAccent` (le texte posé sur l'accent) : le blanc ou l'encre sombre (`slate900`), celle qui contraste le mieux ; elle
  doit tenir 4,5:1. Sur l'or pâle : l'encre sombre.
- `selectedFill` : l'accent à 0,10 (clair) ou 0,16 (sombre).
- Le bouton principal prend l'accent et `onAccent` ; son survol est l'accent mêlé à 15 % de `onAccent`. Le bouton
  Danger garde son rouge et son encre.

`tools/tokens.py --check` refuse une ambiance d'exemple dont l'accent ne tient pas ces seuils, et les essais de chaque
plateforme vérifient le texte sur l'accent et l'accent sur le sol.

Une limite : le texte d'accent n'est pas calculé pour le verre liquide (3,6:1 sur `dore`). Gabarit n'y pose pas de lien ;
une app ne doit pas en poser non plus.

## Comment l'app passe le sien

### Apple (`GabaritCommon`, `GabaritApple`)

- `GGroundSpec(…, ink:, shade:, accent: GRGBA? = nil)`, `withAccent(_:)` ; `accentTone() -> GAccentTone?`.
- `GTheme.current.accent: GRGBA?` : l'accent de l'app ; celui du sol passe devant.
- `EnvironmentValues.gAccentTone` ; les styles `.gAccent`, `.gAccentText`, `.gOnAccent`, `.gSelectedFill`.
- `GColor.accent` reste la rouille (une constante) : une app qui lit `GColor.accent` ou pose `.tint(GColor.accent)`
  passe à `.gAccent` pour suivre l'accent.

### Android (`com.masmarino.gabarit`)

- `GGroundSpec(…, ink, shade, accent: Color? = null)` ; `accentTone(): GAccentTone?`, `accentToneOn(tone, color)`.
- `GTheme(…, accent: Color? = null) { … }`, `GScheme(…, accent = …)` : l'accent de l'app passe devant celui du sol.
- `G.accentTone`, `GColors.withAccent(tone)`. Avec un accent, `G.colors.primary` et `onPrimary` le suivent, donc aussi
  les composants de Material.

### GPUI (`gabarit-gpui`)

- `GGroundSpec` ne change pas (une app l'écrit en entier). L'accent passe par le thème :
  `GTheme::with_accent(Some(rgba))`, `theme::set_accent(Some(rgba), cx)`. `set_ground` rend l'accent de Gabarit : le
  redonner après.
- `GTheme::accent: Option<GAccentTone>`, `GTheme::on_accent()`, `GTheme::on_error_fill()`.
- `tone::accent_tone(spec, tone, accent)`, `tone::accent_edge`, `tone::on_accent_contrast`.
- Les ambiances d'exemple : `grounds::DORE_ACCENT`, `grounds::accent(name)`, `accent_tones::DORE`.

### Web (`@masmarino/gabarit`)

- Sous un élément qui pose `--gbt-ground-accent`, `--gbt-ground-accent-text`, `--gbt-ground-on-accent` et
  `--gbt-ground-selected-fill`, les composants suivent l'accent (la mixin `ambiance-dore` les pose).
- `groundAccent(accent, ambiance)` (`@masmarino/gabarit/ground`) calcule les quatre valeurs et rend les propriétés à
  poser (`properties`) ; `GROUND_AMBIANCES`.
