# PageLayout

The grid a page is built on: a main column, an optional side panel
(`[page-aside]`) and an optional navigation column (`[page-nav]`, on the
start side). It centres itself within a maximum width and **responds to the
width it actually gets** (a container query), not to the window's: inside an
application shell a 1024 px window leaves ~780 px beside a sidebar, which
cannot hold a 300 px aside next to readable content.

**Selector**: `gbt-page-layout`

## Inputs

| Input           | Type                                        | Default             | Role                                                                                              |
| --------------- | ------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `width`         | `'narrow' \| 'default' \| 'wide' \| 'full'` | `'default'`         | Max width, centred: 640 px (forms) \| 1200 px \| 1440 px \| none.                                 |
| `asideWidth`    | `'sm' \| 'md' \| 'lg'`                      | `'md'`              | Aside column: 240 px \| 300 px \| 360 px.                                                         |
| `asidePosition` | `'start' \| 'end'`                          | `'end'`             | Side of the aside when there is no nav column (with a nav, the aside always goes at the end).     |
| `navLabel`      | `string`                                    | `'Page navigation'` | Accessible name of the `[page-nav]` landmark (the application shell has its own main navigation). |
| `asideLabel`    | `string \| null`                            | `null`              | Accessible name of the `[page-aside]` landmark (a complementary region). No name when `null`.     |
| `stickyNav`     | `boolean`                                   | `false`             | Keeps the nav column in view while a long main column scrolls (from two columns up).              |

## Slots

| Selector       | Role                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| (default)      | The main column.                                                                                               |
| `[page-nav]`   | A navigation column on the start side, rendered in a `<nav>` named by `navLabel`.                              |
| `[page-aside]` | A side column, rendered in an `<aside>`. Typically a stack of [`gbt-panel`](../../molecules/panel/README.md)s. |

Empty `[page-nav]` and `[page-aside]` are hidden (`:empty`): no column, no gap, no empty landmark.
The layout adds no `<main>`: the application shell already has one.

## Columns (measured on the layout's own width)

| Layout width   | Columns                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| up to 768 px   | One column: nav, main, aside stacked in DOM order. The stacked aside opens with a hairline.                                          |
| 769 to 1100 px | Main + aside, or nav + main (with an aside under main). Aside on the `asidePosition` side when there is no nav.                      |
| from 1101 px   | Nav + main + aside side by side. The aside sticks (`top: 1rem`) while the main column scrolls, and so does the nav with `stickyNav`. |

## Things to know

- **`@if` around a slot**: content projected into `[page-aside]` / `[page-nav]` inside an `@if` needs a
  **single root element** carrying the attribute: `@if (x) { <div page-aside>…</div> }`.
- **Never make the layout a shrink-to-fit flex or grid item.** The host is a size container
  (`container-type: inline-size`), which has no intrinsic width: give it a width or let it fill a block.
- Header and layout should share a frame: put a `gbt-page-header` inside the same `width`, or use
  `width="wide"` for both.
- **Custom column widths**: `--gbt-page-aside-width` (240 / 300 / 360 px from `asideWidth`) and
  `--gbt-page-nav-width` (240 px) are declared on the host, and setting either on the host (a class of
  yours, a `style` binding) overrides the column width: `.blob-layout { --gbt-page-nav-width: 280px }`.
- **Your own responsive rules** query the same container: `@container gbt-page-layout (min-width: 769px)`
  for anything inside the layout follows the layout's own width, exactly like the layout does.

## Example

```html
<gbt-page-header heading="harbor" />

<gbt-page-layout width="wide" asideWidth="sm" navLabel="Repository files" [stickyNav]="true">
  <div page-nav>…files…</div>

  <article>…main content…</article>

  @if (about()) {
  <div page-aside>
    <gbt-panel heading="About" [headingLevel]="2">…</gbt-panel>
  </div>
  }
</gbt-page-layout>
```

## Accessibility

See [AUDIT.md](./AUDIT.md).
