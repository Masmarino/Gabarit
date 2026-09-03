# Card

Titled container with an optional header.

**Selector**: `gbt-card`

## Inputs

| Input          | Type                         | Default | Role                                                                                                   |
| -------------- | ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `hoverable`    | `boolean`                    | `false` | Adds a visual hover treatment.                                                                         |
| `heading`      | `string`                     | `''`    | Header title. Empty by default: no header is rendered without it.                                      |
| `icon`         | `string`                     | `''`    | Icon shown in the header, if provided.                                                                 |
| `headingLevel` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2`     | Level of the rendered heading — choose it based on the block's place in the page hierarchy (RGAA 9.1). |

## Projected content

- Default: the card's body.
- `[card-header-actions]`: actions shown on the right of the header (button, menu…).

## Example

```html
<gbt-card heading="Registre Docker" [headingLevel]="2">
  <gbt-gauge-bar ... />
</gbt-card>
```
