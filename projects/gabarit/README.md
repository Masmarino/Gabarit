# Gabarit

[![CI](https://github.com/Masmarino/Gabarit/actions/workflows/ci.yml/badge.svg)](https://github.com/Masmarino/Gabarit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40masmarino%2Fgabarit)](https://www.npmjs.com/package/@masmarino/gabarit)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Angular design system for self-hosted applications — UI components and
dataviz, no external dependency.

## Installation

```bash
npm install @masmarino/gabarit
```

## Components

Each component has its own README, with the detail of its inputs and
outputs — the link is on its name.

### Atoms

| Component                                                                               | Selector               | Role                                                                 |
| --------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| [Avatar](projects/gabarit/src/lib/components/atoms/avatar/README.md)                    | `gbt-avatar`           | User picture with an initials fallback.                              |
| [Badge](projects/gabarit/src/lib/components/atoms/badge/README.md)                      | `gbt-badge`            | Status/category label pill.                                          |
| [Button](projects/gabarit/src/lib/components/atoms/button/README.md)                    | `gbt-button`           | Action button.                                                       |
| [ButtonLink](projects/gabarit/src/lib/components/atoms/button-link/README.md)           | `a[gbtButton]`         | Anchor styled as a button (router-agnostic).                         |
| [Checkbox](projects/gabarit/src/lib/components/atoms/checkbox/README.md)                | `gbt-checkbox`         | Checkbox, integrated with forms.                                     |
| [CodeChip](projects/gabarit/src/lib/components/atoms/code-chip/README.md)               | `gbt-code-chip`        | Monospace chip for a SHA, tag or branch; truncates, optional copy.   |
| [CopyButton](projects/gabarit/src/lib/components/atoms/copy-button/README.md)           | `gbt-copy-button`      | Copies a value to the clipboard, with a live-region confirmation.    |
| [Counter](projects/gabarit/src/lib/components/atoms/counter/README.md)                  | `gbt-counter`          | Small number pill: cap (`99+`), neutral / primary.                   |
| [Divider](projects/gabarit/src/lib/components/atoms/divider/README.md)                  | `gbt-divider`          | Separating line with an optional centred label.                      |
| [GaugeBar](projects/gabarit/src/lib/components/atoms/gauge-bar/README.md)               | `gbt-gauge-bar`        | Progress gauge with alert thresholds.                                |
| [Icon](projects/gabarit/src/lib/components/atoms/icon/README.md)                        | `gbt-icon`             | Registered SVG icon, with generic built-in glyphs (`Gallery` story). |
| [IconMarker](projects/gabarit/src/lib/components/atoms/icon-marker/README.md)           | `gbt-icon-marker`      | Icon on a soft tinted disc or tile, six tones.                       |
| [Input](projects/gabarit/src/lib/components/atoms/input/README.md)                      | `gbt-input`            | Text or password field.                                              |
| [JobStatus](projects/gabarit/src/lib/components/atoms/job-status/README.md)             | `gbt-job-status`       | CI job status glyph (extracted from the job graph).                  |
| [NotificationDot](projects/gabarit/src/lib/components/atoms/notification-dot/README.md) | `gbt-notification-dot` | Dot or count overlaid on the corner of what it wraps.                |
| [SaveStatus](projects/gabarit/src/lib/components/atoms/save-status/README.md)           | `gbt-save-status`      | Saving / saved / not saved status, live region.                      |
| [Skeleton](projects/gabarit/src/lib/components/atoms/skeleton/README.md)                | `gbt-skeleton`         | Loading placeholder: line, circle or rectangle.                      |
| [Slider](projects/gabarit/src/lib/components/atoms/slider/README.md)                    | `gbt-slider`           | Native range slider, integrated with forms.                          |
| [Sparkline](projects/gabarit/src/lib/components/atoms/sparkline/README.md)              | `gbt-sparkline`        | Fixed-size trend mini-chart.                                         |
| [Spinner](projects/gabarit/src/lib/components/atoms/spinner/README.md)                  | `gbt-spinner`          | Standalone loading indicator.                                        |
| [Switch](projects/gabarit/src/lib/components/atoms/switch/README.md)                    | `gbt-switch`           | On/off toggle.                                                       |
| [Tag](projects/gabarit/src/lib/components/atoms/tag/README.md)                          | `gbt-tag`              | Custom-colored, optionally removable label.                          |
| [Textarea](projects/gabarit/src/lib/components/atoms/textarea/README.md)                | `gbt-textarea`         | Multiline text field.                                                |

### Molecules

| Component                                                                                     | Selector                                 | Role                                                                   |
| --------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| [Accordion](projects/gabarit/src/lib/components/molecules/accordion/README.md)                | `gbt-accordion` / `gbt-accordion-item`   | Collapsible sections.                                                  |
| [Alert](projects/gabarit/src/lib/components/molecules/alert/README.md)                        | `gbt-alert`                              | Persistent inline banner message.                                      |
| [Autocomplete](projects/gabarit/src/lib/components/molecules/autocomplete/README.md)          | `gbt-autocomplete`                       | Text field with async suggestions.                                     |
| [AvatarGroup](projects/gabarit/src/lib/components/molecules/avatar-group/README.md)           | `gbt-avatar-group`                       | Overlapping avatars with a +N overflow menu.                           |
| [Breadcrumb](projects/gabarit/src/lib/components/molecules/breadcrumb/README.md)              | `gbt-breadcrumb`                         | Ancestor trail plus current segment.                                   |
| [Card](projects/gabarit/src/lib/components/molecules/card/README.md)                          | `gbt-card`                               | Titled container.                                                      |
| [CheckboxGroup](projects/gabarit/src/lib/components/molecules/checkbox-group/README.md)       | `gbt-checkbox-group`                     | Group of checkboxes (fieldset + legend), value is an array.            |
| [CopyField](projects/gabarit/src/lib/components/molecules/copy-field/README.md)               | `gbt-copy-field`                         | Read-only monospace value with a copy button.                          |
| [DatePicker](projects/gabarit/src/lib/components/molecules/date-picker/README.md)             | `gbt-date-picker`                        | Single date, calendar dropdown, integrated with forms.                 |
| [DateRangePicker](projects/gabarit/src/lib/components/molecules/date-range-picker/README.md)  | `gbt-date-range-picker`                  | Start and end dates, calendar dropdown.                                |
| [DescriptionList](projects/gabarit/src/lib/components/molecules/description-list/README.md)   | `gbt-description-list`                   | Label/value pairs on a `dl`, `valueAlign`, opt-in stacking.            |
| [DimensionCard](projects/gabarit/src/lib/components/molecules/dimension-card/README.md)       | `gbt-dimension-card`                     | Dimension table with an accented hover row.                            |
| [Disclosure](projects/gabarit/src/lib/components/molecules/disclosure/README.md)              | `gbt-disclosure`                         | Single disclosure: toggle button and panel, `open` model.              |
| [EmptyState](projects/gabarit/src/lib/components/molecules/empty-state/README.md)             | `gbt-empty-state`                        | Placeholder for an empty list/grid.                                    |
| [FileUpload](projects/gabarit/src/lib/components/molecules/file-upload/README.md)             | `gbt-file-upload`                        | Drag-and-drop or click file selection, removable list.                 |
| [FunnelChart](projects/gabarit/src/lib/components/molecules/funnel-chart/README.md)           | `gbt-funnel-chart`                       | Step-by-step conversion funnel.                                        |
| [JobGraph](projects/gabarit/src/lib/components/molecules/job-graph/README.md)                 | `gbt-job-graph`                          | Pipeline jobs by stage, linked by their dependencies.                  |
| [ListCard](projects/gabarit/src/lib/components/molecules/list-card/README.md)                 | `gbt-list-card`                          | Card for a list: header band, loading / failed / empty / ready states. |
| [ListRow](projects/gabarit/src/lib/components/molecules/list-row/README.md)                   | `gbt-list-row`                           | List item: leading status, title, meta, trailing actions.              |
| [ListToolbar](projects/gabarit/src/lib/components/molecules/list-toolbar/README.md)           | `gbt-list-toolbar`                       | Search + sort controls for a list.                                     |
| [Menu](projects/gabarit/src/lib/components/molecules/menu/README.md)                          | `gbt-menu`                               | Generic dropdown menu.                                                 |
| [MenuItem](projects/gabarit/src/lib/components/molecules/menu-item/README.md)                 | `button[gbtMenuItem]` / `a[gbtMenuItem]` | Menu item: icon, danger variant, disabled, link form.                  |
| [NavTabs](projects/gabarit/src/lib/components/molecules/nav-tabs/README.md)                   | `gbt-nav-tabs` / `a[gbtNavTab]`          | Router-agnostic nav links: icon, badge, orientation, fades.            |
| [PageHeader](projects/gabarit/src/lib/components/molecules/page-header/README.md)             | `gbt-page-header`                        | Page title block: heading, badges, meta, actions.                      |
| [Pagination](projects/gabarit/src/lib/components/molecules/pagination/README.md)              | `gbt-pagination`                         | Page navigation for a list/table.                                      |
| [Panel](projects/gabarit/src/lib/components/molecules/panel/README.md)                        | `gbt-panel`                              | Flat side-panel section: heading, actions, content.                    |
| [Popover](projects/gabarit/src/lib/components/molecules/popover/README.md)                    | `gbt-popover`                            | Floating panel opened by a click on its trigger.                       |
| [RadioGroup](projects/gabarit/src/lib/components/molecules/radio-group/README.md)             | `gbt-radio-group`                        | Radio button group, integrated with forms.                             |
| [SecretReveal](projects/gabarit/src/lib/components/molecules/secret-reveal/README.md)         | `gbt-secret-reveal`                      | Masked secret: show / hide and copy.                                   |
| [SegmentedControl](projects/gabarit/src/lib/components/molecules/segmented-control/README.md) | `gbt-segmented-control`                  | Exclusive-choice button group (`tinted`, `fullWidth`, `wrap`).         |
| [Select](projects/gabarit/src/lib/components/molecules/select/README.md)                      | `gbt-select`                             | Dropdown list, single or multiple.                                     |
| [SkeletonList](projects/gabarit/src/lib/components/molecules/skeleton-list/README.md)         | `gbt-skeleton-list`                      | Placeholder rows for a loading list, with a polite status.             |
| [StatGrid](projects/gabarit/src/lib/components/molecules/stat-grid/README.md)                 | `gbt-stat-grid`                          | Responsive grid of stat tiles (container query), loading state.        |
| [StatTile](projects/gabarit/src/lib/components/molecules/stat-tile/README.md)                 | `gbt-stat-tile`                          | Figure with label, icon, hint, trend and optional link.                |
| [Stepper](projects/gabarit/src/lib/components/molecules/stepper/README.md)                    | `gbt-stepper`                            | Informational progress through numbered steps.                         |
| [Table](projects/gabarit/src/lib/components/molecules/table/README.md)                        | `gbt-table`                              | Data table.                                                            |
| [Tabs](projects/gabarit/src/lib/components/molecules/tabs/README.md)                          | `gbt-tabs` / `gbt-tab`                   | Tab navigation.                                                        |
| [TagInput](projects/gabarit/src/lib/components/molecules/tag-input/README.md)                 | `gbt-tag-input`                          | Free-typed values shown as removable tags.                             |
| [Tooltip](projects/gabarit/src/lib/components/molecules/tooltip/README.md)                    | `gbt-tooltip`                            | Hover/focus info bubble for any content.                               |
| [Tree](projects/gabarit/src/lib/components/molecules/tree/README.md)                          | `gbt-tree`                               | Expandable hierarchical list (WAI-ARIA tree view).                     |
| [UserChip](projects/gabarit/src/lib/components/molecules/user-chip/README.md)                 | `gbt-user-chip`                          | Avatar + name on one line.                                             |

### Organisms

| Component                                                                                          | Selector                   | Role                                                                     |
| -------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------ |
| [BarChart](projects/gabarit/src/lib/components/organisms/bar-chart/README.md)                      | `gbt-bar-chart`            | Bar chart on the dataviz base.                                           |
| [ChartAxis](projects/gabarit/src/lib/components/organisms/chart-axis/README.md)                    | `g[gbtChartAxis]`          | Axis ticks — base building block.                                        |
| [ChartEmpty](projects/gabarit/src/lib/components/organisms/chart-empty/README.md)                  | `gbt-chart-empty`          | Empty state — base building block.                                       |
| [ChartFrame](projects/gabarit/src/lib/components/organisms/chart-frame/README.md)                  | `gbt-chart-frame`          | Low-level base, for a custom chart.                                      |
| [ChartLegend](projects/gabarit/src/lib/components/organisms/chart-legend/README.md)                | `gbt-chart-legend`         | Multi-series legend — base building block.                               |
| [ChartTable](projects/gabarit/src/lib/components/organisms/chart-table/README.md)                  | `gbt-chart-table`          | Non-visual table — base building block.                                  |
| [ChartTooltip](projects/gabarit/src/lib/components/organisms/chart-tooltip/README.md)              | `gbt-chart-tooltip`        | Tooltip — base building block.                                           |
| [ConfirmDangerModal](projects/gabarit/src/lib/components/organisms/confirm-danger-modal/README.md) | `gbt-confirm-danger-modal` | Type-to-confirm destructive-action dialog.                               |
| [Drawer](projects/gabarit/src/lib/components/organisms/drawer/README.md)                           | `gbt-drawer`               | Side panel from a screen edge, focus trapped.                            |
| [GbtToastService](projects/gabarit/src/lib/components/organisms/toaster/README.md)                 | `GbtToastService`          | Signal store of toasts; `gbt-toaster` shows it when `toasts` is omitted. |
| [LineChart](projects/gabarit/src/lib/components/organisms/line-chart/README.md)                    | `gbt-line-chart`           | Line(s) on the dataviz base.                                             |
| [Modal](projects/gabarit/src/lib/components/organisms/modal/README.md)                             | `gbt-modal`                | Modal dialog box.                                                        |
| [PieChart](projects/gabarit/src/lib/components/organisms/pie-chart/README.md)                      | `gbt-pie-chart`            | Pie or donut chart.                                                      |
| [SearchBar](projects/gabarit/src/lib/components/organisms/search-bar/README.md)                    | `gbt-search-bar`           | Search with grouped results.                                             |
| [TimelineChart](projects/gabarit/src/lib/components/organisms/timeline-chart/README.md)            | `gbt-timeline-chart`       | Timeline on the dataviz base.                                            |
| [Toaster](projects/gabarit/src/lib/components/organisms/toaster/README.md)                         | `gbt-toaster`              | Stack of temporary notifications.                                        |

### Templates

| Component                                                                                       | Selector                  | Role                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------- |
| [AppShell](projects/gabarit/src/lib/components/templates/app-shell/README.md)                   | `gbt-app-shell`           | Page shell: side nav, header, content.                    |
| [AppShellNavGroup](projects/gabarit/src/lib/components/templates/app-shell-nav-group/README.md) | `gbt-app-shell-nav-group` | Collapsible nav group, works in the collapsed rail.       |
| [PageLayout](projects/gabarit/src/lib/components/templates/page-layout/README.md)               | `gbt-page-layout`         | Page grid: main, aside and nav columns (container query). |

### Directives and helper components to import

These are not standalone widgets: they decorate a projected element of a
component above. **They must be imported next to the component** (`imports:
[Card, CardHeader]`); without the import the element is still rendered
but plain, without the layout the directive provides.

| Class          | Selector             | Used with                                                            |
| -------------- | -------------------- | -------------------------------------------------------------------- |
| `CardHeader`   | `[card-header]`      | `gbt-card`: your own header above the box, actions on the right.     |
| `CardLink`     | `a[gbtCardLink]`     | `gbt-card`: link mode, the card's box is clickable (stretched link). |
| `MenuTrigger`  | `[gbtMenuTrigger]`   | `gbt-menu`: a custom trigger element instead of the default button.  |
| `StatTileLink` | `a[gbtStatTileLink]` | `gbt-stat-tile`: the router-agnostic link, its text is the label.    |

## Primitives and pipes

Pure functions exported from `@masmarino/gabarit`, usable in any TypeScript
file (no component, no injection context, no browser API beyond `Intl`) and
tree-shakable. Every formatter takes the **locale first**, because Gabarit
has no i18n of its own; the pipes default it to Angular's `LOCALE_ID`.
A missing value (`null`/`undefined`) prints `''`; a value that is not a
finite number or a valid date prints `—`.

| Function                                                      | Role                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------- |
| `formatBytes(bytes, locale, { base, decimals, binaryUnits })` | A file size: `1.5 KiB`, `1,5 Kio`, `1,5 ko` (base 1000).             |
| `formatRelativeTime(date, locale, now?, options?)`            | "5 minutes ago" through `Intl.RelativeTimeFormat`.                   |
| `formatDateTime(date, locale, options?)`                      | A date and time through `Intl.DateTimeFormat`.                       |
| `formatDuration(ms, locale, { days })`                        | `1 min 30 s`, `2 h 5 min`; `{ days: true }` adds `2 d 3 h`.          |
| `formatNumber`, `formatCompact`, `formatPercent`              | Locale-aware numbers (`1,234`, `1.2K`, `12.3%`).                     |
| `computeInitials(name)`                                       | Up to two capitals for an avatar: `Ada Lovelace` gives `AL`.         |
| `createListToolbarState(config)`                              | Search and sort signals for a `gbt-list-toolbar`.                    |
| `copyToClipboard`, `ClipboardFeedback`, `selectContents`      | The clipboard helpers behind `gbt-copy-button` and `gbt-copy-field`. |

Numbers and units in `formatBytes` are joined by a no-break space (`U+00A0`).
The examples below write it as a plain space.

| Call                                                | `en`                    | `fr`                   |
| --------------------------------------------------- | ----------------------- | ---------------------- |
| `formatBytes(1536, l)`                              | `1.5 KiB`               | `1,5 Kio`              |
| `formatBytes(1536, l, { binaryUnits: 'legacy' })`   | `1.5 KB`                | `1,5 Ko`               |
| `formatBytes(1500, l, { base: 1000 })`              | `1.5 kB`                | `1,5 ko`               |
| `formatBytes(512, l)`, `formatBytes(NaN, l)`        | `512 B`, `—`            | `512 o`, `—`           |
| `formatRelativeTime(d, l, now)`, 5 minutes earlier  | `5 minutes ago`         | `il y a 5 minutes`     |
| the same, 26 hours earlier                          | `yesterday`             | `hier`                 |
| the same, 3 days earlier                            | `3 days ago`            | `il y a 3 jours`       |
| the same, 2 hours later                             | `in 2 hours`            | `dans 2 heures`        |
| the same, less than 10 s away                       | `now`                   | `maintenant`           |
| `formatRelativeTime(d, l, now, { style: 'short' })` | `5 min. ago`            | `il y a 5 min`         |
| `formatDateTime(d, l)`                              | `Sep 26, 2026, 2:05 PM` | `26 sept. 2026, 14:05` |
| `formatDateTime(d, l, { dateStyle: 'long' })`       | `September 26, 2026`    | `26 septembre 2026`    |
| `formatDuration(90_000_000, l, { days: true })`     | `1 d 1 h`               | `1 j 1 h`              |

Details worth knowing:

- **`formatBytes`** counts in 1024 by default (as a file manager does) and
  labels with the unambiguous binary units; `base: 1000` counts in thousands
  and labels with the SI units of the locale (`kB`, `ko`). Bytes are never
  fractional, the ranks above show at most `decimals` (default 1) digits and
  roll over (`1023.96 KiB` is `1 MiB`), a negative size keeps its sign. The
  binary label is the locale's SI label with an `i` (`Kio` in `fr`, `KiB` in
  `en`, `de`, `ja`), except where the locale writes its byte in another script
  (`ru`, `uk`, `ar`): those get the Latin `KiB`, `MiB`... so a label never mixes
  two scripts. `binaryUnits: 'legacy'` prints `KB` / `Ko` instead.
- **`formatRelativeTime`** picks the unit from the gap, rounding toward zero:
  under 10 s `now`, seconds under a minute, then minutes, hours, days (under
  7 days), weeks (under 30 days), months (30 days each, under a year), years.
  Past and future are handled. `now` defaults to the current time; pass it for
  a deterministic render. The dates are `Date`, ISO strings or epoch
  milliseconds. Options:
  - `style`: `'long'` (default, `5 minutes ago`), `'short'` (`5 min. ago`),
    `'narrow'`.
  - `numeric`: `'auto'` (default) says `yesterday` / `hier`; `'always'` says
    `1 day ago` / `il y a 1 jour`.
  - `maxUnit`: `'hour' | 'day' | 'week' | 'month'` caps the largest unit, so
    `'day'` gives `il y a 12 jours` instead of `il y a 2 semaines` (and
    `il y a 400 jours` instead of years). Without it weeks and months always
    appear.
  - `absoluteAfterDays: 30` switches to the numeric date (`26/08/2026`) from
    that gap on; `timeZone` sets the zone of that date.
- **`formatDateTime`** uses the runtime's time zone unless `options.timeZone`
  says otherwise. Options that select fields replace the default medium date
  and short time, other options (a time zone) apply on top of it.
- **`formatDuration`** keeps its existing output unless `days: true`; with it
  a duration of a day or more prints days and hours (minutes are dropped, as
  with hours and seconds) using the locale's day letter (`d`, `j`).

### Pipes

Standalone, **pure** pipes that call the primitives. The locale is
`options.locale`, else Angular's `LOCALE_ID` (`en-US` unless the application
provides another, for instance `{ provide: LOCALE_ID, useValue: 'fr' }`); the
document's `lang` is deliberately not read, so server and browser render
alike.

