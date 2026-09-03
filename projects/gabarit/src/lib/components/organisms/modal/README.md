# Modal

Modal dialog box — traps focus, closes on Escape or a click on the
backdrop.

**Selector**: `gbt-modal`

## Inputs

| Input          | Type                         | Default   | Role                                          |
| -------------- | ---------------------------- | --------- | --------------------------------------------- |
| `isOpen`       | `boolean`                    | required  | Open/closed state, driven by the application. |
| `heading`      | `string`                     | `''`      | Dialog title.                                 |
| `headingLevel` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2`       | Level of the rendered heading.                |
| `closeLabel`   | `string`                     | `'Close'` | Accessible name of the close button.          |

## Outputs

| Output   | Type   | Role                                                                                                                                     |
| -------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `closed` | `void` | Emitted on Escape, a click outside the box, or a click on the close button. The application must respond by setting `isOpen` to `false`. |

## Example

```html
<gbt-modal [isOpen]="ouvert()" heading="Confirmer" closeLabel="Fermer" (closed)="ouvert.set(false)">
  Contenu de la boîte de dialogue.
</gbt-modal>
```
