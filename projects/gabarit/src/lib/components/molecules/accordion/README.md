# Accordion

Collapsible sections, with `gbt-accordion-item` as projected content —
each item renders its own header and panel, so header/panel pairs stay
next to each other in the DOM, unlike `Tabs`' separate trigger/panel
lists.

**Selector**: `gbt-accordion` (container), `gbt-accordion-item` (each
section)

Up/down arrows move focus between headers, with wraparound. Enter/Space
toggle the focused header (native `<button>` behavior).

`expanded` is an Angular `model()`, so it works uncontrolled (omit the
binding entirely) or controlled (bind `[expanded]`/`(expandedChange)`,
e.g. to open a specific section by default or persist it).

## Inputs of `gbt-accordion`

| Input      | Type                     | Default                        | Role                                                                 |
| ---------- | ------------------------ | ------------------------------- | --------------------------------------------------------------------- |
| `id`       | `string`                 | generated (`gbt-accordion-N`)   | Prefix of the DOM ids generated for each header/panel.                |
| `mode`     | `'single' \| 'multiple'` | `'single'`                      | `single`: opening an item closes any other, and re-clicking an open item closes it too — nothing is ever forced open. `multiple`: each item toggles independently. |
| `expanded` | `number[]` (model)       | `[]`                             | Indices of the currently open items.                                  |

## Inputs of `gbt-accordion-item`

| Input   | Type     | Role                    |
| ------- | -------- | ------------------------ |
| `label` | `string` | Required. Header label. |

## Example

```html
<gbt-accordion>
  <gbt-accordion-item label="Comment créer un compte ?">...</gbt-accordion-item>
  <gbt-accordion-item label="Comment contacter le support ?">...</gbt-accordion-item>
</gbt-accordion>
```

Open the first section by default:

```html
<gbt-accordion [expanded]="[0]">...</gbt-accordion>
```

## Behavior

- The open/close transition animates `grid-template-rows` (0fr ↔ 1fr)
  rather than a fixed `max-height` — it adapts to any content height
  without guessing, and is disabled under `prefers-reduced-motion:
  reduce`.
- A collapsed panel carries `inert` — its content (and everything
  inside it) is unreachable by keyboard or a screen reader — instead of
  the native `hidden` attribute, which would force `display: none` and
  break the height transition.