| Pipe              | Example                                       | Output (`fr`)          |
| ----------------- | --------------------------------------------- | ---------------------- |
| `gbtRelativeTime` | `{{ event.at \| gbtRelativeTime }}`           | `il y a 5 minutes`     |
| `gbtBytes`        | `{{ file.size \| gbtBytes: { base: 1000 } }}` | `1,5 ko`               |
| `gbtDateTime`     | `{{ event.at \| gbtDateTime }}`               | `26 sept. 2026, 14:05` |

Relative time goes stale, and a pure pipe is not re-evaluated as time passes:
the text is right as of the last time the value or the options changed. That
is what most lists want (no timer per row). For a view that must stay live,
update one signal on a timer and pass it as `now`:

```html
{{ event.at | gbtRelativeTime: { now: clock() } }}
```

### List toolbar state

`createListToolbarState(config)` holds the three signals behind a
`gbt-list-toolbar` (`search`, `sortValue`, `direction`) and the filter and sort
that go with them, so a list page does not re-declare them. It needs no
injection context.

```ts
readonly toolbar = createListToolbarState({
  sortOptions: [
    { value: 'name', label: 'Name' },
    { value: 'created', label: 'Created' },
  ],
  defaultSort: 'name', // defaults to the first option
})

readonly rows = this.toolbar.filtered(() => this.repos(), {
  text: (repo) => [repo.name, repo.description], // searched, case-insensitive
  sortBy: { name: (repo) => repo.name, created: (repo) => repo.createdAt },
})
```

