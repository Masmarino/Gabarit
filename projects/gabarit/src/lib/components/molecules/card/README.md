# Card

Titled container: an optional heading over a box. Two looks for the box —
`elevated` (a shadow) and `outlined` (a quiet 1px edge) —, an optional
description and counter under / after the heading, a flush body for rows, a
tone and a selected state, and a link mode that makes the whole box
clickable.

**Selector**: `gbt-card` (+ the `CardHeader` directive and the `a[gbtCardLink]`
component, see below)

## Inputs

| Input           | Type                                             | Default      | Role                                                                                                                                                                                  |
| --------------- | ------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hoverable`     | `boolean`                                        | `false`      | Adds a visual hover treatment.                                                                                                                                                        |
| `heading`       | `string`                                         | `''`         | Header title. Empty by default: no header is rendered without it (or a `[card-header]` slot).                                                                                         |
| `icon`          | `string`                                         | `''`         | Icon shown beside the title, in the header. A toned header without one shows the tone's icon.                                                                                         |
| `headingLevel`  | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                     | `2`          | Level of the rendered heading — choose it based on the block's place in the page hierarchy (RGAA 9.1).                                                                                |
| `variant`       | `'elevated' \| 'outlined'`                       | `'elevated'` | `outlined` swaps the box's shadow for a border.                                                                                                                                       |
| `description`   | `string`                                         | `''`         | One-line help text under the heading (built-in header only).                                                                                                                          |
| `count`         | `number \| null`                                 | `null`       | Counter pill after the heading, `0` included.                                                                                                                                          |
| `flush`         | `boolean`                                        | `false`      | No padding inside the box: rows and tables reach its edges (clipped to its rounded corners).                                                                                          |
| `tone`          | `'default' \| 'success' \| 'warning' \| 'error'` | `'default'`  | Colours the header's icon and title (`error` for a subsystem that is down, `success` for a result). Needs a header; the box is never tinted.                                          |
| `selected`      | `boolean`                                        | `false`      | Accent ring (2px) and a faint wash on the box — the chosen option of a set of cards.                                                                                                   |
| `selectedLabel` | `string`                                         | `'Selected'` | Visually hidden text read by screen readers on a `selected` card (colour and ring are not enough). Empty removes it.                                                                   |
| `href`          | `string \| null`                                 | `null`       | Link mode: the heading becomes a link whose hit area covers the card's box (see below).                                                                                                |
| `linkLabel`     | `string \| null`                                 | `null`       | `aria-label` of the link — the name of a link-mode card that has NO heading text. Ignored when there is a heading (the visible text stays the name: WCAG label in name).              |

There is no `headerStyle` input: the header has a single look. A static
`headerStyle="…"` attribute still compiles (it renders as an inert
`headerstyle` DOM attribute); a bound `[headerStyle]="…"` fails to compile
(NG8002).

## Structure: a heading over a box

The component renders two siblings:

1. **The header** (`.gbt-card__header`, only when there is a `heading` or a
   `[card-header]`): a plain heading **above** the card, like a section title
   over a panel. It has no background, no border and no radius of its own —
   the icon, the title (with its count), the description under it, and the
   `[card-header-actions]` on the right. `0.5rem` separates it from the box
   (the heading-to-content gap of `gbt-panel`).
2. **The box** (`.gbt-card`): the card itself — shadow (`elevated`) or 1px
   edge (`outlined`), background, padding, and a full radius on all four
   corners. It holds the body only. `selected` and the link target are the
   box's; the header is a label over it.

```
<gbt-card>                       display: grid, position: relative
  div.gbt-card__header           heading, count, description, actions
  div.gbt-card                   the box: data-variant, data-flush, data-selected, data-link
    div.gbt-card__body           your content
```

`tone` is carried by the header (`data-tone` on `.gbt-card__header`), the
other states by the box. To restyle the box (padding, a flex column…), target
`.gbt-card`: it does not contain the heading.

## Projected content

- Default: the card's body. It sits in a `.gbt-card__body` wrapper that is `display: contents` (invisible to layout) unless the card is `flush`, so a `display: flex; gap` you put on the box (`.gbt-card`) still reaches your children directly.
- `[card-header-actions]`: actions shown on the right of the header (button, menu…).
- `[card-header]`: replaces the `heading` / `icon` / `description` / `count` block with your own header content, above the box. **Import the `CardHeader` directive next to `Card`** for the header layout (flex row, actions on the right). Without the import the marked element is still rendered — plain, at the top of the box, above the body — never dropped (same fallback as `gbt-menu`'s `MenuTrigger`).

## Tone

`tone` colours the header's icon and title in the tone's text colour
(`--color-success-text`, `--color-warning-text`, `--color-error-text` — the
pair `gbt-badge`'s outline look uses on the page). No wash, no tinted edge:
the box, the description and the count stay neutral. A toned header always
shows an icon — the one you give, or the tone's own (`check-circle`,
`alert-triangle`, `alert-circle`, as `gbt-alert`) — so the tone is never
conveyed by colour alone; the title text carries the meaning. A card without a
header shows no tone.

With a custom `[card-header]`, `tone` only sets `data-tone` on
`.gbt-card__header` — it does not colour your projected content or add an
icon (there is no built-in icon or title to colour). Style your own header
content by tone if needed, and pair the colour with an icon or a word so the
tone is not conveyed by colour alone:

```css
/* A global stylesheet, or behind `:host ::ng-deep` in a component's styles:
   .gbt-card__header is gbt-card's own element, outside your encapsulation. */
