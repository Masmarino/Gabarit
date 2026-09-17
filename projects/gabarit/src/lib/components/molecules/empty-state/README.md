# EmptyState

A placeholder shown instead of an empty list/grid: an illustration, a
heading, an optional message, and an optional action (a button)
projected as content — used to distinguish "there is genuinely nothing
here yet" from a plain "no results" text message.

**Selector**: `gbt-empty-state`

## Inputs

| Input          | Type                    | Default | Role                                                              |
| -------------- | ----------------------- | ------- | ------------------------------------------------------------------ |
| `illustration` | `EmptyStateIllustration`| —       | Required. One of `'folder' \| 'star' \| 'checklist' \| 'merge' \| 'pipeline' \| 'tag' \| 'book'`. |
| `heading`      | `string`                | —       | Required. The primary message.                                    |
| `message`      | `string`                | `''`    | Optional secondary text, e.g. a hint or call to action description.|

## Content

An optional action (typically a `<gbt-button>`) is projected via
`<ng-content />`, rendered below the message.

## Example

```html
<gbt-empty-state illustration="folder" heading="Aucun dépôt pour l'instant" message="Créez votre premier dépôt pour commencer.">
  <gbt-button text="Nouveau dépôt" (clicked)="openCreate()" />
</gbt-empty-state>
```

## Choosing an illustration

Each illustration is a fixed, curated piece of art shipped by Gabarit —
not an extensible registry like `gbt-icon`'s. Pick whichever of the
seven best matches the empty collection: `folder` for
repositories/groups, `star` for a starred/favorites list, `checklist`
for issues, `merge` for merge/pull requests, `pipeline` for CI
pipelines, `tag` for releases, `book` for a wiki.
