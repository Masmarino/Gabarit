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

| Component                                                                  | Selector        | Role                                  |
| -------------------------------------------------------------------------- | --------------- | ------------------------------------- |
| [Button](projects/gabarit/src/lib/components/atoms/button/README.md)       | `gbt-button`    | Action button.                        |
| [Checkbox](projects/gabarit/src/lib/components/atoms/checkbox/README.md)   | `gbt-checkbox`  | Checkbox, integrated with forms.      |
| [GaugeBar](projects/gabarit/src/lib/components/atoms/gauge-bar/README.md)  | `gbt-gauge-bar` | Progress gauge with alert thresholds. |
| [Icon](projects/gabarit/src/lib/components/atoms/icon/README.md)           | `gbt-icon`      | Registered SVG icon.                  |
| [Input](projects/gabarit/src/lib/components/atoms/input/README.md)         | `gbt-input`     | Text or password field.               |
| [Sparkline](projects/gabarit/src/lib/components/atoms/sparkline/README.md) | `gbt-sparkline` | Fixed-size trend mini-chart.          |

### Molecules

| Component                                                                               | Selector               | Role                                        |
| --------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------- |
| [Card](projects/gabarit/src/lib/components/molecules/card/README.md)                    | `gbt-card`             | Titled container.                           |
| [DimensionCard](projects/gabarit/src/lib/components/molecules/dimension-card/README.md) | `gbt-dimension-card`   | Dimension table with an accented hover row. |
| [FunnelChart](projects/gabarit/src/lib/components/molecules/funnel-chart/README.md)     | `gbt-funnel-chart`     | Step-by-step conversion funnel.             |
| [Menu](projects/gabarit/src/lib/components/molecules/menu/README.md)                    | `gbt-menu`             | Generic dropdown menu.                      |
| [Select](projects/gabarit/src/lib/components/molecules/select/README.md)                | `gbt-select`           | Dropdown list, single or multiple.          |
| [Table](projects/gabarit/src/lib/components/molecules/table/README.md)                  | `gbt-table`            | Data table.                                 |
| [Tabs](projects/gabarit/src/lib/components/molecules/tabs/README.md)                    | `gbt-tabs` / `gbt-tab` | Tab navigation.                             |

### Organisms

| Component                                                                               | Selector             | Role                                       |
| --------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------ |
| [BarChart](projects/gabarit/src/lib/components/organisms/bar-chart/README.md)           | `gbt-bar-chart`      | Bar chart on the dataviz base.             |
| [ChartAxis](projects/gabarit/src/lib/components/organisms/chart-axis/README.md)         | `g[gbtChartAxis]`    | Axis ticks — base building block.          |
| [ChartEmpty](projects/gabarit/src/lib/components/organisms/chart-empty/README.md)       | `gbt-chart-empty`    | Empty state — base building block.         |
| [ChartFrame](projects/gabarit/src/lib/components/organisms/chart-frame/README.md)       | `gbt-chart-frame`    | Low-level base, for a custom chart.        |
| [ChartLegend](projects/gabarit/src/lib/components/organisms/chart-legend/README.md)     | `gbt-chart-legend`   | Multi-series legend — base building block. |
| [ChartTable](projects/gabarit/src/lib/components/organisms/chart-table/README.md)       | `gbt-chart-table`    | Non-visual table — base building block.    |
| [ChartTooltip](projects/gabarit/src/lib/components/organisms/chart-tooltip/README.md)   | `gbt-chart-tooltip`  | Tooltip — base building block.             |
| [LineChart](projects/gabarit/src/lib/components/organisms/line-chart/README.md)         | `gbt-line-chart`     | Line(s) on the dataviz base.               |
| [Modal](projects/gabarit/src/lib/components/organisms/modal/README.md)                  | `gbt-modal`          | Modal dialog box.                          |
| [SearchBar](projects/gabarit/src/lib/components/organisms/search-bar/README.md)         | `gbt-search-bar`     | Search with grouped results.               |
| [TimelineChart](projects/gabarit/src/lib/components/organisms/timeline-chart/README.md) | `gbt-timeline-chart` | Timeline on the dataviz base.              |

### Templates

| Component                                                                     | Selector        | Role                                   |
| ----------------------------------------------------------------------------- | --------------- | -------------------------------------- |
| [AppShell](projects/gabarit/src/lib/components/templates/app-shell/README.md) | `gbt-app-shell` | Page shell: side nav, header, content. |

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

| Category    | Token                                                                    | Role                                                            |
| ----------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Brand       | `--primary` / `--primary-hover`                                          | Action color (buttons, active links, focus) and its hover state |
| Backgrounds | `--bg-principal`                                                         | Page and surface background (cards, panels)                     |
|             | `--bg-panel`                                                             | Background of persistent navigation areas (nav, header)         |
|             | `--bg-hover`                                                             | Hover state of an interactive element on a neutral background   |
| Border      | `--border-color`                                                         | All borders                                                     |
| Text        | `--text-primary` / `--text-secondary` / `--text-discret`                 | From most to least emphasized                                   |
|             | `--text-on-primary` / `--text-on-error` / `--text-on-color`              | Text set on a `--primary` fill, an error fill, or a solid color |
| Success     | `--color-success-base` / `-hover` / `-text` / `-bg` / `-bg-text`         | Fill, hover, text, light background, text on that background    |
| Warning     | `--color-warning-base` / `-hover` / `-text` / `-bg` / `-bg-text`         | Same                                                            |
| Error       | `--color-error-base` / `-fill` / `-hover` / `-text` / `-bg` / `-bg-text` | Same (`-fill`: solid fill, e.g. an icon)                        |
| Dataviz     | `--chart-series-1-base`, `-2-base`, `-3-base`                            | The three chart series, in order                                |
|             | `--chart-grid`                                                           | Chart grid and axes                                             |

Other tokens live on `:root` without being colors — border radii
(`--site-border-radius*`), shadows (`--site-shadow-*`), transition
durations (`--site-transition-*`) — overridable the same way.

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
push by CI — `axe-core` in the unit tests, a dedicated contrast test, and
a manual audit per component), what remains the application's
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

The published version is the one in `projects/gabarit/package.json`. To
cut a new release:

```bash
npm version <patch|minor|major> --prefix projects/gabarit --no-git-tag-version
git add projects/gabarit/package.json
git commit -m "chore(release): vX.Y.Z"
git tag vX.Y.Z
git push origin main --follow-tags
```

The tag triggers the `release.yml` workflow: full rebuild, verification
that the tag matches the package version, then publishing to npm with
provenance attestation.

## License

MIT.
