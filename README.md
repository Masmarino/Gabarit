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

## Imports

Every component is an entry point of its own, named after its folder (the folder of the README the
link on its name opens). Import it from there:

```ts
import { Button } from '@masmarino/gabarit/button'
import { Select, type SelectOption } from '@masmarino/gabarit/select'
import { AuthLogin } from '@masmarino/gabarit/auth-login'
```

An application's bundler (esbuild, behind `ng build`) splits its code by file, and an entry point is
one file: a component only a lazily loaded page uses stays in that page's chunk, out of the first
download. The root, `@masmarino/gabarit`, still re-exports every name, so code written for 2.0 builds
unchanged, but importing from it puts every component the application uses anywhere into its first
chunk: an application should not import from it.

A few entry points hold more than one component, because they are used together:

| Entry point      | Holds                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `accordion`      | `Accordion`, `AccordionItem`                                                                   |
| `app-shell`      | `AppShell`, `AppShellNavGroup`                                                                 |
| `card`           | `Card`, `CardHeader`, `CardLink`                                                               |
| `chart`          | The chart's building blocks (`ChartFrame`, `ChartAxis`, `ChartTooltip`…) and its scales, ticks and paths |
| `copy-button`    | `CopyButton` and the clipboard helpers (`copyToClipboard`, `ClipboardFeedback`…)               |
| `date-picker`    | `DatePicker`, `DateRangePicker`                                                                |
| `format`         | The formatting functions and their pipes                                                       |
| `icon`           | `Icon`, `IconRegistry`                                                                         |
| `list-toolbar`   | `ListToolbar`, `createListToolbarState`                                                        |
| `menu`           | `Menu`, `MenuTrigger`, `MenuItem`                                                              |
| `nav-tabs`       | `NavTabs`, `NavTab`                                                                            |
| `stat-tile`      | `StatTile`, `StatTileLink`                                                                     |
| `tabs`           | `Tabs`, `Tab`                                                                                  |
| `auth`           | The auth kit's ports, labels, rules and error helpers, `AuthPanel`, `AuthFooter`               |
| `mfa-enrollment` | `MfaEnrollment`, `TotpQr`, `BackupCodes`                                                       |
| `docs`           | The documentation reader (see below)                                                           |

The auth pages are `auth-login`, `auth-register`, `auth-activate` and `auth-reset-password`; the
account settings blocks `mfa-settings` and `passkey-settings`.

## Components

Each component has its own README, with the detail of its inputs and
outputs — the link is on its name.

### Atoms

