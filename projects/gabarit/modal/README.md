# Modal

Modal dialog box — traps focus, closes on Escape or a click on the
backdrop, and stays shut while a request is running (`busy`).

**Selector**: `gbt-modal`

## Inputs

| Input          | Type                         | Default         | Role                                                                                                                                                                                                                                                                                                                                          |
| -------------- | ---------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isOpen`       | `boolean`                    | required        | Open/closed state, driven by the application.                                                                                                                                                                                                                                                                                                 |
| `heading`      | `string`                     | `''`            | Dialog title.                                                                                                                                                                                                                                                                                                                                 |
| `headingLevel` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2`             | Level of the rendered heading.                                                                                                                                                                                                                                                                                                                |
| `closeLabel`   | `string`                     | `'Close'`       | Accessible name of the close button.                                                                                                                                                                                                                                                                                                          |
| `busy`         | `boolean`                    | `false`         | A request is in flight: Escape, a click on the backdrop and the close button are ignored (no `closed`). The body reports `aria-busy="true"` (the status region below is deliberately outside it: a busy ancestor can suppress live announcements), the close button `aria-disabled="true"` (it stays focusable), and `busyLabel` is read out. |
| `busyLabel`    | `string`                     | `'Please wait'` | Text read out by a visually hidden `role="status"` region while `busy`.                                                                                                                                                                                                                                                                       |
| `returnFocus`  | `boolean`                    | `true`          | Gives focus back to the element that had it when the dialog opened, once it closes. Turn it off when the opener is gone or you move focus yourself.                                                                                                                                                                                           |

## Slots

| Slot             | Role                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| default          | The body.                                                                                                                                                                                                                                                                                                                                 |
| `[modal-footer]` | Actions under a hairline, kept in view while a long body scrolls. Nothing to import: add the attribute `modal-footer` to the element. A `div`, `footer` or `section` carrying it is the actions row itself (right aligned, wrapping, spaced); any other element (a button, a link) is one item of that row. Nothing projected, no footer. |

## Outputs

| Output   | Type   | Role                                                                                                                                     |
| -------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `closed` | `void` | Emitted on Escape, a click outside the box, or a click on the close button. The application must respond by setting `isOpen` to `false`. |

## Busy

While `busy` is `true`, pass it on from the request's state and disable your own cancel button; the
dialog keeps focus (it comes back to the dialog if the button you pressed was disabled) and closes
again as soon as `busy` is `false`. Setting `isOpen` to `false` yourself still closes it.

## Touch

On a coarse pointer (`pointer: coarse`) the close button is 44 × 44 px; the header keeps its height.

## Example

```html
<gbt-modal [isOpen]="ouvert()" heading="Confirmer" closeLabel="Fermer" (closed)="ouvert.set(false)">
  Contenu de la boîte de dialogue.
</gbt-modal>
```

With a footer and a running request:

```html
<gbt-modal
  [isOpen]="open()"
  [busy]="saving()"
  busyLabel="Saving"
  heading="Rename"
  (closed)="open.set(false)"
>
  <gbt-input label="Name" [(ngModel)]="name" />
  <div modal-footer>
    <gbt-button
      variant="secondary"
      text="Cancel"
      [disabled]="saving()"
      (clicked)="open.set(false)"
    />
    <gbt-button text="Save" [loading]="saving()" (clicked)="save()" />
  </div>
</gbt-modal>
```
