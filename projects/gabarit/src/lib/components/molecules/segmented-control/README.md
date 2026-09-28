# SegmentedControl

Compact, exclusive-choice button group — e.g. switching a view between
"Day / Week / Month". Unlike `Tabs`, it carries no navigation
semantics (`role="radiogroup"`, not `role="tablist"`): it's a value
selector, not a way to move between different page contents.

**Selector**: `gbt-segmented-control`

## Inputs

| Input       | Type                                                | Default  | Role                                                                                                                                                          |
| ----------- | --------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options`   | `{ value: T; label: string; disabled?: boolean }[]` | required | The choices, in display order.                                                                                                                                |
| `value`     | `T` (model)                                         | required | The selected option's value. Bind `[value]`/`[(value)]` to control or observe it from outside.                                                                |
| `ariaLabel` | `string`                                            | `''`     | Accessible name of the group — there's no visible legend, so provide one (e.g. "Période").                                                                    |
| `disabled`  | `boolean`                                           | `false`  | Disables every option at once.                                                                                                                                |
| `label`     | `string`                                            | `''`     | Visible label above the control; it names the group (`aria-labelledby`) and takes over from `ariaLabel`.                                                      |
| `fullWidth` | `boolean`                                           | `false`  | Fills the container; the options share the width equally.                                                                                                     |
| `wrap`      | `boolean`                                           | `false`  | Lets the options flow onto several rows when they do not fit. A label never breaks in the middle.                                                             |
| `size`      | `'md' \| 'sm'`                                      | `'md'`   | Both sizes are 32px tall, track included (`--gbt-control-height-sm`: level with a small button and the `sm` fields); `sm` has smaller text and tighter sides. |
| `tinted`    | `boolean`                                           | `false`  | Draws the track with `--bg-track` (a step darker than `--bg-panel`) so it stays visible on a panel and on the page background.                                |

## Example

```html
<gbt-segmented-control
  [options]="[
    { value: 'day', label: 'Jour' },
    { value: 'week', label: 'Semaine' },
    { value: 'month', label: 'Mois' },
  ]"
  [(value)]="period"
  ariaLabel="Période"
/>
```

## Layout options

```html
<!-- visible label + full width, tinted track -->
<gbt-segmented-control label="Sort" fullWidth tinted [options]="sorts" [(value)]="sort" />

<!-- state tabs with counts in a narrow column -->
<gbt-segmented-control wrap size="sm" ariaLabel="Result type" [options]="types" [(value)]="type" />
```

- **Track token.** The default track is `--bg-panel`, which is the page background
  in the app shell and vanishes on a panel. `tinted` uses the semantic token
  `--bg-track` (`grey-200` in light, `grey-800` in dark; `contrast.spec.ts` checks the
  option text on it and that it stays distinguishable from the page and from
  `--bg-panel`).
- `label` gives the group one visible name, referenced by `aria-labelledby` — the
  alternative is an `ariaLabel` with no visible text.
- With `wrap`, arrow keys still follow the DOM order, row after row.

## Behavior

- Left/right arrow keys (also up/down) move selection _and_ focus
  together, immediately — the same behavior as a native
  `<input type="radio">` group, not `Tabs`' "arrows move focus only,
  the option was already selected" (there is nothing to "activate"
  separately). `Home`/`End` jump to the first/last enabled option.
  Disabled options are skipped when navigating.
- Roving tabindex: only the selected option is a tab stop.

## Why not a `ControlValueAccessor`

`RadioGroup` already covers a real form field. `SegmentedControl`'s
primary use is switching a displayed view (a chart's period, a list's
sort order) — a `model()`-based `value`, the same pattern `Tabs` uses
for `activeIndex`, fits that without pulling in Angular Forms. Use
`RadioGroup` instead if you need this exact choice as part of a form.

## How many options

Designed for a small, fixed set (2–5) shown at a glance. Beyond that,
the segments get cramped and `Select` becomes the better fit — this
isn't enforced by the component, it's a design judgment call.
