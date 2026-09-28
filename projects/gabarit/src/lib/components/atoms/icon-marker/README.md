# IconMarker

An icon on a soft tinted disc (or rounded tile): the marker of an activity on a timeline, the icon of a stat
tile, a key, a decision.

**Selector**: `gbt-icon-marker`. The icon is a registered [`gbt-icon`](../icon/README.md) name.

## Inputs

| Input        | Type                                                                    | Default     | Role                                                                                                                              |
| ------------ | ----------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `icon`       | `string`                                                                | —           | Required. A registered icon name.                                                                                                 |
| `tone`       | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'neutral'` | The tint. `neutral` is quiet (the wash of the empty-state disc), `primary` is the brand colour.                                   |
| `size`       | `'sm' \| 'md' \| 'lg' \| 'xl'`                                          | `'md'`      | 24, 32, 40 and 52 px. The glyph scales with it.                                                                                   |
| `shape`      | `'disc' \| 'tile'`                                                      | `'disc'`    | Round, or a square with 8 px corners.                                                                                             |
| `appearance` | `'soft' \| 'outline'`                                                   | `'soft'`    | `soft`: a tinted fill. `outline`: the page background, a hairline border and the tone's colour on the glyph (a marker on a rail). |
| `label`      | `string \| null`                                                        | `null`      | Makes the marker an image (`role="img"`) with this name. Empty: decorative (`aria-hidden`).                                       |

## Colours

Status tones use the pair designed for a tinted background (`--color-<tone>-bg` + `--color-<tone>-bg-text`,
the alert and badge pairs, 7:1 in both themes). `neutral` is 18 % of `--border-color` under `--text-secondary`;
`primary` is 12 % of `--primary` under `--primary`. No new token: all pairs are asserted in
`tokens/contrast.spec.ts`.

## Accessibility

The marker is decorative unless it has a `label`: the meaning (approved, blocked) must be told by the text
next to it, never by the tint alone. See [AUDIT.md](./AUDIT.md).

## Example

```html
<li><gbt-icon-marker icon="check" size="sm" tone="success" /> bastien approved these changes</li>
<gbt-icon-marker icon="key" shape="tile" tone="info" />
<gbt-icon-marker icon="git-commit" size="sm" appearance="outline" label="Commit" />
```