| Component                                                                               | Selector               | Role                                                                 |
| --------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| [Avatar](projects/gabarit/avatar/README.md)                    | `gbt-avatar`           | User picture with an initials fallback.                              |
| [Badge](projects/gabarit/badge/README.md)                      | `gbt-badge`            | Status/category label pill.                                          |
| [Button](projects/gabarit/button/README.md)                    | `gbt-button`           | Action button.                                                       |
| [Checkbox](projects/gabarit/checkbox/README.md)                | `gbt-checkbox`         | Checkbox, integrated with forms.                                     |
| [CopyButton](projects/gabarit/copy-button/README.md)           | `gbt-copy-button`      | Copies a value to the clipboard, with a live-region confirmation.    |
| [Divider](projects/gabarit/divider/README.md)                  | `gbt-divider`          | Separating line with an optional centred label.                      |
| [GaugeBar](projects/gabarit/gauge-bar/README.md)               | `gbt-gauge-bar`        | Progress gauge with alert thresholds.                                |
| [Icon](projects/gabarit/icon/README.md)                        | `gbt-icon`             | Registered SVG icon, with generic built-in glyphs (`Gallery` story). |
| [IconMarker](projects/gabarit/icon-marker/README.md)           | `gbt-icon-marker`      | Icon on a soft tinted disc or tile, six tones.                       |
| [Input](projects/gabarit/input/README.md)                      | `gbt-input`            | Text or password field.                                              |
| [JobStatus](projects/gabarit/job-status/README.md)             | `gbt-job-status`       | CI job status glyph (extracted from the job graph).                  |
| [NotificationDot](projects/gabarit/notification-dot/README.md) | `gbt-notification-dot` | Dot or count overlaid on the corner of what it wraps.                |
| [SaveStatus](projects/gabarit/save-status/README.md)           | `gbt-save-status`      | Saving / saved / not saved status, live region.                      |
| [Skeleton](projects/gabarit/skeleton/README.md)                | `gbt-skeleton`         | Loading placeholder: line, circle or rectangle.                      |
| [Slider](projects/gabarit/slider/README.md)                    | `gbt-slider`           | Native range slider, integrated with forms.                          |
| [Sparkline](projects/gabarit/sparkline/README.md)              | `gbt-sparkline`        | Fixed-size trend mini-chart.                                         |
| [Spinner](projects/gabarit/spinner/README.md)                  | `gbt-spinner`          | Standalone loading indicator.                                        |
| [Switch](projects/gabarit/switch/README.md)                    | `gbt-switch`           | On/off toggle.                                                       |
| [Tag](projects/gabarit/tag/README.md)                          | `gbt-tag`              | Custom-colored, optionally removable label.                          |
| [Textarea](projects/gabarit/textarea/README.md)                | `gbt-textarea`         | Multiline text field.                                                |

### Molecules

