# Tabs

Tab navigation, with `gbt-tab` as projected content.

**Selector**: `gbt-tabs` (container), `gbt-tab` (each tab)

Left/right arrows to move between triggers, with wraparound.

`activeIndex` is an Angular `model()`, so it works uncontrolled (omit
the binding entirely, as every existing usage does) or controlled
(bind `[activeIndex]`/`(activeIndexChange)` to keep it in sync with,
e.g., a URL query parameter).

## Inputs of `gbt-tabs`

| Input | Type     | Default                  | Role                                                    |
| ----- | -------- | ------------------------ | ------------------------------------------------------- |
| `id`  | `string` | generated (`gbt-tabs-N`) | Prefix of the DOM ids generated for each trigger/panel. |
| `activeIndex` | `number` (model) | `0` | The active tab's index. Bind `[activeIndex]` (one-way — `Tabs` still updates it internally on click/arrow-key) or `[(activeIndex)]` (two-way) to control or observe it from outside. |

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
