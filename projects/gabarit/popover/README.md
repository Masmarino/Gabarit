# Popover

Generic floating panel that wraps any projected trigger and shows
arbitrary projected content near it, opened/closed by a click — for
rich content (a mini-form, a list of actions, a long text) that
`Tooltip`'s hover-triggered short text doesn't fit.

**Selector**: `gbt-popover` (`exportAs="gbtPopover"`)

## Inputs

| Input   | Type              | Default   | Role                                                    |
| ------- | ----------------- | --------- | -------------------------------------------------------- |
| `align` | `'start' \| 'end'` | `'start'` | Aligns the panel's left or right edge with the trigger's. |

## Content

| Slot                          | Role                                                             |
| ------------------------------ | ----------------------------------------------------------------- |
| Default (unmarked)             | The trigger — any element(s), shown as-is, click anywhere toggles the panel. |
| `[popover-content]`            | The panel's body — fully free-form, no role or structure imposed. |

## Example

```html
<gbt-popover #pop="gbtPopover">
  <button type="button" [attr.aria-expanded]="pop.open()" [attr.aria-controls]="pop.panelId">
    Options
  </button>
  <div popover-content>
    <p>Any content: a form, a list, plain text…</p>
    <button type="button" (click)="pop.close()">Close</button>
  </div>
</gbt-popover>
```

## Behavior

- Opens on a click anywhere inside the trigger slot; closes on an
  outside click or `Escape` — never on a click inside the panel's own
  content, since that content can be a form or contain its own buttons.
- `Escape` returns focus to the first focusable element found inside
  the trigger slot.
- No collision/flip handling if the panel would render off-screen —
  the same trade-off `gbt-menu` already makes; choose an `align` that
  fits the layout.

## Accessibility

`gbt-popover` wraps arbitrary projected content, so it cannot reach
into it to set `aria-expanded`/`aria-controls` on your own trigger
element — the same limitation `gbt-tooltip` has for `aria-describedby`.
Wire them yourself using the instance exposed by `exportAs="gbtPopover"`:

- `pop.open()` — a signal, `true` while the panel is shown.
- `pop.panelId` — the panel's DOM id, for `aria-controls`.
- `pop.toggle()` / `pop.close()` — for a close button inside your own
  content (see the example above).

The panel itself carries no ARIA role — it's your content, so it's
your responsibility to give it one if it needs it (e.g. `role="dialog"`
for a form, or leave it out entirely for a plain block of text).