.gbt-card__header[data-tone='warning'] .my-title {
  color: var(--color-warning-text);
}
```

## Flush

`flush` only removes the box's padding: rows, a table, a `gbt-list-row` or a
`gbt-empty-state` reach the box's edges, and the body clips them to the box's
inner corners. The header is not in the box, so it is not affected.

## Examples

```html
<gbt-card heading="Registre Docker" [headingLevel]="2">
  <gbt-gauge-bar ... />
</gbt-card>

<!-- A settings card: outlined, a heading above it, rows to the edges -->
<gbt-card
  variant="outlined"
  heading="Variables"
  icon="key"
  description="Injectées dans chaque job."
  [count]="variables().length"
  [flush]="true"
>
  <gbt-button card-header-actions size="small" text="Ajouter" />
  <ul>
    …
  </ul>
</gbt-card>

<!-- Your own header -->
<gbt-card variant="outlined">
  <div card-header><strong>src/app/app.ts</strong> <gbt-badge>+12 −3</gbt-badge></div>
</gbt-card>
```

## Whole-card link

Two ways, both use the **stretched link** pattern: the anchor stays the heading
text only (that is its accessible name), and a pseudo-element of the anchor
stretches its hit area over the card's **box**. There is **no interactive
content nested inside the link**, so screen readers announce one clear link and
axe's `nested-interactive` rule is satisfied.

The heading sits above the box, so the anchor is not inside the box: the host
is a positioned grid (`gbt-card-header` / `gbt-card-box` areas) and the
anchor's overlay names the `gbt-card-box` area, which makes the box's area its
containing block. The overlay therefore covers the box exactly — not the
heading row, whose only target is the heading text itself — and the hover
shadow and the focus ring are drawn on the box. Keep the host's
`display: grid` (do not set `display: block` on `gbt-card`): when the grid
does not apply, the overlay covers the header row too. The header's controls
(`[card-header-actions]`, anything interactive in a `[card-header]`) still
stay operable then, because they are lifted above the overlay the same way the
body's controls are (see below).

```html
<!-- 1. href: the heading becomes the link -->
<gbt-card
  variant="outlined"
  heading="Guide de démarrage"
  href="/guide"
  description="Installer le projet"
/>

<!-- 2. a projected anchor — router-agnostic, works with routerLink -->
<gbt-card variant="outlined">
  <h3 card-header><a gbtCardLink [routerLink]="['/releases', id]">Release {{ version }}</a></h3>
  <gbt-button card-header-actions size="small" variant="secondary" text="Télécharger" />
  <p>Notes de version…</p>
  <a [routerLink]="['/releases', id, 'notes']">Notes</a>
</gbt-card>
```

Import `CardLink` (and `CardHeader` for the second form). Rules of the pattern:

- **One link per card.** The stretched anchor is the card's target; put the heading, not a paragraph, in it. No heading? Use `href` with `linkLabel`.
- **Other controls stay separate.** Buttons, menus and links elsewhere in the card — in the box or in the header — are lifted above the stretched area (`z-index: 2`, and `position: relative` unless the control positions itself — a `gbt-switch`'s hidden input stays `absolute`) so they stay clickable and keep their own tab stop. The lifting rule has zero specificity: your own `position`/`z-index` on such a control wins. Do not wrap them in the link and do not put the link around the card (`<a>` around interactive content is a nested-interactive trap).
- The focus ring is drawn around the box (inside its edge).
- Trade-off of the pattern: text inside a linked card cannot be selected with the mouse.

## Heading level

`headingLevel` (default `2`) picks the `h1`…`h6`. Choose it from the card's
place in the page, not its size.

## Container queries

The card is not a size container: a page that adapts its contents to the card's
width should wrap the card in its own `container-type: inline-size` element.
