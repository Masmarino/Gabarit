# JobStatus

The status glyph of a CI job: a check (`success`), an alert (`failed`), a cross (`canceled`), a spinning ring
(`running`) or a still ring (`pending`). [`gbt-job-graph`](../job-graph/README.md) renders its
nodes with this same component (same DOM position, same size, same colours), so a pipeline sidebar, a job
header or a summary shows the glyph the graph shows.

**Selector**: `gbt-job-status`

## Inputs

| Input    | Type             | Default | Role                                                                                                  |
| -------- | ---------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `status` | `JobStatusValue` | —       | Required. `'pending' \| 'running' \| 'success' \| 'failed' \| 'canceled'` (same as `JobGraphStatus`). |
| `label`  | `string \| null` | `null`  | The status in words, read by screen readers and hidden visually. Empty: the glyph is decorative.      |

## Colours and motion

`success` `--color-success-text`, `failed` `--color-error-text`, `canceled` `--text-secondary`; the rings take
`--border-color` (pending) and `--primary` (running, spinning). Under `prefers-reduced-motion: reduce` the running
ring stops and becomes a filled dot. The host carries `data-status`.

## Accessibility

The glyph tells the status by its **shape**, never colour alone. Without `label` the host is `aria-hidden`:
say the status in text next to it (as `gbt-job-graph` does in its node text). With `label` the host is exposed,
the glyph stays hidden and the label is announced. See [AUDIT.md](AUDIT.md).

## Example

```html
<gbt-job-status status="failed" label="Failed" />
<li><gbt-job-status status="running" /> integration <span class="sr-only">Running</span></li>
```
