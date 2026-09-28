# EmptyState

A placeholder shown instead of an empty list/grid: an illustration, a
heading, an optional message, and an optional action (a button)
projected as content — used to distinguish "there is genuinely nothing
here yet" from a plain "no results" text message.

**Selector**: `gbt-empty-state`

## Inputs

| Input              | Type                                 | Default     | Role                                                                                                                                        |
| ------------------ | ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `illustration`     | `EmptyStateIllustration`             | `null`      | One of `'folder' \| 'star' \| 'checklist' \| 'merge' \| 'pipeline' \| 'tag' \| 'book' \| 'server'`. Optional. |
| `heading`          | `string`                             | —           | Required. The primary message.                                                                                                              |
| `message`          | `string`                             | `''`        | Optional secondary text, e.g. a hint or call to action description.                                                                         |
| `icon`             | `string \| null`                     | `null`      | A registered icon name on a soft disc, in place of the artwork (ignored when an `illustration` is set).                                    |
| `size`             | `'default' \| 'compact'`             | `'default'` | `compact` is the in-card block: smaller disc/artwork, tighter padding and type.                                                             |
| `tone`             | `'default' \| 'error'`               | `'default'` | `error` tints the disc (or the artwork) in the error colours — a list that could not be loaded.                                             |
| `headingLevel`     | `1 \| 2 \| 3 \| 4 \| 5 \| 6 \| null` | `null`      | Renders the heading as an `h1`…`h6` (default: a `<p>`).                                                                                     |
| `headingId`        | `string \| null`                     | `null`      | `id` of the heading element, so a region can use `aria-labelledby`.                                                                         |
| `headingFocusable` | `boolean`                            | `false`     | Gives the heading `tabindex="-1"` (a programmatic focus target, not a tab stop; it shows no focus ring, being no control).                  |

## Methods

| Method           | Role                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `focusHeading()` | Moves focus to the heading — needs `headingFocusable`. For a result page (activation done, link expired) that moves focus to its title. |

## Content

An optional action (typically a `<gbt-button>`) is projected via
`<ng-content />`, rendered below the message.

## Example

```html
<gbt-empty-state
  illustration="folder"
  heading="Aucun dépôt pour l'instant"
  message="Créez votre premier dépôt pour commencer."
>
  <gbt-button text="Nouveau dépôt" (clicked)="openCreate()" />
</gbt-empty-state>
```

## Icon, compact and in-card states

The 96 px artwork suits a whole page or an empty list. Inside a card, use the
compact block with an icon:

```html
<gbt-card variant="outlined" heading="Variables" flush>
  <gbt-empty-state
    size="compact"
    icon="key"
    heading="Aucune variable définie"
    message="Les variables sont injectées dans chaque job."
  />
</gbt-card>

<gbt-empty-state size="compact" tone="error" icon="alert-circle" heading="Chargement impossible">
  <gbt-button variant="secondary" size="small" text="Réessayer" (clicked)="retry()" />
</gbt-empty-state>
```

With neither `illustration` nor `icon` a compact state is a bare heading (and
message): the "Not found." block.

## Heading level

By default the heading is a `<p>` — the component cannot know where it sits in
your page outline. Pass `headingLevel` when the state stands for a section (or
the whole page, `1`), and `headingId` to name a surrounding `<section>`.

## Choosing an illustration

Each illustration is a fixed, curated piece of art shipped by Gabarit —
not an extensible registry like `gbt-icon`'s. Pick whichever of the
eight best matches the empty collection: `folder` for
repositories/groups, `star` for a starred/favorites list, `checklist`
for issues, `merge` for merge/pull requests, `pipeline` for CI
pipelines, `tag` for releases, `book` for a wiki, `server` for
infrastructure (e.g. CI runners).
