# ListCard

The card that holds a page's list: a header (state tabs, a count, filters)
above a box that shows one of four states of the list. It is the surface
around [`gbt-list-row`](../list-row/README.md)s and the place where
"loading", "failed" and "empty" look the same on every list page.

**Selector**: `gbt-list-card`

## States

| `state`   | What shows                                                                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`   | The `[list-card-header]` above the box, then the projected content in the box (usually `ul > li > gbt-list-row`). The default.                                             |
| `loading` | A skeleton of the same shape (a header placeholder above the box, `skeletonRows` rows in it), the rows are `aria-busy`, and a polite status (`loadingLabel`) announces it. |
| `failed`  | An error block (`failedHeading`, `failedMessage`) in the box with a retry button, and the `[list-card-failed]` slot for more actions. No header.                           |
| `empty`   | Nothing to list at all: `emptyIllustration` or `emptyIcon`, `emptyHeading`, `emptyMessage`, and `[list-card-empty]` for the call to action, in the box. No header.         |

In every state but `ready` the projected content is not rendered.

## Inputs

| Input               | Type                                          | Default                          | Role                                                                                        |
| ------------------- | --------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| `state`             | `'loading' \| 'failed' \| 'empty' \| 'ready'` | `'ready'`                        | Which of the four states shows.                                                             |
| `ariaLabel`         | `string \| null`                              | `null`                           | Names the card's `<section>` (for example "Issues").                                        |
| `loadingLabel`      | `string`                                      | `'Loading…'`                     | Visually hidden, read out politely while loading.                                           |
| `skeletonRows`      | `number`                                      | `4`                              | Placeholder rows while loading.                                                             |
| `skeletonHeader`    | `boolean`                                     | `true`                           | Shows a placeholder of the header while loading (turn off for a card without a header).     |
| `failedHeading`     | `string`                                      | `'The list could not be loaded'` | Heading of the failed block.                                                                |
| `failedMessage`     | `string`                                      | `''`                             | Optional detail under it.                                                                   |
| `retryLabel`        | `string \| null`                              | `'Retry'`                        | Label of the retry button. `null` hides it (bring your own action in `[list-card-failed]`). |
| `emptyHeading`      | `string`                                      | `'Nothing here yet'`             | Heading of the empty block.                                                                 |
| `emptyMessage`      | `string`                                      | `''`                             | Optional message under it.                                                                  |
| `emptyIllustration` | `EmptyStateIllustration \| null`              | `null`                           | The curated artwork of [`gbt-empty-state`](../empty-state/README.md) (full size).           |
| `emptyIcon`         | `string \| null`                              | `null`                           | A registered icon name on a soft disc (compact size), when there is no illustration.        |

## Outputs

| Output  | Payload | Role                                              |
| ------- | ------- | ------------------------------------------------- |
| `retry` | `void`  | The retry button of the failed block was pressed. |

## Slots

| Selector             | State    | Role                                                                                                                                                                                                       |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[list-card-header]` | `ready`  | The header, above the box: state tabs (`gbt-segmented-control tinted`), a heading, a count, filters. No header when absent.                                                                                |
| (default)            | `ready`  | The list. A direct child `ul`/`ol` loses its bullets and spacing; a direct child carrying the `list-card-message` attribute is the centred quiet message of a list that is empty under the current filter. |
| `[list-card-failed]` | `failed` | Extra actions after the retry button.                                                                                                                                                                      |
| `[list-card-empty]`  | `empty`  | The call to action (a `gbt-button`).                                                                                                                                                                       |

## Structure: a header over a box, in one section

The card renders one `<section>` (named by `ariaLabel`, carrying `data-state`) with two parts:

1. **The header** (`.gbt-list-card__header`, `ready` and `loading` only): a plain row **above** the box —
   the projected `[list-card-header]`, or its skeleton while loading. It has no background, no border and
   no padding of its own, like [`gbt-card`](../card/README.md)'s header; `0.5rem` separates it from the
   box. It reserves the height of a `md` control (`--gbt-control-height-md`, 38px), so the loading
   placeholder and the ready header are the same height and the box does not move when the list arrives.
   A header that holds only a heading (no tabs, input or button) is shorter than that on its own: expect a
   little whitespace above the box in that case, since there is no background to make the row visible.
2. **The box** (`.gbt-list-card__box`): the 1px edge (`--gbt-card-border`), the radius and the background.
   It holds the list, the skeleton rows, the failed block or the empty block.

```
<gbt-list-card>
  section.gbt-list-card            the landmark and the size container: aria-label, data-state
    span.sr-only[role=status]      the loading announcement
    div.gbt-list-card__header      [list-card-header], or its skeleton (ready/loading only)
    div.gbt-list-card__box         the edge, the radius, the clipping
      div.gbt-list-card__body      ready: your projected list
      (or, instead of the body: the loading skeleton rows, the failed block, or the empty block —
       exactly one of these four renders in the box at a time, depending on `state`)
```

Unlike `gbt-card`, the header stays **inside** the section: the header's tabs and filters belong to the
named region ("Issues") exactly as the rows do. `.gbt-list-card` is the section, carrying `data-state`;
the edge is drawn by `.gbt-list-card__box`.

## Behaviour

- The card is a **size container** named `gbt-list-card`, on the section (header and box): the header's
  items sit closer under 560 px of card width, and a page can add its own
  `@container gbt-list-card (max-width: …)` rules (hide a column, shorten a label). Never make it a
  shrink-to-fit flex or grid item; give it a width or let it fill a block.
- The box clips its corners (`overflow: hidden`), so the rows' hover follows the rounded edge. The header is
  outside the box and is never clipped.
- The failed block is a live alert (`role="alert"`). The loading status is a **persistent** polite region
  (`role="status"`, a direct child of the section, empty unless `loading`) and is never inside the
  `aria-busy` skeleton, so the announcement is not held back. A card that is already `loading` on its very
  first render inserts the region with its text, which some screen readers do not announce: start in
  `ready` and switch, or accept it.
- **Focus after Retry**: pressing Retry usually flips the state to `loading`, which removes the focused
  button and drops focus to the page. Move focus to a stable target yourself (the card's heading or the
  list once it is ready), or keep the retry outside the card.
- The empty and failed buttons reach 44 px on touch screens.

## Example

```html
<gbt-list-card
  ariaLabel="Issues"
  [state]="state()"
  loadingLabel="Loading issues…"
  failedHeading="The issues could not be loaded"
  emptyHeading="No issues yet"
  emptyIcon="circle-dot"
  (retry)="reload()"
>
  <gbt-segmented-control
    list-card-header
    tinted
    ariaLabel="Issue state"
    [options]="tabs"
    [(value)]="tab"
  />

  @if (rows().length === 0) {
  <p list-card-message>No {{ tab() }} issues.</p>
  } @else {
  <ul>
    @for (issue of rows(); track issue.id) {
    <li>
      <gbt-list-row>
        <a [href]="issue.url" [title]="issue.title">{{ issue.title }}</a>
      </gbt-list-row>
    </li>
    }
  </ul>
  }

  <gbt-button list-card-empty variant="secondary" iconName="plus" text="New issue" />
</gbt-list-card>
```

The `failed` and `empty` slots are only rendered in their own state, so the button above shows only when
`state` is `empty`.

## Accessibility

See [AUDIT.md](AUDIT.md). Note that Safari and VoiceOver drop the list semantics of a `ul` whose bullets are
removed with `list-style: none`: add `role="list"` on the `ul` if that matters to you.