```html
<gbt-list-toolbar
  searchLabel="Search"
  [sortOptions]="toolbar.sortOptions"
  [searchValue]="toolbar.search()"
  (searchValueChange)="toolbar.search.set($event)"
  [sortValue]="toolbar.sortValue()"
  (sortValueChange)="toolbar.sortValue.set($event)"
  [sortDirection]="toolbar.direction()"
  (sortDirectionChange)="toolbar.direction.set($event)"
/>
```

| Member                             | Role                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `search`, `sortValue`, `direction` | The writable signals.                                                             |
| `sortOptions`                      | The options given in the config, ready to bind.                                   |
| `dirty()`, `reset()`               | Whether anything differs from the start values, and back to them.                 |
| `apply(items, accessors)`          | Filters then sorts a list now; call it inside a `computed` to follow the signals. |
| `filtered(source, accessors)`      | A `computed` of `apply(source(), accessors)`; `source` is read lazily.            |

The accessors are `text` (a string or an array of strings, matched as a
case-insensitive substring of the trimmed search) and `sortBy` (one accessor
per sort field, returning a string, number, boolean or `Date`; missing or
non-finite values sort last in both directions). Strings compare with `Intl.Collator` (case-insensitive, numeric: `runner
2` before `runner 10`; pass `locale`). To take over, give `matches(item,
query)` and/or `compare(a, b, key)` instead. There is no debounce: the search
updates on every keystroke. With `sortBy`, `desc` sorts descending (equal items
keep their source order); with `compare`, `desc` reverses the ascending result.

