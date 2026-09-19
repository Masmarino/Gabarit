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

## Example

```html
<gbt-stepper
  [steps]="[{ label: 'Account' }, { label: 'Shipping' }, { label: 'Payment' }]"
  [activeIndex]="step()"
/>
```

## Behavior

- Purely informational: no click handler on a step, no keyboard
  navigation of its own — this component only ever *reflects*
  `activeIndex`, it never changes it. If steps should be clickable to
  jump back, the application wires that itself (e.g. a button around
  each step, or `(click)` on the consumer's own template), rather than
  this component assuming every use case wants that.
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