| Component                                                                                     | Selector                                 | Role                                                                   |
| --------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| [Accordion](projects/gabarit/accordion/README.md)                | `gbt-accordion` / `gbt-accordion-item`   | Collapsible sections.                                                  |
| [Alert](projects/gabarit/alert/README.md)                        | `gbt-alert`                              | Persistent inline banner message.                                      |
| [Autocomplete](projects/gabarit/autocomplete/README.md)          | `gbt-autocomplete`                       | Text field with async suggestions.                                     |
| [AvatarGroup](projects/gabarit/avatar-group/README.md)           | `gbt-avatar-group`                       | Overlapping avatars with a +N overflow menu.                           |
| [Breadcrumb](projects/gabarit/breadcrumb/README.md)              | `gbt-breadcrumb`                         | Ancestor trail plus current segment.                                   |
| [Card](projects/gabarit/card/README.md)                          | `gbt-card`                               | Titled container.                                                      |
| [CheckboxGroup](projects/gabarit/checkbox-group/README.md)       | `gbt-checkbox-group`                     | Group of checkboxes (fieldset + legend), value is an array.            |
| [CopyField](projects/gabarit/copy-field/README.md)               | `gbt-copy-field`                         | Read-only monospace value with a copy button.                          |
| [DatePicker](projects/gabarit/date-picker/README.md)             | `gbt-date-picker`                        | Single date, calendar dropdown, integrated with forms.                 |
| [DateRangePicker](projects/gabarit/date-picker/date-range-picker/README.md)  | `gbt-date-range-picker`                  | Start and end dates, calendar dropdown.                                |
| [DescriptionList](projects/gabarit/description-list/README.md)   | `gbt-description-list`                   | Label/value pairs on a `dl`, `valueAlign`, opt-in stacking.            |
| [DimensionCard](projects/gabarit/dimension-card/README.md)       | `gbt-dimension-card`                     | Dimension table with an accented hover row.                            |
| [Disclosure](projects/gabarit/disclosure/README.md)              | `gbt-disclosure`                         | Single disclosure: toggle button and panel, `open` model.              |
| [EmptyState](projects/gabarit/empty-state/README.md)             | `gbt-empty-state`                        | Placeholder for an empty list/grid.                                    |
| [FileUpload](projects/gabarit/file-upload/README.md)             | `gbt-file-upload`                        | Drag-and-drop or click file selection, removable list.                 |
| [FunnelChart](projects/gabarit/funnel-chart/README.md)           | `gbt-funnel-chart`                       | Step-by-step conversion funnel.                                        |
| [JobGraph](projects/gabarit/job-graph/README.md)                 | `gbt-job-graph`                          | Pipeline jobs by stage, linked by their dependencies.                  |
| [ListCard](projects/gabarit/list-card/README.md)                 | `gbt-list-card`                          | Card for a list: header band, loading / failed / empty / ready states. |
| [ListRow](projects/gabarit/list-row/README.md)                   | `gbt-list-row`                           | List item: leading status, title, meta, trailing actions.              |
| [ListToolbar](projects/gabarit/list-toolbar/README.md)           | `gbt-list-toolbar`                       | Search + sort controls for a list.                                     |
| [Menu](projects/gabarit/menu/README.md)                          | `gbt-menu`                               | Generic dropdown menu.                                                 |
| [MenuItem](projects/gabarit/menu/menu-item/README.md)                 | `button[gbtMenuItem]` / `a[gbtMenuItem]` | Menu item: icon, danger variant, disabled, link form.                  |
| [NavTabs](projects/gabarit/nav-tabs/README.md)                   | `gbt-nav-tabs` / `a[gbtNavTab]`          | Router-agnostic nav links: icon, badge, orientation, fades.            |
| [PageHeader](projects/gabarit/page-header/README.md)             | `gbt-page-header`                        | Page title block: heading, badges, meta, actions.                      |
| [Pagination](projects/gabarit/pagination/README.md)              | `gbt-pagination`                         | Page navigation for a list/table.                                      |
| [Panel](projects/gabarit/panel/README.md)                        | `gbt-panel`                              | Flat side-panel section: heading, actions, content.                    |
| [Popover](projects/gabarit/popover/README.md)                    | `gbt-popover`                            | Floating panel opened by a click on its trigger.                       |
| [RadioGroup](projects/gabarit/radio-group/README.md)             | `gbt-radio-group`                        | Radio button group, integrated with forms.                             |
| [SecretReveal](projects/gabarit/secret-reveal/README.md)         | `gbt-secret-reveal`                      | Masked secret: show / hide and copy.                                   |
| [SegmentedControl](projects/gabarit/segmented-control/README.md) | `gbt-segmented-control`                  | Exclusive-choice button group (`tinted`, `fullWidth`, `wrap`).         |
| [Select](projects/gabarit/select/README.md)                      | `gbt-select`                             | Dropdown list, single or multiple.                                     |
| [SkeletonList](projects/gabarit/skeleton-list/README.md)         | `gbt-skeleton-list`                      | Placeholder rows for a loading list, with a polite status.             |
| [StatGrid](projects/gabarit/stat-grid/README.md)                 | `gbt-stat-grid`                          | Responsive grid of stat tiles (container query), loading state.        |
| [StatTile](projects/gabarit/stat-tile/README.md)                 | `gbt-stat-tile`                          | Figure with label, icon, hint, trend and optional link.                |
| [Stepper](projects/gabarit/stepper/README.md)                    | `gbt-stepper`                            | Informational progress through numbered steps.                         |
| [Table](projects/gabarit/table/README.md)                        | `gbt-table`                              | Data table.                                                            |
| [Tabs](projects/gabarit/tabs/README.md)                          | `gbt-tabs` / `gbt-tab`                   | Tab navigation.                                                        |
| [TagInput](projects/gabarit/tag-input/README.md)                 | `gbt-tag-input`                          | Free-typed values shown as removable tags.                             |
| [Tooltip](projects/gabarit/tooltip/README.md)                    | `gbt-tooltip`                            | Hover/focus info bubble for any content.                               |
| [Tree](projects/gabarit/tree/README.md)                          | `gbt-tree`                               | Expandable hierarchical list (WAI-ARIA tree view).                     |
| [UserChip](projects/gabarit/user-chip/README.md)                 | `gbt-user-chip`                          | Avatar + name on one line.                                             |

