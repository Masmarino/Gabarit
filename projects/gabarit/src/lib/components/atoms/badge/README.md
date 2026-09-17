# Badge

Short status/category label — a colored pill for text content (e.g. a
role, a status, a count), purely informational. Not interactive, not
removable; see the component's GitHub issue if you need a dismissible
chip variant later.

**Selector**: `gbt-badge`

## Inputs

| Input     | Type            | Default     | Role                                                   |
| --------- | --------------- | ----------- | ------------------------------------------------------- |
| `variant` | `BadgeVariant`  | `'neutral'` | `'neutral' \| 'success' \| 'warning' \| 'error' \| 'info'`. |
| `icon`    | `string`        | none        | Optional `gbt-icon` name, shown before the label.       |

## Content

The badge's text comes from projected content (`<ng-content />`), not
an input — like a native `<span>`, so it composes naturally with
interpolation, `@if`, or plain text.

## Example

```html
<gbt-badge variant="success">Actif</gbt-badge>
<gbt-badge variant="error" icon="alert-triangle">Erreur</gbt-badge>
```
