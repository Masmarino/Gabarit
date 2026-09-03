# Tabs

Tab navigation, with `gbt-tab` as projected content.

**Selector**: `gbt-tabs` (container), `gbt-tab` (each tab)

Left/right arrows to move between triggers, with wraparound.

## Inputs of `gbt-tabs`

| Input | Type     | Default                  | Role                                                    |
| ----- | -------- | ------------------------ | ------------------------------------------------------- |
| `id`  | `string` | generated (`gbt-tabs-N`) | Prefix of the DOM ids generated for each trigger/panel. |

## Inputs of `gbt-tab`

| Input   | Type     | Role                     |
| ------- | -------- | ------------------------ |
| `label` | `string` | Required. Trigger label. |

## Example

```html
<gbt-tabs>
  <gbt-tab label="Détails">...</gbt-tab>
  <gbt-tab label="Historique">...</gbt-tab>
</gbt-tabs>
```