### Organisms

| Component                                                                                          | Selector                   | Role                                                                     |
| -------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------ |
| [BarChart](projects/gabarit/bar-chart/README.md)                      | `gbt-bar-chart`            | Bar chart on the dataviz base.                                           |
| [ChartAxis](projects/gabarit/chart/chart-axis/README.md)                    | `g[gbtChartAxis]`          | Axis ticks — base building block.                                        |
| [ChartEmpty](projects/gabarit/chart/chart-empty/README.md)                  | `gbt-chart-empty`          | Empty state — base building block.                                       |
| [ChartFrame](projects/gabarit/chart/chart-frame/README.md)                  | `gbt-chart-frame`          | Low-level base, for a custom chart.                                      |
| [ChartLegend](projects/gabarit/chart/chart-legend/README.md)                | `gbt-chart-legend`         | Multi-series legend — base building block.                               |
| [ChartTable](projects/gabarit/chart/chart-table/README.md)                  | `gbt-chart-table`          | Non-visual table — base building block.                                  |
| [ChartTooltip](projects/gabarit/chart/chart-tooltip/README.md)              | `gbt-chart-tooltip`        | Tooltip — base building block.                                           |
| [ConfirmDangerModal](projects/gabarit/confirm-danger-modal/README.md) | `gbt-confirm-danger-modal` | Type-to-confirm destructive-action dialog.                               |
| [Drawer](projects/gabarit/drawer/README.md)                           | `gbt-drawer`               | Side panel from a screen edge, focus trapped.                            |
| [GbtToastService](projects/gabarit/toaster/README.md)                 | `GbtToastService`          | Signal store of toasts; `gbt-toaster` shows it when `toasts` is omitted. |
| [LineChart](projects/gabarit/line-chart/README.md)                    | `gbt-line-chart`           | Line(s) on the dataviz base.                                             |
| [Modal](projects/gabarit/modal/README.md)                             | `gbt-modal`                | Modal dialog box.                                                        |
| [PieChart](projects/gabarit/pie-chart/README.md)                      | `gbt-pie-chart`            | Pie or donut chart.                                                      |
| [SearchBar](projects/gabarit/search-bar/README.md)                    | `gbt-search-bar`           | Search with grouped results.                                             |
| [TimelineChart](projects/gabarit/timeline-chart/README.md)            | `gbt-timeline-chart`       | Timeline on the dataviz base.                                            |
| [Toaster](projects/gabarit/toaster/README.md)                         | `gbt-toaster`              | Stack of temporary notifications.                                        |

### Templates

| Component                                                                                       | Selector                  | Role                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------- |
| [AppShell](projects/gabarit/app-shell/README.md)                   | `gbt-app-shell`           | Page shell: side nav, header, content.                    |
| [AppShellNavGroup](projects/gabarit/app-shell/app-shell-nav-group/README.md) | `gbt-app-shell-nav-group` | Collapsible nav group, works in the collapsed rail.       |
| [GitField](projects/gabarit/git-field/README.md)                   | `gbt-git-field`           | The family's animated commit graph, behind the sign-in panel (`[auth-backdrop]`) or a dark band. |
| [PageLayout](projects/gabarit/page-layout/README.md)               | `gbt-page-layout`         | Page grid: main, aside and nav columns (container query). |

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

Pure functions from `@masmarino/gabarit/format` (the charts' scales, ticks and paths come from
`@masmarino/gabarit/chart`), usable in any TypeScript
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

Gabarit carries the look of the Ferris family: white paper and near-black ink in the light theme, a
cool graphite in the dark one, IBM Plex throughout, hairlines and square-ish corners. Neutrals carry
the screens; the crab's rust is kept for the marks that are the brand's own (focus, the current page),
patina green says success. Every text token reaches 7:1 on the page and on a panel, in both themes
(`contrast.spec.ts`).

