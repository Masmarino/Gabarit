# Drawer

Side panel that slides in from an edge of the screen — traps focus,
closes on Escape or a click on the backdrop, same control pattern as
`Modal`. Unlike `Modal` (centered, blocks the whole page for a focused
task), `Drawer` is for application content that sits alongside the
page — a detail panel, advanced filters.

**Selector**: `gbt-drawer`

## Inputs

| Input          | Type                                     | Default   | Role                                            |
| -------------- | ----------------------------------------- | --------- | ------------------------------------------------ |
| `isOpen`       | `boolean`                                 | required  | Open/closed state, driven by the application.     |
| `edge`         | `'right' \| 'left' \| 'top' \| 'bottom'`  | `'right'` | Which edge the panel slides in from.               |
| `heading`      | `string`                                  | `''`      | Panel title.                                       |
| `headingLevel` | `1 \| 2 \| 3 \| 4 \| 5 \| 6`              | `2`       | Level of the rendered heading.                     |
| `closeLabel`   | `string`                                  | `'Close'` | Accessible name of the close button.               |

## Outputs

| Output   | Type   | Role                                                                                                                                     |
| -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `closed` | `void` | Emitted on Escape, a click outside the panel, or a click on the close button. The application must respond by setting `isOpen` to `false`. |

## Example

```html
<gbt-drawer [isOpen]="open()" edge="right" heading="Filtres" (closed)="open.set(false)">
  Contenu du tiroir.
</gbt-drawer>
```

## Behavior

- Slides in/out with a matching backdrop fade (200ms), instead of
  appearing/disappearing instantly like `Modal` — the panel stays
  mounted for the closing animation's duration after `isOpen` becomes
  `false`, then unmounts and returns focus, exactly like `Modal`
  otherwise does immediately. Both animations are skipped under
  `prefers-reduced-motion: reduce`.
- Sized `min(90vw, 400px)` for `left`/`right`, `min(90vh, 400px)` for
  `top`/`bottom` — adapts to the viewport with a fixed cap, same
  reasoning as `Modal`'s own `min(90vw, 480px)` dialog width.
- `AppShell`'s own mobile navigation drawer is intentionally left
  independent — refactoring it to use this component risked a
  regression on an already-stable piece for no functional gain, since
  its needs (a fixed nav-link list, no arbitrary content) are narrower
  than this component's.
