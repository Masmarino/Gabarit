# PageHeader

The heading block at the top of a page: the title (the page's `<h1>`), badges
on its row, one muted meta line under it and the page's actions on the right.
Below a title-plus-actions width the actions wrap under the title instead of
squeezing it.

**Selector**: `gbt-page-header`

## Inputs

| Input          | Type          | Default | Role                                                                                                              |
| -------------- | ------------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `heading`      | `string`      | —       | Required. The title. It is `heading`, not `title`: a `title` attribute would stay on the host and show a tooltip. |
| `headingLevel` | `1 \| 2 \| 3` | `1`     | `1` is the page title (once per page). `2` / `3` for a header repeated inside a page, a tab or a dialog.          |

## Slots

| Selector           | Role                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `[header-title]`   | On the title's row, right after it, outside the heading: a `#128` suffix, an icon…                |
| `[header-badges]`  | Status or visibility badges on the same row. Collapses when empty.                                |
| `[header-meta]`    | One muted line under the title (author, dates, a description). Collapses when empty.              |
| `[header-actions]` | Right aligned, level with the title; wraps as a row of its own when narrow. Collapses when empty. |

Empty slots collapse (`:empty`), including a slot filled by an `@if` that is currently false.

## Example

```html
<gbt-page-header heading="harbor">
  <gbt-badge header-badges>Public</gbt-badge>
  <span header-meta>florian · A self-hosted Git forge</span>
  <gbt-button header-actions variant="secondary" size="small" text="Follow" />
</gbt-page-header>
```

An issue page, with a number after the title:

```html
<gbt-page-header heading="The label picker reloads in a loop">
  <span header-title class="muted">#128</span>
  <gbt-badge header-badges variant="success" icon="check">Open</gbt-badge>
  <span header-meta><gbt-user-chip name="Alice Martin" /> opened this 2 days ago</span>
</gbt-page-header>
```

## Layout

The host is a block with a `1.5rem` bottom margin; the header has a hairline
(`--gbt-hairline`) under it. Give the header the same width as the content
below it: put both under the same `gbt-page-layout` or the same max-width.

## Accessibility

See [AUDIT.md](AUDIT.md).
