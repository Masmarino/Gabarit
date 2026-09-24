# Stepper

An informational progress indicator through numbered steps (a
checkout tunnel, a multi-screen setup wizard) — distinct from
`SegmentedControl` (an exclusive choice) and `Tabs` (free navigation
between contents): a step can't be skipped, and this component itself
never navigates anywhere.

**Selector**: `gbt-stepper`

## Inputs

| Input            | Type                            | Default       | Role                                                          |
| ----------------- | --------------------------------- | --------------- | ------------------------------------------------------------------ |
| `steps`          | `{ label: string; hasError?: boolean }[]` | required        | The steps, in order.                                                |
| `activeIndex`    | `number` (model)                  | `0`               | The current step's index.                                          |
| `orientation`    | `'horizontal' \| 'vertical'`       | `'horizontal'`     | —                                                                    |
| `completedLabel` | `string`                          | `'Completed'`      | Visually-hidden suffix announced for a completed step.              |
| `errorLabel`     | `string`                          | `'Error'`           | Visually-hidden suffix announced for a step with `hasError`.        |
| `interactive`    | `boolean`                         | `false`             | Renders each step as a native button that sets `selectedIndex`.     |
| `selectedIndex`  | `number \| null` (model)          | `null`              | The step being viewed (interactive mode only); distinct from `activeIndex`. |
| `selectedLabel`  | `string`                          | `'Selected'`        | Visually-hidden suffix announced for the selected step.             |

## Example

```html
<gbt-stepper
  [steps]="[{ label: 'Account' }, { label: 'Shipping' }, { label: 'Payment' }]"
  [activeIndex]="step()"
/>
```

## Interactive mode

With `interactive`, every step becomes a real `<button type="button">`
inside its `<li>`. Clicking one only sets `selectedIndex` — the step
being *viewed* — while `activeIndex` stays the progress (and keeps
`aria-current="step"`). The consumer decides what a selection does:

```html
<gbt-stepper
  [steps]="steps"
  [activeIndex]="progress()"
  [interactive]="true"
  [(selectedIndex)]="viewed"
/>
```

## Behavior

- Informational by default: without `interactive`, no click handler on
  a step and no keyboard navigation of its own — this component only
  ever *reflects* `activeIndex`, it never changes it. With
  `interactive`, a click only sets `selectedIndex`; `activeIndex` is
  never modified by this component.
- A step's status is derived purely from its position relative to
  `activeIndex` (`completed` before it, `current` at it, `upcoming`
  after it) and its own `hasError` — a step marked `hasError` only
  shows as `error` once reached (at or before `activeIndex`), never
  for a step further ahead that hasn't happened yet.
- Renders a real `<ol>`/`<li>` list — every step is rendered directly
  by this component's own template (via the `steps` data array, not
  content-projected per-step components), the same reasoning
  `DescriptionList` already applied to `<dl>`/`<dt>`/`<dd>`: axe's
  list-structure rule requires `<li>` to be a direct child of a
  `<ul>`/`<ol>`, which a per-step custom element (even one set to
  `display: contents`) does not satisfy.
