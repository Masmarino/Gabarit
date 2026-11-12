# gabarit-gpui

Les composants Gabarit pour [GPUI](https://gpui.rs), la bibliothèque d'interface de Zed, en Rust, dessinée par la
carte graphique : la base de l'app de bureau SkollN (Windows, Linux, Mac). Le rendu de référence est celui de
`swift/GabaritApple` ; `swift/GabaritGtk` sert de second modèle.

| Dossier, fichier        | Ce qu'il contient                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/tokens.rs`         | Les jetons, **générés** par `tools/tokens.py` depuis `tokens/gabarit.json` : ne pas modifier à la main.    |
| `src/theme.rs`          | Le thème clair ou sombre (`cx.theme()`), le cadre sombre, IBM Plex, les styles de texte (`g_text`).        |
| `src/motion.rs`         | Le mouvement : durées (`QUICK` 0,15 s, `NORMAL` 0,25 s, `SLOW`), ressorts (`SPRING`, `BOUNCY`, `SNAPPY`), entrées et sorties (`GMotion`, `g_enter`, `g_exit`, `g_enter_on_change`, `g_collapse`), couleurs et calques qui fondent au survol ; « Réduire les animations » : de simples fondus courts. |
| `src/relief.rs`         | Le relief : carte posée, bouton en volume qui s'enfonce, creux, lueur, ombres, sol éclairé.               |
| `src/button.rs`         | `GButton` (primary, secondary, ghost, danger, destructeur), `GCloseButton`.                               |
| `src/controls.rs`       | `GToggle` (et `GSwitch`), `GCheckbox`, `GSlider`, `GStepper`.                                             |
| `src/picker.rs`         | `GPicker` : menu (la liste en `GMenu`, la coche sur le choix) ou pastilles.                               |
| `src/text_field.rs`     | `GTextInput` (l'état), `GTextField` (titre et cadre), `GFieldFrame` : une ligne ou plusieurs.             |
| `src/form.rs`           | `GForm`, `GFormSection`, `GFormRowButton`, `GLabeledContent`, `GFormButtons`, `GPageTitle`, les mesures. |
| `src/sheet.rs`          | `GSheet` et `GSheetTitle` : l'en-tête toujours sur le gris de la page.                                    |
| `src/menu.rs`           | `GMenu` (carte, sections, sous-menus, raccourcis, clavier), `GContextMenu` (clic droit), `GMenuButton`.   |
| `src/bars.rs`           | `GWindowHeader`, `GBarTitle`, `GNavTabs`, `GPageBand`, `GRailItem`, `GSidebarRow`.                         |
| `src/feedback.rs`       | `GBadge`, `GBanner`, `GToastCenter`, bulle d'aide, `GSkeleton`, `GTypingDots`, `GEmptyState`, `GUnreadBadge`. |
| `src/list.rs`           | `GLongList` (la liste virtualisée, sa barre de défilement) et `GMessageRow`.                              |
| `src/avatar.rs`         | `GAvatar` : initiales sur la couleur de la personne, non-lus, présence.                                   |
| `src/bin/galerie.rs`    | La galerie : tous les composants, en clair et en sombre.                                                  |
| `fonts/`, `icons/`      | IBM Plex (SIL OFL, copie de celles de GabaritApple) ; les icônes Phosphor utiles (MIT), et quatre dessinées pour Gabarit. |
| `correctifs/`           | `gpui-pre-wgpu` corrigé : les émojis en couleur sous Linux (voir « Les correctifs de GPUI »).                |
| `captures/`             | Les captures de la galerie sur le Mac (et une sous Windows, une sous Linux).                              |
| `tests/`                | Les jetons contre `GTokens.swift` ; la saisie (composition, UTF-16, émojis, arabe, hébreu, presse-papiers). |

## GPUI : la version

GPUI est épinglé à la révision **`d2a4fb6ded7c470be25d1541281da3882495b65b`** de Zed (8 novembre 2026), par la crate
**`gpui-pre = "=0.3.12"`** de crates.io. La crate `gpui` publiée par Zed (0.2.2) n'a pas bougé depuis octobre 2025 :
elle ne suit pas Zed. `gpui-pre` est le même code, publié chaque semaine depuis le dépôt de Zed par l'équipe de
gpui-component (Longbridge) ; son `Cargo.toml` dit de quelle révision (`package.metadata.gpui-pre.zed-rev`). Elle évite
de cloner tout le dépôt de Zed (plusieurs gigaoctets) et donne une version exacte. Si cette publication s'arrêtait, on
passe à une dépendance git sur la même révision de Zed, sans rien changer d'autre.

Pour monter de version : changer `=0.3.12` dans `Cargo.toml` (les deux lignes `gpui-pre` et `gpui-pre-platform`), puis
relancer les tests et la galerie, et regarder les captures.

## Les correctifs de GPUI

`correctifs/gpui-pre-wgpu` est la crate `gpui-pre-wgpu` 0.3.12 de crates.io (le texte et le dessin de GPUI sous Linux),
avec un correctif, dans `src/cosmic_text_system.rs` (les passages marqués `GABARIT`) : **les émojis en couleur**. Sans
lui, ❤, 😂, ⏱ ou ☀ sortent en noir et blanc sous Linux : IBM Plex ne les a pas, et cosmic-text prend la première de
ses polices de repli qui les a, dans un ordre fixe où DejaVu Sans (et Noto Sans Symbols) passent avant Noto Color
Emoji. GPUI ne permet pas de mettre la police des émojis dans les replis d'une police (`FontFallbacks`) : il écarte
toute police sans « m », et la demande à la graisse du texte, qu'elle n'a pas. Le correctif ajoute la police des émojis
en couleur du système (Noto Color Emoji) à la fin des replis de chaque police, à sa propre graisse : ce qu'IBM Plex n'a
pas va d'abord à elle, jamais l'ASCII.

Il est branché par `[patch.crates-io]` dans `Cargo.toml` ; une app qui dépend de gabarit-gpui le reprend dans le sien
(SkollN : `rust/Cargo.toml`). Le Mac (Core Text) et Windows (DirectWrite) ne passent pas par cette crate. À la montée de
version de GPUI : recopier la nouvelle crate, y reporter les passages `GABARIT` (ou retirer le correctif si Zed l'a
fait), et regarder les émojis de la galerie sous Linux.

## Les jetons

```sh
python3 tools/tokens.py          # réécrit src/tokens.rs avec les autres plateformes
python3 tools/tokens.py --check  # vérifie qu'il est à jour
cargo test --test tokens         # vérifie qu'ils concordent avec GTokens.swift, et les polices avec GabaritApple
```

## Utiliser la crate

```rust
gpui_platform::application().with_assets(gabarit_gpui::GAssets).run(|cx| {
    gabarit_gpui::init(cx); // IBM Plex, le thème, les touches des champs
    // … ouvrir la fenêtre, puis : gabarit_gpui::theme::follow_system_appearance(window, cx);
});
```

Les composants sont des éléments GPUI : `GButton::new("enregistrer", "Enregistrer").primary().on_click(…)`. La valeur
d'un réglage reste au propriétaire (la vue), le composant la dessine et dit quand elle change (`on_change`). Un champ
de texte a son état dans une entité : `cx.new(|cx| GTextInput::new(cx).multi_line(3, 8))`.

## Mac

```sh
cd rust/gabarit-gpui
cargo run --bin galerie                          # la galerie, dans l'apparence du système
cargo run --bin galerie -- --page states --dark  # une page : controls, states, forms, frame, feedback, sheet, menus, text, list
cargo test                                       # jetons et saisie
./capture.sh                                     # les captures de chaque page, clair et sombre, dans captures/
cargo build --release --bin galerie              # la galerie optimisée, sans symboles
./target/release/galerie --measure-start         # le temps jusqu'à la première image
./target/release/galerie --measure-list          # fait défiler les 10 000 messages dix secondes, puis les chiffres
cargo clean                                      # le dossier target/ pèse 1 à 3 Go
```

Il faut Xcode (le compilateur Metal compile les shaders de GPUI à la construction).

## Windows

Sur le PC, avec Rust et Visual Studio Build Tools 2022 (le C++ et le SDK Windows) :

```powershell
git clone -b gpui <dépôt Gabarit> Gabarit-gpui
cd Gabarit-gpui\rust\gabarit-gpui
cargo build --release --bin galerie
.\target\release\galerie.exe
.\target\release\galerie.exe --journal galerie.txt --measure-list   # le journal dans un fichier : pas de console
```

En release, la galerie n'a pas de console (`windows_subsystem = "windows"`) : ce qu'elle dit va dans le fichier donné
par `--journal`. Elle dessine elle-même les boutons de la fenêtre (réduire, agrandir, fermer), sur l'en-tête sombre.

Vérifier depuis le Mac que tout compile pour Windows, sans le PC :

```sh
PATH="/opt/homebrew/opt/llvm/bin:$PATH" cargo check --target x86_64-pc-windows-msvc --all-targets
```

(`llvm-rc`, de Homebrew `llvm`, compile le manifeste Windows de GPUI.)

## Linux

GPUI y dessine par Vulkan (wgpu), sous X11 ou Wayland. Il faut les en-têtes `libxkbcommon-dev`,
`libxkbcommon-x11-dev`, `libwayland-dev`, `libxcb1-dev`, `libx11-xcb-dev`, `libvulkan-dev`, `libfontconfig-dev`, et un
pilote Vulkan (celui de la carte, ou `mesa-vulkan-drivers` : lavapipe, sur le processeur).

```sh
cargo build --release --bin galerie
./target/release/galerie
```

Dans la machine Podman du Mac (sans écran : Xvfb, et lavapipe pour Vulkan), depuis `rust/gabarit-gpui` :

```sh
podman run --rm -v "$PWD/../..":/gabarit:ro docker.io/library/rust:1-bookworm bash -c '
  apt-get update && apt-get install -y --no-install-recommends mesa-vulkan-drivers libvulkan-dev xvfb \
    libxkbcommon-dev libxkbcommon-x11-dev libwayland-dev libxcb1-dev libx11-xcb-dev libfontconfig-dev libfreetype-dev
  cp -r /gabarit/rust/gabarit-gpui /work && cd /work && cargo build --release --bin galerie
  export XDG_RUNTIME_DIR=/tmp/xdg && mkdir -p -m 700 $XDG_RUNTIME_DIR
  Xvfb :9 -screen 0 1280x860x24 & sleep 1
  DISPLAY=:9 ./target/release/galerie --measure-start --journal /dev/stdout'
```

Elle s'y construit (1 min 45 sur les 6 cœurs de la machine Podman) et s'y lance : la fenêtre s'ouvre et GPUI dessine sa
première image en 90 à 180 ms. Mais sous Xvfb la fenêtre reste noire à la capture (`xwd`), avec lavapipe en Vulkan
comme en OpenGL : la présentation de wgpu vers un serveur X sans accélération ne passe pas. Il reste à l'essayer sur
un vrai bureau Linux (X11 et Wayland), où elle passe par le pilote de la carte.

**La barre de titre dessinée par l'app.** Sous Linux, GPUI ne fait rien des `window_control_area` (elles n'agissent que
sous Windows et sur le Mac) : `bars::window_drag` déplace la fenêtre par un appui puis un mouvement sur la barre (comme
Zed), `bars::window_button_click` fait agir ses boutons (réduire, agrandir, fermer) ; `GWindowHeader` les prend tous
les deux. `bars::draws_window_buttons` dit si l'app dessine ces boutons : pas quand le gestionnaire de fenêtres encadre
la fenêtre (décorations du serveur : X11 sans compositeur, KDE). Une fenêtre aux décorations dessinées par l'app
(`WindowDecorations::Client`) arrondit elle-même ses coins (`bars::window_corner_radius`, 10 points comme Zed, 0 agrandie
ou collée) : GPUI ne découpe qu'en rectangle, chaque élément qui touche un coin s'arrondit
(`GWindowHeader::window_corners` pour l'en-tête).

Le test des jetons lit `../../swift/GabaritCommon/GTokens.swift` : il se lance depuis le dépôt entier.

## Accessibilité

GPUI, à cette révision, branche AccessKit : VoiceOver (Mac), Narrateur (Windows) et Orca (Linux, par AT-SPI) voient
l'arbre que les composants déclarent (`role`, `aria_label`, valeurs, états, actions). Chaque composant interactif de
Gabarit a son rôle et son nom ; le champ de texte expose son texte et sa sélection. Vérifié sur le Mac par l'API
d'accessibilité (l'arbre de la galerie, voir le compte rendu) ; pas encore avec VoiceOver à l'oreille, ni sous
Windows et Linux. Les limites sont dans le compte rendu du chantier.

## Le lissage du texte

Gabarit met le **lissage en gris** partout (`gabarit_gpui::init`) : c'est le plus proche du rendu du Mac. Sous Windows,
GPUI aurait sinon choisi ClearType (sous-pixels) pour la plupart des tailles. Une app peut choisir autrement après `init`
(`cx.set_text_rendering_mode`). Pour comparer avec la galerie : `GABARIT_TEXTE=cleartype` ou `GABARIT_TEXTE=gris`.
L'intensité (gamma, contraste) vient du réglage ClearType de Windows (`cttune`).