## Styles

Import the tokens in the application's `styles.scss`:

```scss
@use 'gabarit/tokens' as *;
```

Gabarit declares **no** `@font-face` rule. The tokens expose
`--font-family: 'Inter', sans-serif`, but serving and declaring the font
is the application's responsibility.

### Color tokens

Every component exclusively reads the custom properties below, set on
`:root` by `_semantic.scss`. **These, and only these, are what an
application should override to re-theme itself** — the raw palette
(`--brand-*`, `--grey-*`, `--red-*`…) is an internal detail, never
referenced outside `_semantic.scss` (enforced by `token-usage.spec.ts`).

| Category    | Token                                                                    | Role                                                             |
| ----------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Brand       | `--primary` / `--primary-hover`                                          | Action color (buttons, active links, focus) and its hover state  |
| Backgrounds | `--bg-principal`                                                         | Page and surface background (cards, panels)                      |
|             | `--bg-panel`                                                             | Background of persistent navigation areas (nav, header)          |
|             | `--bg-hover`                                                             | Hover state of an interactive element on a neutral background    |
|             | `--bg-track`                                                             | Track of a segmented control, visible on the page and on a panel |
| Border      | `--border-color`                                                         | All borders                                                      |
|             | `--gbt-hairline` / `--gbt-card-border`                                   | Quiet separators and card edges, derived from `--border-color`   |
| Text        | `--text-primary` / `--text-secondary` / `--text-discret`                 | From most to least emphasized                                    |
|             | `--text-on-primary` / `--text-on-error` / `--text-on-color`              | Text set on a `--primary` fill, an error fill, or a solid color  |
| Success     | `--color-success-base` / `-hover` / `-text` / `-bg` / `-bg-text`         | Fill, hover, text, light background, text on that background     |
| Warning     | `--color-warning-base` / `-hover` / `-text` / `-bg` / `-bg-text`         | Same                                                             |
| Error       | `--color-error-base` / `-fill` / `-hover` / `-text` / `-bg` / `-bg-text` | Same (`-fill`: solid fill, e.g. an icon)                         |
| Dataviz     | `--chart-series-1-base`, `-2-base`, `-3-base`                            | The three chart series, in order                                 |
|             | `--chart-grid`                                                           | Chart grid and axes                                              |

