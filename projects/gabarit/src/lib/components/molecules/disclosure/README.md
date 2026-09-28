# Disclosure

A single disclosure: a toggle button and the panel it shows or hides ("Advanced options", "Files", "More
details"). It is [`gbt-accordion-item`](../accordion-item/README.md) without the accordion around it: no parent
group, no index, an `open` model you can bind.

**Selector**: `gbt-disclosure`

## Inputs

| Input          | Type                            | Default      | Role                                                                                                    |
| -------------- | ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------- |
| `label`        | `string`                        | —            | Required. The text of the toggle.                                                                       |
| `open`         | `boolean` (model)               | `false`      | Whether the panel is shown. Two-way: `[(open)]`.                                                        |
| `icon`         | `string \| null`                | `null`       | Registered icon name before the label.                                                                  |
| `appearance`   | `'bordered' \| 'plain'`         | `'bordered'` | `bordered`: a framed box with a tinted panel. `plain`: only the toggle and the panel.                   |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6 \| null` | `null`       | Wraps the toggle in a heading of that level (when the disclosure titles a section). `null`: no heading. |

`openChange` is emitted by the model each time the user toggles.

## Pattern

The ARIA disclosure pattern, on the repo's accordion-item ground:

- a native `<button type="button">` with `aria-expanded` and `aria-controls` (Enter and Space work natively);
- a panel that is **`inert` while closed** (nothing in it can be focused or read) and `visibility: hidden`
  once the 200 ms collapse has run;
- a chevron that turns (not under `prefers-reduced-motion`).

The panel's content is always instantiated: a heavy component inside is created while closed. Wrap it in
`@if (open())` if that matters (the `open` model is right there).

## Example

```html
<gbt-disclosure label="Advanced options" [(open)]="advancedOpen">
  <gbt-switch label="CI enabled" [(ngModel)]="ciEnabled" />
  <gbt-input label="Pipeline file path" [(ngModel)]="pipelineFile" />
</gbt-disclosure>

<gbt-disclosure label="Danger zone" icon="alert-triangle" [headingLevel]="3">…</gbt-disclosure>
```

## Accessibility

See [AUDIT.md](./AUDIT.md). Not covered: a disclosure that is open at a wide width and collapsible only on a
phone (the file view's "Files" toggle) is a layout decision of the page: bind `[open]` to a breakpoint signal
you own.
