# Tag

A small chip rendering an arbitrary background color with automatically
computed readable text, used for user-defined labels (e.g. issue labels)
that don't fit the fixed `Badge` semantic variants. Optionally removable.

**Selector:** `gbt-tag`

**Inputs**

| Input | Type | Default | Role |
|---|---|---|---|
| `color` | `string` (required) | — | Background color as a **6-digit hex** string, with or without the leading `#` (e.g. `#dc2626`, `dc2626`). Text color is computed automatically for WCAG-readable contrast (`#ffffff` or `#000000`, worst case 4.58:1). Shorthand hex (`#abc`), CSS named colors, `rgb()`/`hsl()` and custom properties are **not** supported and throw — silently guessing would paint unreadable text. |
| `removable` | `boolean` | `false` | Shows a remove (`×`) button when `true`. |
| `removeLabel` | `string` | `'Remove'` | Accessible label for the remove button. English by default, like every other default string in the library — externalize it per the caller's own i18n strings in a non-English context. |
| `disabled` | `boolean` | `false` | Marks the chip `aria-disabled="true"` — for a container-level disabled state (e.g. `TagInput`, `Select` in chips mode) that visually dims the chip via CSS `opacity`, so contrast-checking tools recognize it as an inactive component rather than flagging its now-lower-contrast text. Purely an ARIA signal — pair it with `[removable]="false"` to actually remove the remove button. |

**Outputs**

| Output | Payload | Fires when |
|---|---|---|
| `removed` | `void` | The remove button is clicked. The click does not bubble to any parent click handler. |

**Content**

Project the tag's visible text via `<ng-content />`.

**Example**

```html
<gbt-tag color="#dc2626" [removable]="true" removeLabel="Retirer Bug" (removed)="onRemoveLabel()">
  Bug
</gbt-tag>
```