Other tokens live on `:root` without being colors — border radii
(`--site-border-radius*`), shadows (`--site-shadow-*`), transition
durations (`--site-transition-*`), the monospace stack `--gbt-font-mono` — overridable the same way.

### Theming hooks

A few more tokens are not set on `:root`: each component falls back to the
value in the last column, resolved where it is used, so an app that leaves
them alone looks the same. Set one to take that part of the look in hand.

| Token                                           | Used by                                                                   | Fallback                                |
| ----------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------- |
| `--gbt-focus-ring`                              | Every focus outline                                                       | `var(--primary)`                        |
| `--gbt-font-display`                            | Page titles, stat tile values, empty state, auth panel and modal headings | `inherit`                               |
| `--gbt-radius-badge`                            | Badges, card and tab counts                                               | `999px` (a pill)                        |
| `--gbt-radius-chip`                             | Mono badges, inline code in a list row, search bar keys                   | `6px`                                   |
| `--gbt-radius-menu`                             | Select and autocomplete panels, menu items, search results                | `8px`                                   |
| `--gbt-radius-tile`                             | Icon marker tiles, job graph nodes, avatar group overflow, TOTP QR code   | `8px` (`12px` for the QR)               |
| `--gbt-radius-search`                           | The search bar field                                                      | `16px`                                  |
| `--gbt-nav-active-bg` / `--gbt-nav-active-text` | The current page in the app shell navigation                              | `--primary` / its text                  |
| `--gbt-nav-active-mark`                         | A 2px rule on the start edge of the current page link                     | `transparent`                           |
| `--gbt-shell-border`                            | The app shell's navigation and header edges                               | `var(--border-color)`                   |
| `--gbt-shell-header-bg`                         | The app shell's header                                                    | `transparent`                           |
| `--gbt-shell-content-padding`                   | The app shell's main content area                                         | `1rem`                                  |
| `--gbt-auth-panel-backdrop`                     | The page behind the auth panels (login, register…)                        | a soft `--primary` glow on `--bg-panel` |
| `--gbt-auth-panel-radius`                       | The auth panel card                                                       | `12px`                                  |

