# Panel

A flat side-panel section: a small heading, an optional action on its
right, then the content. It sits on the page background (no card, no
shadow); consecutive panels are separated by a hairline. Made for the
`[page-aside]` of [`gbt-page-layout`](../../templates/page-layout/README.md)
(about, metadata, participants, filters…).

**Selector**: `gbt-panel`

## Inputs

| Input          | Type          | Default | Role                                                                                              |
| -------------- | ------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `heading`      | `string`      | —       | Required. The small heading; it also names the `<section>` (`aria-labelledby`).                   |
| `headingLevel` | `2 \| 3 \| 4` | `3`     | `3` under the page's `h1` + section `h2`s; `2` when the panel is a top-level section of the page. |

## Slots

| Selector          | Role                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `[panel-actions]` | Right of the heading (an icon button, a link). Collapses when empty. |
| (default)         | The panel's content (14 px text in `--text-primary`).                |

## Separator between panels

A panel that directly follows another gets `margin-top: 1rem`, `padding-top: 1rem` and a
`--gbt-hairline` border on top. Emulated view encapsulation cannot express "a panel after a panel"
from inside the component, so this is one rule that is not scoped to the component
(`gbt-panel + gbt-panel`), keyed on the element name. Put other content between two panels and the
separator is gone: it is the panels' business, not a general divider.

## Example

```html
<gbt-page-layout>
  <p>Main content</p>

  <div page-aside>
    <gbt-panel heading="About" [headingLevel]="2">
      <p>A self-hosted Git forge.</p>
    </gbt-panel>
    <gbt-panel heading="Contributors" [headingLevel]="2">
      <gbt-button panel-actions variant="ghost" size="small" text="See all" />
      <gbt-user-chip name="Alice Martin" />
    </gbt-panel>
  </div>
</gbt-page-layout>
```

## Accessibility

Each panel is a `<section>` labelled by its heading, so it is a named
region for screen reader users. Pick `headingLevel` so the panels fit your
outline (`2` for the panels of an aside next to a page `h1`, `3` inside a
section). See [AUDIT.md](./AUDIT.md).