Import the tokens, and the fonts, in the application's `styles.scss`:

```scss
@use '@masmarino/gabarit/fonts' with ($path: '/fonts/ibm-plex/');
@use '@masmarino/gabarit/tokens';

// Optional: body, h1–h3, code and selection in the family's type.
@include tokens.document-base;
```

The fonts entry declares IBM Plex Sans (400, 500, 600), Sans Condensed (600) and Mono (400, 500),
subset to Latin-1 (OFL licence beside the files). The application serves the files at `$path`, for
instance with an Angular asset:

```json
{ "glob": "*.woff2", "input": "node_modules/@masmarino/gabarit/fonts", "output": "fonts/ibm-plex" }
```

Without them the stacks fall back to the system's sans and monospace.

### The graphite frame

`gbt-app-shell` draws its rail and its bar as one graphite frame, the same in both themes, with the
page set into it as a sheet whose corner is rounded. The auth pages (`gbt-auth-panel`) open on the
same graphite, their panel keeping the page's theme. An application can lay its own parts on the
frame with the `frame-tokens` mixin, which sets the dark tokens on a deeper ground:

```scss
.public-header {
  @include tokens.frame-tokens;
  background: var(--bg-panel);
}
```

### Color tokens

Every component reads only the custom properties below, set on `:root` from the `light-tokens` and
`dark-tokens` mixins (`_themes.scss`). **These are what an application overrides to re-theme
itself**; the raw palette (`--slate-*`, `--graphite-*`, `--rust-*`…) is never referenced by a
component (enforced by `token-usage.spec.ts`).

| Category    | Token                                                                    | Role                                                              |
| ----------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Brand       | `--primary` / `--primary-hover`                                          | Action colour (buttons, selected states): the ink                 |
|             | `--accent` / `--accent-text`                                             | The rust, for marks; its text shade                               |
|             | `--focus-ring`                                                           | Every focus outline                                               |
| Backgrounds | `--bg-principal`                                                         | Surfaces: cards, panels, fields                                   |
|             | `--bg-panel`                                                             | The page's ground                                                 |
|             | `--bg-hover`                                                             | Hover state of an interactive element on a neutral background     |
|             | `--bg-track`                                                             | Track of a segmented control, visible on the page and on a panel  |
|             | `--frame`                                                                | The graphite of the shell and the auth pages, in both themes      |
| Border      | `--border-color`                                                         | The edge of a field or a control (3:1)                            |
|             | `--gbt-hairline` / `--gbt-card-border`                                   | Quiet separators and card edges                                   |
| Text        | `--text-primary` / `--text-secondary` / `--text-discret`                 | From most to least emphasized                                     |
|             | `--text-on-primary` / `--text-on-error` / `--text-on-color`              | Text set on a `--primary` fill, an error fill, or a solid colour  |
| Success     | `--color-success-base` / `-hover` / `-text` / `-bg` / `-bg-text`         | Fill, hover, text, light background, text on that background      |
| Warning     | `--color-warning-base` / `-hover` / `-text` / `-bg` / `-bg-text`         | Same                                                              |
| Error       | `--color-error-base` / `-fill` / `-hover` / `-text` / `-bg` / `-bg-text` | Same (`-fill`: a solid fill, the danger button)                   |
| Info        | `--color-info-bg` / `-bg-text` / `-vivid-base`                           | Light background, text on it, the mark                            |
| Dataviz     | `--chart-series-1-base` … `-6-base`                                      | The chart series, in order                                        |
|             | `--chart-grid`                                                           | Chart grid and axes                                               |

Other tokens live on `:root` without being colours: border radii (`--site-border-radius*`, 3 to
6px), shadows (`--site-shadow-*`, rings rather than drops), transitions (`--site-transition-*`) and
the type stacks (`--font-family`, `--font-display`, `--gbt-font-mono`).

