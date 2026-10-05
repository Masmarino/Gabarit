# ListRow

One item of a list (issues, merge requests, pipelines, accounts…): a
leading status icon, the title area (the title link, then its badges and
tags), a muted meta line under it, and trailing actions or counters on the
right. Every column lines up on the title's first line.

The page provides the list semantics and the surface around it
(`ul > li > gbt-list-row`, inside a [`gbt-list-card`](../list-card/README.md)
or any bordered box). The row adds hairlines between consecutive rows, a
hover / focus-within background and title truncation.

**Selector**: `gbt-list-row`

## Inputs

| Input  | Type                                                       | Default     | Role                                                                                  |
| ------ | ---------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `tone` | `'neutral' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'neutral'` | Tint of the `[row-leading]` icon: muted, or the status colour (`gbt-badge` variants). |

## Slots

| Selector         | Role                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `[row-leading]`  | A 20 px column centred on the title line: a status icon (`gbt-icon` renders as a 16 px glyph). Tinted by `tone`. Collapses when empty.     |
| (default)        | The title area: the title **link as a direct child**, then badges, tags or a `gbt-user-chip`.                                              |
| `[row-meta]`     | A muted line under the title (one or several `span`s, wrapping together). `code` inside is a monospace chip. Collapses when empty.         |
| `[row-trailing]` | Counters, an avatar, a menu, right aligned. Wraps under the main column, still right aligned, when there is no room. Collapses when empty. |

## Rules of use

- **The title link is a DIRECT child of the row** (`<a>` straight inside `gbt-list-row`, not wrapped in a
  `span` or a `@if` block element): only a direct child gets the truncation (one line, ellipsis) and the
  focus ring. Give it the full title in `title`.
- Children of the title area do not shrink (`flex: none`), except the link and a `gbt-user-chip`, which
  truncate. Tags that do not fit beside the title wrap below it.
- Keep **the same trailing items in every row** of a list (an empty, fixed-width `span` for a missing
  avatar) so the columns line up.
- The status is never told by colour alone: put an icon that differs per status and a text alternative
  (`<span class="sr-only">Open</span>`) next to it.
- Do not nest interactive controls inside the title link.

## Separators

`li + li > gbt-list-row` and `gbt-list-row + gbt-list-row` get a `--gbt-hairline` border on top. Emulated
view encapsulation cannot express "a row after a row" from inside the component, so this is one rule
that is not scoped to the component, keyed on the element name.

## Example

```html
<ul>
  @for (issue of issues; track issue.id) {
  <li>
    <gbt-list-row [tone]="issue.tone">
      <span row-leading>
        <gbt-icon [name]="issue.icon" />
        <span class="sr-only">{{ issue.status }}</span>
      </span>
      <a [href]="issue.url" [title]="issue.title">{{ issue.title }}</a>
      <gbt-tag [color]="'#dc2626'">bug</gbt-tag>
      <span row-meta>#{{ issue.id }} opened {{ issue.age }} by {{ issue.author }}</span>
      <span row-trailing><gbt-icon name="message-circle" />{{ issue.comments }}</span>
    </gbt-list-row>
  </li>
  }
</ul>
```

## Accessibility

See [AUDIT.md](AUDIT.md).
