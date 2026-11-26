# Passer à Gabarit 4.3

La 4.3 ne casse rien : un champ sans présentateur se comporte comme en 4.2.2, à l'octet près.

## 4.3.0 : un champ qui montre son texte mis en forme

**GPUI :** `GTextInput::presenter(|texte, cx| GPresentation)` (module `presentation`). Le champ montre son texte
comme son propriétaire le décrit, et le texte lui-même reste tel qu'il est tapé. C'est ce texte que rendent `text()` et
`selection()`, et que `Changed` annonce. Une note en Markdown montre ainsi ses titres plus grands et son gras sans leurs
marques, comme Apple Notes. Le présentateur est rappelé à chaque changement du texte et à chaque image, avec le thème
du moment.

Ce qu'une `GPresentation` décrit, toujours en octets du texte source :

- `segments` (`GSegment`) : une partie cachée (`GSegment::hidden(…)`, comme `**`) ou montrée sous un autre texte
  (`GSegment::replaced(…, "• ")`). Pour le curseur, chacune est un seul bloc : il ne s'arrête jamais dedans.
  `.lead()` désigne la marque d'une ligne (`## `, `- [ ] `) : le curseur ne se met jamais devant, et Retour arrière
  juste après la retire. La mise en forme s'en va, le texte reste. Un segment ne cache ni ne remplace jamais un retour
  à la ligne : les lignes montrées sont celles du texte.
- `styles` (`GStyleSpan`) : gras (le demi-gras d'IBM Plex), italique, barré, souligné, chasse fixe (IBM Plex Mono),
  couleur, fond.
- `lines` (`GLineStyle`) : la taille du texte d'une ligne, en multiple de celle du champ. Ses rangées sont plus hautes
  d'autant.
- `marks` (`GMark`) : un rond de case, dessiné sur le texte qui le remplace. Il est vide, ou plein et coché, et un clic
  dessus remplace une partie du texte (`[ ]` → `[x]`) sans déplacer le curseur. On peut aussi dessiner un filet de
  citation ou un trait de séparation.
- `links` (`GLink`) : un clic sur le texte du lien ouvre son adresse, et la main s'y montre.

Le curseur, la sélection, les flèches, les mots, Origine et Fin, le clic, le double et le triple clic, le défilement,
les méthodes de saisie et ce que lit un lecteur d'écran passent tous par le texte montré. Les effacements suivent ces
règles :

- Retour arrière et Suppr prennent la lettre montrée, et elle seule, pas les marques cachées autour.
- Un bloc remplacé part en entier.
- Entre deux places qui se montrent au même endroit, le curseur prend la première : avant une marque qui ouvre un style,
  dans le style qu'une marque ferme. En fin de ligne, il prend la dernière, après les marques qui ferment la ligne.

Essais : `presentation.rs` (le passage entre les deux textes) et `tests/text_input.rs` (`hidden_marks_are_stepped_over`,
`a_line_mark_is_never_stepped_before`, `delete_and_end_on_a_presented_text`).

**Web, Apple, Android :** rien.