### Theming hooks

A few more tokens are not set on `:root`: each component falls back to the value in the last column,
so an app that leaves them alone gets the family's look. Set one to take that part in hand.

| Token                                           | Used by                                                                   | Fallback                             |
| ----------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| `--gbt-focus-ring`                              | Every focus outline                                                       | `var(--focus-ring)`                  |
| `--gbt-font-display`                            | Page, card, panel, modal and drawer titles, stat tile values, empty state | `var(--font-display)`                |
| `--gbt-radius-badge`                            | Badges, card and tab counts                                               | `3px`                                |
| `--gbt-radius-chip`                             | Mono badges, inline code in a list row, search bar keys                   | `2px`                                |
| `--gbt-radius-menu`                             | Select and autocomplete panels, menu items, search results                | `4px`                                |
| `--gbt-radius-tile`                             | Icon marker tiles, job graph nodes, avatar group overflow, TOTP QR code   | `4px`                                |
| `--gbt-radius-search`                           | The search bar field                                                      | `3px`                                |
| `--gbt-nav-active-bg` / `--gbt-nav-active-text` | The current page in the app shell navigation                              | a 9% ink tint / `--text-primary`     |
| `--gbt-nav-active-mark`                         | A 2px rule on the start edge of the current page link                     | `var(--accent)`                      |
| `--gbt-shell-bar`                               | The height of the app shell's bar and of the logo's corner                | `4rem`                               |
| `--gbt-shell-border`                            | The app shell's navigation and header edges                               | `transparent`                        |
| `--gbt-shell-header-bg`                         | The app shell's header                                                    | the frame                            |
| `--gbt-shell-content-padding`                   | The app shell's bar and main content area                                 | `clamp(1rem, 0.25rem + 2vw, 2rem)`   |
| `--gbt-auth-panel-backdrop`                     | The page behind the auth panels (login, register…)                        | `var(--frame)`                       |
| `--gbt-auth-panel-radius`                       | The auth panel card                                                       | `var(--site-border-radius-lg)`       |

Overriding a token after the import:

```scss
@use '@masmarino/gabarit/tokens';

:root {
  --accent: #7c3aed;
}
```

**Dark mode activates via `prefers-color-scheme` or `[data-theme='dark']` on `<html>`, and
reapplies to the same tokens.** An override set on a bare `:root` applies to both themes; for a value
specific to dark mode, redeclare it under the same conditions as Gabarit, after its import:

```scss
@media (prefers-color-scheme: dark) {
  :root {
    --accent: #a78bfa;
  }
}
```

### Moving to the entry points (2.1)

Nothing breaks: the root still exports every name. To get the smaller first chunk, replace each
`import { … } from '@masmarino/gabarit'` by one import per entry point (see [Imports](#imports));
the compiler names any symbol imported from the wrong one.

### Upgrading from 1.x

- The default look is the Ferris family's (palette, IBM Plex, radii, the graphite shell and auth
  pages). An application that themed 1.x by mapping its own tokens onto Gabarit's can drop that map.
- The raw palette is new (`--slate-*`, `--graphite-*`, `--rust-*`, `--patina-*`, `--amber-*`,
  `--red-*`, `--indigo-*`); `--brand-*`, `--grey-*`, `--green-*` and `--emerald-*` are gone.
- New tokens: `--accent`, `--accent-text`, `--focus-ring`, `--frame`, `--font-display`; new mixins:
  `light-tokens`, `dark-tokens`, `frame-tokens`, `document-base`, `visually-hidden`, `focus-ring`.
- `@masmarino/gabarit/fonts` replaces the font an application served for `'Inter'`.

## Internationalization

Gabarit ships no translation mechanism. Every visible string is a
component input, supplied by the application.

## Accessibility

[`ACCESSIBILITY.md`](ACCESSIBILITY.md) documents what Gabarit
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