Overriding a token after the import:

```scss
@use 'gabarit/tokens' as *;

:root {
  --primary: #7c3aed;
}
```

**Dark mode activates via `prefers-color-scheme` or `[data-theme='dark']`
on `<html>`, and reapplies to the same tokens.** An override set on a bare
`:root` applies to both themes indifferently; for a value specific to
dark mode, redeclare it under the same conditions as Gabarit, after its
import:

```scss
@media (prefers-color-scheme: dark) {
  :root {
    --primary: #a78bfa;
  }
}
```

## Internationalization

Gabarit ships no translation mechanism. Every visible string is a
component input, supplied by the application.

## Accessibility

[`ACCESSIBILITY.md`](./ACCESSIBILITY.md) documents what Gabarit
guarantees with respect to RGAA (30 out of 106 criteria, checked on every
push by CI — `axe-core` in the unit tests and a dedicated contrast test —
plus a manual audit checklist for 69 components), what remains the application's
responsibility (76 criteria), and the points to watch when integrating
each component. Read it before writing your application's accessibility
statement — without it, that statement will be incomplete.

## Known limitations

**Not every non-resting state is covered by a test.** Hover and focus
are: `contrast.spec.ts` checks every hover fill and its perceptibility,
and `token-usage.spec.ts` measures the text/fill pairing as it will
actually be painted, translucent overlays and compositing included. The
`:active` and `:disabled` states are not — the latter is out of scope
for RGAA, which exempts inactive controls.

**Token-usage checking only reads the library's own CSS.** If your
application overrides a semantic token, verifying the resulting contrast
is your responsibility: Gabarit's tests only measure its own values. See
`ACCESSIBILITY.md`.

**Two global utility classes are not prefixed: `.sr-only` and
`.skip-link`.** They live in `_utilities.scss`, which `@use
'gabarit/tokens'` pours unencapsulated into the application's **global**
stylesheet — deliberately, so they stay usable outside the library's
components. An application that already defines one of these two common
names collides with it. Inside the library's own components
(`gbt-search-bar`, `gbt-button`), it's safe: each carries its own local
`.sr-only`, and the scoping attribute Angular adds under encapsulation
(specificity 0-2-0) beats the unscoped global rule (0-1-0). The other
utilities in the same file do carry the `gbt-` prefix.

## Release

The version lives in **five files**, bumped together in one commit:
`package.json`, `package-lock.json` (the root package and its `projects/gabarit`
workspace entry), `projects/gabarit/package.json`,
`projects/gabarit/src/lib/version.ts` (`GABARIT_VERSION`, asserted equal to the
library's `package.json` by `version.spec.ts`) and the version string in
`projects/gabarit/src/lib/public-api.spec.ts`. To cut a release:

```bash
# 1. bump the five files, then check the whole thing
npm run lint && npm test && npm run build && npm run build-storybook
git add package.json package-lock.json projects/gabarit/package.json \
  projects/gabarit/src/lib/version.ts projects/gabarit/src/lib/public-api.spec.ts
git commit -m "bump(): version X.Y.Z"
# 2. publish: push main, then the tag
git push origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```

Pushing the tag triggers the `release.yml` workflow (environment
`npm-release`): full lint, test and build, verification that the tag matches
the package version, then `npm publish --provenance --access public` from
`dist/gabarit`. There is no changelog file.

Before tagging, an unpublished build can be tried in an application with
`npm run build`, then `npm pack` in `dist/gabarit` and, in the application,
`npm install --no-save <path>/masmarino-gabarit-X.Y.Z.tgz` (revert with
`npm ci`).

## License

MIT.
